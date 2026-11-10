"""data/stores_top.csv + data/enriched/{kakao_id}.json → Supabase stores 테이블에 kakao_id 기준 upsert.

- info 칼럼에 enriched JSON 전체 (없으면 {})
- geom은 sql/schema.sql에서 lat/lng로 자동 생성되는 칼럼이라 보내지 않는다
  (생성 칼럼에 값을 넣으면 "cannot insert a non-DEFAULT value into column geom" 오류)
- 루트 .env의 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 사용 (RLS 우회, 스크립트 전용)

사용: .venv/Scripts/python scripts/upload.py [--dry-run]
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "stores_top.csv"
ENRICHED_DIR = ROOT / "data" / "enriched"
BATCH = 50


def num(v: str, cast):
    try:
        return cast(v) if v not in ("", None) else None
    except ValueError:
        return None


def to_record(store: dict, now: str) -> tuple[dict, bool]:
    path = ENRICHED_DIR / f"{store['kakao_id']}.json"
    info = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    rating = num(store.get("rating", ""), float)
    return (
        {
            "kakao_id": store["kakao_id"],
            "name_ko": store["name_ko"],
            "name_en": store.get("name_en") or None,
            "category": store.get("category_name") or None,
            "lat": float(store["lat"]),
            "lng": float(store["lng"]),
            "google_place_id": store.get("google_place_id") or None,
            "rating": round(rating, 1) if rating is not None else None,
            "review_count": num(store.get("review_count", ""), int),
            "info": info,
            "is_curated": store.get("is_curated") == "true",
            "updated_at": now,
        },
        bool(info),
    )


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="업로드 없이 레코드만 확인")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다.")

    with IN_PATH.open(encoding="utf-8-sig", newline="") as f:
        stores = list(csv.DictReader(f))

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    pairs = [to_record(s, now) for s in stores]
    records = [r for r, _ in pairs]
    with_info = sum(has for _, has in pairs)
    print(f"records {len(records)}, with enriched info {with_info}, without {len(records) - with_info}")

    if args.dry_run:
        print(json.dumps({**records[0], "info": "…"}, ensure_ascii=False, indent=2))
        return

    client = create_client(url, key)
    for i in range(0, len(records), BATCH):
        chunk = records[i : i + BATCH]
        client.table("stores").upsert(chunk, on_conflict="kakao_id").execute()
        print(f"  upserted {i + len(chunk)}/{len(records)}")

    total = client.table("stores").select("id", count="exact").limit(1).execute().count
    print(f"done. stores table now has {total} rows")


if __name__ == "__main__":
    main()
