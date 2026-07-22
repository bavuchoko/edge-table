import { useCallback, useMemo, useRef, useState } from 'react'
import { EdgeTable, type EdgeTableHandle } from './components/EdgeTable/EdgeTable'
import {
  ASSET_LIST_HEADER,
  SIMMS_HEADER_WIRE_NOTES,
  applyHeaderDefaults,
  fetchAssetPage,
  normalizeHeaderSetting,
  toPersistableHeaders,
  type Asset,
  type AssetPageResponse,
  type CellRenderArgs,
  type HeaderState,
  type Pageable,
} from './data/dummydata'
import './App.css'

const HEADER_STORAGE_KEY = 'edge-table.headers.asset'

function withDemoRenders(headers: HeaderState[]): HeaderState[] {
  return headers.map((col) => {
    if (col.key === 'assetCode') {
      return {
        ...col,
        render: ({ value, stopRowClick }: CellRenderArgs) => {
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
        },
      }
    }
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
  })
}

function loadHeaders(base: HeaderState[]): HeaderState[] {
  try {
    const raw = localStorage.getItem(HEADER_STORAGE_KEY)
    if (!raw) return applyHeaderDefaults(base)
    return normalizeHeaderSetting(JSON.parse(raw), base) ?? applyHeaderDefaults(base)
  } catch {
    return applyHeaderDefaults(base)
  }
}

function App() {
  const tableRef = useRef<EdgeTableHandle<Asset>>(null)
  const baseHeaders = useMemo(() => withDemoRenders(ASSET_LIST_HEADER), [])
  const [headers, setHeaders] = useState<HeaderState[]>(() => loadHeaders(baseHeaders))
  const [pageData, setPageData] = useState<AssetPageResponse>(() => fetchAssetPage({ pageNumber: 0 }))

  const handleStarClick = (row: Asset, starred: boolean) => {
    console.log('onStarClick', { starred, row })
  }

  const handleRowClick = useCallback((row: Asset) => {
    console.log('onRowClick', row)
  }, [])

  const handlePageChange = useCallback((pageable: Pageable) => {
    console.log('onPageChange', pageable)
    setPageData(fetchAssetPage(pageable))
  }, [])

  const handleHeaderSave = useCallback((next: HeaderState[]) => {
    console.log('onHeaderSave', next)
    localStorage.setItem(HEADER_STORAGE_KEY, JSON.stringify(toPersistableHeaders(next)))
    setHeaders(next)
  }, [])

  const handleHeaderReset = useCallback(() => {
    console.log('onHeaderReset', SIMMS_HEADER_WIRE_NOTES)
    localStorage.removeItem(HEADER_STORAGE_KEY)
    setHeaders(applyHeaderDefaults(baseHeaders))
  }, [baseHeaders])

  return (
    <main className="app">
      <header className="app__header">
        <h1>자산 목록</h1>
        <p>
          maxHeight 있으면 고정+스크롤 · 없으면 행만큼 높이 증가 · Alt+틀고정
          {' · '}
          <button
            type="button"
            onClick={() => console.log('getChecked', tableRef.current?.getChecked())}
          >
            getChecked
          </button>
        </p>
      </header>
      <EdgeTable
        ref={tableRef}
        showStar
        // maxHeight={480}
        data={pageData}
        header={headers}
        onHeaderChanged={handleHeaderSave}
        onHeaderReset={handleHeaderReset}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        onStarClick={handleStarClick}
      />
    </main>
  )
}

export default App
