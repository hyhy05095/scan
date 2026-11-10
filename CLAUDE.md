# Scan — 서촌·북촌 외국인용 간판 인식 웹앱

## 목표
서울 서촌·북촌을 방문한 외국인이 가게 간판을 찍으면, 그 가게 정보를 자기 언어로 바로 볼 수 있게 한다.

## 사용자 흐름
1. 폰으로 간판 사진 촬영
2. GPS 좌표로 주변 가게 후보 조회 (Supabase PostGIS `nearby_stores`)
3. 비전 LLM이 사진 + 후보 목록을 보고 후보 중 하나를 선택
4. 가게 카드 표시
   - 대표 메뉴
   - 비건 3단계
   - 리뷰 요약
   - 5개 언어: en / zh / ja / ru / es

## 스택
- `scripts/` — Python 데이터 수집 스크립트 (Kakao Local, Google Places 등)
- `data/` — 수집 원본/중간 산출물
- `sql/` — Supabase(PostgreSQL + PostGIS) 스키마
- `web/` — Next.js, 로그인 없음, Vercel 배포
- LLM은 Next.js 서버 API 라우트에서 직접 호출 (클라이언트에 키 노출 금지)

## 규칙
- **API 키·비밀값은 `.env`(웹은 `.env.local`)에서만 읽는다. 코드에 하드코딩하거나 커밋하지 않는다.** 새 키가 필요하면 `.env.example`에 빈 값으로 추가한다.
- `SUPABASE_SERVICE_ROLE_KEY`, `LLM_API_KEY`는 서버/스크립트 전용. 브라우저 번들에 들어가면 안 된다.
- 답변은 한국어로 한다.
- 큰 작업(여러 파일 변경, 스키마 변경, 새 기능)은 먼저 계획을 제시하고 확인받은 뒤 진행한다.
