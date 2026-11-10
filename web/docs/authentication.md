# 인증

Supanext는 Supabase Auth를 사용하며 이메일/비밀번호, Google/GitHub/Apple/Kakao OAuth, 매직 링크, 이메일 인증, 비밀번호 재설정, 6자리 코드를 지원합니다.

![인증 화면](assets/authentication.jpg)

## 제공업체와 URL 설정

Supabase Auth에서 사용할 제공업체를 활성화하고 각 OAuth 인증 정보를 설정하세요. 버튼이 있다고 외부 제공업체까지 설정되는 것은 아닙니다.

Supabase의 Site URL과 `NEXT_PUBLIC_SITE_URL`을 애플리케이션 주소로 설정합니다. 로컬 기본값은 `http://localhost:3000`입니다. Supabase의 URL 매칭 규칙에 맞게 쿼리 문자열을 포함한 목적지를 고려하여 `/auth/confirm`, `/auth/social/callback`의 허용 리디렉션 URL을 설정하세요. 운영 환경에는 무제한 와일드카드가 아닌 신뢰하는 주소를 명시합니다.

Google/GitHub/Apple/Kakao에 입력하는 OAuth 콜백은 **해당 제공업체의 Supabase 설정 화면에 표시되는 Supabase 콜백 URL**입니다. 애플리케이션의 콜백은 Supabase의 OAuth 처리가 끝난 뒤 사용되는 별도 단계입니다.

이메일 기능을 사용하기 전에 [커스텀 SMTP와 이메일 템플릿](emails.md)을 설정하세요. [Supabase Auth](https://supabase.com/docs/guides/auth)와 [리디렉션 URL 설정](https://supabase.com/docs/guides/auth/redirect-urls)도 참고하세요.

## 브라우저 경로

| 경로                           | 용도                                           |
| ------------------------------ | ---------------------------------------------- |
| `/join`                        | 회원가입 및 인증 이메일 안내                   |
| `/login`                       | 비밀번호 로그인과 소셜 로그인                  |
| `/auth/forgot-password/reset`  | 비밀번호 재설정 이메일 요청                    |
| `/auth/forgot-password/create` | 인증 후 새 비밀번호 설정                       |
| `/auth/magic-link`             | 기존 계정의 로그인 링크 요청                   |
| `/auth/otp/start`              | 이메일 인증 코드 요청                          |
| `/auth/otp/complete`           | 6자리 코드 입력. 마지막 자리 입력 시 자동 제출 |
| `/auth/confirm`                | 이메일 token hash 검증 또는 인증 코드 교환     |
| `/auth/social/callback`        | OAuth 완료                                     |

공개 경로에는 언어 접두사가 없습니다. [proxy](../src/proxy.ts)가 기존 형태의 경로를 내부 App Router 파일에 연결합니다.

## 세션 클라이언트와 경로 보호

[`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts)는 쿠키를 처리하는 서버 클라이언트를 만듭니다. [`client.ts`](../src/lib/supabase/client.ts)는 브라우저 클라이언트입니다. proxy의 [세션 헬퍼](../src/lib/supabase/proxy.ts)는 내부 언어 rewrite를 유지하면서 인증 쿠키를 갱신합니다.

계정과 대시보드 레이아웃은 [`AuthenticatedDashboardShell`](../src/features/dashboard/components/authenticated-dashboard-shell.tsx)을 사용합니다. 현재 계정을 가져오고 비로그인 사용자를 `/login?next=...`로 이동시킵니다.

로그인/가입 페이지는 [`redirectAuthenticatedUser`](../src/features/auth/guards.ts)를 사용해 이미 로그인한 사용자를 `/`로 이동시킵니다.

레이아웃의 리디렉션은 데이터 변경 작업의 권한 검사를 대신하지 않습니다. 보호된 액션은 공통 액션 클라이언트에서 인증된 사용자를 별도로 확인합니다.

## Server Action과 next-safe-action

[`src/lib/safe-action.ts`](../src/lib/safe-action.ts)는 다음을 export합니다.

- 공개 액션과 공통 예외 처리를 위한 `actionClient`.
- Supabase claims를 검증하고 `ctx.userId`, `ctx.claims`, 사용자 권한의 `ctx.supabase`를 제공하는 `authenticatedActionClient`.
- 애플리케이션의 타입이 지정된 예상 가능한 오류를 반환하는 `returnAppError`.

액션은 [`src/features/auth/actions.ts`](../src/features/auth/actions.ts)와 [`src/features/account/actions.ts`](../src/features/account/actions.ts)에 있습니다. Zod 스키마가 제출값을 검증하고, Client Component는 `next-safe-action/hooks`의 `useAction`으로 호출하여 `result.validationErrors` 또는 `result.serverError`를 표시합니다.

이 구현을 React Router의 `loader`, `action`, `useFetcher` 예시와 혼동하지 마세요. HTTP 콜백은 `route.ts`에서 `GET`을 export합니다. 메일러는 `POST`를 export하고 자체 비밀 값으로 인증합니다. Route Handler는 상위 레이아웃이 보호한다고 가정하지 않고 자체 권한 검사를 해야 합니다.

라이브러리 사용법은 [next-safe-action 문서](https://next-safe-action.dev/docs/getting-started)를, 프로젝트에 사용된 버전의 지침은 [설치된 스킬](../.agents/skills)을 참고하세요.

## 가입, 비밀번호, 리디렉션

- 가입 요청을 보내기 전에 이미 존재하는 이메일인지 확인합니다.
- 이름은 공백을 제외하고 최소 한 글자여야 합니다.
- 비밀번호는 최소 8자이며 추가 영문/숫자 조합 조건이나 클라이언트의 72자 상한을 두지 않습니다. Supabase 프로젝트/제공업체 규칙은 별도로 적용될 수 있습니다.
- 비밀번호 확인 값은 일치해야 합니다.
- 매직 링크와 OTP 요청은 `shouldCreateUser: false`를 사용합니다.
- 로그인 성공 시 기본 목적지는 `/`입니다. 지원되는 흐름에서는 명시된 안전한 내부 `next` 목적지를 유지합니다.
- 로그아웃은 현재 브라우저만이 아니라 Supabase의 기본 전역 로그아웃을 사용합니다.

[`src/lib/site-url.ts`](../src/lib/site-url.ts)는 외부 `next` 목적지를 거부합니다. 이메일 확인과 OAuth 코드 교환은 서버에서 처리합니다.

## 프로필 생성과 마케팅 동의

가입 데이터베이스 트리거가 `profiles` 행을 만듭니다. 이름은 `name`, `display_name`, `full_name` 순으로 선택하고 값이 없으면 `Anonymous`를 사용합니다.

이메일/전화번호 가입은 전달된 마케팅 수신 설정을 읽고 기본값은 false입니다. 소셜 가입은 유지하기로 한 Supaplate 동작과 동일하게 `marketing_consent`를 true로 설정합니다. 사용자는 `/account/edit`에서 변경할 수 있습니다. 이 문서는 해당 기본값을 변경하지 않습니다.

최종 트리거 정의는 [마이그레이션 0005](../supabase/migrations/0005_restore_supaplate_parity.sql)에 있습니다. 기존 가이드의 트리거 SQL을 따로 실행하지 말고 전체 이력을 적용하세요.

---

[목차](README.md)
