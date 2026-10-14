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

/** How a `keyframes` stop leaves its value. */
export interface KeyframeOptions {
  /** Seconds the value holds before the segment to the next stop starts easing. Default 0. */
  holdS?: number
  /** `false` holds the value until the next stop, then steps to it. Default true. */
  connectedRight?: boolean
}

/** A `[t, value]` stop for `keyframes`, with optional `KeyframeOptions`. */
export type Keyframe = readonly [t: number, value: number, options?: KeyframeOptions]

/** Options for `keyframes`. */
export interface KeyframesOptions {
  /** One easing for every segment, or one per segment (segment `i` runs from stop `i` to `i + 1`). */
  ease?: Easing | readonly Easing[]
}

function assertStops(stops: readonly Keyframe[]): void {
  stops.forEach(([t, value, { holdS = 0 } = {}], i) => {
    if (!Number.isFinite(t) || !Number.isFinite(value)) {
      throw new RangeError(`keyframes: stop ${i} is [${t}, ${value}]`)
    }
    const previous = stops[i - 1]
    if (previous && t <= previous[0])
      throw new RangeError(`keyframes: stop ${i} at ${t} is not after ${previous[0]}`)
    const next = stops[i + 1]
    if (!(holdS >= 0 && holdS < Infinity) || (next && t + holdS > next[0])) {
      throw new RangeError(
        `keyframes: stop ${i} holdS ${holdS} is negative or runs past the next stop`
      )
    }
  })
}

function segmentValue(
  t: number,
  [t0, v0, options = {}]: Keyframe,
  [t1, v1]: Keyframe,
  ease: Easing
): number {
  const holdEndS = t0 + (options.holdS ?? 0)
  if (options.connectedRight === false || t <= holdEndS) return v0
  return interpolate(t, [holdEndS, t1], [v0, v1], { ease })
}

/**
 * Piecewise `interpolate` through stops sorted by t: holds the first value before the first stop and the
 * last after the last. A stop's `holdS` keeps its value that long before easing to the next stop, and
 * `connectedRight: false` keeps it until the next stop, then steps. Throws a `RangeError` for a
 * non-finite stop, stops not strictly increasing in t (express a jump with `connectedRight: false`),
 * a negative hold or one past the next stop, or an `ease` array shorter than the segment count.
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
  assertStops(stops)
  const first = stops[0]
  if (!first) return 0
  if (t <= first[0]) return first[1]
  for (let i = 1; i < stops.length; i++) {
    const stop = stops[i] as Keyframe
    const segmentEase = typeof ease === 'function' ? ease : (ease[i - 1] as Easing)
    if (t < stop[0]) return segmentValue(t, stops[i - 1] as Keyframe, stop, segmentEase)
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
