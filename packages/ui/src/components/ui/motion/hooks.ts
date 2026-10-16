import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { rafClock, REDUCED_MOTION_END_S, type Clock } from './clocks'
import { MotionContext } from './MotionProvider'

/** Absolute timeline seconds that local times are measured from; a Beat moves it. */
export const TimeOriginContext = createContext(0)

const subscribeNothing = () => () => {}

/** True when this component's first render hydrated server HTML rather than mounting fresh. */
function useHydratedOnMount(): boolean {
  const hydrating = useSyncExternalStore(
    subscribeNothing,
    () => false,
    () => true
  )
  const [hydrated] = useState(hydrating)
  return hydrated
}

/**
 * Clock seconds. Under a `MotionProvider`, its clock. Otherwise a rAF clock from mount that stops at
 * `endS`, and starts there under reduced motion, on the server, and after hydration, so server HTML
 * shows the end state and never flashes back to the start.
 */
export function useMotionTime(endS = Infinity): number {
  const ctx = useContext(MotionContext)
  const reduced = usePrefersReducedMotion()
  const hydrated = useHydratedOnMount()
  const hasProvider = ctx !== null
  const fallback = useMemo(
    () => (hasProvider ? null : rafClock({ endS, reducedMotion: reduced || hydrated })),
    [hasProvider, endS, reduced, hydrated]
  )
  const clock = ctx?.clock ?? (fallback as Clock)
  const endSnapshot = Number.isFinite(endS) ? endS : REDUCED_MOTION_END_S
  return useSyncExternalStore(clock.subscribe, clock.now, ctx ? clock.now : () => endSnapshot)
}

/** Where a time falls against a window: before its start, inside it, or at or past its end. */
export type Phase = 'before' | 'during' | 'after'

/** A time measured against a window. */
export interface LocalTime {
  /** Seconds into the window, clamped to [0, durationS]. */
  t: number
  /** `t / durationS`, in [0, 1]. */
  progress: number
  /** Where the time falls against the window. */
  phase: Phase
}

/** `raw` is seconds since the window's start; may be negative or past the end. */
export function localTime(raw: number, durationS: number): LocalTime {
  const phase: Phase = raw < 0 ? 'before' : raw >= durationS ? 'after' : 'during'
  const t = Math.min(durationS, Math.max(0, raw))
  return { t, progress: durationS > 0 ? t / durationS : phase === 'before' ? 0 : 1, phase }
}

/**
 * Seconds since the enclosing origin (a Beat's start, or 0), minus `startS`. Without a provider the
 * clock stops once that reaches `untilS`.
 */
export function useRawLocalTime(startS = 0, untilS = Infinity): number {
  const origin = useContext(TimeOriginContext) + startS
  return useMotionTime(origin + untilS) - origin
}

/** Where a component is in its window; without a provider, nothing re-renders after it ends. */
export function useLocalTime(startS: number, durationS: number): LocalTime {
  return localTime(useRawLocalTime(startS, durationS), durationS)
}

/** Holds the provider's frame open until `promise` settles; for assets a component loads itself. */
export function useWaitUntil(promise: Promise<unknown> | undefined): void {
  const ctx = useContext(MotionContext)
  useLayoutEffect(() => {
    if (!promise || !ctx) return
    ctx.waits.add(promise)
    return () => {
      ctx.waits.delete(promise)
    }
  }, [promise, ctx])
}
