"""data/stores_raw.csv의 각 가게를 Google Places (New) Text Search로 매칭한다.

- textQuery = name_ko, locationBias = 카카오 좌표 반경 100m, languageCode = en
- 결과 중 카카오 좌표와 80m 이내인 첫 번째만 채택, 없으면 matched=false
- 한 줄씩 data/stores_google.csv에 추가 저장 → 중단돼도 다시 실행하면 이어서 진행
- 3번 재시도 후에도 실패한 가게는 저장하지 않음 (다음 실행 때 다시 시도)

사용: .venv/Scripts/python scripts/match_google.py
"""

from __future__ import annotations

import csv
import math
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "stores_raw.csv"
OUT_PATH = ROOT / "data" / "stores_google.csv"

API_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = "places.id,places.displayName,places.location,places.rating,places.userRatingCount"
BIAS_RADIUS_M = 100.0
MATCH_MAX_M = 80.0
SLEEP_S = 0.05
RETRIES = 3

EXTRA_COLUMNS = ["google_place_id", "name_en", "rating", "review_count", "matched"]


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


class PlacesClient:
    def __init__(self, key: str) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "X-Goog-Api-Key": key,
                "X-Goog-FieldMask": FIELD_MASK,
                "Content-Type": "application/json",
            }
        )
        self.calls = 0

    def search(self, query: str, lat: float, lng: float) -> list[dict]:
        body = {
            "textQuery": query,
            "languageCode": "en",
            "locationBias": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": BIAS_RADIUS_M,
                }
            },
        }
        last_err = ""
        for attempt in range(1, RETRIES + 1):
            self.calls += 1
            time.sleep(SLEEP_S)
            try:
                res = self.session.post(API_URL, json=body, timeout=15)
            except requests.RequestException as e:
                last_err = str(e)
                time.sleep(attempt)
                continue
            if res.status_code == 200:
                return res.json().get("places", [])
            if res.status_code in (400, 401, 403):
                # 키·권한·요청 형식 문제는 재시도해도 소용없음
                sys.exit(f"Google Places error {res.status_code}: {res.text[:500]}")
            last_err = f"HTTP {res.status_code}: {res.text[:200]}"
            time.sleep(attempt * 2)
        raise RuntimeError(last_err)


def match(places: list[dict], lat: float, lng: float) -> dict | None:
    for p in places:
        loc = p.get("location")
        if not loc:
            continue
        if haversine_m(lat, lng, loc["latitude"], loc["longitude"]) <= MATCH_MAX_M:
            return p
    return None


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    load_dotenv(ROOT / ".env")
    key = os.getenv("GOOGLE_PLACES_KEY")
    if not key:
        sys.exit("GOOGLE_PLACES_KEY가 .env에 없습니다.")

    with IN_PATH.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        in_columns = list(reader.fieldnames or [])
        stores = list(reader)
    out_columns = in_columns + EXTRA_COLUMNS

    done: set[str] = set()
    if OUT_PATH.exists():
        with OUT_PATH.open(encoding="utf-8-sig", newline="") as f:
            done = {row["kakao_id"] for row in csv.DictReader(f)}

    todo = [s for s in stores if s["kakao_id"] not in done]
    print(f"total {len(stores)}, already done {len(done)}, todo {len(todo)}")

    client = PlacesClient(key)
    failed = 0
    is_new = not OUT_PATH.exists()
    with OUT_PATH.open("a", encoding="utf-8-sig" if is_new else "utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=out_columns)
        if is_new:
            writer.writeheader()
        for i, store in enumerate(todo, 1):
            lat, lng = float(store["lat"]), float(store["lng"])
            try:
                places = client.search(store["name_ko"], lat, lng)
            except RuntimeError as e:
                failed += 1
                print(f"\n  FAIL {store['kakao_id']} {store['name_ko']}: {e}", file=sys.stderr)
                continue
            p = match(places, lat, lng)
            row = dict(store)
            row.update(
                {
                    "google_place_id": p["id"] if p else "",
                    "name_en": p.get("displayName", {}).get("text", "") if p else "",
                    "rating": p.get("rating", "") if p else "",
                    "review_count": p.get("userRatingCount", "") if p else "",
                    "matched": "true" if p else "false",
                }
            )
            writer.writerow(row)
            f.flush()
            print(f"  {i}/{len(todo)}  calls={client.calls}  failed={failed}", end="\r")
    print()

    with OUT_PATH.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    matched = [r for r in rows if r["matched"] == "true"]
    rate = len(matched) / len(rows) * 100 if rows else 0
    print(f"API calls this run: {client.calls}, failed: {failed}")
    print(f"matched: {len(matched)}/{len(rows)} ({rate:.1f}%)  (input {len(stores)})")

    top = sorted(matched, key=lambda r: int(r["review_count"] or 0), reverse=True)[:10]
    print("\nTop 10 by review_count:")
    for r in top:
        print(f"  {r['review_count']:>6}  {r['rating'] or '-':>4}  {r['name_ko']} / {r['name_en']}")


if __name__ == "__main__":
    main()
