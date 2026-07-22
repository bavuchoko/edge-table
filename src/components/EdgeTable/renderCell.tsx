import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import type { CellRender, CellRenderArgs } from '../../types'

const POINTER_HANDLER_KEYS = ['onClick', 'onPointerDown', 'onMouseDown'] as const

export function stopRowClick(e: unknown) {
  const event = e as { stopPropagation?: () => void } | null
  event?.stopPropagation?.()
}

/** jsGrid: render 결과에 클릭·포인터 핸들러가 있으면 true */
export function reactNodeHasPointerHandler(node: ReactNode): boolean {
  if (node == null || typeof node === 'boolean') return false
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
    return false
  }
  if (Array.isArray(node)) {
    return node.some(reactNodeHasPointerHandler)
  }
  if (!isValidElement(node)) return false

  const props = node.props as Record<string, unknown>
  for (const key of POINTER_HANDLER_KEYS) {
    if (typeof props[key] === 'function') return true
  }
  return reactNodeHasPointerHandler(props.children as ReactNode)
}

/** react_grid VirtualRow와 동일: function | element(clone) | ReactNode */
export function invokeCellRender(
  render: CellRender | undefined,
  args: CellRenderArgs,
): ReactNode | null {
  if (render == null) return null
  if (typeof render === 'function') return render(args)
  if (isValidElement(render)) {
    return cloneElement(render as ReactElement<Record<string, unknown>>, {
      row: args.row,
      value: args.value,
      columnKey: args.columnKey,
      rowIndex: args.rowIndex,
      stopRowClick: args.stopRowClick,
    })
  }
  return render
}
