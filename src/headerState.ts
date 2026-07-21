import { clampColumnWidth, hasFixedWidth } from './columnWidth'
import type { ColumnDef, ColumnKey, HeaderState } from './types'

/** SIMMS 구형 헤더 저장 포맷 (`initHeaderOrders`가 읽던 형태) */
export type LegacyHeaderSetting = {
  orders?: string[]
  excluded?: string[]
  widths?: Record<string, number>
}

export type AppliedHeaderState = {
  visibleKeys: ColumnKey[]
  /** 고정 폭만 담김 (미지정 칼럼은 키 없음) */
  columnWidths: Record<string, number>
  columns: ColumnDef[]
}

function widthMapFromColumns(columns: ColumnDef[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const col of columns) {
    if (hasFixedWidth(col.width)) out[col.key] = clampColumnWidth(col.width)
  }
  return out
}

function withResolvedWidth(col: ColumnDef, widths: Record<string, number>): ColumnDef {
  const w = widths[col.key]
  if (hasFixedWidth(w)) return { ...col, width: clampColumnWidth(w) }
  if (hasFixedWidth(col.width)) return { ...col, width: clampColumnWidth(col.width) }
  const { width: _omit, ...rest } = col
  return rest
}

/**
 * 저장된 HeaderState를 칼럼 정의에 반영한다.
 * react_grid `applyHeaderStateToHeader`와 달리 `visible`도 반영한다.
 */
export function applyHeaderState(args: {
  columns: ColumnDef[]
  state?: HeaderState[] | null
  fallbackVisibleKeys?: ColumnKey[]
}): AppliedHeaderState {
  const { columns } = args
  const fallbackVisibleKeys =
    args.fallbackVisibleKeys ?? columns.filter((c) => c).map((c) => c.key)
  const state = args.state
  const byKey = new Map(columns.map((col) => [col.key, col] as const))
  const widths = widthMapFromColumns(columns)

  if (!state?.length) {
    return {
      visibleKeys: fallbackVisibleKeys.filter((key) => byKey.has(key)),
      columnWidths: widths,
      columns: columns.map((col) => withResolvedWidth(col, widths)),
    }
  }

  const visibleKeys: ColumnKey[] = []
  const used = new Set<string>()

  for (const item of state) {
    const col = byKey.get(item.key)
    if (!col) continue
    used.add(item.key)
    if (hasFixedWidth(item.width)) {
      widths[item.key] = clampColumnWidth(item.width)
    }
    if (item.visible) visibleKeys.push(item.key)
  }

  for (const key of fallbackVisibleKeys) {
    if (used.has(key) || !byKey.has(key)) continue
    visibleKeys.push(key)
  }

  if (visibleKeys.length === 0) {
    const first = columns[0]?.key
    if (first) visibleKeys.push(first)
  }

  return {
    visibleKeys,
    columnWidths: widths,
    columns: columns.map((col) => withResolvedWidth(col, widths)),
  }
}

/** 보이는 칼럼 순서 + 숨김 칼럼 → react_grid형 HeaderState[] */
export function toHeaderState(
  visibleKeys: ColumnKey[],
  columns: ColumnDef[],
  columnWidths?: Record<string, number>,
): HeaderState[] {
  const columnMap = new Map(columns.map((col) => [col.key, col] as const))
  const visibleSet = new Set(visibleKeys)

  const resolveWidth = (key: string, fallback?: number): number | undefined => {
    const w = columnWidths?.[key]
    if (hasFixedWidth(w)) return clampColumnWidth(w)
    if (hasFixedWidth(fallback)) return clampColumnWidth(fallback)
    return undefined
  }

  const toItem = (col: ColumnDef, visible: boolean): HeaderState => {
    const width = resolveWidth(col.key, col.width)
    return {
      key: col.key,
      label: col.label,
      visible,
      ...(width != null ? { width } : {}),
    }
  }

  const visible = visibleKeys.flatMap((key) => {
    const col = columnMap.get(key)
    if (!col) return []
    return [toItem(col, true)]
  })

  const hidden = columns.filter((col) => !visibleSet.has(col.key)).map((col) => toItem(col, false))

  return [...visible, ...hidden]
}

/**
 * SIMMS 구형 `{ orders, excluded, widths }` → HeaderState[].
 * 이미 HeaderState[]이면 그대로 반환한다.
 */
export function normalizeHeaderSetting(
  raw: unknown,
  columns: ColumnDef[],
): HeaderState[] | null {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    if (raw.length === 0) return []
    const first = raw[0]
    if (first && typeof first === 'object' && 'key' in first && 'visible' in first) {
      return raw as HeaderState[]
    }
    return null
  }

  if (typeof raw !== 'object') return null
  const legacy = raw as LegacyHeaderSetting
  if (!legacy.orders && !legacy.excluded && !legacy.widths) return null

  const excluded = new Set(legacy.excluded ?? [])
  const orders = legacy.orders?.length ? legacy.orders : columns.map((col) => col.key)
  const orderSet = new Set(orders)
  const widths = legacy.widths ?? {}

  const fromOrders: HeaderState[] = orders.flatMap((key) => {
    const col = columns.find((item) => item.key === key)
    if (!col) return []
    const width = widths[key]
    const resolved = hasFixedWidth(width)
      ? clampColumnWidth(width)
      : hasFixedWidth(col.width)
        ? clampColumnWidth(col.width)
        : undefined
    return [
      {
        key: col.key,
        label: col.label,
        visible: !excluded.has(key),
        ...(resolved != null ? { width: resolved } : {}),
      },
    ]
  })

  const rest = columns
    .filter((col) => !orderSet.has(col.key))
    .map((col) => {
      const width = widths[col.key]
      const resolved = hasFixedWidth(width)
        ? clampColumnWidth(width)
        : hasFixedWidth(col.width)
          ? clampColumnWidth(col.width)
          : undefined
      return {
        key: col.key,
        label: col.label,
        visible: !excluded.has(col.key),
        ...(resolved != null ? { width: resolved } : {}),
      }
    })

  return [...fromOrders, ...rest]
}

/**
 * SIMMS 페이지 이식 시:
 * - 저장: `setIndividualSetting({ headers: { asset: headerState[] } })`
 * - 로드: `normalizeHeaderSetting(JSON.parse(setting.headers)?.asset, columns)` 후 `initialHeaders`로 전달
 */
export const SIMMS_HEADER_WIRE_NOTES = {
  saveExample: `onHeaderSave={(v) => setIndividualSetting({ headers: { asset: v } })}`,
  resetExample: `onHeaderReset={() => resetIndividualSetting('headers', 'asset')}`,
  loadExample: `const raw = JSON.parse(r.data.headers)?.asset
const initialHeaders = normalizeHeaderSetting(raw, columns) ?? undefined`,
} as const
