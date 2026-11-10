# 데이터베이스 스키마

Supanext는 Drizzle ORM으로 테이블과 마이그레이션을 관리하고, Supabase 클라이언트로 사용자 권한에 따른 데이터에 접근합니다. 현재 코드의 Drizzle ORM 버전은 0.45.2입니다. 이 문서의 예시는 프로젝트를 다른 API로 바꾸지 않고 설치된 버전을 따릅니다.

## 파일과 명령

| 항목                                                     | 역할                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`src/db/schema`](../src/db/schema)                   | export된 테이블, RLS 정책, 타임스탬프 헬퍼                               |
| [`drizzle.config.ts`](../drizzle.config.ts)           | `./src/db/schema/**/*.ts`를 읽고 `./supabase/migrations`에 출력          |
| [`src/db/index.ts`](../src/db/index.ts)               | 서버 전용 Drizzle/Postgres.js 연결                                       |
| [`scripts/db-typegen.mjs`](../scripts/db-typegen.mjs) | 연결된 프로젝트의 public 스키마로 Supabase 클라이언트 타입 생성          |
| `npm run db:generate`                                    | 마이그레이션 파일 생성. 데이터베이스에는 적용하지 않음                   |
| `npm run db:check`                                       | 마이그레이션 이력/메타데이터 검사. 실제 정책 동작을 검증하는 명령은 아님 |
| `npm run db:migrate`                                     | `DATABASE_URL`의 데이터베이스에 마이그레이션 적용                        |
| `npm run db:typegen`                                     | `src/lib/supabase/database.types.ts` 생성                                |

Drizzle이 찾을 수 있도록 테이블 정의를 export하세요. [`src/db/schema/index.ts`](../src/db/schema/index.ts)에서도 애플리케이션이 import하는 테이블을 다시 export합니다.

## 마이그레이션에 포함된 내용

- `0000_initial_schema.sql`: 프로필과 결제, RLS, 인덱스, 제약 조건, 권한.
- `0001_database_functions.sql`: private 스키마의 가입/타임스탬프 함수와 트리거.
- `0002_avatar_storage.sql`: 공개 아바타 버킷과 소유자별 스토리지 정책.
- `0003_payment_orders.sql`: 서버가 관리하는 결제 주문, 제약 조건, RLS.
- `0004_mailer_queue.sql`: 발송 대기/실패 메일 큐와 환영 이메일 트리거.
- `0005_restore_supaplate_parity.sql`: 사용자 ID 아바타 파일명과 소셜 가입 기본값. 기존 마케팅 수신 설정은 덮어쓰지 않음.

전체 이력을 순서대로 적용하세요. Supaplate의 마이그레이션 스냅샷을 복사하거나, 기존 문서의 함수/큐 생성 SQL을 별도로 다시 실행하지 마세요.

## Supabase 참조와 RLS

[`profiles.ts`](../src/db/schema/profiles.ts)는 `drizzle-orm/supabase`의 `authUsers`로 `auth.users`를 참조하며 계정 삭제 시 프로필을 함께 삭제합니다. `pgPolicy`에는 `authUid`와 `authenticatedRole`을 사용합니다.

아래는 현재 프로필 수정 정책입니다.

```ts
pgPolicy("edit-profile-policy", {
  as: "permissive",
  for: "update",
  to: authenticatedRole,
  using: sql`${authUid} = ${table.profile_id}`,
  withCheck: sql`${authUid} = ${table.profile_id}`,
});
```

설치된 Drizzle 버전은 테이블에 연결된 정책이 있으면 생성하는 마이그레이션에 RLS 활성화를 포함합니다. 반면 `payment_orders`는 일반 사용자용 정책 없이 `.enableRLS()`를 호출하므로 일반 클라이언트 역할에 허용된 접근이 없습니다. TypeScript뿐 아니라 생성된 SQL도 확인하세요.

현재 접근 규칙은 다음과 같습니다.

| 테이블           | 사용자 권한으로 가능한 접근                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `profiles`       | 인증된 사용자가 자신의 행을 조회/수정/삭제. 가입 시 삽입은 트리거가 처리 |
| `payments`       | 인증된 사용자가 자신의 결제 내역을 조회. 결제 데이터 쓰기는 서버가 처리  |
| `payment_orders` | 일반 클라이언트용 정책 없음. 서버가 주문 관리                            |

RLS는 SQL 권한과 함께 작동합니다. public 스키마에 있다고 공개 데이터인 것은 아닙니다. 서버 전용 DB 연결이나 높은 권한의 Supabase 키는 일반 클라이언트의 RLS를 우회할 수 있으므로, 서버에서도 소유권을 확인해야 합니다. 이 프로젝트는 `FORCE ROW LEVEL SECURITY`를 사용하지 않습니다.

[Drizzle RLS 문서](https://orm.drizzle.team/docs/rls)와 [Supabase RLS 문서](https://supabase.com/docs/guides/database/postgres/row-level-security)를 참고하되, 외부 예시는 설치된 버전의 API와 대조하세요.

## 함수, 트리거, 권한

이 설정은 Zod 입력 스키마가 아니라 커스텀 SQL 마이그레이션에 있습니다. `private` 스키마는 내부 함수를 담고 있으며 일반 API 역할에 노출되지 않습니다.

[`0001_database_functions.sql`](../supabase/migrations/0001_database_functions.sql)의 `private.set_updated_at()`은 행을 수정하기 전에 `updated_at`에 `NOW()`를 지정합니다. [`helpers.ts`](../src/db/schema/helpers.ts)의 타임스탬프는 시간대 정보를 포함합니다.

가입 트리거는 프로필을 생성합니다. 마이그레이션 `0005`의 최종 정의는 소셜 가입의 `marketing_consent = true` 기본값을 유지합니다. 이메일/전화번호 가입은 전달된 동의 값을 사용하며 기본값은 false입니다. [인증](authentication.md)을 참고하세요.

## 테이블 변경하기

1. `src/db/schema`의 Drizzle 정의를 수정/export하고 필요한 정책을 포함합니다.
2. `npm run db:generate`를 실행한 뒤 생성된 SQL을 검토합니다.
3. 함수, 트리거, 권한처럼 여기서 Drizzle 정의로 관리하지 않는 변경은 커스텀 마이그레이션을 만듭니다.

   ```sh
   npm run db:generate -- --custom --name your_change
   ```

4. 새 파일에 필요한 SQL을 작성합니다. 기존 마이그레이션을 참고하되 이미 적용한 이력은 수정하지 마세요.
5. 이력을 검사하고 의도한 데이터베이스에 적용합니다.

   ```sh
   npm run db:check
   npm run db:migrate
   ```

6. Supabase 클라이언트 타입을 다시 생성합니다.

   ```sh
   npm run db:typegen
   npm run typecheck
   ```

7. 마이그레이션, 생성된 데이터베이스 타입, 관련 코드를 함께 검토하고 커밋합니다.

`postdb:migrate` 훅은 설치되어 있지 않습니다. 타입 생성은 개발 중 명시적으로 실행하는 단계이며 `prebuild`에 포함되지 않습니다. `npm run build`는 저장소에 포함된 데이터베이스 타입으로 타입 검사와 빌드를 진행하므로, 배포 빌드의 타입 생성을 위한 Supabase CLI 로그인·연결 설정이 필요하지 않습니다.

## 타입 생성

먼저 `npx supabase login`과 `npx supabase link --project-ref your-project-ref`를 실행합니다. 연결한 프로젝트와 `DATABASE_URL`은 같은 스키마/환경을 가리켜야 합니다.

타입 생성 스크립트는 CLI 출력을 검사한 뒤 기존 타입 파일을 교체합니다. 생성에 실패하면 기존 파일을 유지합니다. 생성된 데이터베이스 타입을 직접 수정하지 마세요. 스키마 변경 후에는 타입을 다시 생성해야 합니다. 빌드가 성공해도 저장된 타입이 호스팅된 데이터베이스와 일치한다고 보장할 수는 없습니다.

## 검증 범위

메타데이터 검사나 TypeScript 검사는 데이터베이스 정책을 실행하지 않습니다. 실제 데이터베이스 동작을 확인하려면 설정된 호스팅 프로젝트와 적절한 테스트가 필요합니다. 이 보일러플레이트에는 Docker나 pgTAP 설정이 없습니다. [테스트](testing.md)를 참고하세요.

---

[목차](README.md)
