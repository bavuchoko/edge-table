import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ALL_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  applyHeaderState,
  getCellValue,
  toHeaderState,
  type Asset,
  type AssetPageResponse,
  type ColumnDef,
  type ColumnKey,
  type HeaderState,
  type Pageable,
} from '../../data/dummydata'
import { AddColumnMenu } from './AddColumnMenu'
import { ColumnHeader } from './ColumnHeader'
import {
  computeDataColumnLeftOffsets,
  getFreezeStickyStyle,
  resolveFreezeUntilIndex,
} from './freezeColumns'
import { SortIcon, StarIcon, type SortDirection } from './icons'
import { Pagination } from './Pagination'
import { invokeCellRender, stopRowClick } from './renderCell'
import './EdgeTable.css'

/** YouTrack 행 높이 — virtualizer / CSS 와 동일하게 유지 */
const ROW_HEIGHT_PX = 40

type EdgeTableProps = {
  /** Spring Page 형태 응답. 테이블은 content를 그대로 렌더링한다. */
  data: AssetPageResponse
  /**
   * jsGrid `onPageChange`와 동일.
   * 페이지/정렬 변경 시 pageable을 넘기며, 데이터 fetch는 부모 책임.
   */
  onPageChange?: (pageable: Pageable) => void
  /**
   * 칼럼 정의(react_grid `header`). `render` 포함 가능.
   * 생략 시 `ALL_COLUMNS`.
   */
  columns?: ColumnDef[]
  /** YouTrack형 별(즐겨찾기) 표시 여부 */
  showStar?: boolean
  /** 별표 클릭 시 해당 행 데이터와 활성 여부 전달 */
  onStarClick?: (row: Asset, starred: boolean) => void
  /** 체크박스 선택 변경 시 체크된 행 목록 전달 */
  onSelectionChange?: (rows: Asset[]) => void
  /**
   * 칼럼 추가·제거·순서 변경 시 호출 (react_grid `onHeaderSave`와 동일 HeaderState[]).
   */
  onHeaderSave?: (headers: HeaderState[]) => void | Promise<void>
  /** jsGrid `onHeaderReset` 대응 — 기본 칼럼으로 복원 후 호출 */
  onHeaderReset?: () => void | Promise<void>
  /** 저장된 헤더 상태(로드 시 순서/visible/width 복원) */
  initialHeaders?: HeaderState[] | null
  /**
   * 테이블 영역 최대 높이(px).
   * - 없음: 행 수만큼 높이 증가 (세로 스크롤 없음)
   * - 있음: 그 높이 안에서 thead 고정 + tbody(가상) 세로 스크롤
   */
  maxHeight?: number
}

function parseSort(pageable?: AssetPageResponse['pageable'] | Pageable): {
  key: ColumnKey | null
  direction: SortDirection | null
} {
  const token = pageable?.sort?.[0]
  if (!token) return { key: null, direction: null }
  const [key, dirRaw] = String(token).split(',')
  if (!key) return { key: null, direction: null }
  const dir = (dirRaw ?? '').toLowerCase()
  if (dir === 'desc') return { key, direction: 'desc' }
  return { key, direction: 'asc' }
}

function rowsFromIds(ids: Set<number>, rows: Asset[]): Asset[] {
  return rows.filter((row) => ids.has(row.id))
}

function computeVirtualOverscan(columnCount: number) {
  return Math.max(3, Math.min(12, Math.floor(480 / Math.max(columnCount, 1))))
}

function DefaultCellContent({ columnKey, value }: { columnKey: ColumnKey; value: string }) {
  if (!value.trim()) return null

  if (columnKey === 'assetCode') {
    return <span className="edge-table__mono">{value}</span>
  }
  if (columnKey === 'assetName') {
    return <span className="edge-table__name">{value}</span>
  }
  if (columnKey === 'operator' || columnKey === 'handler') {
    return <span className="edge-table__people">{value}</span>
  }
  return <span>{value}</span>
}

export function EdgeTable({
  data,
  onPageChange,
  columns: columnsProp,
  showStar = false,
  onStarClick,
  onSelectionChange,
  onHeaderSave,
  onHeaderReset,
  initialHeaders = null,
  maxHeight,
}: EdgeTableProps) {
  const isHeightCapped = maxHeight != null && maxHeight > 0
  const catalog = columnsProp ?? ALL_COLUMNS
  const scrollRef = useRef<HTMLDivElement>(null)

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<ColumnKey[]>(() =>
    applyHeaderState({
      columns: catalog,
      state: initialHeaders,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    }).visibleKeys,
  )
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    applyHeaderState({
      columns: catalog,
      state: initialHeaders,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    }).columnWidths,
  )
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [starred, setStarred] = useState<Set<number>>(new Set())
  const [activeKey, setActiveKey] = useState<ColumnKey | null>(null)
  /** react_grid freezeUntilIndex — 해당 칼럼 키까지 sticky */
  const [freezeUntilKey, setFreezeUntilKey] = useState<ColumnKey | null>(null)
  /** Alt 누른 동안 th 전체 hit 영역 활성화 */
  const [altHeld, setAltHeld] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setAltHeld(true)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setAltHeld(false)
    }
    const clear = () => setAltHeld(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clear)
    }
  }, [])

  const initialHeadersKey = useMemo(
    () => (initialHeaders == null ? '' : JSON.stringify(initialHeaders)),
    [initialHeaders],
  )

  useEffect(() => {
    if (!initialHeadersKey) return
    const applied = applyHeaderState({
      columns: catalog,
      state: initialHeaders,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    })
    setVisibleColumnKeys(applied.visibleKeys)
    setColumnWidths(applied.columnWidths)
    // catalog은 columns prop 참조 안정화(useMemo) 전제 — 헤더 로드 시에만 복원
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialHeaders 변경 시에만
  }, [initialHeadersKey, initialHeaders])

  const columnMap = useMemo(() => {
    return new Map(
      catalog.map((col) => {
        const width = columnWidths[col.key] ?? col.width
        return [col.key, { ...col, width }] as const
      }),
    )
  }, [catalog, columnWidths])

  const visibleColumns = visibleColumnKeys
    .map((key) => columnMap.get(key))
    .filter((col): col is NonNullable<typeof col> => Boolean(col))

  const availableColumns = catalog
    .filter((col) => !visibleColumnKeys.includes(col.key))
    .map((col) => ({ ...col, width: columnWidths[col.key] ?? col.width }))

  const freezeUntilIndex = resolveFreezeUntilIndex(freezeUntilKey, visibleColumnKeys)

  useEffect(() => {
    if (freezeUntilKey != null && freezeUntilIndex == null) {
      setFreezeUntilKey(null)
    }
  }, [freezeUntilKey, freezeUntilIndex])

  const freezeLeftOffsets = useMemo(
    () => computeDataColumnLeftOffsets(visibleColumns, showStar),
    [visibleColumns, showStar],
  )

  const handleFreezeColumn = (columnKey: ColumnKey) => {
    setFreezeUntilKey((prev) => (prev === columnKey ? null : columnKey))
  }

  const pageRows = data.content
  const page = data.number ?? data.pageable?.pageNumber ?? 0
  const pageSize = data.size ?? data.pageable?.pageSize ?? 20
  const totalPages = Math.max(1, data.totalPages ?? 1)
  const { key: sortKey, direction: sortDirection } = parseSort(data.pageable)

  const pageableBase: Pageable = useMemo(
    () => ({
      pageNumber: page,
      pageSize,
      size: pageSize,
      sort: data.pageable?.sort,
      sortDirection:
        sortDirection === 'desc' ? 'DESC' : sortDirection === 'asc' ? 'ASC' : undefined,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    }),
    [data.pageable?.sort, data.totalElements, data.totalPages, page, pageSize, sortDirection],
  )

  const virtualOverscan = useMemo(
    () => computeVirtualOverscan(visibleColumns.length),
    [visibleColumns.length],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- tanstack virtual (same as react_grid)
  const rowVirtualizer = useVirtualizer({
    count: pageRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: virtualOverscan,
    getItemKey: (index) => {
      const row = pageRows[index]
      return row?.id != null ? String(row.id) : `idx-${index}`
    },
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [page, pageSize, data.pageable?.sort?.[0]])

  const virtualItems = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1]!.end
      : 0
  const colSpan = (showStar ? 1 : 0) + 1 + visibleColumns.length + 1

  const emitPageable = (next: Pageable) => {
    onPageChange?.(next)
  }

  const toggleSort = (columnKey: ColumnKey) => {
    const same = sortKey === columnKey
    const nextDir: SortDirection = same && sortDirection === 'asc' ? 'desc' : 'asc'
    emitPageable({
      ...pageableBase,
      pageNumber: 0,
      pageSize,
      size: pageSize,
      sort: [`${columnKey},${nextDir}`],
      sortDirection: nextDir === 'desc' ? 'DESC' : 'ASC',
    })
  }

  const handlePageChange = (nextPage: number) => {
    emitPageable({
      ...pageableBase,
      pageNumber: nextPage,
      pageSize,
      size: pageSize,
    })
    setSelected(new Set())
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const pageIds = pageRows.map((row) => row.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id))
    } else {
      pageIds.forEach((id) => next.add(id))
    }
    setSelected(next)
    onSelectionChange?.(rowsFromIds(next, pageRows))
  }

  const toggleRow = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    onSelectionChange?.(rowsFromIds(next, pageRows))
  }

  const toggleStar = (row: Asset) => {
    const nextStarred = !starred.has(row.id)
    setStarred((prev) => {
      const next = new Set(prev)
      if (nextStarred) next.add(row.id)
      else next.delete(row.id)
      return next
    })
    onStarClick?.(row, nextStarred)
  }

  const commitHeaderKeys = (nextKeys: ColumnKey[]) => {
    setVisibleColumnKeys(nextKeys)
    void onHeaderSave?.(toHeaderState(nextKeys, columnWidths))
  }

  const addColumn = (columnKey: ColumnKey) => {
    if (visibleColumnKeys.includes(columnKey)) return
    commitHeaderKeys([...visibleColumnKeys, columnKey])
  }

  const removeColumn = (columnKey: ColumnKey) => {
    if (visibleColumnKeys.length <= 1) return
    commitHeaderKeys(visibleColumnKeys.filter((key) => key !== columnKey))
  }

  const resetHeaders = () => {
    const applied = applyHeaderState({
      columns: catalog,
      state: null,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    })
    setVisibleColumnKeys(applied.visibleKeys)
    setColumnWidths(applied.columnWidths)
    void onHeaderReset?.()
  }

  const onDragStart = (event: DragStartEvent) => {
    setActiveKey(String(event.active.id))
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveKey(null)
    if (!over || active.id === over.id) return

    const oldIndex = visibleColumnKeys.indexOf(String(active.id))
    const newIndex = visibleColumnKeys.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    commitHeaderKeys(arrayMove(visibleColumnKeys, oldIndex, newIndex))
  }

  const activeColumn = activeKey ? columnMap.get(activeKey) : null

  const renderCell = (column: ColumnDef, row: Asset, rowIndex: number) => {
    const display = getCellValue(row, column.key)
    const rendered = invokeCellRender(column.render, {
      row,
      value: display,
      columnKey: column.key,
      rowIndex,
      stopRowClick,
    })
    if (rendered != null) return rendered
    return <DefaultCellContent columnKey={column.key} value={display} />
  }

  return (
    <div className={`edge-table-shell${altHeld ? ' is-alt-held' : ''}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveKey(null)}
      >
        <div
          ref={scrollRef}
          className={`edge-table-scroll${isHeightCapped ? ' is-max-height' : ''}`}
          style={
            isHeightCapped
              ? ({ '--edge-table-max-height': `${maxHeight}px` } as CSSProperties)
              : undefined
          }
        >
          <table className="edge-table">
            <thead>
              <tr>
                {showStar ? (
                  <th className="edge-table__th edge-table__th--star" scope="col" aria-label="별표" />
                ) : null}
                <th
                  className={`edge-table__th edge-table__th--check${showStar ? ' has-star' : ''}`}
                  scope="col"
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="전체 선택"
                  />
                </th>

                <SortableContext items={visibleColumnKeys} strategy={horizontalListSortingStrategy}>
                  {visibleColumns.map((column, dataColIndex) => {
                    const stickyStyle = getFreezeStickyStyle({
                      dataColIndex,
                      freezeUntilIndex,
                      leftOffsets: freezeLeftOffsets,
                      isHeader: true,
                    })
                    return (
                      <ColumnHeader
                        key={column.key}
                        column={column}
                        onRemove={removeColumn}
                        canRemove={visibleColumnKeys.length > 1}
                        sortDirection={sortKey === column.key ? sortDirection : null}
                        onSort={toggleSort}
                        onFreeze={handleFreezeColumn}
                        stickyStyle={stickyStyle}
                        isFrozen={stickyStyle != null}
                        isFreezeEdge={freezeUntilIndex === dataColIndex}
                      />
                    )
                  })}
                </SortableContext>

                <th className="edge-table__th edge-table__th--add" scope="col">
                  <AddColumnMenu
                    availableColumns={availableColumns}
                    onAdd={addColumn}
                    onReset={onHeaderReset ? resetHeaders : undefined}
                  />
                </th>
              </tr>
            </thead>

            <tbody>
              {paddingTop > 0 ? (
                <tr className="edge-table__virtual-spacer" aria-hidden>
                  <td colSpan={colSpan} style={{ height: paddingTop }} />
                </tr>
              ) : null}

              {virtualItems.map((virtualRow) => {
                const row = pageRows[virtualRow.index]
                if (!row) return null
                return (
                  <tr
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    className={selected.has(row.id) ? 'is-selected' : undefined}
                    style={{ height: ROW_HEIGHT_PX }}
                  >
                    {showStar ? (
                      <td className="edge-table__td edge-table__td--star">
                        <button
                          type="button"
                          className={`edge-table__star${starred.has(row.id) ? ' is-active' : ''}`}
                          aria-label={
                            starred.has(row.id)
                              ? `${row.assetName ?? row.id} 별표 해제`
                              : `${row.assetName ?? row.id} 별표`
                          }
                          aria-pressed={starred.has(row.id)}
                          onClick={() => toggleStar(row)}
                        >
                          <StarIcon filled={starred.has(row.id)} />
                        </button>
                      </td>
                    ) : null}
                    <td
                      className={`edge-table__td edge-table__td--check${showStar ? ' has-star' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`${row.assetName ?? row.id} 선택`}
                      />
                    </td>
                    {visibleColumns.map((column, dataColIndex) => {
                      const stickyStyle = getFreezeStickyStyle({
                        dataColIndex,
                        freezeUntilIndex,
                        leftOffsets: freezeLeftOffsets,
                        isHeader: false,
                      })
                      return (
                        <td
                          key={column.key}
                          className={`edge-table__td${stickyStyle ? ' is-frozen' : ''}${
                            freezeUntilIndex === dataColIndex ? ' is-freeze-edge' : ''
                          }`}
                          style={{
                            width: column.width,
                            minWidth: column.width,
                            maxWidth: column.width,
                            ...stickyStyle,
                          }}
                        >
                          {renderCell(column, row, virtualRow.index)}
                        </td>
                      )
                    })}
                    <td className="edge-table__td edge-table__td--add" />
                  </tr>
                )
              })}

              {paddingBottom > 0 ? (
                <tr className="edge-table__virtual-spacer" aria-hidden>
                  <td colSpan={colSpan} style={{ height: paddingBottom }} />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeColumn ? (
            <div className="edge-table__drag-overlay">
              <span className="edge-table__th-label">
                {activeColumn.label}
                <span className="edge-table__sort" aria-hidden>
                  <SortIcon direction={null} />
                </span>
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
    </div>
  )
}
