import { useCallback, useEffect, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { indexAtOffset, indexAtPosition } from './carouselMath'
import {
  clearSettleTimer,
  SETTLE_MS,
  type ScrollRefs,
  type ScrollSyncInput,
} from './scrollSyncShared'

export interface SettleTracking {
  swipeIndex: number | null
  settled: number
  realign: () => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onSettle: () => void
}

/** Follows the scroll frame by frame and commits the slide under it once it rests. */
export function useSettleTracking(input: ScrollSyncInput, refs: ScrollRefs): SettleTracking {
  const { state, geometry, total, count, cloned } = input
  const { select } = state
  const { offsetRef, glideTargetRef, wrapShiftRef, settleTimerRef, unmountedRef } = refs
  const [swipeIndex, setSwipeIndex] = useState<number | null>(null)
  const [settled, setSettled] = useState(0)

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      clearSettleTimer(settleTimerRef)
    }
  }, [settleTimerRef, unmountedRef])

  const onSettle = useCallback(() => {
    if (unmountedRef.current) return
    clearSettleTimer(settleTimerRef)
    glideTargetRef.current = null
    wrapShiftRef.current = 0
    setSwipeIndex(null)
    select(indexAtPosition(indexAtOffset(offsetRef.current, total, geometry), count, cloned))
    // Re-run the alignment even when the committed slide did not change.
    setSettled((n) => n + 1)
  }, [
    cloned,
    count,
    geometry,
    glideTargetRef,
    offsetRef,
    select,
    settleTimerRef,
    total,
    unmountedRef,
    wrapShiftRef,
  ])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (unmountedRef.current) return
      offsetRef.current = event.nativeEvent.contentOffset.x
      const target = glideTargetRef.current
      if (target !== null && Math.abs(offsetRef.current - target) <= 1) {
        glideTargetRef.current = null
      }
      if (target === null) {
        const position = indexAtOffset(offsetRef.current, total, geometry)
        setSwipeIndex(indexAtPosition(position, count, cloned))
      }
      clearSettleTimer(settleTimerRef)
      settleTimerRef.current = setTimeout(onSettle, SETTLE_MS)
    },
    [
      cloned,
      count,
      geometry,
      glideTargetRef,
      offsetRef,
      onSettle,
      settleTimerRef,
      total,
      unmountedRef,
    ]
  )

  const realign = useCallback(() => setSettled((n) => n + 1), [])

  return { swipeIndex, settled, realign, onScroll, onSettle }
}
