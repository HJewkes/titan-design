import { useCallback, useMemo, useRef, useState } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'
import { buildLineModel } from './lineModel'
import type { LineRange, LineRangeState, UseLineRangeOptions } from './types'

const NO_HIGHLIGHTS: LineRange[] = []

const clampLine = (line: number, first: number, last: number) =>
  Math.min(Math.max(line, first), Math.max(last, first))

// Keyed by value, so a consumer passing a fresh but equal `highlights` array keeps the same model.
function useModel(
  text: string,
  startLine: number,
  endLine: number | undefined,
  highlights: LineRange[]
) {
  const highlightsKey = JSON.stringify(highlights)
  return useMemo(
    () =>
      buildLineModel({
        text,
        startLine,
        endLine,
        highlights: JSON.parse(highlightsKey) as LineRange[],
      }),
    [text, startLine, endLine, highlightsKey]
  )
}

// The remembered anchor holds only while it is an end of the selection; a parent may replace a
// controlled selection, and extending from a stale anchor would select lines nobody picked.
function anchorFor(remembered: number | null, selection: LineRange | null, activeLine: number) {
  if (!selection) return activeLine
  const isEnd = remembered === selection.startLine || remembered === selection.endLine
  return isEnd && remembered !== null ? remembered : selection.startLine
}

/** The CodeViewer line model plus the gutter's controlled or uncontrolled line selection. */
export function useLineRange({
  text,
  startLine = 1,
  endLine,
  highlights = NO_HIGHLIGHTS,
  selectedRange: selectedProp,
  defaultSelectedRange = null,
  onSelectedRangeChange,
  isDisabled = false,
}: UseLineRangeOptions): LineRangeState {
  const model = useModel(text, startLine, endLine, highlights)
  const [selectedRange, setSelectedRange] = useControllableState<LineRange | null>({
    value: selectedProp,
    defaultValue: defaultSelectedRange,
    onChange: onSelectedRangeChange,
  })
  const clamp = useCallback(
    (line: number) => clampLine(line, model.startLine, model.lastLine),
    [model.startLine, model.lastLine]
  )
  const [rawActive, setRawActive] = useState(() => selectedRange?.startLine ?? model.startLine)
  const activeLine = clamp(rawActive)
  const anchorRef = useRef<number | null>(null)
  // With no lines there is nothing to select; startLine would be a line that does not exist.
  const isInert = isDisabled || model.lines.length === 0

  const moveActiveTo = useCallback(
    (line: number) => {
      if (!isInert) setRawActive(clamp(line))
    },
    [clamp, isInert]
  )
  const moveActive = useCallback(
    (delta: number) => moveActiveTo(activeLine + delta),
    [activeLine, moveActiveTo]
  )
  const extendSelection = useCallback(
    (delta: number) => {
      if (isInert) return
      const anchor = anchorFor(anchorRef.current, selectedRange, activeLine)
      const next = clamp(activeLine + delta)
      anchorRef.current = anchor
      setRawActive(next)
      setSelectedRange({ startLine: Math.min(anchor, next), endLine: Math.max(anchor, next) })
    },
    [activeLine, clamp, isInert, selectedRange, setSelectedRange]
  )
  const toggleActive = useCallback(() => {
    if (isInert) return
    const isSoleSelection =
      selectedRange?.startLine === activeLine && selectedRange.endLine === activeLine
    anchorRef.current = activeLine
    setSelectedRange(isSoleSelection ? null : { startLine: activeLine, endLine: activeLine })
  }, [activeLine, isInert, selectedRange, setSelectedRange])
  const clearSelection = useCallback(() => {
    if (isInert) return
    anchorRef.current = null
    setSelectedRange(null)
  }, [isInert, setSelectedRange])

  return {
    model,
    selectedRange,
    activeLine,
    moveActive,
    moveActiveTo,
    extendSelection,
    toggleActive,
    clearSelection,
  }
}
