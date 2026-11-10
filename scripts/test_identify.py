"""data/test_photos/ 사진으로 POST /api/identify 를 테스트한다.

- 사진마다 긴 변 1024px JPEG(품질 80)로 줄여 base64 전송
- 좌표: 파일명 → 가게 이름 매핑. stores 테이블에 있으면 그 좌표, 없으면 카카오 키워드 검색으로 실제 위치
  그 지점에서 동쪽으로 30m 떨어진 좌표, accuracy 20, lang en
- DB에 없는 가게는 정답을 "none"(store=null)으로 판정

사용: (web에서 npm run dev 켠 상태) .venv/Scripts/python scripts/test_identify.py [--url http://localhost:3000]
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import math
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image, ImageOps
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
PHOTO_DIR = ROOT / "data" / "test_photos"

PHOTO_TO_STORE = {
    "mugukuk": "무구옥",  # 간판 표기. 카카오: 무구옥 본점 (DB 상위 60곳에는 없음)
    "londonbagel": "런던베이글뮤지엄 안국",
    "tosokchon": "토속촌삼계탕",
}
OFFSET_M = 30
ACCURACY_M = 20
AREA_CENTER = (126.977, 37.581)  # 카카오 키워드 검색 기준점 (경도, 위도)


def to_jpeg_b64(path: Path) -> tuple[str, int]:
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    img.thumbnail((1024, 1024))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode(), buf.tell()


def kakao_location(name: str, key: str) -> tuple[float, float] | None:
    res = requests.get(
        "https://dapi.kakao.com/v2/local/search/keyword.json",
        headers={"Authorization": f"KakaoAK {key}"},
        params={"query": name, "x": AREA_CENTER[0], "y": AREA_CENTER[1], "radius": 3000, "sort": "distance"},
        timeout=10,
    )
    res.raise_for_status()
    docs = res.json()["documents"]
    return (float(docs[0]["y"]), float(docs[0]["x"])) if docs else None


AREA_RADIUS_M = 800  # web/src/app/api/identify/route.ts 와 같게


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6_371_000 * math.asin(math.sqrt(a))


def offset_east(lat: float, lng: float, meters: float) -> tuple[float, float]:
    return lat, lng + meters / (111_320 * math.cos(math.radians(lat)))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:3000")
    parser.add_argument("--mode", choices=["gps", "area"], default="gps")
    parser.add_argument(
        "--area", default="37.5826,126.9830", help="area 모드 지역 중심 '위도,경도' (기본: 북촌·삼청)"
    )
    args = parser.parse_args()
    area_lat, area_lng = (float(v) for v in args.area.split(","))
    print(f"mode={args.mode}" + (f" center=({area_lat}, {area_lng}) radius={AREA_RADIUS_M}m" if args.mode == "area" else ""))

    load_dotenv(ROOT / ".env")
    db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    kakao_key = os.environ["KAKAO_REST_KEY"]

    photos = sorted(p for p in PHOTO_DIR.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".heic"))
    results, full = [], None

    for path in photos:
        name = PHOTO_TO_STORE.get(path.stem)
        if not name:
            print(f"skip {path.name}: 매핑 없음")
            continue

        rows = db.table("stores").select("id,lat,lng").eq("name_ko", name).limit(1).execute().data
        if rows:
            expected, lat, lng, src = rows[0]["id"], rows[0]["lat"], rows[0]["lng"], "db"
        else:
            loc = kakao_location(name, kakao_key)
            if not loc:
                print(f"skip {path.name}: '{name}' 위치를 찾지 못함")
                continue
            expected, (lat, lng), src = None, loc, "kakao"
        if args.mode == "area":
            # 지역 버튼을 누른 상황: 가게 위치와 무관하게 지역 중심 좌표로 보냄
            qlat, qlng, acc = area_lat, area_lng, 200
            dist = haversine_m(area_lat, area_lng, lat, lng)
            if expected is not None and dist > AREA_RADIUS_M:
                expected = None  # 반경 밖이면 후보에 없으므로 정답은 none
                src += f", {dist:.0f}m 반경 밖"
            else:
                src += f", {dist:.0f}m"
        else:
            qlat, qlng = offset_east(lat, lng, OFFSET_M)
            acc = ACCURACY_M

        image, size = to_jpeg_b64(path)
        t0 = time.time()
        res = requests.post(
            f"{args.url}/api/identify",
            json={"image": image, "lat": qlat, "lng": qlng, "accuracy": acc, "mode": args.mode, "lang": "en"},
            timeout=60,
        )
        elapsed = time.time() - t0
        try:
            data = res.json()
        except ValueError:
            data = {"error": res.text[:200]}
        if res.status_code != 200:
            print(f"{path.name}: HTTP {res.status_code} {data}")
            results.append((path.name, "-", f"ERROR {res.status_code}", "-", "-", "✗", elapsed))
            continue

        got = (data.get("store") or {}).get("id")
        ok = got == expected
        picked = (data.get("store") or {}).get("name_ko") or "none"
        results.append(
            (
                path.name,
                data.get("sign_text", ""),
                picked,
                f"{data.get('confidence', 0):.2f}",
                str(data.get("candidates", "?")),
                ("✓" if ok else "✗") + f" (정답: {name if expected else 'none'}, {src})",
                elapsed,
            )
        )
        if full is None and data.get("store"):
            full = (path.name, data, size)

    print("\n파일 | 읽은 간판 | 선택 가게 | 확신도 | 후보 수 | 정답 | 시간")
    for r in results:
        print(" | ".join(r[:6]) + f" | {r[6]:.1f}s")
    correct = sum(r[5].startswith("✓") for r in results)
    print(f"\n정답 {correct}/{len(results)}")

    if full:
        print(f"\n--- {full[0]} 전체 응답 (전송 JPEG {full[2] // 1024}KB) ---")
        print(json.dumps(full[1], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
