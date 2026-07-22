/** @bavuchoko/edge-table — npm 패키지 진입점 */
import './components/EdgeTable/EdgeTable.css'

export { EdgeTable, type EdgeTableProps } from './components/EdgeTable/EdgeTable'
export { EdgeTableEmpty, type EdgeTableEmptyProps } from './components/EdgeTable/EdgeTableEmpty'
export { stopRowClick } from './components/EdgeTable/renderCell'
export {
  ADD_COLUMN_WIDTH,
  COLUMN_MAX_WIDTH,
  COLUMN_MIN_WIDTH,
  clampColumnWidth,
  columnSizeStyle,
  hasFixedWidth,
  resolveFlexMinWidth,
  resolveLayoutColumns,
  resolveTableLayout,
  type TableLayoutMetrics,
} from './columnWidth'
export { getCellValue } from './getCellValue'
export {
  applyHeaderState,
  normalizeHeaderSetting,
  toHeaderState,
  SIMMS_HEADER_WIRE_NOTES,
  type AppliedHeaderState,
  type LegacyHeaderSetting,
} from './headerState'
export { resolvePageMeta } from './resolvePageMeta'
export type {
  CellRender,
  CellRenderArgs,
  ColumnDef,
  ColumnKey,
  HeaderState,
  PageMeta,
  PageResponse,
  Pageable,
} from './types'
