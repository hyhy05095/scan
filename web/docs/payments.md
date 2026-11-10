# 결제

Supanext에는 토스페이먼츠 결제위젯 예제와 로그인한 사용자의 결제 내역 페이지가 포함되어 있습니다.

![토스페이먼츠 결제 화면](assets/payments.jpg)

먼저 공식 [토스페이먼츠 결제위젯 연동 문서](https://docs.tosspayments.com/guides/v2/payment-widget/integration)에서 결제 요청과 승인 과정을 확인하세요.

## 설정

토스페이먼츠 결제위젯에 사용할 서로 대응하는 클라이언트 키와 시크릿 키를 `.env.local`에 설정합니다.

```dotenv
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=your-test-widget-client-key
TOSS_PAYMENTS_SECRET_KEY=your-matching-test-secret-key
```

클라이언트 키는 공개되지만 시크릿 키는 서버에서만 사용합니다. 예제를 검증할 때는 테스트 키를 사용하세요. 라이브 키로 전환하면 실제 결제가 가능해지므로 별도의 운영 단계로 진행해야 합니다.

위젯은 설치된 `@tosspayments/tosspayments-sdk` 패키지와 결제수단의 `DEFAULT`, 약관의 `AGREEMENT` variant를 사용합니다.

[데이터베이스 설정](database.md)을 마치고 로그인한 뒤 결제를 테스트하세요. [product.ts](../src/features/payments/product.ts)에 정의된 예제 상품은 10,000원짜리 단일 구매 상품입니다. 상품 카탈로그나 구독 결제 구현은 아닙니다.

## 경로와 소스 파일

| 경로                  | 역할                               |
| --------------------- | ---------------------------------- |
| `/payments/checkout`  | 인증된 결제 페이지와 브라우저 위젯 |
| `/payments/success`   | 서버 승인 처리 및 성공 화면        |
| `/payments/failure`   | 결제 실패 화면                     |
| `/dashboard/payments` | 로그인한 사용자의 결제 내역        |

브라우저 URL에는 언어 접두사가 붙지 않습니다. 내부 App Router 페이지는 [src/app/[lang]/payments](../src/app/%5Blang%5D/payments)와 [dashboard/payments](../src/app/%5Blang%5D/dashboard/payments)에 있습니다. 위젯의 반환 URL에는 언어 접두사가 있지만, 프록시가 쿼리 매개변수를 유지한 채 접두사 없는 URL로 리다이렉트합니다.

기능 모듈은 다음과 같습니다.

- [checkout-widget.tsx](../src/features/payments/components/checkout-widget.tsx): 브라우저 SDK, 약관, 리다이렉트 URL.
- [actions.ts](../src/features/payments/actions.ts): 주문을 만드는 인증된 `next-safe-action` 액션.
- [toss.ts](../src/features/payments/toss.ts): 결제 승인 요청 및 저장.
- [data.ts](../src/features/payments/data.ts): 소유자를 확인하는 주문·결제 조회.
- [schemas.ts](../src/features/payments/schemas.ts): 입력값과 결제사 응답 검증.

## 결제 과정

1. 로그인한 사용자가 결제 페이지에서 필수 약관에 동의합니다.
2. Server Action이 서버에 정의된 상품 금액과 인증된 사용자 ID로 주문을 저장합니다.
3. 브라우저가 해당 주문 ID로 토스페이먼츠 결제를 요청합니다.
4. 토스페이먼츠가 성공 또는 실패 경로로 리다이렉트합니다.
5. 성공 경로에서 서버가 주문 소유자, 상태, 금액을 확인한 뒤 토스에 승인을 요청합니다.
6. 서버가 승인 응답을 검증하고, 결제 기록과 주문의 승인 상태를 하나의 데이터베이스 트랜잭션으로 저장합니다.

성공 경로로 이동했다는 사실만으로 결제가 확인되는 것은 아닙니다. 서버가 리다이렉트 금액과 결제사 응답을 저장된 주문과 비교합니다.

## 재시도 보호와 저장 데이터

현재 구현은 주문 ID를 토스 승인 요청의 멱등성 키로 사용하고, 충돌하는 payment key를 거부하며, 이미 저장된 동일한 승인 결과를 재사용합니다. 데이터베이스의 유일성 제약과 트랜잭션 내 검증은 동시에 들어오는 저장 요청을 보호합니다.

결제 소유자는 null일 수 없습니다. 금액에는 PostgreSQL `numeric(15, 2)`, 시간에는 시간대가 포함된 타임스탬프를 사용합니다. 결제사 응답 전체 대신 필요한 승인 필드만 저장합니다. 이 보호 장치는 이미 Supanext 스키마와 마이그레이션에 포함되어 있습니다. 자세한 내용은 [데이터베이스](database.md) 문서를 참고하세요.

이 예제에는 구독 과금, 환불 처리, 웹훅 기반 결제 상태 동기화가 구현되어 있지 않습니다. 해당 기능은 문서 설정만 바꾸는 것이 아니라 별도의 구현이 필요합니다.

## 결제 내역

테스트 결제를 성공시킨 뒤 `/dashboard/payments`에서 내역을 확인하세요.

![결제 내역](assets/payment-history.jpg)

결제 내역은 로그인한 사용자의 Supabase 클라이언트로 조회하며, RLS 정책은 해당 사용자의 기록만 읽도록 제한합니다. 브라우저 클라이언트는 승인된 결제를 직접 추가하거나 수정할 수 없습니다.

[테스트](testing.md) 문서는 공개 UI 검사와 호스팅된 데이터베이스 테스트를 구분합니다. 공개 결제 페이지 테스트가 통과했다고 해서 결제사의 실제 승인이 검증된 것은 아닙니다.

---

[목차](README.md)
