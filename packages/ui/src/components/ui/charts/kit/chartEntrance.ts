// The shared chart entrance, generalised from the GoalTrajectoryChart one (VW-385): static
// layers are there from the first frame, a line draws left to right, then marks arrive.
// On screen it runs as CSS transitions on the wall clock. Given `t`, seconds from a motion seek
// clock, it is a pure function of `t` instead, so a seeked video frame matches a played one.
import { useEffect, useState, type CSSProperties } from 'react'
import { Platform } from 'react-native'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'
import { cubicBezier } from '../../motion/easing'
import { MOTION } from '../../motion/tokens'

export const CHART_EASE_OUT = 'var(--ease-out)'

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
  /** Seconds into a seeked entrance. Present only under a seek clock; then no CSS transition runs. */
  t?: number
}

// `CHART_EASE_OUT` and the CSS `ease-out` keyword as curves, so a seeked frame paints what the
// transition would.
const houseEaseOut = MOTION.ease.out
const cssEaseOut = cubicBezier(0, 0, 0.58, 1)
const POP_FROM_SCALE = 0.6

/** Linear progress through one timing window at `tS` seconds, in [0, 1]. */
function windowAt(tS: number, { duration, delay }: EntranceTiming): number {
  const elapsedMs = tS * 1000 - delay
  if (duration <= 0) return elapsedMs >= 0 ? 1 : 0
  return Math.min(1, Math.max(0, elapsedMs / duration))
}

/** Where a seeked entrance stands at one time: each layer's and each mark's window progress. */
export interface EntranceFrame {
  /** Share of the whole entrance elapsed, in [0, 1]. */
  progress: number
  /** Linear progress of the line draw, in [0, 1]. */
  draw: number
  /** Linear progress of the fade that follows the draw, in [0, 1]. */
  fade: number
  /** Linear progress of the point pop, in [0, 1]. */
  points: number
  /** Linear progress of each staggered mark (a bar's growth), in mark order. */
  marks: number[]
}

export interface EntranceAtOptions {
  /** Marks that grow one after another over the draw timing, staggered by the motion tokens. */
  marks?: number
  timing?: Record<keyof typeof CHART_ENTRANCE, EntranceTiming>
}

/**
 * The entrance at `tS` seconds, from `t` alone: it never reads a clock or the previous frame, so
 * a cold seek to `t` and playing up to it give the same frame.
 */
export function entranceAt(
  tS: number,
  { marks = 0, timing = CHART_ENTRANCE }: EntranceAtOptions = {}
): EntranceFrame {
  const staggerMs = MOTION.staggerEachS(marks) * 1000
  const markTimings = Array.from({ length: marks }, (_, i) => ({
    duration: timing.draw.duration,
    delay: timing.draw.delay + i * staggerMs,
  }))
  const windows = [timing.draw, timing.fade, timing.points, ...markTimings]
  const totalMs = Math.max(...windows.map((w) => w.delay + w.duration))
  return {
    progress: windowAt(tS, { duration: totalMs, delay: 0 }),
    draw: windowAt(tS, timing.draw),
    fade: windowAt(tS, timing.fade),
    points: windowAt(tS, timing.points),
    marks: markTimings.map((w) => windowAt(tS, w)),
  }
}

/** Eased growth of mark `index` in `frame`: the share of its final length the mark paints. */
export function markGrowthAt(frame: EntranceFrame, index: number): number {
  return houseEaseOut(frame.marks[index] ?? 1)
}

/**
 * Without `t`, two animation frames, so the browser commits the start state before the end
 * state lands and the transition actually runs. With `t`, the frame is computed from it and
 * reduced motion is not consulted: a seeked render is a video frame, not a screen that moves.
 */
export function useChartEntrance(animate: boolean, t?: number): EntranceState {
  const reduced = usePrefersReducedMotion()
  const seeked = t !== undefined
  const enabled = animate && (seeked || !reduced)
  const transitions = enabled && !seeked
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!transitions) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setStarted(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [transitions])
  if (enabled && seeked) return { enabled, played: true, t }
  return { enabled, played: !enabled || started }
}

/** CSS transitions and `transformBox` are web-only; native renders the final state. */
function entranceOff({ enabled }: EntranceState): boolean {
  return !enabled || Platform.OS !== 'web'
}

/** Stroke-dashoffset draw over a `pathLength={1}` path. */
export function drawStyle(
  entrance: EntranceState,
  timing: EntranceTiming = CHART_ENTRANCE.draw
): CSSProperties {
  if (entranceOff(entrance)) return {}
  const { played, t } = entrance
  if (t !== undefined) {
    return { strokeDasharray: 1, strokeDashoffset: 1 - houseEaseOut(windowAt(t, timing)) }
  }
  return {
    strokeDasharray: 1,
    strokeDashoffset: played ? 0 : 1,
    transition: `stroke-dashoffset ${String(timing.duration)}ms ${CHART_EASE_OUT} ${String(timing.delay)}ms`,
  }
}

export function fadeStyle(
  entrance: EntranceState,
  timing: EntranceTiming = CHART_ENTRANCE.fade
): CSSProperties {
  if (entranceOff(entrance)) return {}
  const { played, t } = entrance
  if (t !== undefined) return { opacity: cssEaseOut(windowAt(t, timing)) }
  return {
    opacity: played ? 1 : 0,
    transition: `opacity ${String(timing.duration)}ms ease-out ${String(timing.delay)}ms`,
  }
}

function popScale(entrance: EntranceState, timing: EntranceTiming): string {
  if (entrance.t === undefined) return entrance.played ? 'scale(1)' : `scale(${POP_FROM_SCALE})`
  const grown = houseEaseOut(windowAt(entrance.t, timing))
  return `scale(${String(POP_FROM_SCALE + (1 - POP_FROM_SCALE) * grown)})`
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
    transform: popScale(entrance, timing),
    transformBox: 'fill-box',
    transformOrigin: 'center',
    ...(entrance.t === undefined && {
      transition: `opacity ${duration} ease-out ${delay}, transform ${duration} ${CHART_EASE_OUT} ${delay}`,
    }),
  }
}
