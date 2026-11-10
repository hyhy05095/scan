"""data/stores_top.csv 각 가게의 Google 리뷰(최대 5개)를 Place Details (New)로 가져온다.

- FieldMask: reviews.text, reviews.rating, reviews.originalText
- languageCode=en → text는 영어 번역본, originalText는 원문
- data/reviews/{google_place_id}.json 저장, 이미 있는 파일은 건너뜀(이어서 실행 가능)
- google_place_id가 없는 가게(미매칭 큐레이션 등)는 건너뜀

사용: .venv/Scripts/python scripts/fetch_reviews.py
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "stores_top.csv"
OUT_DIR = ROOT / "data" / "reviews"

API_URL = "https://places.googleapis.com/v1/places/{place_id}"
FIELD_MASK = "reviews.text,reviews.rating,reviews.originalText"
SLEEP_S = 0.05
RETRIES = 3


def fetch(session: requests.Session, place_id: str) -> dict:
    last_err = ""
    for attempt in range(1, RETRIES + 1):
        time.sleep(SLEEP_S)
        try:
            res = session.get(API_URL.format(place_id=place_id), params={"languageCode": "en"}, timeout=15)
        except requests.RequestException as e:
            last_err = str(e)
            time.sleep(attempt)
            continue
        if res.status_code == 200:
            return res.json()
        if res.status_code in (400, 401, 403):
            sys.exit(f"Google Places error {res.status_code}: {res.text[:500]}")
        last_err = f"HTTP {res.status_code}: {res.text[:200]}"
        time.sleep(attempt * 2)
    raise RuntimeError(last_err)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    load_dotenv(ROOT / ".env")
    key = os.getenv("GOOGLE_PLACES_KEY")
    if not key:
        sys.exit("GOOGLE_PLACES_KEY가 .env에 없습니다.")

    with IN_PATH.open(encoding="utf-8-sig", newline="") as f:
        stores = list(csv.DictReader(f))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK})

    saved = skipped = no_id = failed = 0
    for store in stores:
        pid = store.get("google_place_id", "")
        if not pid:
            no_id += 1
            continue
        out = OUT_DIR / f"{pid}.json"
        if out.exists():
            skipped += 1
            continue
        try:
            data = fetch(session, pid)
        except RuntimeError as e:
            failed += 1
            print(f"  FAIL {pid} {store['name_ko']}: {e}", file=sys.stderr)
            continue
        payload = {
            "google_place_id": pid,
            "kakao_id": store["kakao_id"],
            "name_ko": store["name_ko"],
            "reviews": data.get("reviews", []),
        }
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        saved += 1
        print(f"  {store['name_ko']}: {len(payload['reviews'])} reviews")

    print(f"\nsaved {saved}, already had {skipped}, no place_id {no_id}, failed {failed}")


if __name__ == "__main__":
    main()
