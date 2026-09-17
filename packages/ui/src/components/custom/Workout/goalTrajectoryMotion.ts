// The GoalTrajectoryChart entrance (VW-385): band, rules and gridlines are there from
// the first frame; the line draws left to right, then its shadow and the points arrive.
import { useEffect, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../charts/live-rep-growth'

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const ENTRANCE = {
  draw: { duration: 1000 },
  shadow: { duration: 500, delay: 1000 },
  points: { duration: 250, delay: 900 },
} as const

export interface EntranceState {
  /** False when motion is off or reduced: every layer renders its final state. */
  enabled: boolean
  /** Flips true one frame after mount, which starts the CSS transitions. */
  played: boolean
}

/**
 * Two animation frames, so the browser commits the start state before the end
 * state lands and the transition actually runs.
 */
export function useTrajectoryEntrance(animate: boolean): EntranceState {
  const reduced = usePrefersReducedMotion()
  const enabled = animate && !reduced
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setStarted(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [enabled])
  return { enabled, played: !enabled || started }
}

/** Stroke-dashoffset draw over a `pathLength={1}` path. */
export function drawStyle({ enabled, played }: EntranceState): CSSProperties {
  if (!enabled) return {}
  return {
    strokeDasharray: 1,
    strokeDashoffset: played ? 0 : 1,
    transition: `stroke-dashoffset ${String(ENTRANCE.draw.duration)}ms ${EASE_OUT}`,
  }
}

export function fadeStyle(
  { enabled, played }: EntranceState,
  timing: { duration: number; delay: number }
): CSSProperties {
  if (!enabled) return {}
  return {
    opacity: played ? 1 : 0,
    transition: `opacity ${String(timing.duration)}ms ease-out ${String(timing.delay)}ms`,
  }
}

/** Fade plus a scale from 0.6, about each mark's own centre. */
export function popStyle(entrance: EntranceState): CSSProperties {
  if (!entrance.enabled) return {}
  const { duration, delay } = ENTRANCE.points
  return {
    ...fadeStyle(entrance, ENTRANCE.points),
    transform: entrance.played ? 'scale(1)' : 'scale(0.6)',
    transformBox: 'fill-box',
    transformOrigin: 'center',
    transition: `opacity ${String(duration)}ms ease-out ${String(delay)}ms, transform ${String(duration)}ms ${EASE_OUT} ${String(delay)}ms`,
  }
}
