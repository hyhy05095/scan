# 블로그

Supanext는 `/blog`, `/blog/<slug>`에서 MDX 블로그를 제공합니다. 언어를 바꿔도 공개 URL에 접두사가 붙지 않습니다. 콘텐츠는 [src/content/blog](../src/content/blog)에 있습니다.

![블로그](assets/blog.jpg)

## 글 추가하기

`src/content/blog/my-first-post.mdx` 같은 파일을 만드세요.

```mdx
---
title: 첫 번째 글
description: 이 글을 소개하는 짧은 설명입니다.
date: 2026-09-03
category: 소식
author: 작성자 이름
---

여기에 본문을 작성하세요.
```

로더는 `title`, `description`, `date`, `category`, `author`를 필수 항목으로 확인합니다. 날짜는 `YYYY-MM-DD` 형식으로 작성하세요.

**파일 이름이 URL의 slug를 결정합니다.** 위 예제는 `/blog/my-first-post`에 표시됩니다. 기존 예제 파일에 `slug` frontmatter가 남아 있을 수 있지만, Supanext는 해당 값이 아니라 파일 이름에서 slug를 가져옵니다.

같은 이름의 이미지를 `public/blog/my-first-post.jpg`에 추가하세요. 목록과 본문 페이지는 `/blog/<slug>.jpg`를 사용하며, Open Graph 이미지 생성기도 이 파일을 읽습니다.

기존 글은 예제 콘텐츠입니다. 현재 구현은 모든 언어에서 같은 MDX를 사용하므로, 인터페이스 언어를 바꿔도 글 본문이 번역되지는 않습니다.

## React 컴포넌트 사용하기

MDX에서는 React 컴포넌트를 사용할 수 있습니다. [hello-world 예제](../src/content/blog/hello-world.mdx)는 기존 카운터를 불러옵니다.

```mdx
import CounterExample from "../../features/blog/components/counter-example";

<CounterExample />
```

상대 경로는 블로그 콘텐츠 디렉터리를 기준으로 해석됩니다. 상호작용이 필요한 로직은 예제처럼 적절한 Client Component에 두세요. 이 기능은 저장소에서 관리하는 MDX를 위한 것이며, 신뢰할 수 없는 사용자가 콘텐츠를 업로드하는 기능이 아닙니다.

## Next.js에서 렌더링되는 방식

| 파일                                                           | 역할                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| [posts.ts](../src/features/blog/posts.ts)                   | MDX 읽기, 필수 메타데이터 검증, 최신순 정렬, 콘텐츠 번들링 |
| [블로그 목록](../src/app/%5Blang%5D/blog/page.tsx)          | 글 목록을 렌더링하는 Server Component                      |
| [글 페이지](../src/app/%5Blang%5D/blog/%5Bslug%5D/page.tsx) | 본문 렌더링, 메타데이터, 정적 경로 매개변수                |
| [MDX 렌더러](../src/components/mdx-content.tsx)             | 컴파일된 MDX와 컴포넌트 렌더링                             |

글 페이지는 `generateStaticParams()`로 각 지원 언어와 기존 글의 경로를 생성합니다. `dynamicParams = false` 설정에 따라 목록에 없는 slug는 제공하지 않습니다. 글을 수정하거나 추가한 뒤에는 애플리케이션을 다시 빌드하고 배포하세요.

React Router의 `loader`, 라우트 등록 파일, `react-router.config.ts`의 사전 렌더링 목록을 수정할 필요가 없습니다. Next.js는 `page.tsx` 파일을 통해 경로를 인식합니다.

## Open Graph 이미지와 검색 정보

[opengraph-image.tsx](../src/app/%5Blang%5D/blog/%5Bslug%5D/opengraph-image.tsx)는 `next/og`의 `ImageResponse`로 글의 소셜 공유 이미지를 생성합니다. 글 제목, 설명, 같은 이름의 JPG를 사용합니다. 글 페이지의 `generateMetadata()`는 제목, 설명, 소셜 메타데이터를 제공합니다.

[사이트맵](../src/app/sitemap.ts)과 [robots 파일](../src/app/robots.ts)은 Next.js 메타데이터 라우트 규칙을 따릅니다. 프로덕션 빌드 전에 `NEXT_PUBLIC_SITE_URL`을 실제 사이트의 origin으로 설정하세요.

공식 [generateStaticParams 문서](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)와 [Open Graph 이미지 규칙](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)도 참고하세요.

---

[목차](README.md)
