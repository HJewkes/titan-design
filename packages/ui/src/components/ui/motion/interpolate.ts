// Pure value functions. Every animated value is f(t); nothing here reads a clock.
import { linear, type Easing } from './easing'

/** Options for `interpolate`. */
export interface InterpolateOptions {
  /** Applied to the normalised progress, not the output. Default `linear`. */
  ease?: Easing
  /** Clamp to the output range outside the input range. Default true. */
  clamp?: boolean
}

/** Maps `t` from the input range to the output range, easing the normalised progress. */
export function interpolate(
  t: number,
  [in0, in1]: readonly [number, number],
  [out0, out1]: readonly [number, number],
  { ease = linear, clamp = true }: InterpolateOptions = {}
): number {
  if (in1 === in0) return t < in0 ? out0 : out1
  const raw = (t - in0) / (in1 - in0)
  const p = clamp ? Math.min(1, Math.max(0, raw)) : raw
  return out0 + (out1 - out0) * ease(p)
}

/** A `[t, value]` stop for `keyframes`. */
export type Keyframe = readonly [number, number]

/**
 * Piecewise `interpolate` through stops sorted by t: holds the first value before the first stop and the
 * last after the last. Two stops at one t jump to the second.
 */
export function keyframes(
  t: number,
  stops: readonly Keyframe[],
  { ease = linear }: { ease?: Easing } = {}
): number {
  const first = stops[0]
  if (!first) return 0
  if (t <= first[0]) return first[1]
  for (let i = 1; i < stops.length; i++) {
    const [t0, v0] = stops[i - 1] as Keyframe
    const [t1, v1] = stops[i] as Keyframe
    if (t < t1) return interpolate(t, [t0, t1], [v0, v1], { ease })
  }
  return (stops[stops.length - 1] as Keyframe)[1]
}
