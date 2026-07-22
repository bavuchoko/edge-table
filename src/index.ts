/** @bavuchoko/edge-table — npm 패키지 진입점 */
import './components/EdgeTable/EdgeTable.css'

export {
  EdgeTable,
  type EdgeTableHandle,
  type EdgeTableProps,
} from './components/EdgeTable/EdgeTable'
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
  applyHeaderDefaults,
  applyHeaderState,
  defaultVisibleKeysFromColumns,
  headerSignature,
  mergeHeaderState,
  normalizeHeaderSetting,
  toHeaderState,
  toPersistableHeaders,
  visibleKeysFromHeaders,
  withVisibleOrder,
  SIMMS_HEADER_WIRE_NOTES,
  type AppliedHeaderState,
  type LegacyHeaderSetting,
  type PersistableHeaderState,
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
