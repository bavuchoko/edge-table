import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import type { ColumnDef, ColumnKey } from '../../data/dummydata'
import { DragHandleIcon, SortIcon, TrashIcon, type SortDirection } from './icons'

type ColumnHeaderProps = {
  column: ColumnDef
  onRemove: (columnKey: ColumnKey) => void
  canRemove: boolean
  sortDirection?: SortDirection | null
  onSort?: (columnKey: ColumnKey) => void
}

export function ColumnHeader({
  column,
  onRemove,
  canRemove,
  sortDirection = null,
  onSort,
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
    zIndex: isDragging ? 2 : undefined,
    position: 'relative',
    width: column.width,
    minWidth: column.width,
    maxWidth: column.width,
  }

  const isSorted = Boolean(sortDirection)

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`edge-table__th${isDragging ? ' is-dragging' : ''}${isSorted ? ' is-sorted' : ''}`}
      scope="col"
      aria-sort={
        sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'
      }
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
          onClick={() => onSort?.(column.key)}
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
