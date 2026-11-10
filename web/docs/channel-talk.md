# 채널톡

Supanext에는 채널톡 브라우저 연동이 이미 포함되어 있습니다.

## 설정

채널톡에서 해당 채널의 플러그인 키를 확인한 뒤 설정하세요.

```dotenv
NEXT_PUBLIC_CHANNEL_PLUGIN_KEY=your-channel-plugin-key
```

대시보드 설정과 위젯 옵션은 채널톡 [웹 시작하기 문서](https://developers.channel.io/ko/articles/d27c51d1)를 참고하세요.

이 값은 브라우저에 공개되는 설정입니다. 수정한 뒤 개발 서버를 다시 시작하거나 배포를 다시 빌드해야 합니다. 값을 비워 두면 Supanext는 채널톡 스크립트를 로드하지 않습니다.

## 현재 연동 방식

[루트 레이아웃](../src/app/%5Blang%5D/layout.tsx)이 [AppIntegrations](../src/components/app-integrations.tsx)에 키를 전달합니다.

이 Client Component는 `next/script`를 사용해 기존 채널톡 브라우저 로더 스니펫을 불러오고, `pluginKey`로 위젯을 시작합니다. 현재 구현에는 별도의 채널톡 npm SDK가 필요하지 않습니다.

현재 boot 데이터에는 플러그인 키만 포함됩니다. 로그인한 Supabase 사용자를 자동으로 식별하거나 프로필을 보내지 않으며, 앱의 언어와 채팅 위젯의 언어를 동기화하지도 않습니다. 해당 기능은 별도의 구현 결정이 필요합니다.

같은 컴포넌트에서 NProgress와 Sonner도 제공합니다. 채널톡을 사용하지 않으려면 공유 컴포넌트 전체를 삭제하지 말고 키를 비워 두세요.

## 확인

유효한 키와 서비스 설정을 준비한 뒤 앱에서 위젯이 로드되는지 확인하세요. 표시되지 않으면 채널 설정, 브라우저 콘솔, 네트워크 차단 여부를 살펴보세요. 스크립트가 존재한다는 사실만으로 상담 메시지가 수신함에 도착했다고 볼 수는 없습니다.

---

[목차](README.md)
