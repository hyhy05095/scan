# 설정과 테마

Supanext는 영어·스페인어·한국어 UI와 라이트·다크·시스템 테마를 제공합니다.

![언어와 테마 메뉴](assets/settings.gif)

## 언어 선택

[`src/components/locale-switcher.tsx`](../src/components/locale-switcher.tsx)는 `locale` 쿠키를 저장하고 `router.refresh()`를 호출합니다.

[`src/proxy.ts`](../src/proxy.ts)는 쿠키의 지원 언어를 사용하며, 없으면 `Accept-Language`를 확인하고 최종적으로 영어를 사용합니다. 페이지를 `src/app/[lang]` 내부 경로로 rewrite합니다. 브라우저 URL은 `/ko/login`이 아니라 `/login`처럼 언어 접두사가 없는 형태입니다. 기존 언어 접두사 URL을 방문하면 해당 언어를 선택한 뒤 접두사 없는 경로로 이동합니다.

최상위 레이아웃은 HTML `lang` 속성을 지정하고 i18next provider에 번역을 전달합니다. 이 구현에는 `/api/settings/locale` 엔드포인트가 없습니다.

## 번역 파일

아래 세 파일에서 같은 키를 함께 수정하세요.

- [`src/i18n/dictionaries/en.json`](../src/i18n/dictionaries/en.json)
- [`src/i18n/dictionaries/es.json`](../src/i18n/dictionaries/es.json)
- [`src/i18n/dictionaries/ko.json`](../src/i18n/dictionaries/ko.json)

Server Component는 [`dictionaries.ts`](../src/i18n/dictionaries.ts)의 `await getDictionary(locale)`를 사용합니다. 여러 양식은 필요한 번역 부분을 props로 받습니다. [`TranslationProvider`](../src/i18n/provider.tsx) 아래의 Client Component는 기존 react-i18next context를 사용할 수 있습니다.

```tsx
"use client";

import { useTranslation } from "react-i18next";

export function LoginLabel() {
  const { t } = useTranslation();
  return <span>{t("auth.login")}</span>;
}
```

위 코드는 설명용 컴포넌트이며 새로 설치된 기능이 아닙니다. `Dictionary` 타입은 읽어 온 JSON 구조에서 만들어집니다. 기존 `app/locales/types.ts` 파일은 사용하지 않습니다. 키를 일치시키고 변경 후 `npm run typecheck`를 실행하세요.

새 언어를 추가하려면 지원 언어 목록, 번역 로더, 언어 메뉴의 문구/국기도 함께 수정해야 합니다. 현재 설치된 언어는 그대로 유지됩니다.

## 테마 선택

[`src/components/theme-switcher.tsx`](../src/components/theme-switcher.tsx)는 `theme` 쿠키를 저장합니다. 기본값은 다크이며 `system`은 운영체제 설정과 그 변경을 따릅니다.

[`src/lib/theme.ts`](../src/lib/theme.ts)는 최상위 레이아웃이 사용하는 초기화 스크립트를 제공합니다. 화면을 그리기 전에 HTML의 `dark`/`light` 클래스와 색상 모드를 지정합니다. 테마 변경용 POST 엔드포인트는 없습니다.

Tailwind의 `dark:` variant와 [`src/app/globals.css`](../src/app/globals.css)의 CSS 변수가 테마 스타일을 제어합니다. 공통 shadcn/ui 컴포넌트는 [`src/components/ui`](../src/components/ui)에 있으며 설치된 컴포넌트 스타일은 New York입니다.

## 앱 이름과 사용자화

공통 앱 이름은 `NEXT_PUBLIC_APP_NAME`으로 설정합니다. 페이지 콘텐츠, 번역, 메타데이터, 법적 고지 템플릿, 이메일에 들어 있는 제품별 문구는 필요한 곳에서 별도로 수정하세요.

언어/테마 메뉴는 사이트 및 대시보드 화면에서 사용하는 공통 컴포넌트입니다. 메뉴를 숨긴다고 이미 저장된 쿠키나 언어/테마 구현까지 제거되지는 않습니다.

기본 개념은 [i18next](https://www.i18next.com/overview/getting-started)와 [Tailwind 다크 모드](https://tailwindcss.com/docs/dark-mode) 문서를 참고하세요.

---

[목차](README.md)
