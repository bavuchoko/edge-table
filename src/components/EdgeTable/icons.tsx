export function DragHandleIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
      <circle cx="3" cy="2.5" r="1.1" />
      <circle cx="7" cy="2.5" r="1.1" />
      <circle cx="3" cy="7" r="1.1" />
      <circle cx="7" cy="7" r="1.1" />
      <circle cx="3" cy="11.5" r="1.1" />
      <circle cx="7" cy="11.5" r="1.1" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12zM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type SortDirection = 'asc' | 'desc'

/** 미정렬: 쌍방향 / ASC: 위쪽 화살표 / DESC: 아래쪽 화살표 */
export function SortIcon({ direction }: { direction?: SortDirection | null }) {
  if (direction === 'asc') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="currentColor"
        aria-hidden
      >
        <g transform="rotate(180 5 5)">
          <polygon points="5 7.99 1.5 4.5 2.5 3.5 5 6.01 7.5 3.5 8.49 4.5 5 7.99" />
        </g>
      </svg>
    )
  }

  if (direction === 'desc') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="currentColor"
        aria-hidden
      >
        <polygon points="5 7.99 1.5 4.5 2.5 3.5 5 6.01 7.5 3.5 8.49 4.5 5 7.99" />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="currentColor"
      aria-hidden
    >
      <path d="M5,8,3,6,2,7l3,3L8,7,7,6ZM5,2,7,4,8,3,5,0,2,3,3,4Z" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.632.375c.346 0 .625.28.625.625v12.8a.625.625 0 1 1-1.25 0V1c0-.345.28-.625.625-.625Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M1.002 7.625c0-.345.28-.625.625-.625h12.204a.625.625 0 1 1 0 1.25H1.627a.625.625 0 0 1-.625-.625Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function UserPlaceholderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 3.6 14.4 9l5.9.5-4.5 3.9 1.4 5.7L12 16.8 6.8 19.1l1.4-5.7-4.5-3.9L9.6 9 12 3.6Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
