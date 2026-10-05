// The shared chart entrance, generalised from the GoalTrajectoryChart one (VW-385): static
// layers are there from the first frame, a line draws left to right, then marks arrive.
import { useEffect, useState, type CSSProperties } from 'react'
import { Platform } from 'react-native'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'

export const CHART_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

export interface EntranceTiming {
  duration: number
  delay: number
}

/** Default timings: the draw, a fade that follows it, and points that pop in near its end. */
export const CHART_ENTRANCE = {
  draw: { duration: 1000, delay: 0 },
  fade: { duration: 500, delay: 1000 },
  points: { duration: 250, delay: 900 },
} as const satisfies Record<string, EntranceTiming>

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
export function useChartEntrance(animate: boolean): EntranceState {
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

/** CSS transitions and `transformBox` are web-only; native renders the final state. */
function entranceOff({ enabled }: EntranceState): boolean {
  return !enabled || Platform.OS !== 'web'
}

/** Stroke-dashoffset draw over a `pathLength={1}` path. */
export function drawStyle(
  entrance: EntranceState,
  { duration, delay }: EntranceTiming = CHART_ENTRANCE.draw
): CSSProperties {
  if (entranceOff(entrance)) return {}
  const { played } = entrance
  return {
    strokeDasharray: 1,
    strokeDashoffset: played ? 0 : 1,
    transition: `stroke-dashoffset ${String(duration)}ms ${CHART_EASE_OUT} ${String(delay)}ms`,
  }
}

export function fadeStyle(
  entrance: EntranceState,
  { duration, delay }: EntranceTiming = CHART_ENTRANCE.fade
): CSSProperties {
  if (entranceOff(entrance)) return {}
  const { played } = entrance
  return {
    opacity: played ? 1 : 0,
    transition: `opacity ${String(duration)}ms ease-out ${String(delay)}ms`,
  }
}

/** Fade plus a scale from 0.6, about each mark's own centre. */
export function popStyle(
  entrance: EntranceState,
  timing: EntranceTiming = CHART_ENTRANCE.points
): CSSProperties {
  if (entranceOff(entrance)) return {}
  const duration = `${String(timing.duration)}ms`
  const delay = `${String(timing.delay)}ms`
  return {
    ...fadeStyle(entrance, timing),
    transform: entrance.played ? 'scale(1)' : 'scale(0.6)',
    transformBox: 'fill-box',
    transformOrigin: 'center',
    transition: `opacity ${duration} ease-out ${delay}, transform ${duration} ${CHART_EASE_OUT} ${delay}`,
  }
}
