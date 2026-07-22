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

/**
 * 헤더(칼럼) 정의 + 표시 상태.
 * - 배열 순서 = 헤더 순서
 * - visible = 현재 표시 여부
 * - default = 저장 없을 때·리셋 시 기본 표시
 */
export type HeaderState = {
  key: ColumnKey
  label: string
  type: 'text' | string
  visible: boolean
  /** 있으면 고정 폭(130~500 clamp). 없으면 flex로 남는 폭을 나눔 */
  width?: number
  /**
   * flex 칼럼(`width` 없음) 전용 하한.
   * 뷰포트에 따라 늘어날 때 이 값 이하로는 줄지 않음 (기본 130, 최대 500 안).
   */
  minWidth?: number
  /** 저장 없을 때·리셋 시 기본으로 표시할지 */
  default?: boolean
  filterable?: boolean
  /**
   * react_grid `Header.render` — 함수 또는 ReactNode(element면 props 주입).
   * - 표시만 하면 `onRowClick`을 막지 않음
   * - 반환 JSX에 `onClick` 등이 있거나 `args.stopRowClick(e)` 호출 시 행 클릭 차단
   */
  render?: CellRender
}

/** @deprecated HeaderState와 동일 — 기존 이름 호환 */
export type ColumnDef = HeaderState

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

/** Spring Data Page 메타(루트 필드 또는 nested `page`) */
export type PageMeta = {
  size?: number
  number?: number
  totalElements?: number
  totalPages?: number
  numberOfElements?: number
  first?: boolean
  last?: boolean
  empty?: boolean
}

/**
 * 목록 페이지 응답.
 * - Spring Page: content + totalPages/totalElements/number/size(+ pageable)
 * - nested page: content + page: { size, number, totalElements, totalPages }
 */
export type PageResponse<T> = {
  content: T[]
  /** nested page 메타 (API가 page 객체로 내려주는 경우) */
  page?: PageMeta
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
