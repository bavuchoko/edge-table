import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ColumnDef, ColumnKey } from '../../data/dummydata'
import { PlusIcon, SearchIcon } from './icons'

type AddColumnMenuProps = {
  availableColumns: ColumnDef[]
  onAdd: (columnKey: ColumnKey) => void
  onReset?: () => void
}

type MenuPosition = {
  top: number
  left: number
}

export function AddColumnMenu({ availableColumns, onAdd, onReset }: AddColumnMenuProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return availableColumns
    return availableColumns.filter((col) => col.label.toLowerCase().includes(q))
  }, [availableColumns, query])

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const menuWidth = 260
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    )

    setPosition({
      top: rect.bottom + 6,
      left,
    })
  }

  useEffect(() => {
    if (!open) return

    updatePosition()

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
      setQuery('')
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }

    const onReposition = () => updatePosition()

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, query])

  const closeMenu = () => {
    setOpen(false)
    setQuery('')
  }

  const handleSelect = (columnKey: ColumnKey) => {
    onAdd(columnKey)
    closeMenu()
  }

  const handleReset = () => {
    onReset?.()
    closeMenu()
  }

  return (
    <div className="add-column">
      <button
        ref={triggerRef}
        type="button"
        className={`add-column__trigger${open ? ' is-open' : ''}`}
        aria-label="칼럼 추가"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <PlusIcon />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="add-column__menu"
            role="listbox"
            aria-label="추가 가능한 칼럼"
            style={{ top: position.top, left: position.left }}
          >
            <div className="add-column__search">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                placeholder="Filter items"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setActiveIndex((i) => Math.max(i - 1, 0))
                  } else if (event.key === 'Enter' && filtered[activeIndex]) {
                    event.preventDefault()
                    handleSelect(filtered[activeIndex].key)
                  }
                }}
              />
            </div>
            <ul className="add-column__list">
              {filtered.length === 0 && (
                <li className="add-column__empty">일치하는 칼럼 없음</li>
              )}
              {filtered.map((col, index) => (
                <li key={col.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`add-column__item${index === activeIndex ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(col.key)}
                  >
                    {col.label}
                  </button>
                </li>
              ))}
            </ul>
            {onReset ? (
              <div className="add-column__footer">
                <button type="button" className="add-column__reset" onClick={handleReset}>
                  칼럼 초기화
                </button>
              </div>
            ) : null}
          </div>,
          document.body,
        )}
    </div>
  )
}
