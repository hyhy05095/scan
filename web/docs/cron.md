# Cron 작업

Supanext는 **Supabase Queues**에 환영 이메일 작업을 보관하고 **Supabase Cron**으로 처리를 예약합니다. 애플리케이션 호스팅과 예약 실행은 별개이며, 이 설정은 Vercel Cron을 사용하지 않습니다.

## 어디서 무엇이 실행되나요?

```text
auth.users에 새 행 생성
  → 데이터베이스 트리거가 mailer 큐에 메시지 추가

30초마다 Supabase Cron 실행
  → POST /api/cron/mailer
  → Next.js Route Handler가 요청 인증
  → 워커가 메시지를 임시로 가져와 Resend로 발송
  → 성공한 메시지는 삭제, 실패한 메시지는 재시도 또는 보관
```

큐를 사용하면 가입 처리가 이메일 제공업체의 전달을 기다리지 않습니다. 데이터베이스에 작업을 추가하는 단계는 여전히 가입 과정에서 실행됩니다.

## 데이터베이스 설정

[데이터베이스 마이그레이션](database.md)을 적용하세요. [`0004_mailer_queue.sql`](../supabase/migrations/0004_mailer_queue.sql)은 다음을 설치합니다.

- `pgmq` 확장.
- RLS와 제한된 권한이 적용된 `mailer`, `mailer_dead_letters` 큐.
- `private.enqueue_welcome_email()`과 `auth.users` 가입 트리거.

이미 마이그레이션을 적용한 프로젝트에 큐를 중복 생성하거나 원본 가이드의 개별 트리거를 붙여 넣지 마세요.

## 발송 서비스 설정

다음 서버 전용 값을 설정합니다.

```dotenv
DATABASE_URL=your-supabase-postgres-connection
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL="Supanext <hello@your-verified-domain.com>"
CRON_SECRET=your-long-random-secret
```

[이메일](emails.md)의 안내에 따라 인증된 발신자를 사용하세요. 큐 워커는 공개 Supabase 브라우저 클라이언트가 아닌 기존 서버 전용 Drizzle 연결을 사용합니다.

## Supabase 예약 작업 만들기

Supabase에서 접근할 수 있는 HTTPS 주소로 애플리케이션을 배포합니다. 호스팅된 Cron 작업은 개발 컴퓨터의 `localhost`에 접근할 수 없습니다. 임시 개발용 터널은 선택 사항이며 보일러플레이트의 필수 설정이 아닙니다.

Supabase 대시보드에서 필요한 경우 Cron과 `pg_net` HTTP 확장을 활성화하고 다음 HTTP 작업을 생성합니다.

| 설정   | 값                                         |
| ------ | ------------------------------------------ |
| 이름   | `mailer`                                   |
| 주기   | `30 seconds`                               |
| 유형   | HTTP request                               |
| 메서드 | `POST`                                     |
| URL    | `https://your-app.example/api/cron/mailer` |
| 헤더   | `Authorization: your-long-random-secret`   |
| 본문   | `{}`                                       |

헤더 값은 `CRON_SECRET`과 정확히 같아야 하며 **`Bearer `를 붙이지 않습니다**. 비밀 값을 알고 있는지를 확인하는 방식이지, 요청이 Supabase에서 왔다는 사실을 별도로 증명하는 방식은 아닙니다.

초 단위 주기는 [Supabase Cron 빠른 시작](https://supabase.com/docs/guides/cron/quickstart)의 문법을 따릅니다. 예약 작업은 대시보드에서 별도로 설정합니다. Supanext 설치, 빌드, 마이그레이션이 예약 작업까지 생성하지는 않습니다.

## 메시지 형식

기존 트리거는 다음 형태의 데이터를 보냅니다.

```json
{
  "eventId": "e4d9b6f1-d624-4bc9-941e-8c34c0806f65",
  "template": "welcome",
  "to": "person@example.com",
  "data": {
    "locale": "en",
    "name": "Example User"
  }
}
```

eventId는 신규 사용자의 UUID입니다. 트리거는 `auth.users.email`을 사용하고 이메일이 없는 사용자는 건너뜁니다. Auth 행 전체가 아닌 메시지에 필요한 데이터만 저장합니다. 지원되는 스페인어/한국어 메타데이터가 없으면 영어를 사용합니다.

현재 워커가 처리하는 템플릿은 `welcome`뿐입니다. 다른 작업을 추가하려면 메시지를 만드는 코드, 검증 스키마, 처리 코드가 함께 필요합니다. 템플릿 문자열만 바꿔서는 활성화되지 않습니다.

## 처리와 재시도

[`src/app/api/cron/mailer/route.ts`](../src/app/api/cron/mailer/route.ts)는 `POST`를 export합니다. 비밀 값이 없거나 다르면 401을 반환합니다. GET 요청은 메시지를 처리하지 않습니다.

[`src/features/mailer/queue.ts`](../src/features/mailer/queue.ts)는 최대 10개 메시지를 300초 동안 다른 처리에서 보이지 않도록 가져옵니다. 발송에 성공하면 `pgmq.delete`로 삭제합니다. 실패한 메시지는 해당 시간이 지난 뒤 다시 나타나며, 다섯 번의 읽기/시도 후에도 발송에 실패하면 `mailer_dead_letters`로 이동합니다. 형식이 잘못된 메시지는 즉시 실패 큐로 이동합니다.

실패 큐로 옮기는 작업과 활성 큐에서 삭제하는 작업은 하나의 데이터베이스 트랜잭션에서 실행됩니다. eventId 기반의 고정된 Resend idempotency key로 중복 발송을 줄이지만, 기간 제한 없이 정확히 한 번만 전달된다고 보장하는 것은 아닙니다.

핸들러는 성공/재시도/실패 큐 이동 건수를 반환합니다. 처리 실패는 HTTP 500, 성공은 200입니다. Sentry가 설정되어 있으면 예외를 보고합니다.

## 발송 확인

Cron 실행 기록, 엔드포인트의 HTTP 응답/애플리케이션 로그, 큐 내용, Resend 발송 기록을 함께 확인하세요. 예약된 HTTP 요청이 시작되었다는 사실만으로 이메일 전달을 확인할 수는 없습니다.

수동으로 인증된 POST 요청을 보내도 실제 대기 중인 이메일이 처리되므로 발송하려는 경우에만 사용하세요. 실패 메시지를 검토한 뒤 재시도 여부와 방법을 결정하세요. 실패 메시지를 자동 재실행하는 UI는 포함되어 있지 않습니다.

[Supabase Queues](https://supabase.com/docs/guides/queues)와 [Resend 멱등성](https://resend.com/docs/dashboard/emails/idempotency-keys)을 참고하세요.

---

[목차](README.md)
