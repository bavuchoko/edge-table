/** @bavuchoko/edge-table — npm 패키지 진입점 */
import './components/EdgeTable/EdgeTable.css'

export { EdgeTable, type EdgeTableProps } from './components/EdgeTable/EdgeTable'
export { getCellValue } from './getCellValue'
export {
  applyHeaderState,
  normalizeHeaderSetting,
  toHeaderState,
  SIMMS_HEADER_WIRE_NOTES,
  type AppliedHeaderState,
  type LegacyHeaderSetting,
} from './headerState'
export type {
  CellRender,
  CellRenderArgs,
  ColumnDef,
  ColumnKey,
  HeaderState,
  PageResponse,
  Pageable,
} from './types'
