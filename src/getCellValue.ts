/**
 * 기본 셀 값 추출 — `row[key]`를 문자열로.
 * 배열(담당자 등)은 `name`/`label` 필드를 이어 붙인다.
 */
export function getCellValue(row: unknown, columnKey: string): string {
  if (row == null || typeof row !== 'object') return ''
  const record = row as Record<string, unknown>
  const value = record[columnKey]

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
  return ''
}
