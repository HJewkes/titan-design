import { createContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { publishMotionApi } from './bridge'
import type { Clock } from './clocks'

export interface MotionContextValue {
  clock: Clock
  /** Total timeline length in seconds. */
  durationS: number
  /** Promises a render must settle before its frame is final; see `useWaitUntil`. */
  waits: Set<Promise<unknown>>
}

export const MotionContext = createContext<MotionContextValue | null>(null)

/** Props for `MotionProvider`. */
export interface MotionProviderProps {
  /** The time source for every motion hook below. */
  clock: Clock
  /** Total timeline length in seconds, published as `__titanMotion.duration`. */
  durationS?: number
  /** The timeline. */
  children?: ReactNode
}

/**
 * Puts every motion hook below it on `clock`, so a seek clock can drive a render frame by frame. On
 * web, a seek clock also publishes `window.__titanMotion` (`TitanMotionApi`) for the renderer.
 */
export function MotionProvider({ clock, durationS = 0, children }: MotionProviderProps) {
  const [waits] = useState(() => new Set<Promise<unknown>>())
  const value = useMemo(() => ({ clock, durationS, waits }), [clock, durationS, waits])
  useLayoutEffect(() => publishMotionApi(clock, durationS, waits), [clock, durationS, waits])
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}
