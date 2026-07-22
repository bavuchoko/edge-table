/**
 * 기본 셀 값 추출.
 * - `row[key]` 또는 nested path (`group.name`)
 * - 객체면 `name` / `label`
 * - 배열(담당자 등)은 `name`/`label` 을 이어 붙임
 */
export function getCellValue(row: unknown, columnKey: string): string {
  if (row == null || typeof row !== 'object' || columnKey == null || columnKey === '') {
    return ''
  }

  const value = columnKey.includes('.')
    ? columnKey.split('.').reduce<unknown>((acc, key) => {
        if (acc == null || typeof acc !== 'object') return undefined
        return (acc as Record<string, unknown>)[key]
      }, row)
    : (row as Record<string, unknown>)[columnKey]

  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return ''
        if (typeof item === 'string' || typeof item === 'number') return String(item)
        if (typeof item === 'object') {
          const obj = item as Record<string, unknown>
          if (typeof obj.name === 'string') return obj.name
          if (typeof obj.label === 'string') return obj.label
        }
        return ''
      })
      .filter(Boolean)
      .join(', ')
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (typeof obj.name === 'string') return obj.name
    if (typeof obj.label === 'string') return obj.label
  }
  return ''
}
