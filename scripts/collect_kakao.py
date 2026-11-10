"""카카오 로컬 카테고리 검색으로 data/area.geojson 안의 음식점(FD6)·카페(CE7)를 수집한다.

- 영역 경계 상자를 약 300m 격자로 나누고, 폴리곤과 겹치는 칸만 검색
- 한 칸의 total_count가 45를 넘으면 4등분해 재검색 (최소 약 25m)
- 카카오 id로 중복 제거, 폴리곤 안(경계 포함)만 남김
- 결과: data/stores_raw.csv

사용: .venv/Scripts/python scripts/collect_kakao.py
"""

from __future__ import annotations

import csv
import json
import math
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
AREA_PATH = ROOT / "data" / "area.geojson"
OUT_PATH = ROOT / "data" / "stores_raw.csv"

API_URL = "https://dapi.kakao.com/v2/local/search/category.json"
CATEGORIES = ["FD6", "CE7"]  # 음식점, 카페
PAGE_SIZE = 15
MAX_PAGE = 3  # 카카오 제한: 15 x 3 = 45개
MAX_RESULTS = PAGE_SIZE * MAX_PAGE

CELL_M = 300
MIN_CELL_M = 25
SLEEP_S = 0.1
RETRIES = 3

COLUMNS = [
    "kakao_id",
    "name_ko",
    "category_group_code",
    "category_name",
    "lat",
    "lng",
    "address",
    "road_address",
    "phone",
    "place_url",
]


class KakaoClient:
    def __init__(self, key: str) -> None:
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"KakaoAK {key}"
        self.calls = 0

    def search(self, code: str, rect: tuple[float, float, float, float], page: int) -> dict:
        params = {
            "category_group_code": code,
            "rect": ",".join(f"{v:.7f}" for v in rect),
            "page": page,
            "size": PAGE_SIZE,
            "sort": "accuracy",
        }
        for attempt in range(1, RETRIES + 1):
            self.calls += 1
            time.sleep(SLEEP_S)
            try:
                res = self.session.get(API_URL, params=params, timeout=10)
            except requests.RequestException as e:
                if attempt == RETRIES:
                    raise
                print(f"  network error, retry {attempt}: {e}", file=sys.stderr)
                time.sleep(attempt)
                continue
            if res.status_code == 200:
                return res.json()
            if res.status_code == 429 or res.status_code >= 500:
                if attempt == RETRIES:
                    res.raise_for_status()
                print(f"  HTTP {res.status_code}, retry {attempt}", file=sys.stderr)
                time.sleep(attempt * 2)
                continue
            # 401/403 등은 재시도해도 소용없음
            sys.exit(f"Kakao API error {res.status_code}: {res.text[:300]}")
        raise RuntimeError("unreachable")


def meters_to_deg(lat: float, meters: float) -> tuple[float, float]:
    """(경도 간격, 위도 간격) 도 단위."""
    dlat = meters / 111_320
    dlng = meters / (111_320 * math.cos(math.radians(lat)))
    return dlng, dlat


def make_grid(area, cell_m: float) -> list[tuple[float, float, float, float]]:
    minx, miny, maxx, maxy = area.bounds
    dlng, dlat = meters_to_deg((miny + maxy) / 2, cell_m)
    cells = []
    y = miny
    while y < maxy:
        x = minx
        while x < maxx:
            cell = (x, y, min(x + dlng, maxx), min(y + dlat, maxy))
            if box(*cell).intersects(area):
                cells.append(cell)
            x += dlng
        y += dlat
    return cells


def cell_size_m(rect: tuple[float, float, float, float]) -> float:
    x1, y1, x2, y2 = rect
    w = (x2 - x1) * 111_320 * math.cos(math.radians((y1 + y2) / 2))
    h = (y2 - y1) * 111_320
    return max(w, h)


def split4(rect):
    x1, y1, x2, y2 = rect
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    return [(x1, y1, mx, my), (mx, y1, x2, my), (x1, my, mx, y2), (mx, my, x2, y2)]


def collect_cell(client: KakaoClient, code: str, rect, area, stats: dict) -> list[dict]:
    stats["cells"] += 1
    first = client.search(code, rect, 1)
    total = first["meta"]["total_count"]

    if total > MAX_RESULTS:
        if cell_size_m(rect) / 2 >= MIN_CELL_M:
            stats["splits"] += 1
            docs = []
            for sub in split4(rect):
                if box(*sub).intersects(area):
                    docs += collect_cell(client, code, sub, area, stats)
            return docs
        stats["overflow"] += 1
        print(f"  WARN {code} cell {cell_size_m(rect):.0f}m still has {total} > {MAX_RESULTS}, truncated", file=sys.stderr)

    docs = list(first["documents"])
    page = 1
    meta = first["meta"]
    while not meta["is_end"] and page < MAX_PAGE:
        page += 1
        data = client.search(code, rect, page)
        docs += data["documents"]
        meta = data["meta"]
    return docs


def to_row(doc: dict) -> dict:
    return {
        "kakao_id": doc["id"],
        "name_ko": doc["place_name"],
        "category_group_code": doc["category_group_code"],
        "category_name": doc["category_name"],
        "lat": doc["y"],
        "lng": doc["x"],
        "address": doc.get("address_name", ""),
        "road_address": doc.get("road_address_name", ""),
        "phone": doc.get("phone", ""),
        "place_url": doc.get("place_url", ""),
    }


def main() -> None:
    # Windows 콘솔(cp1251 등)에서 한글 출력 깨짐 방지
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    load_dotenv(ROOT / ".env")
    key = os.getenv("KAKAO_REST_KEY")
    if not key:
        sys.exit("KAKAO_REST_KEY가 .env에 없습니다.")

    geo = json.loads(AREA_PATH.read_text(encoding="utf-8"))
    area = unary_union([shape(f["geometry"]) for f in geo["features"]])

    client = KakaoClient(key)
    stats = {"cells": 0, "splits": 0, "overflow": 0}
    grid = make_grid(area, CELL_M)
    print(f"grid: {len(grid)} cells x {len(CATEGORIES)} categories (~{CELL_M}m)")

    found: dict[str, dict] = {}
    raw_count = 0
    for code in CATEGORIES:
        for i, rect in enumerate(grid, 1):
            docs = collect_cell(client, code, rect, area, stats)
            raw_count += len(docs)
            for doc in docs:
                found.setdefault(doc["id"], doc)
            print(f"  {code} {i}/{len(grid)}  unique={len(found)}  calls={client.calls}", end="\r")
        print()

    rows = [
        to_row(d)
        for d in found.values()
        if area.covers(Point(float(d["x"]), float(d["y"])))
    ]
    rows.sort(key=lambda r: (r["category_group_code"], r["name_ko"]))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    by_code = {c: sum(r["category_group_code"] == c for r in rows) for c in CATEGORIES}
    print(
        f"API calls: {client.calls}\n"
        f"cells searched: {stats['cells']} (base {len(grid) * len(CATEGORIES)}, splits {stats['splits']}, overflow {stats['overflow']})\n"
        f"raw docs: {raw_count}, unique: {len(found)}, inside area: {len(rows)} {by_code}\n"
        f"saved: {OUT_PATH.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
