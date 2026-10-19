import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ColumnDef, ColumnKey } from '../../types'
import { PlusIcon, SearchIcon } from './icons'

type AddColumnMenuProps = {
  /** 전체 칼럼. visible인 칼럼은 이미 추가됨(비활성), 숨김 칼럼만 추가 가능. 감추기는 헤더 휴지통에서. */
  columns: ColumnDef[]
  onAdd: (columnKey: ColumnKey) => void
  onReset?: () => void
}

type MenuPosition = {
  top: number
  left: number
}

export function AddColumnMenu({ columns, onAdd, onReset }: AddColumnMenuProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return columns
    return columns.filter((col) => col.label.toLowerCase().includes(q))
  }, [columns, query])

  /** from에서 step 방향으로 다음 추가 가능한(숨김) 칼럼 index. 없으면 from 유지 */
  const findAddable = (from: number, step: 1 | -1) => {
    for (let i = from + step; i >= 0 && i < filtered.length; i += step) {
      if (!filtered[i].visible) return i
    }
    return from
  }

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
      setActiveIndex(findAddable(-1, 1))
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, query]) // eslint-disable-line react-hooks/exhaustive-deps -- 열기/검색어 변경 시에만

  const closeMenu = () => {
    setOpen(false)
    setQuery('')
  }

  // 여러 칼럼을 연달아 추가할 수 있도록 메뉴는 열어둔다 (외부 클릭/Esc로 닫힘)
  const handleAdd = (index: number) => {
    const col = filtered[index]
    if (!col || col.visible) return
    onAdd(col.key)
    // 방금 추가한 칼럼은 비활성이 되므로 다음 추가 가능한 칼럼으로 이동
    const next = findAddable(index, 1)
    const prev = findAddable(index, -1)
    setActiveIndex(next !== index ? next : prev !== index ? prev : -1)
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
                    setActiveIndex((i) => findAddable(i, 1))
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setActiveIndex((i) => findAddable(i, -1))
                  } else if (event.key === 'Enter') {
                    event.preventDefault()
                    handleAdd(activeIndex)
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
                    disabled={col.visible}
                    title={col.visible ? '이미 표시 중인 칼럼' : undefined}
                    className={`add-column__item${index === activeIndex ? ' is-active' : ''}${col.visible ? ' is-added' : ''}`}
                    onMouseEnter={() => {
                      if (!col.visible) setActiveIndex(index)
                    }}
                    onClick={() => handleAdd(index)}
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
