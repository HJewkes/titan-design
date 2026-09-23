import { useCallback, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

export interface UseMeasuredWidthResult {
  /** The measured width, or `null` until the first layout pass. */
  width: number | null
  onLayout: (event: LayoutChangeEvent) => void
}

/**
 * The width of whatever it is attached to, from the `onLayout` pass every other
 * width-aware table here already uses — no resize observer, and no window
 * width standing in for a column that lives inside a much narrower card.
 *
 * `override` pins the width instead of measuring, so a story or a test can hold
 * one breakpoint still.
 */
export function useMeasuredWidth(override?: number): UseMeasuredWidthResult {
  const [measured, setMeasured] = useState<number | null>(null)
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width),
    []
  )
  return { width: override ?? measured, onLayout }
}
