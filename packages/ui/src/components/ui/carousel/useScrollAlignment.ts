import { useCallback, useEffect } from 'react'

import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { indexAtOffset, isClonePosition, offsetForIndex } from './carouselMath'
import type { ScrollRefs, ScrollSyncInput } from './scrollSyncShared'

export interface ScrollAlignment {
  scrollTo: (target: number, animated: boolean) => void
  leaveCopy: () => void
  wrapThrough: (position: number) => void
}

/** Lines the scroll up with the committed slide, and moves it across the wrap. */
export function useScrollAlignment(
  input: ScrollSyncInput,
  refs: ScrollRefs,
  activePosition: number,
  settled: number
): ScrollAlignment {
  const { scrollRef, geometry, total, count, cloned, measured } = input
  const { offsetRef, animateNextRef, wrapViaRef, wrapShiftRef, glideTargetRef } = refs
  const reducedMotion = usePrefersReducedMotion()

  const scrollTo = useCallback(
    (target: number, animated: boolean) => {
      glideTargetRef.current = animated ? target : null
      scrollRef.current?.scrollTo({ x: target, animated })
      offsetRef.current = target
    },
    [glideTargetRef, offsetRef, scrollRef]
  )

  useEffect(() => {
    if (!measured) return
    const position = wrapViaRef.current ?? activePosition
    // Any alignment that is not a wrap (a data or width change, a settle) ends the wrap.
    if (wrapViaRef.current === null) wrapShiftRef.current = 0
    wrapViaRef.current = null
    const target = offsetForIndex(position, total, geometry)
    if (Math.abs(offsetRef.current - target) > 0.5) {
      scrollTo(target, animateNextRef.current && !reducedMotion)
    }
    animateNextRef.current = false
  }, [
    activePosition,
    animateNextRef,
    total,
    geometry,
    measured,
    offsetRef,
    reducedMotion,
    scrollTo,
    settled,
    wrapShiftRef,
    wrapViaRef,
  ])

  const shiftFor = useCallback(
    (position: number) => (position <= 0 ? count : -count) * geometry.step,
    [count, geometry.step]
  )

  // Mid-wrap the view may be over the copies; move it onto the originals, which look identical.
  const leaveCopy = useCallback(() => {
    const position = indexAtOffset(offsetRef.current, total, geometry)
    const shift =
      wrapShiftRef.current !== 0
        ? wrapShiftRef.current
        : isClonePosition(position, count, cloned)
          ? shiftFor(position)
          : 0
    wrapShiftRef.current = 0
    if (shift !== 0) scrollTo(offsetRef.current + shift, false)
  }, [cloned, count, geometry, offsetRef, scrollTo, shiftFor, total, wrapShiftRef])

  const wrapThrough = useCallback(
    (position: number) => {
      wrapViaRef.current = position
      wrapShiftRef.current = shiftFor(position)
    },
    [shiftFor, wrapShiftRef, wrapViaRef]
  )

  return { scrollTo, leaveCopy, wrapThrough }
}
