# 프로젝트 구조

아래는 `supanext` 내부 구조입니다. Git 저장소는 상위 디렉토리인 `ax-school-boilerplates`에 있습니다.

```text
supanext/
├── src/
│   ├── app/
│   │   ├── [lang]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/ 및 join/
│   │   │   ├── auth/
│   │   │   ├── account/
│   │   │   ├── dashboard/
│   │   │   ├── blog/[slug]/
│   │   │   ├── legal/[slug]/
│   │   │   ├── payments/
│   │   │   ├── contact/
│   │   │   ├── debug/
│   │   │   ├── [...rest]/page.tsx
│   │   │   ├── error.tsx
│   │   │   └── not-found.tsx
│   │   ├── api/cron/mailer/route.ts
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/ui/
│   ├── content/blog/ 및 content/legal/
│   ├── db/schema/
│   ├── features/
│   ├── hooks/
│   ├── i18n/
│   ├── lib/supabase/
│   ├── proxy.ts
│   ├── instrumentation.ts
│   ├── instrumentation-client.ts
│   ├── sentry.server.config.ts
│   └── sentry.edge.config.ts
├── e2e/
├── tests/parity.test.mjs
├── scripts/db-typegen.mjs
├── public/blog/
├── supabase/migrations/
├── transactional-emails/
├── docs/
├── next.config.ts
├── drizzle.config.ts
├── playwright.config.ts
├── .env.example
└── package.json
```

## App Router 파일

Next.js는 React Router의 `routes.ts` 목록 대신 파일 기반 라우팅을 사용합니다.

| 파일                             | Supanext에서의 역할                                 |
| -------------------------------- | --------------------------------------------------- |
| `page.tsx`                       | 경로의 페이지                                       |
| `layout.tsx`                     | 하위 페이지를 감싸는 공통 레이아웃                  |
| `route.ts`                       | 메일러 POST 엔드포인트 같은 HTTP 핸들러             |
| `error.tsx` / `global-error.tsx` | 오류 경계                                           |
| `not-found.tsx`                  | 페이지를 찾을 수 없을 때의 UI                       |
| `[slug]`                         | 블로그/법적 고지의 동적 세그먼트                    |
| `[...rest]/page.tsx`             | 알 수 없는 페이지 경로를 번역된 not-found UI로 연결 |
| `sitemap.ts` / `robots.ts`       | 메타데이터 라우트                                   |

[`src/app/[lang]/layout.tsx`](../src/app/%5Blang%5D/layout.tsx)는 최상위 HTML, 번역, 공통 화면, 테마 초기화, 외부 연동을 구성합니다. 상호작용이 있는 컴포넌트에는 `"use client"` 경계가 있고, 기능별 액션에는 `"use server"`가 있습니다.

내부 `[lang]` 세그먼트는 브라우저 URL에 나타나지 않습니다. [`src/proxy.ts`](../src/proxy.ts)가 언어를 선택하고 내부 경로로 rewrite합니다. `/account/edit`, `/auth/otp/complete` 같은 기존 공개 경로도 유지합니다. 자세한 내용은 [설정과 테마](settings.md)를 참고하세요.

## 공통 코드와 기능

- [`src/components`](../src/components): 공통 내비게이션, 테마/언어 메뉴, MDX 렌더링, shadcn/ui 컴포넌트.
- [`src/features`](../src/features): `auth`, `account`, `blog`, `contact`, `dashboard`, `debug`, `errors`, `mailer`, `payments`.
- 기능별 `actions.ts`에는 Server Action, `data.ts`에는 데이터 접근 코드, `schemas.ts` 또는 `schema.ts`에는 입력 검증이 있습니다. 이 검증 파일은 Drizzle 테이블 정의와 다릅니다.
- [`src/db/schema`](../src/db/schema): Drizzle 테이블과 정책.
- [`src/lib`](../src/lib): 공통 데이터베이스/인증 헬퍼, next-safe-action 클라이언트, 사이트 URL 처리, 이메일 클라이언트, 테마 초기화.
- [`src/i18n`](../src/i18n): 영어·스페인어·한국어 JSON 번역과 i18next 설정.
- [`src/content`](../src/content): 블로그 및 법적 고지 MDX 원본.

`@/` import 별칭은 `src/`를 가리킵니다.

## 테스트, 데이터베이스, 이메일

[`e2e`](../e2e)에는 공개 페이지 검사와 호스팅된 프로젝트를 사용하는 계정 테스트가 있습니다. 테스트 자료는 `e2e/assets`, 헬퍼는 `e2e/utils`에 있습니다. [`tests/parity.test.mjs`](../tests/parity.test.mjs)는 외부 서비스와 분리된 회귀 검사를 담고 있습니다.

[`supabase/migrations`](../supabase/migrations)에는 생성된 SQL, 커스텀 SQL, Drizzle 메타데이터가 있습니다. 별도의 `sql/functions` 파일을 수동으로 복사하는 설정은 없습니다.

[`transactional-emails`](../transactional-emails)는 자체 package manifest를 가진 React Email 프로젝트입니다. 템플릿은 `emails/`, HTML 출력은 `out/`에 위치합니다.

[`docs`](../README.md)는 일반 Markdown 문서입니다. 애플리케이션 경로나 별도로 배포된 웹사이트가 아닙니다.

프레임워크의 자세한 규칙은 [Next.js 파일 규칙](https://nextjs.org/docs/app/getting-started/project-structure)을 참고하세요.

---

[목차](README.md)
