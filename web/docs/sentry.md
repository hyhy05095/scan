# Sentry

Supanext에는 이미 `@sentry/nextjs` 연동이 포함되어 있습니다. 활성화하려면 프로젝트 인증 정보를 설정하세요. 단순히 연동을 켜기 위해 설치 마법사로 기존 파일을 덮어쓸 필요는 없습니다.

프레임워크 설정은 React Router가 아닌 Sentry의 [Next.js App Router 가이드](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)를 참고합니다.

## 설정

Sentry 계정과 Next.js 프로젝트를 만든 뒤 다음 값을 설정하세요.

```dotenv
NEXT_PUBLIC_SENTRY_DSN=your-project-dsn
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-private-build-auth-token
```

DSN은 브라우저, 서버, edge SDK 설정에서 공통으로 사용합니다. 브라우저에 공개되는 값이며, 계정을 관리하는 토큰이 아닙니다. 현재 구현에는 별도의 `SENTRY_DSN` 환경 변수가 없습니다.

나머지 세 값은 빌드 중 소스맵 업로드에 사용됩니다. `SENTRY_AUTH_TOKEN`은 비공개로 관리하고 버전 관리에 포함하지 마세요. [next.config.ts](../next.config.ts)는 업로드용 세 값이 모두 있을 때만 소스맵 업로드를 활성화합니다. 소스맵 업로드가 꺼져 있어도 DSN이 설정되어 있으면 런타임 오류 수집은 동작합니다.

## 파일별 역할

| 파일                                                                                                | 역할                                            |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [instrumentation-client.ts](../src/instrumentation-client.ts)                                    | 브라우저 SDK 초기화와 라우터 전환 계측          |
| [instrumentation.ts](../src/instrumentation.ts)                                                  | 서버·edge SDK 로딩 및 `onRequestError` 내보내기 |
| [sentry.server.config.ts](../src/sentry.server.config.ts)                                        | Node.js SDK 초기화                              |
| [sentry.edge.config.ts](../src/sentry.edge.config.ts)                                            | Edge SDK 초기화                                 |
| [global-error.tsx](../src/app/global-error.tsx), [error.tsx](../src/app/%5Blang%5D/error.tsx) | React 오류 경계에서 오류 보고                   |
| [safe-action.ts](../src/lib/safe-action.ts)                                                      | Server Action의 예상하지 못한 오류 보고         |
| [next.config.ts](../next.config.ts)                                                              | 기존 Next.js·MDX 설정에 Sentry 설정 결합        |

## 현재 수집 설정

- `NEXT_PUBLIC_SENTRY_DSN`이 있으면 오류 모니터링을 활성화합니다.
- 트레이스 샘플링은 개발 환경에서 100%, 프로덕션을 포함한 그 외 환경에서 10%입니다.
- Session Replay와 프로파일링은 활성화되어 있지 않습니다.
- Sentry 터널은 설정되어 있지 않습니다.

트레이스 샘플링 비율은 오류 이벤트의 샘플링 비율과 다릅니다. 프로파일링 패키지가 설치되어 있다는 사실만으로 프로파일링이 활성화되지는 않습니다.

위 내용은 현재 프로젝트 설정입니다. 공식 문서의 선택적 replay, 프로파일링, 데이터 수집, 계측 예제가 이 보일러플레이트에서 해당 기능을 추가로 활성화하라는 뜻은 아닙니다.

## 연동 테스트

개발 환경에서 `/debug/sentry`를 열고 테스트 버튼을 누르세요.

![Sentry 테스트 페이지](assets/sentry.jpg)

버튼은 의도적으로 오류를 던지는 기존 테스트 Server Action을 호출합니다. 올바른 Sentry 프로젝트의 Issues 화면에 이벤트가 도착했는지 확인하세요. 스크린샷이나 로컬 오류 메시지만으로는 Sentry의 수신 여부를 알 수 없습니다.

프로덕션에서는 서버 전용 `SENTRY_DEBUG_ENABLED=true`가 없으면 테스트 페이지를 사용할 수 없습니다. 액션도 같은 조건을 확인합니다. 검증을 위해 일시적으로 켰다면 확인 후 해당 설정을 제거하세요. DSN이 없으면 버튼이 비활성화됩니다.

이벤트가 도착하지 않으면 DSN, 빌드 환경, 서비스 접근 상태, 브라우저 차단 여부를 확인하세요. 스택 트레이스를 읽기 어렵다면 소스맵 업로드용 세 값과 빌드 로그를 확인하세요. 이 문서를 포팅하면서 모니터링 설정을 변경하지 않았습니다.

---

[목차](README.md)
