import { useCallback, useMemo, useRef, useState } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'
import { buildLineModel } from './lineModel'
import type { LineRange, LineRangeState, UseLineRangeOptions } from './types'

const NO_HIGHLIGHTS: LineRange[] = []

const clampLine = (line: number, first: number, last: number) =>
  Math.min(Math.max(line, first), Math.max(last, first))

// Keyed by value, so a consumer passing a fresh but equal `highlights` array keeps the same model.
function useModel(text: string, startLine: number, highlights: LineRange[]) {
  const highlightsKey = JSON.stringify(highlights)
  return useMemo(
    () => buildLineModel(text, startLine, JSON.parse(highlightsKey) as LineRange[]),
    [text, startLine, highlightsKey]
  )
}

/** The CodeViewer line model plus the gutter's controlled or uncontrolled line selection. */
export function useLineRange({
  text,
  startLine = 1,
  highlights = NO_HIGHLIGHTS,
  selectedRange: selectedProp,
  defaultSelectedRange = null,
  onSelectedRangeChange,
  isDisabled = false,
}: UseLineRangeOptions): LineRangeState {
  const model = useModel(text, startLine, highlights)
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

  const moveActiveTo = useCallback(
    (line: number) => {
      if (!isDisabled) setRawActive(clamp(line))
    },
    [clamp, isDisabled]
  )
  const moveActive = useCallback(
    (delta: number) => moveActiveTo(activeLine + delta),
    [activeLine, moveActiveTo]
  )
  const extendSelection = useCallback(
    (delta: number) => {
      if (isDisabled) return
      const anchor = anchorRef.current ?? activeLine
      const next = clamp(activeLine + delta)
      anchorRef.current = anchor
      setRawActive(next)
      setSelectedRange({ startLine: Math.min(anchor, next), endLine: Math.max(anchor, next) })
    },
    [activeLine, clamp, isDisabled, setSelectedRange]
  )
  const toggleActive = useCallback(() => {
    if (isDisabled) return
    const isSoleSelection =
      selectedRange?.startLine === activeLine && selectedRange.endLine === activeLine
    anchorRef.current = activeLine
    setSelectedRange(isSoleSelection ? null : { startLine: activeLine, endLine: activeLine })
  }, [activeLine, isDisabled, selectedRange, setSelectedRange])
  const clearSelection = useCallback(() => {
    if (isDisabled) return
    anchorRef.current = null
    setSelectedRange(null)
  }, [isDisabled, setSelectedRange])

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
