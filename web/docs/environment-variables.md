# 환경 변수

전체 목록은 [`.env.example`](../.env.example)을 기준으로 확인하세요. 로컬 값은 `src` 내부가 아닌 `supanext` 최상위의 `.env.local`에 저장합니다.

## 공개 값과 서버 전용 값

Next.js는 `NEXT_PUBLIC_` 변수를 브라우저 코드에 노출합니다. 이 값은 빌드할 때 포함되므로, 배포된 애플리케이션에서 변경하려면 다시 빌드해야 합니다. 나머지 변수는 이 프로젝트에서 서버 전용으로 사용하며, Client Component의 props나 응답에 값을 전달하면 안 됩니다. [Next.js 환경 변수 문서](https://nextjs.org/docs/app/guides/environment-variables)를 참고하세요.

| 용도          | 브라우저에 공개되는 변수                                           | 서버 전용 변수                                                              |
| ------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Supabase      | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_SECRET_KEY` 또는 기존 `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| 브랜드/URL    | `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_URL`                     | —                                                                           |
| Sentry        | `NEXT_PUBLIC_SENTRY_DSN`                                           | `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DEBUG_ENABLED` |
| Analytics     | `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`                                  | —                                                                           |
| 채널톡        | `NEXT_PUBLIC_CHANNEL_PLUGIN_KEY`                                   | —                                                                           |
| hCaptcha      | `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`                                    | `HCAPTCHA_SECRET_KEY`                                                       |
| Turnstile     | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                   | `TURNSTILE_SECRET_KEY`                                                      |
| 이메일/문의   | —                                                                  | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`                        |
| 메일러 인증   | —                                                                  | `CRON_SECRET`                                                               |
| Toss Payments | `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`                             | `TOSS_PAYMENTS_SECRET_KEY`                                                  |

Supabase publishable key는 클라이언트에서 사용하도록 제공되는 키이며, 실제 접근 범위는 권한과 RLS로 제한됩니다. 높은 권한을 가진 secret/service-role 키와 서로 바꿔 쓰면 안 됩니다.

## 데이터베이스와 도구

애플리케이션과 Drizzle Kit는 모두 `DATABASE_URL`을 사용합니다. Drizzle은 `@next/env`로 Next.js 환경 파일을 읽습니다. 이 프로젝트에는 별도의 `DIRECT_URL`이 필요하지 않습니다.

Supabase CLI의 `db:typegen`에는 별도의 로그인/프로젝트 연결 설정이 필요합니다. Postgres 연결 문자열만으로 이 설정이 대체되지는 않습니다. [데이터베이스 스키마](database.md)를 참고하세요.

Playwright는 `.env.local`과 [테스트](testing.md)에 나열된 테스트 이메일 변수를 읽습니다. 테스트 계정 설정을 운영 배포에 복사하지 마세요.

## 사용 시 주의 사항

- `.env.local`, API 비밀 키, 데이터베이스 인증 정보를 Git에 저장하지 마세요.
- 로컬 환경 파일을 업로드하는 대신 배포 제공업체에서 운영 값을 설정하세요.
- 선택적인 Sentry, Analytics, 채널톡 값은 비워 두면 연동이 비활성화됩니다.
- 공개/비공개 키는 동일한 제공업체 프로젝트와 환경의 키를 사용하세요.
- 로컬 설정을 바꾼 후 개발 서버를 재시작하고, 공개 값이 바뀌면 다시 빌드하세요.

---

[목차](README.md)
