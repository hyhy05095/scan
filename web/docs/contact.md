# 문의하기

문의 페이지는 `/contact`에서 확인할 수 있습니다. 언어는 쿠키로 선택하며, 내부 `[lang]` 디렉터리는 브라우저 URL에 표시되지 않습니다. hCaptcha, Cloudflare Turnstile, 입력값 검증, Resend를 통한 이메일 전송을 함께 보여 주는 예제입니다.

![문의 양식](assets/contact.jpg)

## 서비스 설정

각 CAPTCHA 서비스에서 사이트를 만들고, 양식을 사용할 도메인을 등록하세요. 로컬에서 테스트한다면 개발 환경의 호스트 이름도 허용해야 합니다. 자세한 절차는 [hCaptcha 문서](https://docs.hcaptcha.com/)와 [Turnstile 문서](https://developers.cloudflare.com/turnstile/get-started/)를 참고하세요.

`.env.local`에 다음 값을 설정합니다.

```dotenv
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-public-hcaptcha-site-key
HCAPTCHA_SECRET_KEY=your-private-hcaptcha-secret
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-public-turnstile-site-key
TURNSTILE_SECRET_KEY=your-private-turnstile-secret
RESEND_API_KEY=your-private-resend-api-key
RESEND_FROM_EMAIL=Supanext <hello@your-domain.com>
ADMIN_EMAIL=you@your-domain.com
```

사이트 키는 브라우저에 공개됩니다. 비밀 키와 Resend 인증 정보는 서버에서만 사용해야 합니다. Resend에서 인증한 발신 주소를 사용하세요. 자세한 내용은 [이메일](emails.md) 문서에 있습니다.

현재 예제는 **두 CAPTCHA 검증을 모두 통과해야** 전송됩니다. 각각 별도의 스팸 방지 서비스이지만, 이 양식에는 두 연동이 함께 포함되어 있습니다. 하나만 설정해서는 현재 양식이 동작하지 않습니다. 하나만 사용하도록 바꾸려면 구현을 변경해야 합니다.

## 전송 과정

1. 브라우저에서 이름, 이메일 주소, 메시지, 두 CAPTCHA 토큰을 수집합니다.
2. 양식이 `next-safe-action`을 통해 Next.js Server Action을 호출합니다.
3. 서버에서 입력값을 검증하고, 각 서비스에 CAPTCHA 토큰 검증을 요청합니다.
4. 두 검증이 모두 성공하면 Resend가 `ADMIN_EMAIL`로 메시지를 보냅니다.
5. 발신 주소는 `RESEND_FROM_EMAIL`이며, 방문자의 주소는 `replyTo`에 지정됩니다.

검증 실패, 네트워크 시간 초과, 설정 누락 시에는 이메일을 보내지 않습니다. Resend 요청은 제출 ID를 멱등성 키로 사용하여 재시도를 보호합니다. 문의 이메일은 환영 이메일 Cron 큐를 거치지 않고 직접 전송됩니다.

## 관련 파일

| 파일                                                                | 역할                                       |
| ------------------------------------------------------------------- | ------------------------------------------ |
| [문의 페이지](../src/app/%5Blang%5D/contact/page.tsx)            | 라우트와 번역된 문구                       |
| [문의 양식](../src/features/contact/components/contact-form.tsx) | 클라이언트 입력란, CAPTCHA 위젯, 제출 상태 |
| [입력 스키마](../src/features/contact/schema.ts)                 | Server Action 입력값 검증                  |
| [문의 액션](../src/features/contact/actions.ts)                  | CAPTCHA 검증 및 이메일 전송                |
| [문의 이메일](../transactional-emails/emails/contact.tsx)        | 이메일 템플릿                              |

실제 전송을 테스트할 때는 직접 관리하는 수신함을 사용하세요. 브라우저의 입력값 검증을 통과했다는 사실만으로 CAPTCHA 서비스나 Resend의 요청 처리까지 확인된 것은 아닙니다.

---

[목차](README.md)
