// Timing arithmetic in seconds: delays and phase windows, never a clock read.
import { linear, type Easing } from './easing'
import { MOTION } from './tokens'

/** Options for `stagger`. */
export interface StaggerOptions {
  /** Number of items in the cascade. */
  count: number
  /** Seconds between neighbours, before the cap. Default `MOTION.video.staggerEach`. */
  each?: number
  /** Index the stagger radiates from. Default 0. */
  from?: number
}

/**
 * Delay in seconds for item `index` of `count`: its distance from `from`, times `each`. The step
 * shrinks when needed so no item starts later than `MOTION.video.staggerMax`. An index outside
 * `[0, count)` throws a `RangeError`.
 */
export function stagger(
  index: number,
  { count, each = MOTION.video.staggerEach, from = 0 }: StaggerOptions
): number {
  if (!(index >= 0 && index < count)) {
    throw new RangeError(`stagger: index ${index} is outside [0, ${count})`)
  }
  const maxDistance = Math.max(from, count - 1 - from)
  const step = maxDistance > 0 ? Math.min(each, MOTION.video.staggerMax / maxDistance) : each
  return Math.min(Math.abs(index - from) * step, MOTION.video.staggerMax)
}

/** Options for `sequence`. */
export interface SequenceOptions {
  /** Start of the first item, in seconds. Default 0. */
  startS?: number
  /** Seconds each item starts before its predecessor ends. Default 0, so phases abut. */
  overlapS?: number
}

/** An item placed by `sequence`, with its window in seconds. */
export type Sequenced<T> = T & { startS: number; endS: number }

/** What `sequence` returns. */
export interface SequenceResult<T> {
  /** The input items in order, each with `startS` and `endS`. */
  items: Sequenced<T>[]
  /** Seconds from the first start to the last end. */
  totalS: number
}

function assertSequenceable(items: readonly { durationS: number }[], overlapS: number): void {
  if (!(overlapS >= 0)) throw new RangeError(`sequence: overlapS must be >= 0, got ${overlapS}`)
  items.forEach(({ durationS }, i) => {
    if (!(durationS >= 0)) throw new RangeError(`sequence: item ${i} has durationS ${durationS}`)
    const previous = items[i - 1]
    if (previous && overlapS > Math.min(previous.durationS, durationS)) {
      throw new RangeError(`sequence: overlapS ${overlapS} exceeds a neighbour of item ${i}`)
    }
  })
}

/**
 * Lays items end to end: item i starts `overlapS` before item i-1 ends. An overlap longer than either
 * neighbour, a negative overlap or a negative duration throws, since each is an authoring error.
 */
export function sequence<T extends { durationS: number }>(
  items: readonly T[],
  { startS = 0, overlapS = 0 }: SequenceOptions = {}
): SequenceResult<T> {
  assertSequenceable(items, overlapS)
  const placed: Sequenced<T>[] = []
  let cursor = startS
  for (const item of items) {
    const itemStartS = placed.length === 0 ? cursor : cursor - overlapS
    cursor = itemStartS + item.durationS
    placed.push({ ...item, startS: itemStartS, endS: cursor })
  }
  return { items: placed, totalS: cursor - startS }
}

/** A window of time, in seconds. */
export interface Window {
  /** Seconds at which the window opens. */
  startS: number
  /** Seconds at which the window closes. */
  endS: number
}

/** Options for `lagged`. */
export interface LaggedOptions {
  /** Seconds the whole group takes; no item ends later. */
  totalS: number
  /** Each item starts this fraction of an item's length after its predecessor. 0 is together, 1 abuts. */
  lagRatio: number
  /** Eases the group's time, not each item's progress. Default `linear`. */
  ease?: Easing
}

/** What `lagged` returns. */
export interface Lagged {
  /** Seconds each item lasts. */
  itemS: number
  /** Each item's window, in order. */
  items: Window[]
  /** Item `index`'s progress in [0, 1] at group time `t`, after the group ease. */
  progress(t: number, index: number): number
}

function assertSeconds(name: string, s: number): void {
  if (!(s >= 0 && s < Infinity)) throw new RangeError(`${name} must be finite and >= 0, got ${s}`)
}

function windowProgress(t: number, { startS, endS }: Window): number {
  if (endS <= startS) return t < startS ? 0 : 1
  return Math.min(1, Math.max(0, (t - startS) / (endS - startS)))
}

/**
 * Fits `n` overlapping items into `totalS`, each starting `lagRatio` of an item's length after the
 * last (Manim's LaggedStart). No window ends past `totalS`. Throws a `RangeError` for a non-integer
 * or negative `n`, or a negative or non-finite `totalS` or `lagRatio`.
 */
export function lagged(n: number, { totalS, lagRatio, ease = linear }: LaggedOptions): Lagged {
  if (!(Number.isInteger(n) && n >= 0))
    throw new RangeError(`lagged: n must be an integer >= 0, got ${n}`)
  assertSeconds('lagged: totalS', totalS)
  assertSeconds('lagged: lagRatio', lagRatio)
  const itemS = n > 0 ? totalS / (1 + (n - 1) * lagRatio) : 0
  const items = Array.from({ length: n }, (_, i) => {
    const startS = Math.min(totalS, i * lagRatio * itemS)
    return { startS, endS: Math.min(totalS, startS + itemS) }
  })
  const progress = (t: number, index: number) => {
    const item = items[index]
    if (!item) throw new RangeError(`lagged: index ${index} is outside [0, ${n})`)
    const groupT = totalS > 0 ? ease(Math.min(1, Math.max(0, t / totalS))) * totalS : t
    return windowProgress(groupT, item)
  }
  return { itemS, items, progress }
}

/** A composed stretch of time: its length, and each leaf's absolute window in input order. */
export interface Span {
  /** Seconds from the span's start to its last end. */
  durationS: number
  /** Each leaf's window, depth first, measured from the span's start. */
  windows: Window[]
}

function shift(windows: readonly Window[], byS: number): Window[] {
  return windows.map(({ startS, endS }) => ({ startS: startS + byS, endS: endS + byS }))
}

/** A leaf span of `durationS` seconds. Throws a `RangeError` for a negative or non-finite length. */
export function span(durationS: number): Span {
  assertSeconds('span: durationS', durationS)
  return { durationS, windows: [{ startS: 0, endS: durationS }] }
}

/** Lays spans end to end. */
export function chain(...spans: Span[]): Span {
  const { items, totalS } = sequence(spans)
  return { durationS: totalS, windows: items.flatMap((item) => shift(item.windows, item.startS)) }
}

/** Starts spans together; lasts as long as the longest. */
export function all(...spans: Span[]): Span {
  return {
    durationS: Math.max(0, ...spans.map((s) => s.durationS)),
    windows: spans.flatMap((s) => s.windows),
  }
}

/** Starts `inner` after `s` seconds. Throws a `RangeError` for a negative or non-finite delay. */
export function delay(s: number, inner: Span): Span {
  assertSeconds('delay: s', s)
  return { durationS: s + inner.durationS, windows: shift(inner.windows, s) }
}
