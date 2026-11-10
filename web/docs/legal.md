# 약관과 개인정보 처리방침

Supanext에는 다음 두 MDX 템플릿이 포함되어 있습니다.

| 공개 경로                 | 콘텐츠 파일                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| `/legal/privacy-policy`   | [privacy-policy.mdx](../src/content/legal/privacy-policy.mdx)     |
| `/legal/terms-of-service` | [terms-of-service.mdx](../src/content/legal/terms-of-service.mdx) |

언어를 바꿔도 공개 URL과 콘텐츠는 동일합니다. 현재 법률 문서 템플릿은 영어입니다. 탐색 문구와 템플릿 경고가 번역되어 있다고 해서 약관 본문까지 번역된 것은 아닙니다.

## 콘텐츠 수정하기

MDX 파일을 직접 수정하세요. 페이지 메타데이터를 생성할 수 있도록 `title`, `description` frontmatter를 유지해야 합니다.

이 문서는 시작용 템플릿이며, 여러분의 사업에 맞춰 완성된 정책이 아닙니다. 공개하기 전에 자리표시자와 각 문장이 실제 서비스에 맞는지 확인하고, 적절한 법률 검토를 받으세요. 애플리케이션에도 템플릿임을 알리는 경고가 표시됩니다.

Markdown을 수정해도 애플리케이션의 정보 수집, 보관, 결제 처리, 계정 삭제 동작은 바뀌지 않습니다. 문서 내용과 실제 구현이 일치해야 합니다.

## 라우트 동작

[법률 콘텐츠 모듈](../src/content/legal.ts)이 허용된 두 문서를 읽고 번들링합니다. [App Router 페이지](../src/app/%5Blang%5D/legal/%5Bslug%5D/page.tsx)는 본문과 메타데이터를 렌더링하고, `generateStaticParams()`로 각 언어의 경로를 생성합니다.

콘텐츠를 바꾼 뒤에는 다시 빌드하고 배포하세요. React Router의 사전 렌더링 설정을 수정할 필요는 없습니다.

문서를 추가하려면 파일을 넣는 것만으로는 부족합니다. 현재 로더는 `src/content/legal.ts`에 등록된 slug만 허용합니다. 새 페이지를 추가하기로 했다면 허용 목록, 탐색 링크, 사이트맵도 함께 확인해야 합니다.

---

[목차](README.md)
