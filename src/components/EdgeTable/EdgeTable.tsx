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
import { useEffect, useMemo, useState } from 'react'
import {
  ALL_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  applyHeaderState,
  getCellValue,
  toHeaderState,
  type Asset,
  type AssetPageResponse,
  type ColumnKey,
  type HeaderState,
  type Pageable,
} from '../../data/dummydata'
import { AddColumnMenu } from './AddColumnMenu'
import { ColumnHeader } from './ColumnHeader'
import { SortIcon, StarIcon, type SortDirection } from './icons'
import { Pagination } from './Pagination'
import './EdgeTable.css'

type EdgeTableProps = {
  /** Spring Page 형태 응답. 테이블은 content를 그대로 렌더링한다. */
  data: AssetPageResponse
  /**
   * jsGrid `onPageChange`와 동일.
   * 페이지/정렬 변경 시 pageable을 넘기며, 데이터 fetch는 부모 책임.
   */
  onPageChange?: (pageable: Pageable) => void
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

function CellContent({ columnKey, value }: { columnKey: ColumnKey; value: string }) {
  if (!value.trim()) {
    return null
  }

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
  showStar = false,
  onStarClick,
  onSelectionChange,
  onHeaderSave,
  onHeaderReset,
  initialHeaders = null,
}: EdgeTableProps) {
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<ColumnKey[]>(() =>
    applyHeaderState({
      columns: ALL_COLUMNS,
      state: initialHeaders,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    }).visibleKeys,
  )
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    applyHeaderState({
      columns: ALL_COLUMNS,
      state: initialHeaders,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    }).columnWidths,
  )
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [starred, setStarred] = useState<Set<number>>(new Set())
  const [activeKey, setActiveKey] = useState<ColumnKey | null>(null)

  const initialHeadersKey = useMemo(
    () => (initialHeaders == null ? '' : JSON.stringify(initialHeaders)),
    [initialHeaders],
  )

  useEffect(() => {
    if (!initialHeadersKey) return
    const applied = applyHeaderState({
      columns: ALL_COLUMNS,
      state: initialHeaders,
      fallbackVisibleKeys: DEFAULT_VISIBLE_COLUMNS,
    })
    setVisibleColumnKeys(applied.visibleKeys)
    setColumnWidths(applied.columnWidths)
  }, [initialHeadersKey, initialHeaders])

  const columnMap = useMemo(() => {
    return new Map(
      ALL_COLUMNS.map((col) => {
        const width = columnWidths[col.key] ?? col.width
        return [col.key, { ...col, width }] as const
      }),
    )
  }, [columnWidths])

  const visibleColumns = visibleColumnKeys
    .map((key) => columnMap.get(key))
    .filter((col): col is NonNullable<typeof col> => Boolean(col))

  const availableColumns = ALL_COLUMNS.filter((col) => !visibleColumnKeys.includes(col.key)).map(
    (col) => ({ ...col, width: columnWidths[col.key] ?? col.width }),
  )

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
      columns: ALL_COLUMNS,
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

  return (
    <div className="edge-table-shell">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveKey(null)}
      >
        <div className="edge-table-scroll">
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
                  {visibleColumns.map((column) => (
                    <ColumnHeader
                      key={column.key}
                      column={column}
                      onRemove={removeColumn}
                      canRemove={visibleColumnKeys.length > 1}
                      sortDirection={sortKey === column.key ? sortDirection : null}
                      onSort={toggleSort}
                    />
                  ))}
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
              {pageRows.map((row) => (
                <tr key={row.id} className={selected.has(row.id) ? 'is-selected' : undefined}>
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
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="edge-table__td"
                      style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
                    >
                      <CellContent
                        columnKey={column.key}
                        value={getCellValue(row, column.key)}
                      />
                    </td>
                  ))}
                  <td className="edge-table__td edge-table__td--add" />
                </tr>
              ))}
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
