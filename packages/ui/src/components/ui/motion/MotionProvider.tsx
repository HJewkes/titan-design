import { createContext, useMemo, useState, type ReactNode } from 'react'
import type { Clock } from './clocks'

export interface MotionContextValue {
  clock: Clock
  /** Total timeline length in seconds. */
  durationS: number
  /** Promises a render must settle before its frame is final; see `useWaitUntil`. */
  waits: Set<Promise<unknown>>
}

export const MotionContext = createContext<MotionContextValue | null>(null)

export interface MotionProviderProps {
  clock: Clock
  /** Total timeline length in seconds. */
  durationS?: number
  children?: ReactNode
}

/** Puts every motion hook below it on `clock`, so a seek clock can drive a render frame by frame. */
export function MotionProvider({ clock, durationS = 0, children }: MotionProviderProps) {
  const [waits] = useState(() => new Set<Promise<unknown>>())
  const value = useMemo(() => ({ clock, durationS, waits }), [clock, durationS, waits])
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}
