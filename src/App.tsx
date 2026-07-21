import { useCallback, useState } from 'react'
import { EdgeTable } from './components/EdgeTable/EdgeTable'
import {
  SIMMS_HEADER_WIRE_NOTES,
  fetchAssetPage,
  normalizeHeaderSetting,
  type Asset,
  type AssetPageResponse,
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

function App() {
  const [headers, setHeaders] = useState<HeaderState[] | null>(() => loadStoredHeaders())
  /** 실제 서비스에서는 API 응답. 여기선 fetchAssetPage로 서버 페이징/정렬을 흉내 냄 */
  const [pageData, setPageData] = useState<AssetPageResponse>(() => fetchAssetPage({ pageNumber: 0 }))

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
          + 칼럼 추가 · 정렬/페이지는 onPageChange(pageable) · 헤더 저장(localStorage)
        </p>
      </header>
      <EdgeTable
        showStar
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
