import { useCallback, useEffect, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native'

import { revealOffset } from './matrix-layout'
import type { MatrixPosition } from './types'

interface Offset {
  x: number
  y: number
  /** A reveal moved the offset, so the scrollers still have to follow it. */
  isReveal: boolean
}

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>

const scrolledTo = (prev: Offset, x: number, y: number): Offset =>
  prev.x === x && prev.y === y ? prev : { x, y, isReveal: false }

/**
 * Two-axis scroll state. react-native-web's ScrollView scrolls one axis, so CSS sticky cannot hold
 * headers on both; the grid nests two scrollers and translates its headers by this offset instead.
 */
export function useMatrixViewport(size: number, bodyWidth: number, bodyHeight: number) {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0, isReveal: false })
  const horizontalRef = useRef<ScrollView>(null)
  const verticalRef = useRef<ScrollView>(null)
  const onScrollX = useCallback((event: ScrollEvent) => {
    const { x } = event.nativeEvent.contentOffset
    setOffset((prev) => scrolledTo(prev, x, prev.y))
  }, [])
  const onScrollY = useCallback((event: ScrollEvent) => {
    const { y } = event.nativeEvent.contentOffset
    setOffset((prev) => scrolledTo(prev, prev.x, y))
  }, [])
  const reveal = useCallback(
    ({ row, col }: MatrixPosition) =>
      setOffset((prev) => {
        const x = revealOffset(prev.x, col, size, bodyWidth)
        const y = revealOffset(prev.y, row, size, bodyHeight)
        return prev.x === x && prev.y === y ? prev : { x, y, isReveal: true }
      }),
    [size, bodyWidth, bodyHeight]
  )
  useEffect(() => {
    if (!offset.isReveal) return
    horizontalRef.current?.scrollTo({ x: offset.x, animated: false })
    verticalRef.current?.scrollTo({ y: offset.y, animated: false })
  }, [offset])
  return { offset, horizontalRef, verticalRef, onScrollX, onScrollY, reveal }
}

/** Moves DOM focus to the active cell after a key moved it, and scrolls it into view. */
export function useActiveCellFocus(
  position: MatrixPosition | null,
  reveal: (position: MatrixPosition) => void
) {
  const activeRef = useRef<View>(null)
  const focusPending = useRef(false)
  const row = position?.row ?? -1
  const col = position?.col ?? -1
  useEffect(() => {
    if (row >= 0) reveal({ row, col })
  }, [row, col, reveal])
  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    activeRef.current?.focus()
  })
  const requestFocus = useCallback(() => {
    focusPending.current = true
  }, [])
  return { activeRef, requestFocus }
}
