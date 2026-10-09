import { useCallback, useEffect, useRef } from 'react'
import { scrollIndexFor } from './lineModel'

export interface FocusOffsetInput {
  /** File line number to bring into view. */
  line: number
  startLine: number
  count: number
  rowHeight: number
  /** `undefined` when nothing scrolls (no height cap, or wrapped rows of unknown height). */
  viewport?: number
  /** The scroller's current offset. Default 0. */
  offset?: number
}

/** The offset that shows the line: unchanged when it is fully visible, otherwise centred on it. */
export function focusOffset({
  line,
  startLine,
  count,
  rowHeight,
  viewport,
  offset = 0,
}: FocusOffsetInput): number {
  if (viewport === undefined || count === 0) return offset
  const top = scrollIndexFor(line, startLine, count) * rowHeight
  if (top >= offset && top + rowHeight <= offset + viewport) return offset
  const max = Math.max(0, count * rowHeight - viewport)
  return Math.min(Math.max(top - (viewport - rowHeight) / 2, 0), max)
}

export interface UseFocusLineOptions extends Omit<FocusOffsetInput, 'line' | 'offset'> {
  focusLine?: number
  /** Moves the scroller. */
  scrollTo: (offset: number) => void
}

export interface FocusLineState {
  /** Scrolls a file line into view; `focusLine` and the gutter's active line both come here. */
  revealLine: (line: number) => void
  /** Records the scroller's real offset from its scroll events. */
  trackOffset: (offset: number) => void
}

/** `focusLine` as a one-way scroll command, on mount and on change. */
export function useFocusLine({
  focusLine,
  startLine,
  count,
  rowHeight,
  viewport,
  scrollTo,
}: UseFocusLineOptions): FocusLineState {
  const offsetRef = useRef(0)
  const revealLine = useCallback(
    (line: number) => {
      const offset = offsetRef.current
      const next = focusOffset({ line, startLine, count, rowHeight, viewport, offset })
      if (next === offset) return
      offsetRef.current = next
      scrollTo(next)
    },
    [count, rowHeight, scrollTo, startLine, viewport]
  )
  const revealRef = useRef(revealLine)
  useEffect(() => {
    revealRef.current = revealLine
  }, [revealLine])
  // Keyed on the command alone: a re-render with the same `focusLine` must not undo a user scroll.
  useEffect(() => {
    if (focusLine !== undefined) revealRef.current(focusLine)
  }, [focusLine])
  const trackOffset = useCallback((offset: number) => {
    offsetRef.current = offset
  }, [])
  return { revealLine, trackOffset }
}
