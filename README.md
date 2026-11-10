# Scan — 서촌·북촌 간판 인식 가게 안내

> 간판 사진 한 장으로 "여기가 어떤 가게인지, 뭘 먹을 수 있는지, 비건이 가능한지"를 내 언어로 알려주는 모바일 웹 에이전트

- 배포: Vercel
- 배포 주소: `(배포 후 추가 예정)`
- 기반: [nomadcoders/ax-school-boilerplates](https://github.com/nomadcoders/ax-school-boilerplates)의 **Supanext 스타터 키트** (`web/`)

---

## 1. 누구를 위한 에이전트이고, 어떤 업무를 대신하나

### 대상

서촌·북촌·경복궁·광화문 일대를 걷는 **외국인 관광객**. 특히 다음과 같은 사람을 위한 서비스입니다.

- 한글 간판을 읽지 못해서 눈앞의 가게가 어떤 곳인지 모르는 사람
- 한국어 리뷰를 찾아 읽기 어려운 사람
- 고기·생선 육수, 젓갈 때문에 한식에서 메뉴를 고르기 어려운 **비건·채식 여행자**

### 대신하는 업무

| 사람이 원래 해야 하는 일 | 에이전트가 대신하는 일 |
|---|---|
| 한글 간판 읽기 | 사진 한 장으로 **어느 가게인지 식별** |
| 한국어 리뷰 찾아 읽기 | 구글 리뷰를 바탕으로 **리뷰 요약 3줄** |
| 메뉴 파악 | **대표 메뉴 3~5개** (한글 메뉴명을 괄호로 병기해 주문할 때 보여줄 수 있음) |
| 비건 가능 여부 판단 | **likely / check / hard 3단계 + 이유** (한식은 육수·젓갈·멸치 때문에 기본 "check" 이하로 보수적으로 판단) |
| 직원과 소통 | "저는 비건이에요. 고기, 생선, 해산물, 젓갈, 계란, 우유, 고기·멸치 육수를 빼 주실 수 있나요?" **한국어 문구를 전체화면 큰 글씨로** 보여주기 |
| 길찾기 | **카카오맵 길찾기 링크** |
| 언어 장벽 | 가게 정보를 **5개 언어**(en, zh, ja, ru, es)로 제공 |

### 작동 흐름

```
① 사진 촬영 (폰 카메라, PC에서는 파일 선택)
      ↓
② GPS 좌표로 주변 가게 후보 조회 — Supabase PostGIS nearby_stores()
   · GPS 모드: 반경 = max(60m, 정확도×1.5), 최대 300m, 후보 15곳
   · 위치 권한을 거부하면 지역 버튼 4개(서촌 / 경복궁·광화문 / 북촌·삼청 / 안국·인사동) → 반경 800m, 후보 40곳
      ↓
③ 비전 AI(OpenAI gpt-5.4-mini)가 간판 글자를 읽고, 후보 목록 안에서만 선택
   · 답을 후보 id 중 하나 또는 "none"으로만 할 수 있게 구조화 출력(enum)으로 강제 → 목록에 없는 가게를 지어내지 않음
      ↓
④ 결과 화면
   · 확신도 0.7 이상 → 가게 카드
   · 확신도 0.7 미만 → "이 중 어느 가게인가요?" 후보 최대 3곳
   · 해당 가게 없음 → "등록되지 않은 가게예요"
```

---

## 2. 진행 상황

> 2026-11-11 기준. 코드와 데이터(로컬 파일, Supabase 테이블)를 직접 확인해서 작성했습니다.

### 지금 되는 것

- [x] **카카오 수집** — 서촌·경복궁·북촌 사각형 영역의 음식점·카페 **1,324곳** (음식점 882, 카페 442). 45개를 넘는 칸은 4등분해 다시 검색하므로 잘린 칸은 0개
- [x] **구글 매칭 + 검증** — 1,324곳 중 1,207곳을 구글 장소와 매칭(91.2%). 리뷰 수 상위 101곳은 가게 종류와 이름을 다시 확인해서 6곳을 제외(박물관·시장·호텔로 잘못 매칭된 5곳, 중복 1곳)
- [x] **상위 60곳 정보 생성** — 구글 리뷰 5개씩을 바탕으로 업종, 대표 메뉴, 비건 3단계, 리뷰 요약, 팁을 **5개 언어**로 생성 (실패 0곳). 비건 분포: likely 2 / check 24 / hard 34
- [x] **Supabase 업로드** — `stores` 테이블 60행, PostGIS 좌표 칼럼, 거리순 후보 함수 `nearby_stores()`
- [x] **`/api/identify`** — 사진 + 좌표 → 가게 판별. 테스트 사진 3장이 GPS 모드와 지역 모드 모두 정답 (등록 가게 2곳 식별, 미등록 가게 1곳은 "none")
- [x] **`/scan` 화면** — 찍기, 분석 중 표시, 가게 카드, 후보 선택, 미등록 안내, 직원에게 보여주기(전체화면), 카카오맵 길찾기
- [x] **위치 거부 대응** — 지역 버튼 4개로 수동 선택
- [x] **사이트 언어 6개** — en / es / ko / zh / ja / ru (ko는 개발 확인용이고, 가게 정보는 영어로 대체)
- [x] **스캔 로그** — 위치, 읽은 간판 글자, 선택 가게, 확신도, 사용자 정정 여부를 저장. **사진은 저장하지 않음.** 브라우저에서는 읽기·쓰기가 막혀 있고 서버 키로만 접근 가능

### 아직 안 되는 것 / 한계

- [ ] **등록 가게가 60곳뿐** — 나머지 매칭된 약 1,140곳은 DB에 없어서, 그 가게를 찍으면 "미등록"으로 나옴
- [ ] **네이버 블로그 리뷰 미반영** — 지금은 구글 리뷰(가게당 최대 5개)만 사용
- [ ] **큐레이션 10곳 미반영** — 강제 포함 기능(`data/curated.txt`)은 구현했지만 목록 파일은 아직 없음
- [ ] **현장 실사용 테스트 부족** — 테스트 사진이 3장뿐이고, 실제 폰 카메라·아이폰 HEIC 사진·야간·비스듬한 간판은 아직 확인하지 않음
- [ ] **비건 판단은 AI 추정** — 리뷰와 업종만으로 판단하므로 사람이 검증해야 함. 괄호 안 한글 메뉴명도 AI가 영어에서 되옮긴 경우가 있어 실제 메뉴판과 다를 수 있음
- [ ] **Cloudflare AI Gateway 미적용** — OpenAI를 서버에서 직접 호출하고, 호출 횟수 제한(rate limit)도 아직 없음
- [ ] **키트의 다른 페이지는 zh·ja·ru 번역 안 됨** — 헤더, 언어 메뉴, `/scan`, 오류 페이지만 번역함
- [ ] **배포 전** — GitHub push 후 Vercel에 배포할 예정

### 다음 계획

1. Vercel 배포 후 서촌·북촌 현장에서 실제 폰으로 30장 이상 찍어 정확도를 측정하고, 확신도 기준값(0.7)과 이미지 해상도(`detail: low`)를 조정
2. 큐레이션 10곳을 반영하고, 비건·메뉴 정보를 사람이 검수. 네이버 블로그 리뷰를 추가해 한국어 리뷰 근거를 보강
3. 매칭된 1,200여 곳을 "후보 전용"으로 DB에 올려 미등록 판정을 줄이고, 스캔 로그의 사용자 정정 데이터로 오답을 분석
4. `/api/identify`에 AI Gateway와 호출 제한을 적용해 비용과 남용을 통제

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 웹 | Next.js 16 (App Router, Route Handlers), React, Tailwind CSS, shadcn/ui, i18next — **Supanext 스타터 키트(nomadcoders) 기반** |
| DB | Supabase (PostgreSQL + PostGIS), RLS |
| AI | OpenAI `gpt-5.4-mini` — 간판 인식(비전)과 가게 정보 생성. 둘 다 Structured Outputs(`json_schema` strict) 사용 |
| 데이터 수집 | Python 3.12 — requests, pandas, shapely, supabase-py, openai, Pillow |
| 외부 API | 카카오 로컬(카테고리·키워드 검색), Google Places API (New) — Text Search, Place Details |
| 배포 | Vercel (예정) |

## 데이터 파이프라인

`scripts/`에서 아래 순서로 실행합니다. 모든 스크립트는 중간에 끊겨도 다시 실행하면 이어서 진행합니다.

| 순서 | 스크립트 | 하는 일 | 결과 |
|---|---|---|---|
| 1 | `collect_kakao.py` | `data/area.geojson` 영역을 300m 격자로 나눠 카카오 카테고리 검색 (FD6 음식점, CE7 카페). 45개를 넘는 칸은 4등분해 재검색 | `data/stores_raw.csv` |
| 2 | `match_google.py` | 가게명 + 좌표로 Google Text Search. 80m 이내 결과만 매칭으로 인정 | `data/stores_google.csv` |
| 3 | `verify_google.py` | 리뷰 수 상위 후보를 Place Details로 재확인: 음식점·카페가 아니거나 이름이 다르면 제외하고, 같은 구글 장소는 하나만 남김 | `stores_google.csv` 갱신 |
| 4 | `select_top.py` | 검증 통과 가게 중 리뷰 수 상위 60곳 + `data/curated.txt` 강제 포함 | `data/stores_top.csv` |
| 5 | `fetch_reviews.py` | Place Details로 가게당 리뷰 최대 5개 | `data/reviews/*.json` |
| 6 | `enrich.py` | OpenAI로 5개 언어 카드 정보 생성 (호출 상한 100번, 인증·한도 오류 시 즉시 중단) | `data/enriched/*.json` |
| 7 | `upload.py` | Supabase `stores`에 `kakao_id` 기준으로 upsert (`--dry-run` 지원) | DB |
| — | `test_identify.py` | 테스트 사진으로 `/api/identify` 정확도 확인 (`--mode gps` 또는 `--mode area`) | 콘솔 표 |

## 폴더 구조

```
scan/
├── README.md
├── CLAUDE.md               # 프로젝트 규칙 (키 관리, 작업 방식)
├── .env.example            # 스크립트용 키 목록 (값 없음)
├── requirements.txt
├── data/
│   └── area.geojson        # 수집 영역. 그 외 수집 결과(csv/json/사진)는 .gitignore
├── scripts/                # 데이터 파이프라인 (위 표)
├── sql/
│   ├── schema.sql          # stores 테이블 + PostGIS + nearby_stores()
│   ├── nearby_stores_v2.sql# nearby_stores에 max_count 추가
│   └── scan_logs.sql       # 스캔 로그 테이블 (RLS, 서버 키 전용)
└── web/                    # Next.js (Supanext 스타터 키트 기반)
    └── src/
        ├── app/[lang]/scan/page.tsx         # 스캔 화면
        ├── app/api/identify/route.ts        # 간판 인식 API
        ├── app/api/scan-feedback/route.ts   # 후보 선택 기록 API
        ├── features/scan/                   # 화면 컴포넌트, 이미지 축소, 타입
        └── i18n/dictionaries/               # en/es/ko/zh/ja/ru
```

## 실행 방법

### 1) Supabase

SQL Editor에서 순서대로 실행합니다: `sql/schema.sql` → `sql/scan_logs.sql`
(`schema.sql`에는 `nearby_stores_v2.sql`의 내용이 이미 들어 있습니다.)

### 2) 데이터 파이프라인 (Python)

```bash
cp .env.example .env        # KAKAO_REST_KEY, GOOGLE_PLACES_KEY, OPENAI_API_KEY, SUPABASE_* 입력
py -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python

.venv/Scripts/python scripts/collect_kakao.py
.venv/Scripts/python scripts/match_google.py
.venv/Scripts/python scripts/verify_google.py
.venv/Scripts/python scripts/select_top.py
.venv/Scripts/python scripts/fetch_reviews.py
.venv/Scripts/python scripts/enrich.py --limit 10   # 10곳 테스트 후
.venv/Scripts/python scripts/enrich.py              # 나머지 전체
.venv/Scripts/python scripts/upload.py
```

> Google Places와 OpenAI는 유료 API입니다. 1,324곳 기준으로 Text Search 약 1,300번, Place Details 약 160번, OpenAI 60번을 호출합니다.

### 3) 웹 (Node 24)

```bash
cd web
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000 → /scan 으로 이동
```

`web/.env.local`에 꼭 필요한 값:

| 이름 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 연결 (모든 요청에 필요) |
| `SUPABASE_SECRET_KEY` | 서버 전용: 후보 조회, 스캔 로그 |
| `OPENAI_API_KEY` | 서버 전용: 간판 인식 |
| `NEXT_PUBLIC_SITE_URL` | 사이트 주소 (배포 시 Vercel 주소) |

Sentry, Resend, Toss 같은 키트의 다른 연동은 비워 둬도 됩니다.

> 위치 권한(GPS)은 HTTPS나 localhost에서만 동작합니다. 폰에서 테스트하려면 배포 주소를 사용하세요.

### 4) 배포 (Vercel)

- **Root Directory: `web`**
- Node 버전은 `web/package.json`의 `engines`(24.x)를 따름
- 위 표의 환경변수를 Vercel 설정에 등록. 서버 전용 키에는 `NEXT_PUBLIC_`을 붙이지 않음

## 보안·개인정보

- API 키는 `.env` / `.env.local`에서만 읽고 저장소에는 올리지 않습니다 (`.gitignore`).
- 사진은 서버에 저장하지 않습니다. OpenAI로 보내 판별한 뒤 바로 버립니다.
- 스캔 로그 테이블은 RLS를 켜고 정책을 두지 않아, 브라우저(공개 키)에서는 읽을 수도 쓸 수도 없습니다.

## 크레딧

- 웹 기반: [Supanext 스타터 키트 — nomadcoders/ax-school-boilerplates](https://github.com/nomadcoders/ax-school-boilerplates/tree/master/supanext)
- 데이터: 카카오 로컬 API, Google Places API
