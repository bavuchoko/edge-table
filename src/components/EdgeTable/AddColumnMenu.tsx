import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ColumnDef, ColumnKey } from '../../types'
import { PlusIcon, SearchIcon } from './icons'

type AddColumnMenuProps = {
  /** 전체 칼럼 (visible = 체크 여부) */
  columns: ColumnDef[]
  onToggle: (columnKey: ColumnKey) => void
  /** false면 표시 중인 마지막 칼럼은 해제 불가 */
  canRemove: boolean
  onReset?: () => void
}

type MenuPosition = {
  top: number
  left: number
}

export function AddColumnMenu({ columns, onToggle, canRemove, onReset }: AddColumnMenuProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  /** 토글 시 headers 순서(표시 → 숨김)가 바뀌어도 항목이 튀지 않도록, 열 때의 순서를 고정 */
  const [order, setOrder] = useState<ColumnKey[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ordered = useMemo(() => {
    const rank = new Map(order.map((key, i) => [key, i] as const))
    const rankOf = (key: ColumnKey) => rank.get(key) ?? order.length
    return [...columns].sort((a, b) => rankOf(a.key) - rankOf(b.key))
  }, [columns, order])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordered
    return ordered.filter((col) => col.label.toLowerCase().includes(q))
  }, [ordered, query])

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

  const isLocked = (col: ColumnDef) => col.visible && !canRemove

  // 여러 칼럼을 연달아 토글할 수 있도록 메뉴는 열어둔다 (외부 클릭/Esc로 닫힘)
  const handleToggle = (col: ColumnDef) => {
    if (isLocked(col)) return
    onToggle(col.key)
    inputRef.current?.focus()
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
        onClick={() => {
          if (!open) setOrder(columns.map((col) => col.key))
          setOpen((prev) => !prev)
        }}
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
            aria-multiselectable
            aria-label="표시할 칼럼"
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
                    handleToggle(filtered[activeIndex])
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
                  <label
                    role="option"
                    aria-selected={col.visible}
                    aria-disabled={isLocked(col) || undefined}
                    className={`add-column__item${index === activeIndex ? ' is-active' : ''}${isLocked(col) ? ' is-locked' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="add-column__label">{col.label}</span>
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={col.visible}
                      disabled={isLocked(col)}
                      onChange={() => handleToggle(col)}
                    />
                  </label>
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
