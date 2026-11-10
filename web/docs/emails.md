# 이메일

Supanext에는 두 가지 발송 경로가 있습니다. Supabase Auth는 SMTP 설정으로 계정 관련 이메일을 보내며, 애플리케이션 코드는 Resend SDK로 문의 및 큐에 저장된 환영 이메일을 보냅니다.

![이메일 템플릿](assets/emails.jpg)

## 커스텀 SMTP

Supabase 기본 이메일 서비스에는 수신자와 발송 제한이 있으며 운영 용도로 제공되지 않습니다. 실제 사용자와 이메일을 사용하는 테스트에는 커스텀 SMTP를 설정하세요. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)를 참고하세요.

현재 Resend 연동의 설정 순서는 다음과 같습니다.

1. Resend 계정을 만들고 소유한 도메인을 인증합니다. 메일 전용 서브도메인도 사용할 수 있습니다.
2. API 키를 만들고 비공개로 보관합니다.
3. Supabase Auth의 이메일/SMTP 설정에서 발신자 주소와 이름을 설정하고 다음 인증 정보를 입력합니다.

| 설정     | 값                |
| -------- | ----------------- |
| Host     | `smtp.resend.com` |
| Port     | `465`             |
| Username | `resend`          |
| Password | Resend API 키     |

[Resend의 Supabase SMTP 가이드](https://resend.com/docs/send-with-supabase-smtp)에 해당 설정이 설명되어 있습니다. 프로젝트의 Auth 이메일 발송 제한도 확인하세요.

애플리케이션이 직접 보내는 이메일에는 다음 값도 설정합니다.

```dotenv
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL="Supanext <hello@your-verified-domain.com>"
ADMIN_EMAIL=you@example.com
```

`ADMIN_EMAIL`은 문의 양식의 수신자입니다. 이 애플리케이션 변수를 설정한다고 Supabase SMTP가 자동으로 구성되지는 않습니다.

## 템플릿 수정과 미리보기

[`transactional-emails`](../transactional-emails)는 자체 의존성을 가진 독립 프로젝트입니다.

```sh
npm --prefix transactional-emails install
npm run email:dev
```

React Email 미리보기 서버가 실행됩니다. 출력된 URL을 확인하세요. Next.js 애플리케이션과는 별도의 프로세스입니다.

템플릿은 [`transactional-emails/emails`](../transactional-emails/emails)에 있습니다. 설치된 `react-email` 패키지를 사용하며 Supanext 이름으로 바꾼 원본 레이아웃을 유지합니다.

## Supabase 인증 템플릿

HTML을 출력합니다.

```sh
npm run email:export
```

`transactional-emails/out`의 파일을 Supabase Auth의 해당 이메일 템플릿에 복사합니다.

| HTML 파일             | Supabase 템플릿      |
| --------------------- | -------------------- |
| `confirm-email.html`  | Confirm signup       |
| `magic-link.html`     | Magic link           |
| `reset-password.html` | Reset password       |
| `change-email.html`   | Change email address |

원본 템플릿을 수정한 뒤에는 다시 출력하고 새 HTML을 복사하세요. 출력에 `welcome.html`도 포함될 수 있지만 위 네 가지 Auth 템플릿 필드에 넣는 파일은 아닙니다.

템플릿에는 `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Token }}` 같은 Supabase 치환 변수가 있습니다. 실제 사용자의 토큰으로 바꾸지 마세요.

링크는 `{{ .SiteURL }}/auth/confirm`을 거칩니다. 비밀번호 재설정은 `/auth/forgot-password/create`, 이메일 변경은 `/auth/email-verified`, 가입/매직 링크는 `/`로 이동합니다. 매직 링크 이메일에는 6자리 코드도 표시됩니다.

이 템플릿은 동적으로 선택한 미리보기 URL이 아니라 **Site URL**을 사용합니다. 테스트하거나 배포할 때 Supabase Site URL과 애플리케이션의 기준 URL을 맞추세요.

## 트랜잭션 이메일

[`src/lib/resend.ts`](../src/lib/resend.ts)는 서버 전용 Resend 클라이언트를 만듭니다. 기존 워커는 환영 이메일의 React Email 컴포넌트를 SDK에 직접 전달하며 사용자 이름만 넘깁니다. [문의 양식](contact.md)은 contact 템플릿을 사용하고 작성자의 이메일을 `replyTo`로 지정합니다.

이러한 SDK 발송에는 HTML 출력 단계가 필요하지 않습니다. Auth 이메일에는 Cron이 필요하지 않으며, 큐 기반 환영 이메일 흐름만 [Supabase Cron](cron.md)을 사용합니다.

소유한 메일함으로 테스트하세요. 가입 이메일을 받았다고 별도 환영 메일 큐나 문의 발신자 설정까지 확인된 것은 아닙니다.

---

[목차](README.md)
