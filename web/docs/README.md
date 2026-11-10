# Supanext에 오신 것을 환영합니다

Supanext는 Next.js App Router 기반의 보일러플레이트입니다. 완성된 제품이 아니라, 여러분의 애플리케이션을 만들기 위한 시작점입니다.

인증, 프로필, 결제, 언어 및 테마 설정, 블로그, 법적 고지 템플릿, 이메일 발송, 모니터링 기능이 포함되어 있습니다. 제품의 고유 기능, 브랜딩, 인증 정보, 최종 콘텐츠는 직접 준비해야 합니다.

## 시작하기 전에

이 가이드는 React, Next.js, TypeScript, Supabase, SQL, Drizzle ORM, Tailwind CSS에 익숙한 개발자를 대상으로 합니다. 각 기술의 입문서가 아니라 이 저장소의 사용 설명서입니다.

[설정](setup.md)부터 읽고 [프로젝트 구조](project-structure.md)를 살펴보세요. 별도 안내가 없으면 모든 명령은 `supanext` 디렉토리에서 실행합니다. 이 문서는 현재 포함된 구현을 설명하며 외부 서비스를 자동으로 생성하거나 설정하지 않습니다.

## 포함된 기능

- 이메일/비밀번호 로그인, 이메일 인증, 비밀번호 재설정, 매직 링크, 6자리 인증 코드.
- Google, GitHub, Apple, Kakao 로그인 버튼. 각 제공업체를 Supabase에서 설정해야 합니다.
- 프로필 수정, 아바타 업로드, 이메일/비밀번호 변경, GitHub/Kakao 계정 연결, 계정 삭제.
- 영어·스페인어·한국어 애플리케이션 번역과 라이트·다크·시스템 테마.
- Toss Payments 결제위젯, 서버 결제 승인, 사용자별 결제 내역.
- MDX 블로그, Open Graph 이미지 생성, 사이트맵, 법적 고지 템플릿.
- hCaptcha와 Turnstile을 사용하는 문의 양식, React Email, Resend, Supabase Queues 및 Supabase Cron.
- Sentry, Google Analytics, 채널톡, Playwright 테스트.

인증 정보와 제공업체 설정을 마치기 전에는 일부 연동이 작동하지 않습니다. 애플리케이션은 영어·스페인어·한국어를 지원하지만, 문서는 한국어로 제공합니다.

## 가이드 목차

### 시작하기

- [설정](setup.md)

### 개발

- [프로젝트 구조](project-structure.md)
- [환경 변수](environment-variables.md)
- [데이터베이스 스키마](database.md)
- [이메일](emails.md)
- [테스트](testing.md)
- [Prettier](prettier.md)

### 기능

- [인증](authentication.md)
- [사용자](users.md)
- [설정과 테마](settings.md)
- [Cron 작업](cron.md)
- [문의 양식](contact.md)
- [블로그](blog.md)
- [법적 고지 페이지](legal.md)
- [결제](payments.md)

### 연동

- [Sentry](sentry.md)
- [Google Analytics](google-analytics.md)
- [채널톡](channel-talk.md)

### 운영

- [배포](deployment.md)
- [운영 준비](production-tips.md)

## 참고 자료

[Next.js App Router 문서](https://nextjs.org/docs/app), [Supabase 문서](https://supabase.com/docs), [Drizzle 문서](https://orm.drizzle.team/docs/overview), [next-safe-action 문서](https://next-safe-action.dev/docs/getting-started)를 참고하세요. 프로젝트에 설치된 next-safe-action 스킬은 [`.agents/skills`](../.agents/skills)에 있습니다.

원본 가이드의 [Maker 마스터클래스](https://nomadcoders.co/maker-masterclass) 링크도 관련 학습 자료로 남겨 두었습니다. 해당 강의는 React Router를 사용하며, 이 저장소는 Next.js를 사용합니다.

문서에 포함된 스크린샷은 해당 기능을 설명하기 위한 참고 이미지입니다. 일부 브랜드명, 문구, 간격은 다를 수 있으므로 경로와 설정 값은 이 가이드의 본문을 기준으로 확인하세요.

---

[목차](README.md)
