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
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ADD_COLUMN_WIDTH,
  COLUMN_MIN_WIDTH,
  clampColumnWidth,
  columnSizeStyle,
  hasFixedWidth,
  resolveTableLayout,
} from '../../columnWidth'
import { getCellValue as defaultGetCellValue } from '../../getCellValue'
import { applyHeaderState, toHeaderState } from '../../headerState'
import type { ColumnDef, ColumnKey, HeaderState, PageResponse, Pageable } from '../../types'
import { AddColumnMenu } from './AddColumnMenu'
import { ColumnHeader } from './ColumnHeader'
import { EdgeTableEmpty, renderEdgeTableEmpty, type EdgeTableEmptyProps } from './EdgeTableEmpty'
import {
  computeDataColumnLeftOffsets,
  getFreezeStickyStyle,
  resolveFreezeUntilIndex,
  stickyBaseLeft,
} from './freezeColumns'
import { SortIcon, StarIcon, type SortDirection } from './icons'
import { Pagination } from './Pagination'
import { invokeCellRender, stopRowClick } from './renderCell'
import './EdgeTable.css'

/** YouTrack 행 높이 — virtualizer / CSS 와 동일하게 유지 */
const ROW_HEIGHT_PX = 40

export type EdgeTableProps<T> = {
  /** Spring Page 형태 응답. 테이블은 content를 그대로 렌더링한다. */
  data: PageResponse<T>
  /** 칼럼 정의(react_grid `header`). `render` 포함 가능. */
  columns: ColumnDef[]
  /**
   * jsGrid `onPageChange`와 동일.
   * 페이지/정렬 변경 시 pageable을 넘기며, 데이터 fetch는 부모 책임.
   */
  onPageChange?: (pageable: Pageable) => void
  /** 행 고유 키. 기본: `row.id` */
  getRowId?: (row: T, index: number) => string | number
  /** 셀 표시 문자열. 기본: `getCellValue` */
  getCellValue?: (row: T, columnKey: ColumnKey) => string
  /** 최초 표시 칼럼 키(헤더 저장 없을 때). 기본: columns 전체 */
  defaultVisibleKeys?: ColumnKey[]
  /** YouTrack형 별(즐겨찾기) 표시 여부 */
  showStar?: boolean
  /** 별표 클릭 시 해당 행 데이터와 활성 여부 전달 */
  onStarClick?: (row: T, starred: boolean) => void
  /** 체크박스 선택 변경 시 체크된 행 목록 전달 */
  onSelectionChange?: (rows: T[]) => void
  /**
   * 칼럼 추가·제거·순서 변경 시 호출 (react_grid `onHeaderSave`와 동일 HeaderState[]).
   */
  onHeaderSave?: (headers: HeaderState[]) => void | Promise<void>
  /** jsGrid `onHeaderReset` 대응 — 기본 칼럼으로 복원 후 호출 */
  onHeaderReset?: () => void | Promise<void>
  /** 저장된 헤더 상태(로드 시 순서/visible/width 복원) */
  initialHeaders?: HeaderState[] | null
  /**
   * 테이블 스크롤 영역 높이(px).
   * - 있음: 그 높이로 고정 (thead sticky + 본문 세로 스크롤)
   * - 없음: 행 수만큼 테이블 높이 증가 (세로 스크롤 없음)
   */
  maxHeight?: number
  /** content가 비었을 때 empty 영역 커스텀 (제목/설명/이미지 또는 children) */
  empty?: EdgeTableEmptyProps | ReactNode
}

function parseSort(pageable?: PageResponse<unknown>['pageable'] | Pageable): {
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

function rowsFromIds<T>(
  ids: Set<string | number>,
  rows: T[],
  getRowId: (row: T, index: number) => string | number,
): T[] {
  return rows.filter((row, index) => ids.has(getRowId(row, index)))
}

function computeVirtualOverscan(columnCount: number) {
  return Math.max(3, Math.min(12, Math.floor(480 / Math.max(columnCount, 1))))
}

function DefaultCellContent({ value }: { value: string }) {
  if (!value.trim()) return null
  return <span>{value}</span>
}

function defaultRowId<T>(row: T, index: number): string | number {
  if (row != null && typeof row === 'object' && 'id' in row) {
    const id = (row as { id: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return id
  }
  return index
}

export function EdgeTable<T>({
  data,
  columns: catalog,
  onPageChange,
  getRowId = defaultRowId,
  getCellValue = defaultGetCellValue as (row: T, columnKey: ColumnKey) => string,
  defaultVisibleKeys,
  showStar = false,
  onStarClick,
  onSelectionChange,
  onHeaderSave,
  onHeaderReset,
  initialHeaders = null,
  maxHeight,
  empty,
}: EdgeTableProps<T>) {
  const isHeightCapped = maxHeight != null && maxHeight > 0
  const isEmpty = (data.content?.length ?? 0) === 0
  const fallbackVisibleKeys = defaultVisibleKeys ?? catalog.map((col) => col.key)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setViewportWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<ColumnKey[]>(() =>
    applyHeaderState({
      columns: catalog,
      state: initialHeaders,
      fallbackVisibleKeys,
    }).visibleKeys,
  )
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    applyHeaderState({
      columns: catalog,
      state: initialHeaders,
      fallbackVisibleKeys,
    }).columnWidths,
  )
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const [starred, setStarred] = useState<Set<string | number>>(new Set())
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
      fallbackVisibleKeys,
    })
    setVisibleColumnKeys(applied.visibleKeys)
    setColumnWidths(applied.columnWidths)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialHeaders 변경 시에만
  }, [initialHeadersKey, initialHeaders])

  const columnMap = useMemo(() => {
    return new Map(
      catalog.map((col) => {
        const saved = columnWidths[col.key]
        if (hasFixedWidth(saved)) {
          return [col.key, { ...col, width: clampColumnWidth(saved) }] as const
        }
        if (hasFixedWidth(col.width)) {
          return [col.key, { ...col, width: clampColumnWidth(col.width) }] as const
        }
        const { width: _w, ...rest } = col
        return [col.key, rest] as const
      }),
    )
  }, [catalog, columnWidths])

  const visibleColumns = visibleColumnKeys
    .map((key) => columnMap.get(key))
    .filter((col): col is NonNullable<typeof col> => Boolean(col))

  /** gap % 폭은 테이블을 무한 확장시키므로 px로 확정 */
  const { columns: layoutColumns, gapWidth, tableWidth } = useMemo(
    () =>
      resolveTableLayout({
        columns: visibleColumns,
        viewportWidth,
        chromeWidth: stickyBaseLeft(showStar) + ADD_COLUMN_WIDTH,
      }),
    [visibleColumns, viewportWidth, showStar],
  )

  const gapStyle: CSSProperties = {
    width: gapWidth,
    minWidth: gapWidth,
    maxWidth: gapWidth,
    padding: 0,
  }

  const availableColumns = catalog
    .filter((col) => !visibleColumnKeys.includes(col.key))
    .map((col) => {
      const saved = columnWidths[col.key]
      if (hasFixedWidth(saved)) return { ...col, width: clampColumnWidth(saved) }
      if (hasFixedWidth(col.width)) return { ...col, width: clampColumnWidth(col.width) }
      const { width: _w, ...rest } = col
      return rest
    })

  const freezeUntilIndex = resolveFreezeUntilIndex(freezeUntilKey, visibleColumnKeys)

  useEffect(() => {
    if (freezeUntilKey != null && freezeUntilIndex == null) {
      setFreezeUntilKey(null)
    }
  }, [freezeUntilKey, freezeUntilIndex])

  const freezeLeftOffsets = useMemo(
    () => computeDataColumnLeftOffsets(layoutColumns, showStar),
    [layoutColumns, showStar],
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
    () => computeVirtualOverscan(layoutColumns.length),
    [layoutColumns.length],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- tanstack virtual (same as react_grid)
  const rowVirtualizer = useVirtualizer({
    count: pageRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: virtualOverscan,
    getItemKey: (index) => {
      const row = pageRows[index]
      return row != null ? String(getRowId(row, index)) : `idx-${index}`
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
  /* star? + check + data + gap + add — gap이 500 상한 후 남은 폭 흡수 */
  const colSpan = (showStar ? 1 : 0) + 1 + layoutColumns.length + 2

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

  const pageIds = pageRows.map((row, index) => getRowId(row, index))
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id))
    } else {
      pageIds.forEach((id) => next.add(id))
    }
    setSelected(next)
    onSelectionChange?.(rowsFromIds(next, pageRows, getRowId))
  }

  const toggleRow = (id: string | number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    onSelectionChange?.(rowsFromIds(next, pageRows, getRowId))
  }

  const toggleStar = (row: T, index: number) => {
    const id = getRowId(row, index)
    const nextStarred = !starred.has(id)
    setStarred((prev) => {
      const next = new Set(prev)
      if (nextStarred) next.add(id)
      else next.delete(id)
      return next
    })
    onStarClick?.(row, nextStarred)
  }

  const commitHeaderKeys = (nextKeys: ColumnKey[]) => {
    setVisibleColumnKeys(nextKeys)
    void onHeaderSave?.(toHeaderState(nextKeys, catalog, columnWidths))
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
      fallbackVisibleKeys,
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

  const renderCell = (column: ColumnDef, row: T, rowIndex: number) => {
    const display = getCellValue(row, column.key)
    const rendered = invokeCellRender(column.render, {
      row,
      value: display,
      columnKey: column.key,
      rowIndex,
      stopRowClick,
    })
    if (rendered != null) return rendered
    return <DefaultCellContent value={display} />
  }

  const scrollStyle = isHeightCapped
    ? ({ '--edge-table-max-height': `${maxHeight}px` } as CSSProperties)
    : undefined

  return (
    <div
      className={`edge-table-shell${altHeld ? ' is-alt-held' : ''}${isHeightCapped ? ' is-max-height' : ''}`}
    >
      {isEmpty ? (
        <div className={`edge-table-scroll${isHeightCapped ? ' is-max-height' : ''}`} style={scrollStyle}>
          {renderEdgeTableEmpty(empty)}
        </div>
      ) : (
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
          style={scrollStyle}
        >
          <table
            className="edge-table"
            style={{ width: tableWidth, minWidth: tableWidth, maxWidth: tableWidth }}
          >
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
                  {layoutColumns.map((column, dataColIndex) => {
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

                <th className="edge-table__th edge-table__th--gap" style={gapStyle} aria-hidden />

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
                const rowId = getRowId(row, virtualRow.index)
                const rowLabel = String(rowId)
                return (
                  <tr
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    className={selected.has(rowId) ? 'is-selected' : undefined}
                    style={{ height: ROW_HEIGHT_PX }}
                  >
                    {showStar ? (
                      <td className="edge-table__td edge-table__td--star">
                        <button
                          type="button"
                          className={`edge-table__star${starred.has(rowId) ? ' is-active' : ''}`}
                          aria-label={
                            starred.has(rowId) ? `${rowLabel} 별표 해제` : `${rowLabel} 별표`
                          }
                          aria-pressed={starred.has(rowId)}
                          onClick={() => toggleStar(row, virtualRow.index)}
                        >
                          <StarIcon filled={starred.has(rowId)} />
                        </button>
                      </td>
                    ) : null}
                    <td
                      className={`edge-table__td edge-table__td--check${showStar ? ' has-star' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(rowId)}
                        onChange={() => toggleRow(rowId)}
                        aria-label={`${rowLabel} 선택`}
                      />
                    </td>
                    {layoutColumns.map((column, dataColIndex) => {
                      const stickyStyle = getFreezeStickyStyle({
                        dataColIndex,
                        freezeUntilIndex,
                        leftOffsets: freezeLeftOffsets,
                        isHeader: false,
                      })
                      const colWidth = column.width ?? COLUMN_MIN_WIDTH
                      return (
                        <td
                          key={column.key}
                          className={`edge-table__td${stickyStyle ? ' is-frozen' : ''}${
                            freezeUntilIndex === dataColIndex ? ' is-freeze-edge' : ''
                          }`}
                          style={{
                            ...columnSizeStyle(colWidth),
                            ...stickyStyle,
                          }}
                        >
                          {renderCell(column, row, virtualRow.index)}
                        </td>
                      )
                    })}
                    <td className="edge-table__td edge-table__td--gap" style={gapStyle} aria-hidden />
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
      )}

      {!isEmpty ? (
        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      ) : null}
    </div>
  )
}
