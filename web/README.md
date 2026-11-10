# Supanext에 오신 것을 환영합니다!

[Supanext 홈페이지](https://nomadcoders.co/supanext)

Supanext는 여러분의 애플리케이션을 만들기 위한 Next.js App Router 보일러플레이트입니다. 완성된 제품이 아니라 프로젝트의 시작점입니다.

방문해 주셔서 기쁩니다. 여러분이 Supanext로 무엇을 만들지 기대됩니다.

이 가이드는 Supanext의 작동 방식을 이해하고 프로젝트를 빌드하기 위한 설정 방법을 안내합니다. 필요한 부분을 주의 깊게 읽어 주세요.

---

## Supanext에 대하여

Supanext는 프로젝트의 시작점으로 사용할 수 있는 코드 템플릿입니다.

사용자 인증, 프로필 관리, 결제, 현지화, 테마, 블로그, 이메일, 모니터링 등 대부분의 프로젝트에 필요한 핵심 기능이 포함되어 있습니다.

> **Supanext는 시작점일 뿐입니다**
>
> Supanext는 모든 기능을 갖춘 애플리케이션이 아니므로, 필요한 기능과 제품별 정책을 직접 추가해야 합니다.
>
> 이 코드 템플릿은 프로젝트를 시작하는 데 필요한 기능을 제공하며, 이를 기반으로 자신만의 프로젝트를 만드는 것은 여러분의 몫입니다.

---

## 이 가이드에 대하여

이 가이드는 처음부터 끝까지 순서대로 읽는 것을 권장합니다.

이 문서는 React, Next.js, Supabase, Tailwind CSS, Drizzle ORM 등의 입문서가 아닙니다. 각 기술의 자세한 내용은 해당 공식 문서를 참고해 주세요.

이 가이드에서는 프로젝트 설정 방법, 사용 규칙, Next.js 프로젝트 구조, 그리고 Supanext에서 제공하는 기능을 사용하는 방법을 설명합니다.

---

## Maker, 당신에 대하여

여러분은 다음 기술에 대해 어느 정도 알고 있어야 합니다:

- React
- Next.js App Router
- Supabase
- Tailwind CSS
- Drizzle ORM
- TypeScript
- SQL

익숙하지 않은 기술이 있다면 공식 문서를 먼저 살펴보세요.

- [Next.js 문서](https://nextjs.org/docs)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Tailwind CSS 문서](https://tailwindcss.com/)
- [Supabase 문서](https://supabase.com/docs)
- [TypeScript 문서](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [Drizzle 문서](https://orm.drizzle.team/docs/overview)
- [next-safe-action 문서](https://next-safe-action.dev/docs/getting-started)

긴 튜토리얼을 읽는 대신 실제 프로젝트를 만들면서 배우는 것도 좋은 방법입니다. [Maker 마스터클래스](https://nomadcoders.co/maker-masterclass)에서 React, Supabase, Tailwind CSS 등을 사용해 프로젝트를 구축하는 방법을 배울 수 있습니다.

---

## 기능

Supanext에 포함된 기능을 그룹별로 정리했습니다.

### 인증

- ✅ 이메일/비밀번호 인증
- ✅ Google, GitHub, Apple, Kakao 로그인 버튼
- ✅ 매직 링크 인증
- ✅ 6자리 OTP 인증
- ✅ 이메일 인증
- ✅ 비밀번호 재설정
- ✅ GitHub/Kakao 계정 연결 및 연결 해제
- ✅ 로그아웃
- ✅ 보호된 경로

### 사용자 프로필

- ✅ 프로필 정보 수정
- ✅ 아바타 업로드
- ✅ 안전한 이메일 변경
- ✅ 비밀번호 변경
- ✅ 계정 삭제
- ✅ Playwright를 통한 E2E 테스트

### 분석 및 모니터링

- ✅ Sentry
- ✅ Google Analytics
- ✅ 채널톡

### 결제

- ✅ Toss Payments 결제위젯
- ✅ 서버 결제 승인 및 검증
- ✅ 사용자별 결제 내역

### 추가 기능

- ✅ 영어·스페인어·한국어 현지화
- ✅ 라이트·다크·시스템 테마
- ✅ MDX 기반 블로그
- ✅ Open Graph 이미지 템플릿
- ✅ 이용 약관 및 개인정보처리방침 템플릿
- ✅ hCaptcha 및 Turnstile 문의 양식
- ✅ 사이트맵 생성
- ✅ 자동화 이메일
- ✅ Supabase Cron 기반 작업

> **기능은 자유롭게 제거하세요**
>
> 모든 기능을 사용할 필요는 없습니다. 필요 없는 기능 그룹을 `src/features`에서 제거하고, `src/components`의 내비게이션 링크와 `src/app/[lang]`의 해당 라우트를 함께 정리하세요. 라우트 별칭을 변경했다면 `src/proxy.ts`도 확인해야 합니다.

---

## 기술적 세부 정보

Supanext는 다음 패키지와 서비스를 사용합니다.

- [Next.js](https://nextjs.org/docs)
  - [App Router](https://nextjs.org/docs/app)
  - [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [next-safe-action](https://next-safe-action.dev/docs/getting-started)
- [Supabase](https://supabase.com/docs)
  - [Supabase Auth](https://supabase.com/docs/guides/auth)
  - [Supabase Database](https://supabase.com/docs/guides/database)
  - [Supabase Storage](https://supabase.com/docs/guides/storage)
  - [Supabase Queues](https://supabase.com/docs/guides/queues)
  - [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide React](https://lucide.dev/icons/)
- [NProgress](https://ricostacruz.com/nprogress/)
- [React Email](https://react.email/)
- [Resend](https://resend.com/docs)
- [Sentry](https://sentry.io/docs)
- [Playwright](https://playwright.dev/docs/intro)

---

## 빠른 시작

Node.js 24를 사용하세요.

```sh
nvm use
npm install
cp .env.example .env.local
npm run dev
```

인증, 스토리지, 결제 기능을 사용하기 전에 환경 변수와 호스팅된 Supabase 프로젝트를 설정해야 합니다. 로컬 Supabase 또는 Docker는 필요하지 않습니다.

전체 설정은 [`docs`](docs/README.md)의 가이드를 참고하세요.
