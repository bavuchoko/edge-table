import type { PageMeta, PageResponse } from './types'

/** 루트 Spring Page 필드 또는 nested `page` 에서 페이지 메타를 읽는다. */
export function resolvePageMeta<T>(data: PageResponse<T>): Required<
  Pick<PageMeta, 'number' | 'size' | 'totalElements' | 'totalPages'>
> &
  PageMeta {
  const nested = data.page
  const number = data.number ?? nested?.number ?? data.pageable?.pageNumber ?? 0
  const size = data.size ?? nested?.size ?? data.pageable?.pageSize ?? 20
  const totalElements = data.totalElements ?? nested?.totalElements ?? 0
  const totalPages = Math.max(1, data.totalPages ?? nested?.totalPages ?? 1)

  return {
    number,
    size,
    totalElements,
    totalPages,
    numberOfElements: data.numberOfElements ?? nested?.numberOfElements,
    first: data.first ?? nested?.first,
    last: data.last ?? nested?.last,
    empty: data.empty ?? nested?.empty,
  }
}
