# 테스트

Supanext는 Playwright로 브라우저를 검사하고 Node 테스트 러너로 외부 서비스와 분리된 회귀 테스트를 실행합니다.

## 테스트 그룹

| 그룹                          | 검사 대상                                                            | 외부 영향                                                                      |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 공개 브라우저 검사            | 페이지, 입력 검증, 언어/테마 메뉴, MDX 상호작용, 리디렉션, Cron 인증 | 호스팅 프로젝트의 계정 생성/변경/삭제 흐름을 실행하지 않음                     |
| 이름에 `Hosted`가 있는 테스트 | 가입/로그인/복구, 이메일/비밀번호/프로필 변경, 계정 삭제             | 설정된 Supabase 프로젝트의 사용자를 생성/변경/삭제하며 일부 흐름은 이메일 요청 |
| 회귀 테스트                   | 스키마, 액션 동작, Cron 인증, 내역 조회, MDX 자동 탐색               | 외부 서비스/DB 경계를 테스트용 구현으로 대체                                   |

파일은 [`e2e`](../e2e)에 있고, 호스팅된 프로젝트를 사용하는 흐름은 `e2e/auth`와 `e2e/users`에 있습니다. 자료와 헬퍼는 `e2e/assets`, `e2e/utils`에 있습니다. 회귀 테스트는 [`tests/parity.test.mjs`](../tests/parity.test.mjs)입니다.

## 검사 실행

```sh
npm run test:regression
npx playwright install
npm run test:e2e:public
npm run test:e2e
npm run test:e2e:ui
```

전체 테스트는 비운영 프로젝트와 테스트 계정을 설정한 뒤에만 실행하세요. `test:e2e:ui`는 Playwright의 대화형 테스트 UI를 열고, `test:e2e`는 기본적으로 headless로 실행합니다.

[`playwright.config.ts`](../playwright.config.ts)는 Chromium, Firefox, WebKit을 실행합니다. 실행하지 않고 현재 테스트 목록만 보려면 다음을 사용하세요.

```sh
npx playwright test --list
```

원본 테스트 결과 스크린샷을 이 저장소의 테스트 결과로 사용하지 않습니다.

## 서버와 빌드 설정

Playwright는 `.env.local`을 읽습니다. `PLAYWRIGHT_BASE_URL`이 없으면 앱을 빌드하고 `http://localhost:3000` 또는 지정한 `PORT`에서 실행합니다. CI가 아닌 환경에서는 사용 가능한 기존 서버를 재사용합니다.

빌드는 `prebuild`에서 타입 검사를 수행하고 저장소에 포함된 데이터베이스 타입을 사용합니다. Playwright가 앱을 빌드하기 위해 Supabase CLI에 로그인하거나 프로젝트를 연결할 필요는 없습니다. 호스팅 환경 테스트에는 여전히 데이터베이스, 인증 정보, 서비스 설정이 필요하므로 전체 테스트가 오프라인으로 실행되는 것은 아닙니다.

이미 실행 중인 서버를 사용하려면 `PLAYWRIGHT_BASE_URL`을 지정합니다. macOS/Linux 예시는 다음과 같습니다.

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e:public
```

PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
npm run test:e2e:public
```

애플리케이션 서버와 테스트 러너의 설정을 일치시키세요. 현재 빌드 조건은 [배포](deployment.md)를 참고하세요.

## 호스팅된 프로젝트의 계정 테스트

> 이 테스트는 테스트 계정을 삭제하거나 변경합니다. 운영 사용자 또는 운영 프로젝트를 대상으로 실행하지 마세요.

애플리케이션에는 일반 Supabase 설정과 적용된 데이터베이스 스키마가 필요합니다. 러너에는 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SECRET_KEY` 또는 기존 `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다. 필요한 설정이 없으면 조용히 건너뛰지 않고 명시적으로 실패합니다.

[`.env.example`](../.env.example)의 모든 테스트 이메일 변수를 설정하세요.

```dotenv
JOIN_TEST_UNCONFIRMED_USER_EMAIL=
JOIN_TEST_EXISTING_USER_EMAIL=
LOGIN_TEST_USER_EMAIL=
FORGOT_PASSWORD_TEST_USER_EMAIL=
MAGIC_LINK_TEST_USER_EMAIL=
CHANGE_EMAIL_TEST_USER_EMAIL=
CHANGE_EMAIL_TEST_USER_NEW_EMAIL=
CHANGE_PASSWORD_TEST_USER_EMAIL=
EDIT_PROFILE_TEST_USER_EMAIL=
DELETE_PROFILE_TEST_USER_EMAIL=
```

소유한 서로 다른 테스트 전용 메일함을 사용하고 plus addressing을 지원하는지 확인하세요. 헬퍼는 병렬 테스트를 분리하기 위해 고정된 `+시나리오-브라우저` 별칭을 붙입니다. 예를 들어 `tester@example.com`은 해당 시나리오에서 `tester+login-chromium@example.com`이 됩니다. 테스트 별칭에 이미 있는 계정도 준비/정리 과정에서 삭제될 수 있습니다.

테스트는 Supabase Admin API로 계정을 만들고 인증 토큰을 생성하며 받은편지함을 읽지 않습니다. 따라서 실제 메일함 전달을 입증하지는 않습니다. 일부 액션은 여전히 이메일 발송을 요청하므로 [SMTP](emails.md)와 제공업체 제한을 확인하세요. 사용자 생성 시 환영 이메일 큐를 포함한 가입 데이터베이스 트리거도 실행됩니다.

## 결과와 한계

HTML 보고서는 `playwright-report`에 생성되며 `npx playwright show-report`로 열 수 있습니다. 설정은 첫 재시도 시 trace/동영상을 저장합니다. CI에서는 재시도를 활성화하고 로컬 기본값에는 재시도가 없습니다.

공개 테스트 통과만으로 실제 OAuth 로그인, Toss 결제, 이메일 전달, 모든 DB 정책이 검증되지는 않습니다. 설정된 비운영 환경에서 해당 검사를 수행하세요.

이 테스트 설정에 Docker, pgTAP, 로컬 Supabase 스택은 필요하지 않습니다. [Playwright 테스트 실행 가이드](https://playwright.dev/docs/running-tests)를 참고하세요.

---

[목차](README.md)
