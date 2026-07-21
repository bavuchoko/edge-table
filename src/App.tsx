import { useCallback, useMemo, useState } from 'react'
import { EdgeTable } from './components/EdgeTable/EdgeTable'
import {
  ALL_COLUMNS,
  SIMMS_HEADER_WIRE_NOTES,
  fetchAssetPage,
  normalizeHeaderSetting,
  type Asset,
  type AssetPageResponse,
  type CellRenderArgs,
  type ColumnDef,
  type HeaderState,
  type Pageable,
} from './data/dummydata'
import './App.css'

const HEADER_STORAGE_KEY = 'edge-table.headers.asset'

function loadStoredHeaders(): HeaderState[] | null {
  try {
    const raw = localStorage.getItem(HEADER_STORAGE_KEY)
    if (!raw) return null
    return normalizeHeaderSetting(JSON.parse(raw))
  } catch {
    return null
  }
}

/** react_grid Header.render 데모 — 자산코드를 링크로 */
function renderAssetCode({ value, stopRowClick }: CellRenderArgs) {
  const text = value == null ? '' : String(value)
  if (!text.trim()) return null
  return (
    <button
      type="button"
      className="edge-table__mono"
      style={{
        padding: 0,
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        font: 'inherit',
      }}
      onClick={(e) => {
        stopRowClick(e)
        console.log('assetCode click', text)
      }}
    >
      {text}
    </button>
  )
}

function App() {
  const [headers, setHeaders] = useState<HeaderState[] | null>(() => loadStoredHeaders())
  /** 실제 서비스에서는 API 응답. 여기선 fetchAssetPage로 서버 페이징/정렬을 흉내 냄 */
  const [pageData, setPageData] = useState<AssetPageResponse>(() => fetchAssetPage({ pageNumber: 0 }))

  const columns = useMemo<ColumnDef[]>(
    () =>
      ALL_COLUMNS.map((col) =>
        col.key === 'assetCode' ? { ...col, render: renderAssetCode } : col,
      ),
    [],
  )

  const handleStarClick = (row: Asset, starred: boolean) => {
    console.log('onStarClick', { starred, row })
  }

  const handleSelectionChange = (rows: Asset[]) => {
    console.log('onSelectionChange', rows)
  }

  /**
   * jsGrid / SIMMS30:
   * onPageChange={handleGridPageChange}
   * → parseJsGridPageable → fetchData(search, pageNumber, size, sort, desc)
   */
  const handlePageChange = useCallback((pageable: Pageable) => {
    console.log('onPageChange', pageable)
    setPageData(fetchAssetPage(pageable))
  }, [])

  const handleHeaderSave = useCallback((next: HeaderState[]) => {
    console.log('onHeaderSave', next)
    localStorage.setItem(HEADER_STORAGE_KEY, JSON.stringify(next))
    setHeaders(next)
  }, [])

  const handleHeaderReset = useCallback(() => {
    console.log('onHeaderReset', SIMMS_HEADER_WIRE_NOTES)
    localStorage.removeItem(HEADER_STORAGE_KEY)
    setHeaders(null)
  }, [])

  return (
    <main className="app">
      <header className="app__header">
        <h1>자산 목록</h1>
        <p>
          maxHeight 시 th 고정·본문 스크롤 · Alt+헤더 틀고정 · render · onPageChange
        </p>
      </header>
      <EdgeTable
        showStar
        maxHeight={480}
        columns={columns}
        data={pageData}
        initialHeaders={headers}
        onPageChange={handlePageChange}
        onStarClick={handleStarClick}
        onSelectionChange={handleSelectionChange}
        onHeaderSave={handleHeaderSave}
        onHeaderReset={handleHeaderReset}
      />
    </main>
  )
}

export default App
