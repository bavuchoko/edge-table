import { useCallback, useMemo, useState } from 'react'
import { EdgeTable } from './components/EdgeTable/EdgeTable'
import {
  ALL_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  SIMMS_HEADER_WIRE_NOTES,
  fetchAssetPage,
  getCellValue,
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

function loadStoredHeaders(columns: ColumnDef[]): HeaderState[] | null {
  try {
    const raw = localStorage.getItem(HEADER_STORAGE_KEY)
    if (!raw) return null
    return normalizeHeaderSetting(JSON.parse(raw), columns)
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
  const columns = useMemo<ColumnDef[]>(
    () =>
      ALL_COLUMNS.map((col) => {
        if (col.key === 'assetCode') return { ...col, render: renderAssetCode }
        if (col.key === 'assetName') {
          return {
            ...col,
            render: ({ value }: CellRenderArgs) => {
              const text = value == null ? '' : String(value)
              if (!text.trim()) return null
              return <span className="edge-table__name">{text}</span>
            },
          }
        }
        if (col.key === 'operator' || col.key === 'handler') {
          return {
            ...col,
            render: ({ value }: CellRenderArgs) => {
              const text = value == null ? '' : String(value)
              if (!text.trim()) return null
              return <span className="edge-table__people">{text}</span>
            },
          }
        }
        return col
      }),
    [],
  )

  const [headers, setHeaders] = useState<HeaderState[] | null>(() => loadStoredHeaders(ALL_COLUMNS))
  const [pageData, setPageData] = useState<AssetPageResponse>(() => fetchAssetPage({ pageNumber: 0 }))

  const handleStarClick = (row: Asset, starred: boolean) => {
    console.log('onStarClick', { starred, row })
  }

  const handleRowClick = useCallback((row: Asset) => {
    console.log('onRowClick', row)
  }, [])

  const handleSelectionChange = (rows: Asset[]) => {
    console.log('onSelectionChange', rows)
  }

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
          maxHeight 있으면 고정+스크롤 · 없으면 행만큼 높이 증가 · Alt+틀고정
        </p>
      </header>
      <EdgeTable<Asset>
        showStar
        // maxHeight={480}
        columns={columns}
        data={pageData}
        defaultVisibleKeys={DEFAULT_VISIBLE_COLUMNS}
        getCellValue={getCellValue}
        initialHeaders={headers}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        onStarClick={handleStarClick}
        onSelectionChange={handleSelectionChange}
        onHeaderSave={handleHeaderSave}
        onHeaderReset={handleHeaderReset}
      />
    </main>
  )
}

export default App
