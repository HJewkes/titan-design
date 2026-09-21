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
  /** A finger or wheel took the scroll: stop treating it as ours. */
  onUserScroll: () => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onSettle: () => void
  focusSlide: (index: number) => void
  stepAnimated: (delta: number) => void
}

/**
 * Keeps the scroller and the current slide in step, in rendered positions so a
 * copy is just another position.
 *
 * The rule: the current slide is always committed first, and the scroll follows
 * it. An arrow commits its slide at once, even across the wrap; the glide onto
 * the copy at that end is scenery. When the scroll rests, whatever is under it
 * is committed, and the scroll is then lined up with the committed slide: that
 * one step hands a copy over to its original, lands an interrupted glide
 * exactly, and snaps a controlled carousel back when its owner declines a change.
 */
export function useScrollSync(input: ScrollSyncInput): ScrollSync {
  const { scrollRef, state, geometry, total, count, cloned, loop, measured } = input
  const { activeIndex, select } = state
  const offset = useRef(0)
  const dragStart = useRef(0)
  const animateNext = useRef(false)
  // The copy a wrap glides onto before the hand-over; consumed by the next alignment.
  const wrapVia = useRef<number | null>(null)
  // While a wrap glide is over the copies, the offset of the same view over the originals.
  const wrapShift = useRef(0)
  // Where a scroll we started is heading; its frames must not drive the counter.
  const glideTarget = useRef<number | null>(null)
  const settleTimer: TimerRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const [swipeIndex, setSwipeIndex] = useState<number | null>(null)
  const [settled, setSettled] = useState(0)
  const activePosition = positionOf(activeIndex, cloned)

  const scrollTo = useCallback(
    (target: number, animated: boolean) => {
      glideTarget.current = animated ? target : null
      scrollRef.current?.scrollTo({ x: target, animated })
      offset.current = target
    },
    [scrollRef]
  )

  useEffect(() => {
    if (!measured) return
    const position = wrapVia.current ?? activePosition
    // Any alignment that is not a wrap (a data or width change, a settle) ends the wrap.
    if (wrapVia.current === null) wrapShift.current = 0
    wrapVia.current = null
    const target = offsetForIndex(position, total, geometry)
    if (Math.abs(offset.current - target) > 0.5) {
      scrollTo(target, animateNext.current && !reducedMotion)
    }
    animateNext.current = false
  }, [activePosition, total, geometry, measured, reducedMotion, scrollTo, settled])

  useEffect(() => () => clearSettleTimer(settleTimer), [])

  const onSettle = useCallback(() => {
    clearSettleTimer(settleTimer)
    glideTarget.current = null
    wrapShift.current = 0
    setSwipeIndex(null)
    select(indexAtPosition(indexAtOffset(offset.current, total, geometry), count, cloned))
    // Re-run the alignment even when the committed slide did not change.
    setSettled((n) => n + 1)
  }, [cloned, count, geometry, select, total])

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

  const shiftFor = useCallback(
    (position: number) => (position <= 0 ? count : -count) * geometry.step,
    [count, geometry.step]
  )

  // Mid-wrap the view may be over the copies; move it onto the originals, which look identical.
  const leaveCopy = useCallback(() => {
    const position = indexAtOffset(offset.current, total, geometry)
    const shift =
      wrapShift.current !== 0
        ? wrapShift.current
        : isClonePosition(position, count, cloned)
          ? shiftFor(position)
          : 0
    wrapShift.current = 0
    if (shift !== 0) scrollTo(offset.current + shift, false)
  }, [cloned, count, geometry, scrollTo, shiftFor, total])

  const onUserScroll = useCallback(() => {
    glideTarget.current = null
    wrapVia.current = null
    wrapShift.current = 0
  }, [])

  const onDragStart = useCallback(() => {
    leaveCopy()
    onUserScroll()
    dragStart.current = indexAtOffset(offset.current, total, geometry)
  }, [geometry, leaveCopy, onUserScroll, total])

  const wrapThrough = useCallback(
    (position: number) => {
      wrapVia.current = position
      wrapShift.current = shiftFor(position)
    },
    [shiftFor]
  )

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
      if (isClonePosition(position, count, cloned)) wrapThrough(position)
      animateNext.current = true
      select(indexAtPosition(position, count, cloned))
      // A flick back onto the slide it started from changes nothing, so align explicitly.
      setSettled((n) => n + 1)
    },
    [cloned, count, geometry, select, total, wrapThrough]
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
        leaveCopy()
        animateNext.current = true
        select(next)
      } else if (loop) {
        // Commit the wrapped slide now; with copies, glide onto the copy at this end first.
        if (cloned) wrapThrough(activePosition + delta)
        animateNext.current = true
        select(wrapIndex(activeIndex, delta, count))
      }
    },
    [activeIndex, activePosition, cloned, count, leaveCopy, loop, select, wrapThrough]
  )

  return {
    visibleIndex: swipeIndex ?? activeIndex,
    onDragStart,
    onDragRelease,
    onUserScroll,
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
