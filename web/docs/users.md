# 사용자

프로필에는 이름, 아바타 URL, 마케팅 수신 설정과 함께 프로필 ID 및 타임스탬프가 있습니다. 인증 수단과 이메일/비밀번호는 Supabase Auth에서 관리합니다.

![계정 설정](assets/users.jpg)

## 계정 화면

로그인한 사용자는 `/account/edit`에서 다음 작업을 할 수 있습니다.

- 이름, 아바타, 마케팅 수신 설정 변경.
- 이메일 변경 요청.
- 비밀번호 추가 또는 변경.
- GitHub와 Kakao 계정 연결/연결 해제.
- 두 개의 확인 체크박스를 선택한 뒤 계정 삭제.

비밀번호 변경 시 현재 비밀번호를 추가로 묻지 않습니다. 계정 삭제 시 `DELETE`를 입력하지 않습니다. Supabase의 인증 및 이메일 보안 설정은 별도로 적용됩니다. 다른 인증 수단이 없는 상태에서 마지막 연결을 해제하려 하면 거부됩니다.

[계정 페이지](../src/app/%5Blang%5D/account/page.tsx), [양식](../src/features/account/components), [액션](../src/features/account/actions.ts)을 참고하세요.

## 아바타 버킷 설정

마이그레이션이 이미 `avatars` 버킷과 정책을 생성합니다. 기존 가이드의 더 넓은 `image/*` 정책을 수동으로 추가하지 마세요.

[데이터베이스 설정](database.md) 후 Supabase Storage에서 확인할 값은 다음과 같습니다.

| 설정           | 값                                                   |
| -------------- | ---------------------------------------------------- |
| 버킷 이름      | `avatars`                                            |
| 공개 다운로드  | 활성화                                               |
| 최대 파일 크기 | 1,048,576바이트 (1MB)                                |
| 허용 MIME 타입 | `image/png`, `image/jpeg`, `image/gif`, `image/webp` |

공개 아바타 URL은 로그인하지 않아도 볼 수 있습니다. 공개 다운로드가 임의의 업로드, 수정, 삭제를 허용한다는 뜻은 아닙니다.

## 업로드와 접근 규칙

인증된 사용자 ID를 객체 파일명으로 사용하고 기존 아바타를 덮어씁니다. 이전 버전에서 업로드한 `<user-id>/avatar` 객체도 소유자가 계속 수정할 수 있습니다.

액션은 업로드 전에 선언된 파일 타입과 실제 파일 시그니처를 확인합니다. SVG 등 허용 목록 외 형식은 받지 않습니다. 크기/타입 스키마는 [`schemas.ts`](../src/features/account/schemas.ts), 시그니처 검사는 [`image-validation.ts`](../src/features/account/image-validation.ts)에 있습니다.

스토리지 정책은 해당 사용자/소유자의 쓰기만 허용합니다. SQL은 [마이그레이션 0002](../supabase/migrations/0002_avatar_storage.sql)에, 파일명 보정은 [마이그레이션 0005](../supabase/migrations/0005_restore_supaplate_parity.sql)에 있습니다.

계정 삭제는 서버 전용 admin 클라이언트를 사용하며 두 가지 아바타 파일명 모두에 대해 삭제를 시도합니다. admin 키는 비공개로 유지하세요.

## 프로필 확장

[`src/db/schema/profiles.ts`](../src/db/schema/profiles.ts)를 수정하고 마이그레이션을 생성/검토한 뒤 데이터베이스 타입을 다시 생성합니다. 새 필드에 맞게 계정 조회 코드, 검증 스키마, 액션, 양식, 세 언어의 애플리케이션 번역도 수정하세요. [데이터베이스 스키마](database.md)의 순서를 따르세요. 양식만 수정한다고 데이터베이스 열이 생기지는 않습니다.

---

[목차](README.md)
