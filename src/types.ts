import type { ReactNode } from 'react'

export type ColumnKey = string

/** react_grid `GridCellRenderArgs`와 동일 계약 */
export type CellRenderArgs = {
  row: unknown
  value: unknown
  columnKey: string
  rowIndex: number
  stopRowClick: (e: unknown) => void
}

export type CellRender = ReactNode | ((args: CellRenderArgs) => ReactNode)

export type ColumnDef = {
  key: ColumnKey
  label: string
  type: 'text' | string
  width: number
  filterable?: boolean
  /** react_grid `Header.render` — 함수 또는 ReactNode(element면 props 주입) */
  render?: CellRender
}

/** react_grid `HeaderState`와 동일 형태 — 칼럼 표시/순서 저장용 */
export type HeaderState = {
  key: string
  label: string
  visible: boolean
  width?: number
}

/** jsGrid / Spring Pageable 과 동일한 요청·상태 형태 */
export type Pageable = {
  pageNumber?: number
  size?: number
  pageSize?: number
  sort?: string[]
  desc?: string | boolean
  totalElements?: number
  totalPages?: number
  sortDirection?: 'ASC' | 'DESC'
}

/** Spring Page 형태 응답 */
export type PageResponse<T> = {
  content: T[]
  pageable?: {
    pageNumber?: number
    pageSize?: number
    offset?: number
    paged?: boolean
    unpaged?: boolean
    sort?: string[]
  }
  totalPages?: number
  totalElements?: number
  last?: boolean
  size?: number
  number?: number
  numberOfElements?: number
  first?: boolean
  empty?: boolean
}
