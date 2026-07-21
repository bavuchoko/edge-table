import type { CSSProperties } from 'react'
import type { ColumnDef } from './types'

/** 모든 칼럼 공통 폭 범위 */
export const COLUMN_MIN_WIDTH = 130
export const COLUMN_MAX_WIDTH = 500
export const ADD_COLUMN_WIDTH = 72

/** 고정 폭이 지정된 칼럼인지 */
export function hasFixedWidth(width?: number): width is number {
  return width != null && Number.isFinite(width) && width > 0
}

/** 지정 폭을 130~500 안으로 clamp */
export function clampColumnWidth(width: number): number {
  return Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, Math.round(width)))
}

/** flex 칼럼의 하한 — ColumnDef.minWidth 또는 기본 130, 범위는 130~500 */
export function resolveFlexMinWidth(minWidth?: number): number {
  if (minWidth == null || !Number.isFinite(minWidth) || minWidth <= 0) {
    return COLUMN_MIN_WIDTH
  }
  return clampColumnWidth(minWidth)
}

/** th/td에 적용할 고정 폭 스타일 (항상 130~500) */
export function columnSizeStyle(width: number): CSSProperties {
  const fixed = clampColumnWidth(width)
  return {
    width: fixed,
    minWidth: fixed,
    maxWidth: fixed,
  }
}

export type TableLayoutMetrics = {
  columns: ColumnDef[]
  /** + 앞 spacer 폭(px). 칼럼이 뷰보다 넓으면 0 */
  gapWidth: number
  /** 테이블 전체 폭(px) = chrome + data + gap */
  tableWidth: number
}

/**
 * 칼럼/gap/테이블 폭을 px로 확정.
 * gap에 width:100%를 쓰면 min-width:max-content와 맞물려 무한 확장되므로 사용하지 않는다.
 */
export function resolveTableLayout(args: {
  columns: ColumnDef[]
  viewportWidth: number
  chromeWidth: number
}): TableLayoutMetrics {
  const { columns, chromeWidth } = args
  const viewportWidth = Math.max(0, args.viewportWidth)

  type FlexSlot = { index: number; min: number }
  const flexSlots: FlexSlot[] = []
  let fixedSum = 0

  columns.forEach((col, index) => {
    if (hasFixedWidth(col.width)) {
      fixedSum += clampColumnWidth(col.width)
    } else {
      flexSlots.push({ index, min: resolveFlexMinWidth(col.minWidth) })
    }
  })

  const widths = new Map<number, number>()

  if (flexSlots.length === 0) {
    columns.forEach((col, index) => {
      if (hasFixedWidth(col.width)) {
        widths.set(index, clampColumnWidth(col.width))
      }
    })
  } else {
    const available = Math.max(0, viewportWidth - chromeWidth - fixedSum)
    const minSum = flexSlots.reduce((sum, slot) => sum + slot.min, 0)

    flexSlots.forEach((slot) => widths.set(slot.index, slot.min))

    let rest = Math.max(0, available - minSum)
    while (rest > 0.5) {
      const growers = flexSlots.filter((slot) => (widths.get(slot.index) ?? 0) < COLUMN_MAX_WIDTH)
      if (growers.length === 0) break

      const share = rest / growers.length
      let used = 0
      for (const slot of growers) {
        const current = widths.get(slot.index) ?? slot.min
        const room = COLUMN_MAX_WIDTH - current
        const add = Math.min(room, share)
        widths.set(slot.index, current + add)
        used += add
      }
      if (used < 0.5) break
      rest -= used
    }
  }

  const layoutColumns = columns.map((col, index) => {
    if (hasFixedWidth(col.width)) {
      return { ...col, width: clampColumnWidth(col.width) }
    }
    const resolved = widths.get(index)
    return { ...col, width: Math.round(resolved ?? COLUMN_MIN_WIDTH) }
  })

  const dataSum = layoutColumns.reduce((sum, col) => sum + (col.width ?? 0), 0)
  const contentWidth = chromeWidth + dataSum
  // 뷰가 더 넓을 때만 gap으로 채움. % 폭 금지.
  const gapWidth =
    viewportWidth > 0 ? Math.max(0, Math.floor(viewportWidth - contentWidth)) : 0
  const tableWidth = contentWidth + gapWidth

  return {
    columns: layoutColumns,
    gapWidth,
    tableWidth: Math.max(tableWidth, contentWidth),
  }
}

/** @deprecated resolveTableLayout 사용 */
export function resolveLayoutColumns(args: {
  columns: ColumnDef[]
  viewportWidth: number
  chromeWidth: number
}): ColumnDef[] {
  return resolveTableLayout(args).columns
}
