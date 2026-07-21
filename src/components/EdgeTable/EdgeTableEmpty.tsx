import { isValidElement, type ReactNode } from 'react'
import emptyIllustration from '../../assets/edge-table-empty.png'

const DEFAULT_TITLE = '데이터가 없습니다'
const DEFAULT_DESCRIPTION = '조건을 바꿔 보세요.'
const DEFAULT_SUGGESTIONS = ['필터 초기화', '다른 검색어']

export type EdgeTableEmptyProps = {
  title?: string
  description?: string
  /** 안내 목록 (불릿). 기본: 검색/필터 힌트 */
  suggestions?: string[]
  /** 커스텀 일러스트 URL. 없으면 기본 이미지 */
  imageSrc?: string
  /** 전체 교체용 슬롯 */
  children?: ReactNode
}

export function EdgeTableEmpty({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  suggestions = DEFAULT_SUGGESTIONS,
  imageSrc,
  children,
}: EdgeTableEmptyProps) {
  if (children != null) {
    return <div className="edge-table-empty">{children}</div>
  }

  return (
    <div className="edge-table-empty" role="status">
      <img
        className="edge-table-empty__art"
        src={imageSrc ?? emptyIllustration}
        alt=""
        width={420}
        height={420}
        decoding="async"
      />

      <div className="edge-table-empty__copy">
        <h2 className="edge-table-empty__title">{title}</h2>
        {description ? <p className="edge-table-empty__desc">{description}</p> : null}
        {suggestions.length > 0 ? (
          <ul className="edge-table-empty__suggestions">
            {suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

export function renderEdgeTableEmpty(empty?: EdgeTableEmptyProps | ReactNode) {
  if (empty == null) return <EdgeTableEmpty />
  if (isValidElement(empty) || typeof empty === 'string' || typeof empty === 'number') {
    return <EdgeTableEmpty>{empty}</EdgeTableEmpty>
  }
  return <EdgeTableEmpty {...(empty as EdgeTableEmptyProps)} />
}
