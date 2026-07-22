# @bavuchoko/edge-table

YouTrack 스타일 React 테이블 — 칼럼 DnD, Alt+클릭 틀고정, 가상 스크롤, Spring `Pageable` 연동.

## Install

```bash
npm i @bavuchoko/edge-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-virtual
```

## Usage

```tsx
import { EdgeTable, applyHeaderDefaults, type HeaderState } from '@bavuchoko/edge-table'
import '@bavuchoko/edge-table/style.css'

const ASSET_LIST_HEADER: HeaderState[] = [
  { key: 'name', label: '자산명', type: 'text', width: 200, default: true, visible: true },
  { key: 'code', label: '자산코드', type: 'text', width: 120, default: true, visible: true },
  { key: 'group', label: '자산그룹', type: 'text', width: 140, visible: false },
]

<EdgeTable
  data={page}
  maxHeight={480}
  header={headers}
  onHeaderChanged={(next) => saveHeaders(next)}
  onHeaderReset={() => setHeaders(applyHeaderDefaults(ASSET_LIST_HEADER))}
  onPageChange={(pageable) => fetchPage(pageable)}
/>
```

### Props (요약)

| prop | 설명 |
|------|------|
| `header` | `HeaderState[]` — 헤더 정의 + 현재 표시 상태 |
| `onHeaderChanged` | 칼럼 추가·제거·순서 변경 시 |
| `onHeaderReset` | 기본 헤더로 리셋 시 |
| `data` | Spring Page 형태 `{ content, pageable, totalPages, ... }` |
| `onPageChange` | 정렬/페이지 변경 시 `Pageable` 전달 |
| `maxHeight` | 있으면 thead 고정 + 본문 스크롤·가상 리스트 |
| `ref.getChecked()` | 현재 체크된 행 배열 |

`HeaderState`: `key`, `label`, `type`, `visible`, `width?`, `minWidth?`, `default?`, `filterable?`, `render?`

## Publish

```bash
npm publish
```

`prepack` / `prepublishOnly`에서 `build:lib`가 먼저 실행됩니다. (`publishConfig.access: public`)
