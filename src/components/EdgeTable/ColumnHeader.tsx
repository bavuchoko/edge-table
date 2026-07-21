import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, MouseEvent } from 'react'
import type { ColumnDef, ColumnKey } from '../../data/dummydata'
import { DragHandleIcon, SortIcon, TrashIcon, type SortDirection } from './icons'

type ColumnHeaderProps = {
  column: ColumnDef
  onRemove: (columnKey: ColumnKey) => void
  canRemove: boolean
  sortDirection?: SortDirection | null
  onSort?: (columnKey: ColumnKey) => void
  /** react_grid: Alt+클릭 시 해당 칼럼까지 틀 고정 토글 (th 전체 영역) */
  onFreeze?: (columnKey: ColumnKey) => void
  stickyStyle?: CSSProperties
  isFrozen?: boolean
  isFreezeEdge?: boolean
}

export function ColumnHeader({
  column,
  onRemove,
  canRemove,
  sortDirection = null,
  onSort,
  onFreeze,
  stickyStyle,
  isFrozen = false,
  isFreezeEdge = false,
}: ColumnHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : undefined,
    width: column.width,
    minWidth: column.width,
    maxWidth: column.width,
    ...stickyStyle,
    zIndex: isDragging ? 6 : stickyStyle?.zIndex,
    position: stickyStyle?.position ?? 'relative',
  }

  const isSorted = Boolean(sortDirection)

  const handleThClick = (event: MouseEvent<HTMLTableCellElement>) => {
    if (!event.altKey || !onFreeze) return
    event.preventDefault()
    onFreeze(column.key)
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`edge-table__th${isDragging ? ' is-dragging' : ''}${isSorted ? ' is-sorted' : ''}${
        isFrozen ? ' is-frozen' : ''
      }${isFreezeEdge ? ' is-freeze-edge' : ''}`}
      scope="col"
      aria-sort={
        sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'
      }
      onClick={handleThClick}
    >
      <div className="edge-table__th-inner">
        <button
          type="button"
          className="edge-table__drag"
          ref={setActivatorNodeRef}
          aria-label={`${column.label} 칼럼 순서 변경`}
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon />
        </button>

        <button
          type="button"
          className="edge-table__th-label"
          onClick={(event) => {
            // Alt+클릭은 th에서 처리 (버블)
            if (event.altKey) return
            event.stopPropagation()
            onSort?.(column.key)
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {column.label}
          <span className={`edge-table__sort${isSorted ? ' is-active' : ''}`} aria-hidden>
            <SortIcon direction={sortDirection} />
          </span>
        </button>

        {canRemove && (
          <button
            type="button"
            className="edge-table__trash"
            aria-label={`${column.label} 칼럼 제외`}
            onClick={(event) => {
              event.stopPropagation()
              onRemove(column.key)
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </th>
  )
}
