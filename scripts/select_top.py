"""data/stores_google.csv에서 서비스에 올릴 가게를 고른다.

- matched=true 중 review_count 상위 60곳
- data/curated.txt의 가게명(한 줄에 하나, name_ko 부분일치)은 순위·매칭 여부와 무관하게 강제 포함, is_curated=true
- curated.txt가 없거나 비어 있으면 상위 60곳만
- 결과: data/stores_top.csv

사용: .venv/Scripts/python scripts/select_top.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "stores_google.csv"
CURATED_PATH = ROOT / "data" / "curated.txt"
OUT_PATH = ROOT / "data" / "stores_top.csv"

TOP_N = 60


def read_curated() -> list[str]:
    if not CURATED_PATH.exists():
        return []
    lines = CURATED_PATH.read_text(encoding="utf-8-sig").splitlines()
    return [s.strip() for s in lines if s.strip() and not s.strip().startswith("#")]


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    df = pd.read_csv(IN_PATH, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    df["review_count_n"] = pd.to_numeric(df["review_count"], errors="coerce").fillna(0).astype(int)
    df["is_curated"] = False

    curated = read_curated()
    print(f"curated.txt: {len(curated)} names" + ("" if curated else " (없음 → 상위 60곳만)"))
    for name in curated:
        hit = df["name_ko"].str.contains(name, regex=False)
        df.loc[hit, "is_curated"] = True
        names = df.loc[hit, "name_ko"].tolist()
        if not names:
            print(f"  ✗ '{name}': 일치 없음")
        else:
            unmatched = df.loc[hit & (df["matched"] != "true"), "name_ko"].tolist()
            warn = f"  (Google 미매칭: {', '.join(unmatched)})" if unmatched else ""
            mark = "⚠" if len(names) > 1 else "✓"
            print(f"  {mark} '{name}': {len(names)}곳 → {', '.join(names)}{warn}")

    # verify_google.py를 돌렸다면 재확인 통과(verified=true)만 후보로
    pool = df[df["matched"] == "true"]
    if "verified" in df.columns and (df["verified"] == "true").any():
        pool = pool[pool["verified"] == "true"]
    # 같은 google_place_id는 하나만 (이름 유사도 → 리뷰 수 순)
    sim = pd.to_numeric(pool.get("name_sim", pd.Series(dtype=str)), errors="coerce").fillna(0)
    pool = (
        pool.assign(_sim=sim)
        .sort_values(["_sim", "review_count_n"], ascending=False)
        .drop_duplicates("google_place_id")
    )
    top_ids = pool.sort_values("review_count_n", ascending=False).head(TOP_N)["kakao_id"]
    selected = df[df["kakao_id"].isin(top_ids) | df["is_curated"]].copy()
    selected = selected.sort_values(["is_curated", "review_count_n"], ascending=[False, False])

    extra = int((selected["is_curated"] & ~selected["kakao_id"].isin(top_ids)).sum())
    selected["is_curated"] = selected["is_curated"].map({True: "true", False: "false"})
    selected.drop(columns=["review_count_n"]).to_csv(OUT_PATH, index=False, encoding="utf-8-sig")

    print(
        f"\n최종 {len(selected)}곳 = 상위 {len(top_ids)} + 상위권 밖 큐레이션 {extra}"
        f"  (큐레이션 총 {int((selected['is_curated'] == 'true').sum())}곳)"
    )
    print(f"saved: {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
