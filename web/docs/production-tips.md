# 프로덕션 팁

아래 항목은 출시 전에 확인할 기존 보일러플레이트와 외부 설정을 설명합니다. 서비스를 추가하거나 공급자를 바꾸지 않으며, 배포가 프로덕션에 준비되었다고 보장하지도 않습니다.

## 설정과 콘텐츠

- 의도한 Supabase 프로젝트를 사용하고 비밀 키를 서버에서만 관리하세요.
- 검토한 마이그레이션을 개발 프로젝트에 적용하고, 데이터베이스 타입을 다시 생성한 뒤 스키마 변경과 함께 커밋하세요. 배포 대상 데이터베이스에는 검토한 마이그레이션을 별도로 적용합니다.
- 제품 문구, 브랜딩, 블로그 예제, [법률 문서 템플릿](legal.md)을 완성하세요.
- 앱 origin, Supabase Site URL, OAuth 콜백, CAPTCHA 허용 도메인이 일치하는지 확인하세요.
- 직접 관리하는 수신함으로 인증 이메일 템플릿과 발신 설정을 검증하세요.
- 토스페이먼츠를 검증할 때는 테스트 키를 유지하고, 라이브 키 활성화는 별도 단계로 진행하세요.
- 저장된 데이터베이스 타입으로 `npm run build`를 확인하고, Vercel 설정은 [배포 가이드](deployment.md)를 따르세요.

## 모니터링과 디버그 페이지

현재 [Sentry 설정](sentry.md)은 오류 모니터링과 샘플링된 트레이스를 사용하며, replay와 프로파일링은 꺼져 있습니다. 배포 버전에서 이벤트 수신과 소스맵을 확인하세요.

프로덕션에서 `/debug/sentry`는 `SENTRY_DEBUG_ENABLED=true`가 있어야 열립니다. [분석 테스트 페이지](google-analytics.md)에는 같은 제한이 없습니다. 디버그 접근이나 수집 동작을 바꾸려면 해당 변경을 명시적으로 결정해야 합니다.

이메일 문제를 조사할 때는 Supabase Cron 실행 기록, 앱 로그, Resend 전송 결과, `mailer_dead_letters` 큐를 확인하세요. 현재 재시도 보호 동작은 [Cron](cron.md) 문서에서 설명합니다.

## 선택적인 외부 서비스로서의 Cloudflare

원본 가이드에는 DNS, 트래픽 보호, 이메일 전달 용도로 Cloudflare를 소개하는 내용이 있습니다. 이는 선택 사항이며, Supanext의 필수 조건이나 Cloudflare에 앱을 배포하는 구현이 아닙니다.

DNS 영역을 추가하는 것만으로 앱에 적절한 캐시·방화벽 정책이 정해지지는 않습니다. 프록시나 CDN을 사용하기로 했다면 인증 쿠키, 리다이렉트, Server Actions, 비공개 응답을 올바르게 처리해야 합니다. 계정 페이지나 양식 요청에 일괄 공개 캐시를 적용하지 마세요. 현재 [프록시](../src/proxy.ts)는 재작성된 페이지 응답에 `private, no-store`를 설정합니다.

이 문서는 Cloudflare 어댑터, 프록시 규칙, 유료 요금제, 방화벽 설정을 선택하지 않습니다. 해당 서비스를 사용하기로 했다면 최신 [도메인 설정](https://developers.cloudflare.com/fundamentals/setup/manage-domains/add-site/), [WAF](https://developers.cloudflare.com/waf/get-started/), [속도 제한 문서](https://developers.cloudflare.com/waf/rate-limiting-rules/)를 참고하세요.

## 이메일 전달과 앱 발송 구분

Cloudflare Email Routing 같은 서비스를 사용하면 `hello@your-domain.com`으로 받은 이메일을 기존 수신함으로 전달할 수 있습니다.

수신 메일 라우팅과 발신 메일 전송은 별개의 기능입니다. 현재 Cloudflare Email Service는 라우팅과 발송을 모두 문서화하고 있지만, 전달 기능을 켠다고 Supanext의 발신 메일 설정이 바뀌지는 않습니다. 이 프로젝트는 여전히 Resend와 Supabase에 설정한 SMTP 서비스를 사용합니다. [Cloudflare Email Service](https://developers.cloudflare.com/email-service/)와 [이메일](emails.md) 문서를 참고하세요.

## Supabase Auth 요청 제한

프로젝트의 실제 사용량에 맞춰 Authentication의 요청 제한 설정을 확인하세요. 이 제한은 Next.js 라우트가 아니라 Supabase에서 관리합니다. 현재 설정 항목은 [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits) 문서에서 확인할 수 있습니다.

문의 페이지의 CAPTCHA 예제가 모든 인증 엔드포인트를 보호한다고 가정하지 마세요. 현재 CAPTCHA 검증은 해당 문의 양식에만 적용됩니다.

## 출시 전 검증

[테스트](testing.md) 문서에서 코드 수준 회귀 검사, 공개 브라우저 검사, 호스팅 환경의 계정 테스트, 실제 서비스 전송 검증을 구분하세요. 빌드나 공개 테스트가 통과해도 호스팅된 스키마, RLS, OAuth 인증 정보, 이메일, 결제가 모두 검증된 것은 아닙니다.

이 문서의 작업 흐름에는 Docker, pgTAP, 로컬 Supabase 스택이 필요하지 않습니다.

---

[목차](README.md)
