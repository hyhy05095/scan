"""stores_top.csv 각 가게의 카드 정보를 OpenAI로 생성한다 (5개 언어 한 번에, Structured Outputs strict).

입력: name_ko, name_en, category_name, rating, review_count + data/reviews/{google_place_id}.json
출력: data/enriched/{kakao_id}.json (이미 있으면 건너뜀)
호출 간격 1초, 재시도 3번, 실행당 API 시도 상한 100번 (성공·실패 모두 셈)
인증·권한·잔액·모델 없음·요청 형식 오류는 재시도 없이 실행 전체 중단

사용:
  .venv/Scripts/python scripts/enrich.py --limit 10   # 10곳만 시도
  .venv/Scripts/python scripts/enrich.py              # 남은 전체
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import openai
from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "stores_top.csv"
REVIEWS_DIR = ROOT / "data" / "reviews"
OUT_DIR = ROOT / "data" / "enriched"

MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
SLEEP_S = 1.0
RETRIES = 3
MAX_CALLS = 100
LANGS = ["en", "zh", "ja", "ru", "es"]

LANG_CARD = {
    "type": "object",
    "properties": {
        "cuisine": {"type": "string"},
        "signature_menu": {"type": "array", "items": {"type": "string"}},
        "vegan_note": {"type": "string"},
        "review_summary": {"type": "array", "items": {"type": "string"}},
        "tip": {"type": "string"},
    },
    "required": ["cuisine", "signature_menu", "vegan_note", "review_summary", "tip"],
    "additionalProperties": False,
}
CARD_SCHEMA = {
    "type": "object",
    "properties": {
        "vegan": {"type": "string", "enum": ["likely", "check", "hard"]},
        "price_level": {"type": "string", "enum": ["$", "$$", "$$$"]},
        **{lang: LANG_CARD for lang in LANGS},
    },
    "required": ["vegan", "price_level", *LANGS],
    "additionalProperties": False,
}
RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {"name": "store_card", "strict": True, "schema": CARD_SCHEMA},
}

SYSTEM = """You write short store cards for foreign tourists in Seochon/Bukchon, Seoul.
Write the same facts in five languages: en (English), zh (Simplified Chinese), ja (Japanese), ru (Russian), es (Spanish).

Rules:
- Use ONLY the store info and reviews given. Never invent facts.
- signature_menu: 3-5 dishes/drinks that the reviews mention, or that the store name clearly states
  (e.g. "토속촌삼계탕" → samgyetang). Format each as "<name in that language> (<Korean name>)" so staff can read it.
  If there is no evidence, return an empty list. Do not guess.
- cuisine: a short phrase like "Korean chicken soup" or "Specialty coffee & bakery".
- vegan (one value for all languages), be conservative:
  "likely" = clearly vegan/vegetarian-focused, or reviews confirm vegan options.
  "check"  = some dishes may be vegan but need confirmation.
  "hard"   = menu centers on meat/seafood/broth.
  Korean food uses meat/anchovy broth, fish sauce and jeotgal, so a Korean restaurant is "check" at best
  unless reviews clearly say it is vegan. Bakeries/cafes are usually "check" (butter, milk, eggs).
- vegan_note: one sentence explaining the vegan rating and what to ask.
- price_level: "$" (under ~12,000 KRW per person), "$$" (~12,000-30,000), "$$$" (more). Best estimate from category and reviews.
- review_summary: exactly 3 short sentences summarizing what reviewers say (good and bad).
- tip: one practical tip from reviews (waiting line, reservation, best time, payment). Empty string if none.
- Keep each string under ~120 characters. Natural, native wording for each language."""


class Fatal(Exception):
    """재시도해도 소용없는 오류 → 실행 전체 중단."""


def build_prompt(store: dict, reviews: list[dict]) -> str:
    lines = [
        f"Store (Korean name): {store['name_ko']}",
        f"Google English name: {store.get('name_en') or '-'}",
        f"Kakao category: {store.get('category_name') or '-'}",
        f"Google primary type: {store.get('primary_type') or '-'}",
        f"Google rating: {store.get('rating') or '-'} ({store.get('review_count') or 0} reviews)",
        "",
        "Reviews:",
    ]
    if not reviews:
        lines.append("(none)")
    for i, r in enumerate(reviews, 1):
        text = (r.get("text") or {}).get("text", "")
        orig = r.get("originalText") or {}
        orig_text = orig.get("text", "")
        lines.append(f"{i}. [{r.get('rating', '-')}/5] {text}")
        if orig_text and orig_text != text:
            lines.append(f"   (original, {orig.get('languageCode', '?')}): {orig_text}")
    return "\n".join(lines)


def tidy(data: dict) -> dict:
    for lang in LANGS:
        d = data[lang]
        d["signature_menu"] = [m.strip() for m in d["signature_menu"] if m.strip()][:5]
        d["review_summary"] = [s.strip() for s in d["review_summary"] if s.strip()][:3]
    return data


class LLM:
    def __init__(self, key: str) -> None:
        self.client = OpenAI(api_key=key, max_retries=0, timeout=120)
        self.calls = 0
        self.tokens_in = self.tokens_out = 0

    def card(self, prompt: str) -> dict:
        last_err = ""
        for attempt in range(1, RETRIES + 1):
            if self.calls >= MAX_CALLS:
                raise Fatal(f"시도 상한 {MAX_CALLS} 도달")
            self.calls += 1
            time.sleep(SLEEP_S)
            try:
                res = self.client.chat.completions.create(
                    model=MODEL,
                    reasoning_effort="low",
                    messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}],
                    response_format=RESPONSE_FORMAT,
                )
            except (openai.AuthenticationError, openai.PermissionDeniedError, openai.NotFoundError, openai.BadRequestError) as e:
                raise Fatal(f"{type(e).__name__}: {e}") from e
            except openai.RateLimitError as e:
                if "insufficient_quota" in str(e):
                    raise Fatal(f"잔액/한도 소진: {e}") from e
                last_err = f"RateLimit: {e}"
                time.sleep(attempt * 5)
                continue
            except (openai.APIConnectionError, openai.APITimeoutError, openai.InternalServerError) as e:
                last_err = f"{type(e).__name__}: {e}"
                time.sleep(attempt * 2)
                continue

            if res.usage:
                self.tokens_in += res.usage.prompt_tokens
                self.tokens_out += res.usage.completion_tokens
            msg = res.choices[0].message
            if msg.refusal:
                last_err = f"refusal: {msg.refusal}"
                continue
            try:
                return tidy(json.loads(msg.content or ""))
            except (json.JSONDecodeError, KeyError) as e:
                last_err = f"bad output: {e}"
        raise RuntimeError(last_err[:300])


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="이번 실행에서 시도할 최대 가게 수")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY가 .env에 없습니다.")

    with IN_PATH.open(encoding="utf-8-sig", newline="") as f:
        stores = list(csv.DictReader(f))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    llm = LLM(key)
    made = skipped = failed = tried = 0
    print(f"model {MODEL}, stores {len(stores)}")

    for store in stores:
        out = OUT_DIR / f"{store['kakao_id']}.json"
        if out.exists():
            skipped += 1
            continue
        if args.limit and tried >= args.limit:
            break
        tried += 1
        pid = store.get("google_place_id", "")
        rpath = REVIEWS_DIR / f"{pid}.json"
        reviews = json.loads(rpath.read_text(encoding="utf-8"))["reviews"] if pid and rpath.exists() else []

        try:
            data = llm.card(build_prompt(store, reviews))
        except Fatal as e:
            print(f"  STOP {store['name_ko']}: {e}", file=sys.stderr)
            break
        except RuntimeError as e:
            failed += 1
            print(f"  FAIL {store['name_ko']}: {e}", file=sys.stderr)
            continue

        data["source"] = {
            "model": MODEL,
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "reviews_used": len(reviews),
        }
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        made += 1
        print(f"  {store['name_ko']}: vegan={data['vegan']} price={data['price_level']} menu={len(data['en']['signature_menu'])}")

    print(
        f"\nmade {made}, already had {skipped}, failed {failed}, API attempts {llm.calls}, "
        f"tokens in/out {llm.tokens_in}/{llm.tokens_out}"
    )


if __name__ == "__main__":
    main()
