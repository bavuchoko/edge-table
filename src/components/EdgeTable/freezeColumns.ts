import type { CSSProperties } from 'react'
import type { ColumnDef, ColumnKey } from '../../types'

export const FREEZE_HIGHLIGHT_BG = 'rgb(219, 234, 254)'

const STAR_COL_WIDTH = 36
const CHECK_COL_WIDTH = 36
const CHECK_WITH_STAR_WIDTH = 32

/** 별/체크 sticky 너비 합 — 데이터 칼럼 left 오프셋 기준 */
export function stickyBaseLeft(showStar: boolean): number {
  return showStar ? STAR_COL_WIDTH + CHECK_WITH_STAR_WIDTH : CHECK_COL_WIDTH
}

/** 데이터 칼럼 index별 sticky left (별/체크 포함 누적) */
export function computeDataColumnLeftOffsets(
  columns: readonly ColumnDef[],
  showStar: boolean,
): number[] {
  const offsets: number[] = []
  let acc = stickyBaseLeft(showStar)
  for (let i = 0; i < columns.length; i++) {
    offsets[i] = acc
    const w = columns[i]?.width
    // flex 칼럼은 sticky 합산용 추정폭(범위 중간)
    acc += w != null && w > 0 ? w : 500
  }
  return offsets
}

export function getFreezeStickyStyle(args: {
  dataColIndex: number
  freezeUntilIndex: number | null
  leftOffsets: number[]
  isHeader: boolean
}): CSSProperties | undefined {
  const { dataColIndex, freezeUntilIndex, leftOffsets, isHeader } = args
  if (freezeUntilIndex == null || dataColIndex > freezeUntilIndex) return undefined

  const isLastFrozen = dataColIndex === freezeUntilIndex
  return {
    position: 'sticky',
    left: leftOffsets[dataColIndex] ?? 0,
    top: isHeader ? 0 : undefined,
    zIndex: isHeader ? 4 : 2,
    backgroundColor: FREEZE_HIGHLIGHT_BG,
    backgroundClip: 'padding-box',
    ...(isLastFrozen ? { boxShadow: 'inset -2px 0 0 #1d4ed8' } : {}),
  }
}

export function resolveFreezeUntilIndex(
  freezeUntilKey: ColumnKey | null,
  visibleKeys: readonly ColumnKey[],
): number | null {
  if (freezeUntilKey == null) return null
  const index = visibleKeys.indexOf(freezeUntilKey)
  return index >= 0 ? index : null
}
