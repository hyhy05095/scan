# Google Analytics

Supanext는 `@next/third-parties/google`의 `GoogleAnalytics`를 통해 Google Analytics 4를 사용합니다.

## 설정

Google Analytics 속성과 웹 데이터 스트림을 만든 뒤, 측정 ID를 `.env.local`에 설정하세요.

```dotenv
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-YOUR_MEASUREMENT_ID
```

[루트 레이아웃](../src/app/%5Blang%5D/layout.tsx)은 값이 있을 때 기존 연동 컴포넌트를 렌더링합니다. 이 값은 빌드 시 반영되는 공개 설정입니다. 개발 중 수정했다면 서버를 다시 시작하고, 배포된 앱은 다시 빌드하세요.

여기에는 일반적으로 `G-`로 시작하는 **GA4 측정 ID**를 넣습니다. `GTM-`으로 시작하는 Google Tag Manager 컨테이너 ID가 아닙니다. Supanext는 Tag Manager 컨테이너를 설치하거나 Google Ads를 자동으로 추가하지 않습니다.

Next.js 컴포넌트는 hydration 이후 Google Analytics 스크립트를 로드합니다. 공식 [Google Analytics 연동 문서](https://nextjs.org/docs/app/guides/third-party-libraries#google-analytics)를 참고하세요.

## 이벤트 보내기

[기존 분석 테스트 컴포넌트](../src/features/debug/components/analytics-test.tsx)는 다음 이벤트를 보냅니다.

```tsx
sendGAEvent("event", "test_event", {
  test: "test",
  time: new Date().toISOString(),
});
```

Client Component에서 `@next/third-parties/google`의 `sendGAEvent`를 가져와 사용합니다. 이 함수가 동작하려면 `GoogleAnalytics` 컴포넌트가 마운트되어 있어야 합니다.

이벤트 이름과 속성은 서비스에 맞게 정하세요. 비밀번호, 토큰, 문의 양식 본문을 분석 이벤트에 넣지 마세요. Supanext에는 별도의 분석 수집 동의 관리 흐름이 없습니다. 측정 ID를 설정한다고 동의 관리 기능까지 생기지는 않습니다.

## 수신 확인

`/debug/analytics`에서 테스트 이벤트를 보내세요.

![분석 테스트 페이지](assets/google.jpg)

해당 속성의 실시간 보고서에서 `test_event`가 도착했는지 확인합니다.

![분석 이벤트 보고서 예시](assets/event.jpg)

페이지의 성공 메시지는 함수가 호출되었다는 뜻이지 Google이 수신을 확인했다는 뜻은 아닙니다. 이벤트가 보이지 않으면 브라우저 차단, 네트워크 요청, 속성 ID, 빌드 환경 설정을 확인하세요.

측정 ID가 없으면 테스트 버튼이 비활성화됩니다. Sentry 테스트 경로와 달리 이 페이지는 프로덕션에서 `SENTRY_DEBUG_ENABLED`로 숨겨지지 않습니다. 숨기려면 명시적인 애플리케이션 변경이 필요하며, 이 문서 포팅에서는 변경하지 않습니다.

---

[목차](README.md)
