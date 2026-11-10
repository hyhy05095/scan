# 배포

Supanext는 Vercel의 Next.js 배포를 대상으로 합니다. Server Actions, 인증된 서버 렌더링, Route Handlers를 사용하므로 정적 파일만 내보내는 웹사이트가 아닙니다.

## 저장소에 포함된 데이터베이스 타입으로 빌드하기

배포 빌드는 저장소에 포함된 데이터베이스 타입을 사용합니다. [package.json](../package.json)의 스크립트는 다음과 같습니다.

```json
{
  "prebuild": "npm run typecheck",
  "build": "next build"
}
```

`npm run build`는 먼저 타입을 검사한 뒤 Next.js를 빌드합니다. 데이터베이스 타입을 다시 생성하지 않습니다. 따라서 Vercel에 타입 생성을 위한 Supabase CLI 로그인·연결 인증 정보를 설정할 필요가 없으며, 배포할 코드와 함께 검토된 타입으로 빌드합니다.

개발 중 데이터베이스 스키마를 변경한 뒤에는 다음 순서로 진행합니다.

1. 검토한 마이그레이션을 개발용 Supabase 프로젝트에 적용합니다.
2. `npm run db:typegen`과 `npm run typecheck`를 순서대로 실행합니다.
3. 마이그레이션, 생성된 데이터베이스 타입, 관련 코드를 함께 검토하고 커밋합니다.

[타입 생성 스크립트](../scripts/db-typegen.mjs)를 명시적으로 실행할 때는 여전히 연결된 호스팅 프로젝트가 필요합니다. 개발 설정은 [데이터베이스](database.md) 문서를 참고하세요. 빌드는 저장된 타입을 검사할 뿐 실제 데이터베이스 스키마를 확인하지 않으므로, 마이그레이션과 타입을 일치시켜야 합니다. 사용하는 기능에 필요한 일반적인 앱 환경 변수도 여전히 설정해야 합니다.

## Vercel 프로젝트 설정

[Vercel](https://vercel.com/new)에서 `ax-school-boilerplates` 저장소를 가져옵니다.

| 항목             | 값                             |
| ---------------- | ------------------------------ |
| Root Directory   | `supanext`                     |
| Framework Preset | Next.js                        |
| Node.js 버전     | 프로젝트와 동일한 24.x         |
| 의존성           | npm과 기존 `package-lock.json` |
| Build Command    | `npm run build`                |
| Output Directory | Next.js 프레임워크 기본값 유지 |

Git 저장소의 루트는 `ax-school-boilerplates`이지만, 앱의 패키지 파일은 `supanext` 안에 있습니다. [Vercel 빌드 설정 문서](https://vercel.com/docs/builds/configure-a-build)를 참고하세요.

## 환경 변수와 데이터베이스

[환경 변수](environment-variables.md) 문서를 기준으로 값을 설정하세요. 테스트 수신함 인증 정보나 로컬 값 전체를 프로덕션에 복사하지 말고, 배포 환경별로 필요한 값을 구분하세요.

대상 호스팅 프로젝트의 Supabase URL, 공개 키, 서버 전용 관리자 키, `DATABASE_URL`을 설정합니다. 실제 사용할 Resend, CAPTCHA, 토스페이먼츠, Sentry, 분석, 채널톡도 각각 설정하세요.

`NEXT_PUBLIC_*` 값은 브라우저 빌드에 포함되므로 바꾼 뒤에는 새로 빌드해야 합니다. 비밀 키에 이 접두사를 붙이면 안 됩니다.

[데이터베이스 마이그레이션](database.md)은 대상 프로젝트를 확인하고 검토한 뒤 별도 작업으로 적용하세요. 앱 빌드는 마이그레이션 적용, Supabase Cron 일정 생성, 외부 서비스 설정을 대신하지 않습니다.

## 도메인과 인증 URL

필요하다면 [Vercel 도메인 가이드](https://vercel.com/docs/domains/working-with-domains/add-a-domain)에 따라 사용자 지정 도메인을 연결하세요.

`NEXT_PUBLIC_SITE_URL`을 `https://your-domain.com` 같은 최종 origin으로 설정하고, Supabase Auth의 Site URL도 수정합니다. 다음 콜백에 필요한 신뢰할 수 있는 리다이렉트 허용 항목을 추가하세요.

- `https://your-domain.com/auth/confirm`
- `https://your-domain.com/auth/social/callback`

콜백 세부 사항은 [인증](authentication.md) 문서를 참고하세요. 이메일 템플릿은 Supabase의 `{{ .SiteURL }}`을 사용하므로 값이 맞지 않으면 다른 배포로 이동할 수 있습니다. 미리보기 배포도 URL과 서비스 설정을 따로 검토해야 하며, 프로덕션 리다이렉트를 무제한 허용하는 것으로 대신하지 마세요.

## 예약 작업과 확인

기존 메일러는 [Supabase Cron](cron.md)으로 설정합니다. 30초마다 `POST /api/cron/mailer`를 호출하고, `Authorization: <CRON_SECRET>`에 원본 비밀 값을 넣습니다. Next.js 앱을 Vercel에 배포해도 스케줄러는 Supabase에 있습니다. Vercel Cron 작업을 추가하지 않습니다.

배포 후 대상 환경에서 인증 콜백, 이메일 전송, 테스트 모드 결제, 정적 파일, 설정한 모니터링을 확인하세요. 호스팅 환경의 계정 테스트는 사용자를 만들고 삭제하므로 프로덕션이 아닌 전용 테스트 프로젝트를 사용해야 합니다.

이 포트에는 Cloudflare Workers, OpenNext, vinext 배포 설정이 포함되어 있지 않습니다. [프로덕션 팁](production-tips.md)은 운영 시 고려 사항이며, 별도의 호스팅 구현을 제공하는 문서가 아닙니다.

---

[목차](README.md)
