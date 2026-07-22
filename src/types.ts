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
  /** 있으면 고정 폭(130~500 clamp). 없으면 flex로 남는 폭을 나눔 */
  width?: number
  /**
   * flex 칼럼(`width` 없음) 전용 하한.
   * 뷰포트에 따라 늘어날 때 이 값 이하로는 줄지 않음 (기본 130, 최대 500 안).
   */
  minWidth?: number
  filterable?: boolean
  /**
   * react_grid `Header.render` — 함수 또는 ReactNode(element면 props 주입).
   * - 표시만 하면 `onRowClick`을 막지 않음
   * - 반환 JSX에 `onClick` 등이 있거나 `args.stopRowClick(e)` 호출 시 행 클릭 차단
   */
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
