import { useMemo, useState } from 'react'
import { computeWindow, type FixedWindow } from '../../../utils/fixed-window'

/** Windowing turns on above this many lines, and never with `wrap`. */
export const WINDOWING_THRESHOLD = 500
const DEFAULT_OVERSCAN = 10

export interface LineWindowInput {
  count: number
  rowHeight: number
  /** Viewport height in px. */
  viewport: number
  offset: number
  isWindowed: boolean
  /** Row index of the gutter's active line, which must stay mounted for `aria-activedescendant`. */
  pinnedIndex: number | null
  overscan?: number
}

export interface LineWindow extends FixedWindow {
  /** The pinned row when it lies outside `start..end`, where the shell mounts it on its own. */
  pinnedOutside: number | null
}

/** Without windowing every row renders; with it, `computeWindow` picks the rows. */
export function computeLineWindow({
  count,
  rowHeight,
  viewport,
  offset,
  isWindowed,
  pinnedIndex,
  overscan = DEFAULT_OVERSCAN,
}: LineWindowInput): LineWindow {
  const window = isWindowed
    ? computeWindow({ offset, viewport, itemSize: rowHeight, count, overscan })
    : { start: 0, end: count, padBefore: 0, padAfter: 0 }
  const isPinnable = pinnedIndex !== null && pinnedIndex >= 0 && pinnedIndex < count
  const isInside = isPinnable && pinnedIndex >= window.start && pinnedIndex < window.end
  return { ...window, pinnedOutside: isPinnable && !isInside ? pinnedIndex : null }
}

/** Every row index the shell mounts: the window in order, then the pinned row if it is outside. */
export function windowRows({ start, end, pinnedOutside }: LineWindow): number[] {
  const rows = Array.from({ length: end - start }, (_, i) => start + i)
  return pinnedOutside === null ? rows : [...rows, pinnedOutside]
}

export interface UseLineWindowOptions extends Omit<LineWindowInput, 'offset'> {
  /** The offset of the first render, so a `focusLine` row is windowed before any scroll event. */
  initialOffset?: number | (() => number)
}

export interface LineWindowState {
  window: LineWindow
  /** Reports the scroller's vertical offset. */
  setOffset: (offset: number) => void
}

/** A thin wrapper over `computeWindow` that also keeps the active row mounted. */
export function useLineWindow({
  count,
  rowHeight,
  viewport,
  isWindowed,
  pinnedIndex,
  overscan,
  initialOffset = 0,
}: UseLineWindowOptions): LineWindowState {
  const [offset, setOffset] = useState(initialOffset)
  const window = useMemo(
    () =>
      computeLineWindow({ count, rowHeight, viewport, offset, isWindowed, pinnedIndex, overscan }),
    [count, rowHeight, viewport, offset, isWindowed, pinnedIndex, overscan]
  )
  return { window, setOffset }
}
