type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

function buildPageItems(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i)
  }

  const items: Array<number | 'ellipsis'> = []
  const windowStart = Math.max(0, Math.min(page - 2, totalPages - 5))
  const windowEnd = Math.min(totalPages - 1, windowStart + 4)

  for (let i = windowStart; i <= windowEnd; i++) items.push(i)

  if (windowEnd < totalPages - 1) items.push('ellipsis')

  return items
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const items = buildPageItems(page, totalPages)
  const isFirst = page <= 0
  const isLast = page >= totalPages - 1

  return (
    <nav className="edge-pagination" aria-label="페이지 탐색">
      <div className="edge-pagination__nav">
        <button
          type="button"
          className="edge-pagination__text-link"
          disabled={isFirst}
          onClick={() => onChange(page - 1)}
        >
          &lt; Previous
        </button>
        <button
          type="button"
          className="edge-pagination__text-link is-accent"
          disabled={isLast}
          onClick={() => onChange(page + 1)}
        >
          Next page &gt;
        </button>
      </div>

      <div className="edge-pagination__controls">
        <div className="edge-pagination__pages" role="list">
          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`e-${index}`} className="edge-pagination__ellipsis" role="presentation">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                role="listitem"
                className={`edge-pagination__page${item === page ? ' is-active' : ''}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
              >
                {item + 1}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="edge-pagination__last"
          disabled={isLast}
          onClick={() => onChange(totalPages - 1)}
        >
          Last page
        </button>
      </div>
    </nav>
  )
}
