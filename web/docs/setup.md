# 설정

## 요구 사항

- [`.nvmrc`](../.nvmrc)와 [`package.json`](../package.json)에 지정된 Node.js 24.
- npm과 코드 에디터. 저장소로 작업하는 경우 Git도 필요합니다.
- 인증, 스토리지, 데이터베이스 기능에 사용할 호스팅된 Supabase 프로젝트.

Docker나 로컬 Supabase 설치는 필요하지 않습니다.

## 프로젝트 열기와 의존성 설치

다운로드한 파일의 압축을 풀거나 저장소를 연 다음, 그 안의 `supanext` 디렉토리로 이동합니다.

```sh
cd supanext
nvm use
npm install
```

nvm을 사용하지 않는다면 평소 사용하는 버전 관리 도구로 Node.js 24를 선택하세요.

## 환경 파일 만들기

예제 파일은 유지하고 로컬 설정용 복사본을 만듭니다.

macOS/Linux:

```sh
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Next.js는 이 파일을 자동으로 읽습니다. 현재 스크립트에는 React Router에서 사용하던 Windows용 `cross-env` 우회 설정이 필요하지 않습니다.

## Supabase 설정

[Supabase 대시보드](https://supabase.com/dashboard)에서 프로젝트를 생성합니다. 데이터베이스 비밀번호를 안전하게 보관하고 애플리케이션에 적합한 지역을 선택하세요.

프로젝트의 Connect/API 키 설정에서 프로젝트 URL, publishable key, 서버 전용 secret key, Postgres 연결 문자열을 확인하여 다음 값을 입력합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
SUPABASE_SECRET_KEY=sb_secret_your-key
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@your-region.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Supanext
```

사용자명, 호스트, 비밀번호를 포함해 프로젝트에 표시된 실제 연결 문자열을 사용하세요. 데이터베이스 클라이언트는 transaction pooler에 맞게 prepared statement를 비활성화합니다. `SUPABASE_SECRET_KEY`가 없으면 기존 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`도 사용할 수 있습니다.

secret/service-role 키나 데이터베이스 비밀번호를 `NEXT_PUBLIC_` 변수에 넣지 마세요.

## 데이터베이스 초기 설정 적용

[`supabase/migrations`](../supabase/migrations)의 SQL을 검토하고 `DATABASE_URL`이 의도한 프로젝트를 가리키는지 확인한 뒤 실행합니다.

```sh
npm run db:check
npm run db:migrate
```

위 명령은 마이그레이션 메타데이터를 검사하고 스키마 변경을 적용합니다. 마이그레이션에는 프로필, 결제, 결제 주문, RLS 정책, 권한, 프로필/타임스탬프 트리거, 아바타 스토리지, 메일 큐가 포함됩니다. 예약된 Cron 작업은 [Cron 작업](cron.md)에서 별도로 설정합니다.

클라이언트 타입을 생성하려면 같은 Supabase 프로젝트를 CLI에 연결합니다.

```sh
npx supabase login
npx supabase link --project-ref your-project-ref
npm run db:typegen
```

이 과정에서 로컬 데이터베이스를 실행할 필요는 없습니다. 마이그레이션 생성, 적용, 타입 생성의 차이는 [데이터베이스 스키마](database.md)에서 설명합니다.

## 개발 서버 실행

```sh
npm run dev
```

[localhost:3000](http://localhost:3000)을 엽니다. 선택적 연동은 설정하기 전까지 값을 비워 두세요. 인증 이메일, 소셜 로그인, 문의 양식, 결제, 환영 이메일에는 각 장에서 설명하는 추가 설정이 필요합니다.

계정 기능을 사용하기 전에 [인증](authentication.md)과 [이메일](emails.md) 설정을 마치세요. 공개 배포는 [배포](deployment.md) 안내를 별도로 따릅니다.

---

[목차](README.md)
