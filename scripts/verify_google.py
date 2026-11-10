"""stores_google.csv 상위 후보의 Google 매칭을 Place Details로 재확인한다.

- review_count 상위부터 Place Details(primaryType, types, 한국어 displayName) 조회
- 음식점·카페 계열이 아니면 matched=false (예: museum, market, lodging)
- 카카오 name_ko와 구글 한국어 displayName이 전혀 안 비슷하면 matched=false
- 같은 google_place_id가 여러 카카오 가게에 붙으면 이름이 가장 비슷한 하나만 남김
- 통과한 고유 가게가 TARGET 이상 + 최소 MIN_CHECK곳 확인하면 멈춤 (호출 상한 MAX_CALLS)
- 조회 결과는 data/verify_cache.json에 캐시 (다시 실행해도 재호출 없음)
- stores_google.csv에 primary_type, name_sim, verified, reject_reason 칼럼을 덮어써 저장

사용: .venv/Scripts/python scripts/verify_google.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "stores_google.csv"
CACHE_PATH = ROOT / "data" / "verify_cache.json"

API_URL = "https://places.googleapis.com/v1/places/{place_id}"
FIELD_MASK = "id,primaryType,types,displayName"
SLEEP_S = 0.05
RETRIES = 3

TARGET = 60  # 확보할 통과 가게 수
MIN_CHECK = 100  # 최소 확인할 후보 수
MAX_CALLS = 150  # 호출 상한
SIM_MIN = 0.4  # 이름 유사도 하한

FOOD_TYPES = {
    "restaurant", "cafe", "bakery", "bar", "coffee_shop", "tea_house", "food",
    "meal_takeaway", "meal_delivery", "pub", "wine_bar", "cafeteria", "diner",
    "food_court", "dessert_shop", "ice_cream_shop", "donut_shop", "bagel_shop",
    "juice_shop", "chocolate_shop", "confectionery", "candy_store", "deli",
    "bistro", "brewpub", "brewery", "winery", "snack_bar", "acai_shop",
    "noodle_shop", "steak_house", "dumpling_shop", "tea_store", "dessert_restaurant",
}
FOOD_SUFFIXES = ("_restaurant", "_bar", "_cafe", "_house")
# primaryType이 이 중 하나면 types에 cafe 등이 섞여 있어도 가게가 아닌 것으로 본다
NON_FOOD = {
    "museum", "market", "hotel", "lodging", "tourist_attraction", "park",
    "shopping_mall", "department_store", "art_gallery", "cultural_center",
    "historical_landmark", "historical_place", "palace", "church", "library",
}

# 지점명·업종 접미사 등 비교에 방해되는 부분
BRANCH_RE = re.compile(r"\s*\S+(점|지점|본점|직영점)$")
NORM_RE = re.compile(r"[\s\-_·.,()\[\]&'\"/|]+")


def is_food(t: str) -> bool:
    return t in FOOD_TYPES or t.endswith(FOOD_SUFFIXES)


def food_ok(primary: str | None, types: list[str]) -> bool:
    if primary and is_food(primary):
        return True
    if primary in NON_FOOD:
        return False
    # primaryType이 목록에 없는 세부 업종이면 types에 restaurant/food/cafe 등이 있는지로 판단
    return any(is_food(t) for t in types)


def norm(s: str) -> str:
    return NORM_RE.sub("", s).lower()


def name_sim(kakao: str, google: str) -> float:
    """0~1. 한쪽 핵심 이름이 다른 쪽에 포함되면 1."""
    if not kakao or not google:
        return 0.0
    a_full, b = norm(kakao), norm(google)
    a_core = norm(BRANCH_RE.sub("", kakao)) or a_full
    # 포함 관계는 지점명을 뗀 핵심 이름으로만 본다
    # (예: "이디야커피 국립고궁박물관점"이 "국립고궁박물관"을 포함해도 통과시키지 않음)
    # 한 글자 이름(예: "참" → "바 참 Bar Cham")도 포함이면 인정. 80m 거리 조건이 이미 걸려 있음
    if a_core and (a_core in b or (len(b) >= 2 and b in a_core)):
        return 1.0
    return SequenceMatcher(None, a_core, b).ratio()


class Details:
    def __init__(self, key: str) -> None:
        self.session = requests.Session()
        self.session.headers.update({"X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK})
        self.cache: dict = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
        self.calls = 0

    def get(self, pid: str) -> dict:
        if pid in self.cache:
            return self.cache[pid]
        last_err = ""
        for attempt in range(1, RETRIES + 1):
            self.calls += 1
            time.sleep(SLEEP_S)
            try:
                res = self.session.get(API_URL.format(place_id=pid), params={"languageCode": "ko"}, timeout=15)
            except requests.RequestException as e:
                last_err = str(e)
                time.sleep(attempt)
                continue
            if res.status_code == 200:
                d = res.json()
                info = {
                    "primaryType": d.get("primaryType"),
                    "types": d.get("types", []),
                    "displayName_ko": d.get("displayName", {}).get("text", ""),
                }
                self.cache[pid] = info
                CACHE_PATH.write_text(json.dumps(self.cache, ensure_ascii=False, indent=1), encoding="utf-8")
                return info
            if res.status_code in (400, 401, 403):
                sys.exit(f"Google Places error {res.status_code}: {res.text[:500]}")
            last_err = f"HTTP {res.status_code}: {res.text[:200]}"
            time.sleep(attempt * 2)
        raise RuntimeError(last_err)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    load_dotenv(ROOT / ".env")
    key = os.getenv("GOOGLE_PLACES_KEY")
    if not key:
        sys.exit("GOOGLE_PLACES_KEY가 .env에 없습니다.")

    df = pd.read_csv(CSV_PATH, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    for col in ("primary_type", "name_sim", "verified", "reject_reason"):
        if col not in df.columns:
            df[col] = ""
    df["_rc"] = pd.to_numeric(df["review_count"], errors="coerce").fillna(0)
    # 다시 실행할 때: 이전 실행에서 떨어뜨린 행을 원래 매칭 상태로 되돌린 뒤 새 규칙으로 재판정
    df.loc[df["verified"] == "false", "matched"] = "true"
    df[["verified", "reject_reason"]] = ""

    client = Details(key)
    candidates = df[df["matched"] == "true"].sort_values("_rc", ascending=False)
    seen_pids: set[str] = set()
    passed = checked = 0
    rejected: list[str] = []

    for _, cand in candidates.iterrows():
        pid = cand["google_place_id"]
        if pid in seen_pids:
            continue
        if checked >= MIN_CHECK and passed >= TARGET:
            break
        if client.calls >= MAX_CALLS:
            print(f"호출 상한 {MAX_CALLS} 도달, 중단")
            break
        seen_pids.add(pid)
        checked += 1
        try:
            info = client.get(pid)
        except RuntimeError as e:
            print(f"  FAIL {pid} {cand['name_ko']}: {e}", file=sys.stderr)
            continue

        group = df.index[(df["google_place_id"] == pid) & (df["matched"] == "true")]
        sims = {i: name_sim(df.at[i, "name_ko"], info["displayName_ko"]) for i in group}
        best = max(sims, key=lambda i: (sims[i], df.at[i, "_rc"]))
        type_ok = food_ok(info["primaryType"], info["types"])

        for i in group:
            df.at[i, "primary_type"] = info["primaryType"] or ""
            df.at[i, "name_sim"] = f"{sims[i]:.2f}"
            reason = ""
            if not type_ok:
                reason = f"type:{info['primaryType']}"
            elif sims[i] < SIM_MIN:
                reason = f"name:{info['displayName_ko']}"
            elif i != best:
                reason = f"dup:{df.at[best, 'name_ko']}"
            df.at[i, "verified"] = "false" if reason else "true"
            df.at[i, "reject_reason"] = reason
            if reason:
                df.at[i, "matched"] = "false"
                rejected.append(f"{df.at[i, 'name_ko']} → {info['displayName_ko']} ({reason})")
            else:
                passed += 1

    df.drop(columns=["_rc"]).to_csv(CSV_PATH, index=False, encoding="utf-8-sig")
    print(f"checked {checked} places, API calls {client.calls}, passed {passed}, rejected {len(rejected)}")
    for r in rejected:
        print(f"  ✗ {r}")


if __name__ == "__main__":
    main()
