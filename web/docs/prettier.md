# Prettier

Supanext는 Prettier와 import 정렬 및 Tailwind 클래스 정렬 플러그인을 사용합니다.

## 설정

현재 [`.prettierrc.json`](../.prettierrc.json)의 내용은 다음과 같습니다.

```json
{
  "plugins": [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],
  "importOrder": [
    "<THIRD_PARTY_MODULES>",
    "^@/lib/(.*)$",
    "^@/components/ui/(.*)$",
    "^@/(.*)$",
    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
```

외부 패키지, 공통 라이브러리, shadcn/ui, 나머지 `@/` import, 상대 경로 순으로 그룹화합니다. `@/`는 `src/`를 가리킵니다. React Router가 생성하는 `+types` import 설정은 없습니다.

[Trivago 플러그인](https://github.com/trivago/prettier-plugin-sort-imports)은 import를 정렬합니다. [Tailwind 플러그인](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)은 유틸리티 클래스를 정렬하며 플러그인 목록의 마지막에 위치합니다.

## 명령

```sh
npm run format:check
npm run format
```

첫 번째 명령은 파일을 수정하지 않고 검사하며, 두 번째는 포맷을 적용합니다. [`.prettierignore`](../.prettierignore)는 생성된 디렉토리와 로컬 도구 파일 등을 제외합니다.

에디터 연동은 [Prettier 확장](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)을 설치하고 필요하면 저장 시 포맷을 활성화합니다. 이 가이드가 확장을 설치하거나 에디터 설정을 변경하지는 않습니다.

포맷 검사는 `npm run lint`, `npm run typecheck`와 별개입니다. 코드 변경 시 해당되는 검사를 함께 실행하세요.

---

[목차](README.md)
