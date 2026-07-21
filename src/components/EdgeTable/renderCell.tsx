import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import type { CellRender, CellRenderArgs } from '../../data/dummydata'

export function stopRowClick(e: unknown) {
  const event = e as { stopPropagation?: () => void } | null
  event?.stopPropagation?.()
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
