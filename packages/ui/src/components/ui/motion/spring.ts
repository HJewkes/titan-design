// A damped harmonic oscillator as a pure function of time; nothing here reads a clock.
import type { Easing } from './easing'

/** Physical parameters and endpoints for `spring`. */
export interface SpringOptions {
  /** Spring constant. Default 100. */
  stiffness?: number
  /** Damping coefficient; below `2 * sqrt(stiffness * mass)` the spring overshoots. Default 10. */
  damping?: number
  /** Default 1. */
  mass?: number
  /** Value at t <= 0. Default 0. */
  from?: number
  /** Rest value. Default 1. */
  to?: number
  /** Initial velocity in units per second. */
  velocity?: number
}

/** Closed-form spring position at `t` seconds, so any t is computed without stepping. */
export function spring(
  t: number,
  { stiffness = 100, damping = 10, mass = 1, from = 0, to = 1, velocity = 0 }: SpringOptions = {}
): number {
  if (t <= 0) return from
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  return to + springDisplacement(t, w0, zeta, from - to, velocity)
}

function springDisplacement(t: number, w0: number, zeta: number, x0: number, v0: number): number {
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const b = (v0 + zeta * w0 * x0) / wd
    return Math.exp(-zeta * w0 * t) * (x0 * Math.cos(wd * t) + b * Math.sin(wd * t))
  }
  if (zeta === 1) return Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t)
  const root = Math.sqrt(zeta * zeta - 1)
  const r1 = -w0 * (zeta - root)
  const r2 = -w0 * (zeta + root)
  const c2 = (v0 - r1 * x0) / (r2 - r1)
  return (x0 - c2) * Math.exp(r1 * t) + c2 * Math.exp(r2 * t)
}

/** Spring parameters for `springEase`, which always runs from 0 to 1. */
export type SpringEaseOptions = Omit<SpringOptions, 'from' | 'to'>

/**
 * Seconds until the spring stays within `threshold` of its rest value, as a fraction of the distance
 * from `from` to `to` (an absolute distance when they are equal). It solves an upper bound on the
 * displacement rather than the motion itself, so it is never early: underdamped springs use the
 * decay envelope in closed form; critical and overdamped ones bisect a monotone bound.
 */
export function springSettleS(
  { stiffness = 100, damping = 10, mass = 1, from = 0, to = 1, velocity = 0 }: SpringOptions = {},
  threshold = 1e-3
): number {
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  const bound = displacementBound(w0, zeta, from - to, velocity)
  const tolerance = threshold * (Math.abs(to - from) || 1)
  if (bound.closedForm) return Math.max(0, Math.log(bound.amplitude / tolerance) / (zeta * w0))
  return lastTimeAbove(bound.at, tolerance, bound.peakS)
}

/**
 * The spring as an easing curve: `p` in [0, 1] maps onto its settle time, normalised so the curve is
 * exactly 0 at 0 and exactly 1 at 1. Underdamped options overshoot past 1 in between.
 */
export function springEase(options: SpringEaseOptions = {}): Easing {
  const springOptions = { ...options, from: 0, to: 1 }
  const settleS = springSettleS(springOptions)
  const end = spring(settleS, springOptions)
  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : spring(p * settleS, springOptions) / end)
}

type DisplacementBound =
  | { closedForm: true; amplitude: number }
  | { closedForm: false; at: (t: number) => number; peakS: number }

function displacementBound(w0: number, zeta: number, x0: number, v0: number): DisplacementBound {
  if (zeta < 1) {
    const b = (v0 + zeta * w0 * x0) / (w0 * Math.sqrt(1 - zeta * zeta))
    return { closedForm: true, amplitude: Math.hypot(x0, b) }
  }
  if (zeta === 1) {
    const c = Math.abs(v0 + w0 * x0)
    const peakS = c > 0 ? Math.max(0, 1 / w0 - Math.abs(x0) / c) : 0
    return { closedForm: false, at: (t) => (Math.abs(x0) + c * t) * Math.exp(-w0 * t), peakS }
  }
  const root = Math.sqrt(zeta * zeta - 1)
  const r1 = -w0 * (zeta - root)
  const r2 = -w0 * (zeta + root)
  const c2 = (v0 - r1 * x0) / (r2 - r1)
  const at = (t: number) => Math.abs(x0 - c2) * Math.exp(r1 * t) + Math.abs(c2) * Math.exp(r2 * t)
  return { closedForm: false, at, peakS: 0 }
}

/** The time after which `bound`, decreasing from `fromS` on, stays at or below `tolerance`. */
function lastTimeAbove(bound: (t: number) => number, tolerance: number, fromS: number): number {
  if (bound(fromS) <= tolerance) return fromS
  let lo = fromS
  let hi = fromS + 1
  while (bound(hi) > tolerance) hi *= 2
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (bound(mid) > tolerance) lo = mid
    else hi = mid
  }
  return hi
}
