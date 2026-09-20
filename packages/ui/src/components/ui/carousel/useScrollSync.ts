import { useCallback, useEffect, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'

import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import {
  flickTarget,
  indexAtOffset,
  indexAtPosition,
  isClonePosition,
  offsetForIndex,
  positionOf,
  wrapIndex,
  type SlideGeometry,
} from './carouselMath'
import type { CarouselState } from './useCarouselState'
import type { DragRelease } from './useDragToScroll'

/** How long the scroll must rest before the slide under it becomes current. */
const SETTLE_MS = 150

type TimerRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>

export interface ScrollSyncInput {
  scrollRef: React.RefObject<ScrollView | null>
  state: CarouselState
  geometry: SlideGeometry
  /** Rendered slots, clones included. */
  total: number
  /** Real slides. */
  count: number
  cloned: boolean
  loop: boolean
  measured: boolean
}

export interface ScrollSync {
  visibleIndex: number
  onDragStart: () => void
  onDragRelease: (release: DragRelease) => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onSettle: () => void
  focusSlide: (index: number) => void
  stepAnimated: (delta: number) => void
}

/**
 * Keeps the scroller and the current slide in step, in rendered positions so a
 * clone is just another position. A swipe updates the counter live and commits
 * once the scroll rests; a committed change the scroller did not make (an arrow,
 * focus, a width or data change) scrolls to it; resting on a clone hands over to
 * the real slide it copies, without animation, so a loop never rewinds.
 */
export function useScrollSync(input: ScrollSyncInput): ScrollSync {
  const { scrollRef, state, geometry, total, count, cloned, loop, measured } = input
  const { activeIndex, select } = state
  const offset = useRef(0)
  const dragStart = useRef(0)
  const animateNext = useRef(false)
  // Where a scroll we started is heading; its frames must not drive the counter.
  const glideTarget = useRef<number | null>(null)
  // A wrap glide must survive a settle left over from the glide before it.
  const pendingPosition = useRef<number | null>(null)
  const settleTimer: TimerRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const [swipeIndex, setSwipeIndex] = useState<number | null>(null)
  const activePosition = positionOf(activeIndex, cloned)

  const scrollTo = useCallback(
    (target: number, animated: boolean) => {
      glideTarget.current = target
      scrollRef.current?.scrollTo({ x: target, animated })
      offset.current = target
    },
    [scrollRef]
  )

  useEffect(() => {
    if (!measured) return
    const target = offsetForIndex(activePosition, total, geometry)
    if (Math.abs(offset.current - target) > 0.5) {
      scrollTo(target, animateNext.current && !reducedMotion)
    }
    animateNext.current = false
  }, [activePosition, total, geometry, measured, reducedMotion, scrollTo])

  useEffect(() => () => clearSettleTimer(settleTimer), [])

  const onSettle = useCallback(
    function settle() {
      clearSettleTimer(settleTimer)
      glideTarget.current = null
      setSwipeIndex(null)
      const position = pendingPosition.current ?? indexAtOffset(offset.current, total, geometry)
      if (pendingPosition.current !== null) {
        const target = offsetForIndex(pendingPosition.current, total, geometry)
        if (Math.abs(offset.current - target) > 0.5) {
          settleTimer.current = setTimeout(settle, SETTLE_MS)
          return
        }
        pendingPosition.current = null
      }
      const index = indexAtPosition(position, count, cloned)
      const landing = offsetForIndex(positionOf(index, cloned), total, geometry)
      // A clone hands over to its original, and an interrupted glide lands exactly.
      if (Math.abs(offset.current - landing) > 0.5) scrollTo(landing, false)
      select(index)
    },
    [cloned, count, geometry, scrollTo, select, total]
  )

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.x
      const target = glideTarget.current
      if (target !== null && Math.abs(offset.current - target) <= 1) glideTarget.current = null
      if (target === null) {
        const position = indexAtOffset(offset.current, total, geometry)
        setSwipeIndex(indexAtPosition(position, count, cloned))
      }
      clearSettleTimer(settleTimer)
      settleTimer.current = setTimeout(onSettle, SETTLE_MS)
    },
    [cloned, count, geometry, onSettle, total]
  )

  const glideToPosition = useCallback(
    (position: number) => {
      pendingPosition.current = position
      scrollTo(offsetForIndex(position, total, geometry), !reducedMotion)
      clearSettleTimer(settleTimer)
      settleTimer.current = setTimeout(onSettle, SETTLE_MS)
    },
    [geometry, onSettle, reducedMotion, scrollTo, total]
  )

  const onDragStart = useCallback(() => {
    pendingPosition.current = null
    glideTarget.current = null
    dragStart.current = activePosition
  }, [activePosition])

  const onDragRelease = useCallback(
    ({ offset: released, velocity }: DragRelease) => {
      offset.current = released
      const position = flickTarget({
        startIndex: dragStart.current,
        offset: released,
        velocity,
        count: total,
        geometry,
      })
      if (isClonePosition(position, count, cloned)) glideToPosition(position)
      else {
        animateNext.current = true
        select(indexAtPosition(position, count, cloned))
      }
    },
    [cloned, count, geometry, glideToPosition, select, total]
  )

  const focusSlide = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      animateNext.current = true
      select(index)
    },
    [activeIndex, select]
  )

  const stepAnimated = useCallback(
    (delta: number) => {
      const next = activeIndex + delta
      if (next >= 0 && next < count) {
        animateNext.current = true
        select(next)
      } else if (loop && cloned) {
        // Glide onto the copy at this end; settling there hands over to the real slide.
        glideToPosition(activePosition + delta)
      } else if (loop) {
        animateNext.current = true
        select(wrapIndex(activeIndex, delta, count))
      }
    },
    [activeIndex, activePosition, cloned, count, glideToPosition, loop, select]
  )

  return {
    visibleIndex: swipeIndex ?? activeIndex,
    onDragStart,
    onDragRelease,
    onScroll,
    onSettle,
    focusSlide,
    stepAnimated,
  }
}

function clearSettleTimer(timer: TimerRef) {
  if (timer.current !== null) clearTimeout(timer.current)
  timer.current = null
}
