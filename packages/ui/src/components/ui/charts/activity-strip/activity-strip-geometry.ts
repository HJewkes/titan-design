// Time <-> pixel mapping, column merging and the cursor key map for ActivityStrip. Pure.
import {
  clamp,
  isFiniteNumber,
  resolveBucketMs,
  type CleanBucket,
  type TimeRange,
} from './activity-strip-clean'

export type CursorKey =
  | 'ArrowRight'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowUp'
  | 'PageDown'
  | 'PageUp'
  | 'Home'
  | 'End'

export const PAGE_BUCKETS = 10

export const columnsOf = (length: number) =>
  isFiniteNumber(length) && length > 0 ? Math.floor(length) : 0

/** Pixel offset of a time along the strip, clamped to 0..length. */
export function offsetOfTime(time: number, domain: TimeRange, length: number): number {
  const size = isFiniteNumber(length) && length > 0 ? length : 0
  if (!isFiniteNumber(time) || size === 0) return 0
  return clamp(((time - domain.start) / (domain.end - domain.start)) * size, 0, size)
}

/** Inverse of offsetOfTime: the time at a pixel offset, clamped to the domain. */
export function timeAtOffset(offset: number, domain: TimeRange, length: number): number {
  const size = isFiniteNumber(length) && length > 0 ? length : 0
  if (!isFiniteNumber(offset) || size === 0) return domain.start
  const fraction = clamp(offset / size, 0, 1)
  return domain.start + fraction * (domain.end - domain.start)
}

export interface Column {
  /** Pixel column, an integer in 0..length-1. */
  column: number
  /** The largest bucket count in the column, never the mean. */
  count: number
}

/**
 * Merges buckets into whole pixel columns, keeping the maximum so a one-minute spike survives at any
 * width. Buckets with no positive count draw nothing. At most floor(length) columns come back.
 */
export function columnMax(
  buckets: readonly CleanBucket[],
  domain: TimeRange,
  length: number,
  bucketMs: number
): Column[] {
  const cols = columnsOf(length)
  if (cols === 0) return []
  const maxima = new Map<number, number>()
  for (const bucket of buckets) {
    if (!(bucket.count > 0)) continue
    const from = offsetOfTime(bucket.start, domain, cols)
    const to = offsetOfTime(bucket.start + bucketMs, domain, cols)
    if (to <= 0 && from <= 0 && bucket.start + bucketMs <= domain.start) continue
    if (from >= cols && bucket.start >= domain.end) continue
    const first = clamp(Math.floor(from), 0, cols - 1)
    const last = clamp(Math.max(Math.ceil(to) - 1, first), first, cols - 1)
    for (let column = first; column <= last; column += 1) {
      maxima.set(column, Math.max(maxima.get(column) ?? 0, bucket.count))
    }
  }
  return [...maxima]
    .map(([column, count]) => ({ column, count }))
    .sort((a, b) => a.column - b.column)
}

/** The cleaned bucket whose span holds the time, or null. */
export function bucketAt(
  buckets: readonly CleanBucket[],
  time: number,
  bucketMs: number
): CleanBucket | null {
  if (!isFiniteNumber(time)) return null
  return buckets.find((b) => time >= b.start && time < b.start + bucketMs) ?? null
}

const KEY_BUCKETS: Partial<Record<CursorKey, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  PageDown: PAGE_BUCKETS,
  PageUp: -PAGE_BUCKETS,
}

/**
 * The cursor time after a key. Steps are whole buckets, Home and End go to the ends, and the result is
 * always inside the domain (no wrapping). From a null cursor the first press lands on the domain
 * start, except End, which lands on the domain end.
 */
export function stepCursor(
  cursor: number | null | undefined,
  key: CursorKey,
  domain: TimeRange,
  bucketMs: number
): number {
  if (key === 'Home') return domain.start
  if (key === 'End') return domain.end
  if (!isFiniteNumber(cursor)) return domain.start
  const delta = KEY_BUCKETS[key] ?? 0
  return clamp(cursor + delta * resolveBucketMs(bucketMs), domain.start, domain.end)
}
