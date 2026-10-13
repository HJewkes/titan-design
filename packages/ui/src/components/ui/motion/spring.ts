// A damped harmonic oscillator as a pure function of time; nothing here reads a clock.

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
