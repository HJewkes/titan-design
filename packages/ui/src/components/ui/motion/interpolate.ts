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

/** Options for `keyframes`. */
export interface KeyframesOptions {
  /** One easing for every segment, or one per segment (segment `i` runs from stop `i` to `i + 1`). */
  ease?: Easing | readonly Easing[]
}

/**
 * Piecewise `interpolate` through stops sorted by t: holds the first value before the first stop and the
 * last after the last. Two stops at one t jump to the second. An `ease` array shorter than the
 * segment count throws a `RangeError`.
 */
export function keyframes(
  t: number,
  stops: readonly Keyframe[],
  { ease = linear }: KeyframesOptions = {}
): number {
  const segments = Math.max(0, stops.length - 1)
  if (typeof ease !== 'function' && ease.length < segments) {
    throw new RangeError(`keyframes: ${segments} segments but ${ease.length} easings`)
  }
  const first = stops[0]
  if (!first) return 0
  if (t <= first[0]) return first[1]
  for (let i = 1; i < stops.length; i++) {
    const [t0, v0] = stops[i - 1] as Keyframe
    const [t1, v1] = stops[i] as Keyframe
    const segmentEase = typeof ease === 'function' ? ease : (ease[i - 1] as Easing)
    if (t < t1) return interpolate(t, [t0, t1], [v0, v1], { ease: segmentEase })
  }
  return (stops[stops.length - 1] as Keyframe)[1]
}

/**
 * `interpolate` for a scale factor, lerped in signed-area space (`s * |s|`) so a grow looks even: at
 * the midpoint of 0 to 1 the area is half, and the scale is `sqrt(0.5)`. Negative scales (flips)
 * keep their sign, passing through 0 where the areas cancel.
 */
export function interpolateScale(
  t: number,
  input: readonly [number, number],
  [s0, s1]: readonly [number, number],
  options: InterpolateOptions = {}
): number {
  const area = interpolate(t, input, [s0 * Math.abs(s0), s1 * Math.abs(s1)], options)
  return Math.sign(area) * Math.sqrt(Math.abs(area))
}
