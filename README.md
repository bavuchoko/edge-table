# @bavuchoko/edge-table

YouTrack 스타일 React 테이블 — 칼럼 DnD, Alt+클릭 틀고정, 가상 스크롤, Spring `Pageable` 연동.

## Install

```bash
npm i @bavuchoko/edge-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-virtual
```

## Usage

```tsx
import { EdgeTable } from '@bavuchoko/edge-table'
import '@bavuchoko/edge-table/style.css'

<EdgeTable
  columns={columns}
  data={page}
  maxHeight={480}
  onPageChange={(pageable) => fetchPage(pageable)}
  onHeaderSave={(headers) => saveHeaders(headers)}
/>
```

### Props (요약)

| prop | 설명 |
|------|------|
| `columns` | 칼럼 정의 (`render` 지원) |
| `data` | Spring Page 형태 `{ content, pageable, totalPages, ... }` |
| `onPageChange` | 정렬/페이지 변경 시 `Pageable` 전달 |
| `maxHeight` | 있으면 thead 고정 + 본문 스크롤·가상 리스트 |
| `initialHeaders` / `onHeaderSave` / `onHeaderReset` | 헤더 저장 왕복 |

## Publish

```bash
npm publish
```

`prepack` / `prepublishOnly`에서 `build:lib`가 먼저 실행됩니다. (`publishConfig.access: public`)
