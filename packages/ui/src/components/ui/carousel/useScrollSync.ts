import { useCallback } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import {
  flickTarget,
  indexAtOffset,
  indexAtPosition,
  isClonePosition,
  positionOf,
  wrapIndex,
} from './carouselMath'
import { useScrollRefs, type ScrollSyncInput } from './scrollSyncShared'
import type { DragRelease } from './useDragToScroll'
import { useScrollAlignment } from './useScrollAlignment'
import { useSettleTracking } from './useSettleTracking'

export type { ScrollSyncInput } from './scrollSyncShared'

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
  const { geometry, total, count, cloned, loop } = input
  const { activeIndex, select } = input.state
  const refs = useScrollRefs()
  const { offsetRef, dragStartRef, animateNextRef, wrapViaRef, wrapShiftRef, glideTargetRef } = refs
  const activePosition = positionOf(activeIndex, cloned)
  const { swipeIndex, settled, realign, onScroll, onSettle } = useSettleTracking(input, refs)
  const { leaveCopy, wrapThrough } = useScrollAlignment(input, refs, activePosition, settled)

  const onUserScroll = useCallback(() => {
    glideTargetRef.current = null
    wrapViaRef.current = null
    wrapShiftRef.current = 0
  }, [glideTargetRef, wrapShiftRef, wrapViaRef])

  const onDragStart = useCallback(() => {
    leaveCopy()
    onUserScroll()
    dragStartRef.current = indexAtOffset(offsetRef.current, total, geometry)
  }, [dragStartRef, geometry, leaveCopy, offsetRef, onUserScroll, total])

  const onDragRelease = useCallback(
    ({ offset: released, velocity }: DragRelease) => {
      offsetRef.current = released
      const position = flickTarget({
        startIndex: dragStartRef.current,
        offset: released,
        velocity,
        count: total,
        geometry,
      })
      if (isClonePosition(position, count, cloned)) wrapThrough(position)
      animateNextRef.current = true
      select(indexAtPosition(position, count, cloned))
      // A flick back onto the slide it started from changes nothing, so align explicitly.
      realign()
    },
    [
      animateNextRef,
      cloned,
      count,
      dragStartRef,
      geometry,
      offsetRef,
      realign,
      select,
      total,
      wrapThrough,
    ]
  )

  const focusSlide = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      animateNextRef.current = true
      select(index)
    },
    [activeIndex, animateNextRef, select]
  )

  const stepAnimated = useCallback(
    (delta: number) => {
      const next = activeIndex + delta
      if (next >= 0 && next < count) {
        leaveCopy()
        animateNextRef.current = true
        select(next)
      } else if (loop) {
        // Commit the wrapped slide now; with copies, glide onto the copy at this end first.
        if (cloned) wrapThrough(activePosition + delta)
        animateNextRef.current = true
        select(wrapIndex(activeIndex, delta, count))
      }
    },
    [
      activeIndex,
      activePosition,
      animateNextRef,
      cloned,
      count,
      leaveCopy,
      loop,
      select,
      wrapThrough,
    ]
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
