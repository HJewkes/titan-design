import { useState } from 'react'
import type { ScrollView } from 'react-native'

import type { SlideGeometry } from './carouselMath'
import type { CarouselState } from './useCarouselState'

/** How long the scroll must rest before the slide under it becomes current. */
export const SETTLE_MS = 150

export type TimerRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>

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

export interface ScrollRefs {
  offsetRef: React.MutableRefObject<number>
  dragStartRef: React.MutableRefObject<number>
  animateNextRef: React.MutableRefObject<boolean>
  wrapViaRef: React.MutableRefObject<number | null>
  wrapShiftRef: React.MutableRefObject<number>
  glideTargetRef: React.MutableRefObject<number | null>
  settleTimerRef: TimerRef
  unmountedRef: React.MutableRefObject<boolean>
}

/** The scroll state every part of the sync shares; one bundle for the component's lifetime. */
export function useScrollRefs(): ScrollRefs {
  const [refs] = useState<ScrollRefs>(() => ({
    offsetRef: { current: 0 },
    dragStartRef: { current: 0 },
    animateNextRef: { current: false },
    // The copy a wrap glides onto before the hand-over; consumed by the next alignment.
    wrapViaRef: { current: null },
    // While a wrap glide is over the copies, the offset of the same view over the originals.
    wrapShiftRef: { current: 0 },
    // Where a scroll we started is heading; its frames must not drive the counter.
    glideTargetRef: { current: null },
    settleTimerRef: { current: null },
    // react-native-web fires a scroll-end onScroll 100 ms after the last scroll, even after unmount.
    unmountedRef: { current: false },
  }))
  return refs
}

export function clearSettleTimer(timer: TimerRef) {
  if (timer.current !== null) clearTimeout(timer.current)
  timer.current = null
}
