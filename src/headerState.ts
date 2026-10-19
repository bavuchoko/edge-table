import { clampColumnWidth, hasFixedWidth } from './columnWidth'
import type { ColumnKey, HeaderState } from './types'

/** SIMMS 구형 헤더 저장 포맷 (`initHeaderOrders`가 읽던 형태) */
export type LegacyHeaderSetting = {
  orders?: string[]
  excluded?: string[]
  widths?: Record<string, number>
}

/** JSON 저장용 — render 등 비직렬화 필드 제외 */
export type PersistableHeaderState = Omit<HeaderState, 'render'>

export type AppliedHeaderState = {
  headers: HeaderState[]
  visibleKeys: ColumnKey[]
}

function hasAnyDefault(headers: HeaderState[]): boolean {
  return headers.some((h) => h.default)
}

/** `default: true`만 표시(없으면 전부). 보이는 항목을 앞으로. */
export function applyHeaderDefaults(headers: HeaderState[]): HeaderState[] {
  const useDefault = hasAnyDefault(headers)
  const next = headers.map((h) => ({
    ...h,
    visible: useDefault ? Boolean(h.default) : true,
  }))
  if (next.every((h) => !h.visible) && next[0]) {
    next[0] = { ...next[0], visible: true }
  }
  return [...next.filter((h) => h.visible), ...next.filter((h) => !h.visible)]
}

export function visibleKeysFromHeaders(headers: HeaderState[]): ColumnKey[] {
  const keys = headers.filter((h) => h.visible).map((h) => h.key)
  if (keys.length > 0) return keys
  return headers[0] ? [headers[0].key] : []
}

/**
 * visible 플래그를 맞추고, 보이는 칼럼끼리만 visibleKeys 순서로 재배열한다.
 * 숨김 칼럼은 원래 자리를 유지 (숨겼다 다시 추가하면 같은 위치로 돌아옴). 나머지 필드는 유지.
 */
export function withVisibleOrder(
  headers: HeaderState[],
  visibleKeys: ColumnKey[],
): HeaderState[] {
  const byKey = new Map(headers.map((h) => [h.key, h] as const))
  const visibleSet = new Set(visibleKeys)
  const ordered = visibleKeys.filter((key) => byKey.has(key))
  let cursor = 0
  const next: HeaderState[] = headers.map((h) => {
    if (!visibleSet.has(h.key)) return { ...h, visible: false }
    const item = byKey.get(ordered[cursor++])!
    return { ...item, visible: true }
  })
  if (next.every((h) => !h.visible) && next[0]) {
    next[0] = { ...next[0], visible: true }
  }
  return next
}

export function headerSignature(headers: HeaderState[]): string {
  return headers
    .map((h) => `${h.key}:${h.visible ? 1 : 0}:${h.width ?? ''}:${h.minWidth ?? ''}`)
    .join('|')
}

export function toPersistableHeaders(headers: HeaderState[]): PersistableHeaderState[] {
  return headers.map(({ render: _r, ...rest }) => rest)
}

/**
 * base(정의+render)에 저장본을 합친다.
 * 저장 없으면 `applyHeaderDefaults(base)`.
 */
export function mergeHeaderState(
  base: HeaderState[],
  saved?: HeaderState[] | PersistableHeaderState[] | null,
): HeaderState[] {
  if (!saved?.length) return applyHeaderDefaults(base)

  const baseByKey = new Map(base.map((h) => [h.key, h] as const))
  const used = new Set<string>()
  const merged: HeaderState[] = []

  for (const item of saved) {
    const def = baseByKey.get(item.key)
    if (!def) continue
    used.add(item.key)
    const next: HeaderState = {
      ...def,
      label: item.label?.trim() ? item.label : def.label,
      visible: Boolean(item.visible),
    }
    if (hasFixedWidth(item.width)) {
      next.width = clampColumnWidth(item.width)
    }
    merged.push(next)
  }

  for (const def of base) {
    if (used.has(def.key)) continue
    merged.push({ ...def, visible: false })
  }

  if (merged.every((h) => !h.visible) && merged[0]) {
    merged[0] = { ...merged[0], visible: true }
  }
  return merged
}

/**
 * SIMMS 구형 `{ orders, excluded, widths }` → HeaderState[].
 * 이미 HeaderState[]이면 base와 merge한다.
 */
export function normalizeHeaderSetting(
  raw: unknown,
  base: HeaderState[],
): HeaderState[] | null {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    if (raw.length === 0) return applyHeaderDefaults(base)
    const first = raw[0]
    if (first && typeof first === 'object' && 'key' in first && 'visible' in first) {
      return mergeHeaderState(base, raw as HeaderState[])
    }
    return null
  }

  if (typeof raw !== 'object') return null
  const legacy = raw as LegacyHeaderSetting
  if (!legacy.orders && !legacy.excluded && !legacy.widths) return null

  const excluded = new Set(legacy.excluded ?? [])
  const orders = legacy.orders?.length ? legacy.orders : base.map((col) => col.key)
  const orderSet = new Set(orders)
  const widths = legacy.widths ?? {}

  const fromOrders: PersistableHeaderState[] = orders.flatMap((key) => {
    const col = base.find((item) => item.key === key)
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
        type: col.type,
        visible: !excluded.has(key),
        ...(resolved != null ? { width: resolved } : {}),
        ...(col.minWidth != null ? { minWidth: col.minWidth } : {}),
        ...(col.default != null ? { default: col.default } : {}),
        ...(col.filterable != null ? { filterable: col.filterable } : {}),
      },
    ]
  })

  const rest: PersistableHeaderState[] = base
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
        type: col.type,
        visible: !excluded.has(col.key),
        ...(resolved != null ? { width: resolved } : {}),
        ...(col.minWidth != null ? { minWidth: col.minWidth } : {}),
        ...(col.default != null ? { default: col.default } : {}),
        ...(col.filterable != null ? { filterable: col.filterable } : {}),
      }
    })

  return mergeHeaderState(base, [...fromOrders, ...rest])
}

/**
 * SIMMS 페이지 이식 시:
 * - 정의: HeaderState[] (default/render 포함)
 * - 저장: `setIndividualSetting({ headers: { asset: persistable } })`
 * - 로드: `normalizeHeaderSetting(raw, ASSET_LIST_HEADER)` → `header={...}`
 */
export const SIMMS_HEADER_WIRE_NOTES = {
  saveExample: `onHeaderChanged={(v) => setIndividualSetting({ headers: { asset: toPersistableHeaders(v) } })}`,
  resetExample: `onHeaderReset={() => { resetIndividualSetting('headers', 'asset'); setHeader(applyHeaderDefaults(ASSET_LIST_HEADER)) }}`,
  loadExample: `const header = normalizeHeaderSetting(JSON.parse(r.data.headers)?.asset, ASSET_LIST_HEADER)
// header={header} onHeaderChanged={...} onHeaderReset={...}`,
} as const

/** @deprecated applyHeaderDefaults / mergeHeaderState 사용 */
export function defaultVisibleKeysFromColumns(headers: HeaderState[]): ColumnKey[] {
  return visibleKeysFromHeaders(applyHeaderDefaults(headers))
}

/** @deprecated mergeHeaderState / applyHeaderDefaults 사용 */
export function applyHeaderState(args: {
  columns: HeaderState[]
  state?: HeaderState[] | null
}): AppliedHeaderState {
  const headers = mergeHeaderState(args.columns, args.state)
  return {
    headers,
    visibleKeys: visibleKeysFromHeaders(headers),
  }
}

/** @deprecated withVisibleOrder 사용 */
export function toHeaderState(
  visibleKeys: ColumnKey[],
  columns: HeaderState[],
  _columnWidths?: Record<string, number>,
): HeaderState[] {
  return withVisibleOrder(columns, visibleKeys)
}
