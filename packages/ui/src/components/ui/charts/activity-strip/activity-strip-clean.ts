// Input cleaning and intensity binning for ActivityStrip. Pure; every time is epoch milliseconds.

export interface ActivityBucket {
  start: number
  count: number | null
}
export interface ActivityGap {
  start: number
  end: number
  label?: string
}
export interface TimeRange {
  start: number
  end: number
}
export type ActivityScale = 'linear' | 'sqrt' | 'log'
export const DEFAULT_BUCKET_MS = 60_000
export const INTENSITY_STEPS = 4

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export interface CleanBucket {
  start: number
  count: number
}
export interface CleanBuckets {
  buckets: CleanBucket[]
  /** Input buckets whose count was null, NaN, infinite or negative. They draw nothing. */
  unknownCount: number
}

/**
 * Drops buckets with a non-finite start, sums duplicate starts, and returns the rest ordered by start.
 * A count that is not a finite number of at least zero is unknown: it adds nothing and is tallied.
 */
export function cleanBuckets(buckets: readonly ActivityBucket[]): CleanBuckets {
  const sums = new Map<number, number>()
  let unknownCount = 0
  for (const bucket of buckets) {
    if (!isFiniteNumber(bucket?.start)) continue
    const known = isFiniteNumber(bucket.count) && bucket.count >= 0
    if (!known) unknownCount += 1
    if (known) sums.set(bucket.start, (sums.get(bucket.start) ?? 0) + (bucket.count as number))
  }
  const cleaned = [...sums]
    .map(([start, count]) => ({ start, count }))
    .sort((a, b) => a.start - b.start)
  return { buckets: cleaned, unknownCount }
}

export function resolveBucketMs(bucketMs: number | undefined): number {
  return isFiniteNumber(bucketMs) && bucketMs > 0 ? bucketMs : DEFAULT_BUCKET_MS
}

const isValidRange = (range: TimeRange | null | undefined): range is TimeRange =>
  !!range && isFiniteNumber(range.start) && isFiniteNumber(range.end) && range.end > range.start

function validGaps(gaps: readonly ActivityGap[]): ActivityGap[] {
  return gaps.filter((gap) => isValidRange(gap))
}

/**
 * The given domain when it is a finite, non-empty range; otherwise the extent of the buckets (each
 * one bucketMs wide) and the gaps; otherwise one bucket starting at zero. Never empty.
 */
export function resolveDomain(
  buckets: readonly CleanBucket[],
  gaps: readonly ActivityGap[],
  bucketMs: number,
  domain?: TimeRange | null
): TimeRange {
  if (isValidRange(domain)) return { start: domain.start, end: domain.end }
  const starts = [...buckets.map((b) => b.start), ...validGaps(gaps).map((g) => g.start)]
  const ends = [...buckets.map((b) => b.start + bucketMs), ...validGaps(gaps).map((g) => g.end)]
  if (starts.length === 0) return { start: 0, end: bucketMs }
  const start = Math.min(...starts)
  const end = Math.max(...ends)
  return end > start ? { start, end } : { start, end: start + bucketMs }
}

/** Drops inverted and empty gaps, clips to the domain, then merges overlapping or touching ones. */
export function cleanGaps(gaps: readonly ActivityGap[], domain: TimeRange): ActivityGap[] {
  const clipped = validGaps(gaps)
    .map((gap) => ({
      ...gap,
      start: Math.max(gap.start, domain.start),
      end: Math.min(gap.end, domain.end),
    }))
    .filter((gap) => gap.end > gap.start)
    .sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: ActivityGap[] = []
  for (const gap of clipped) {
    const last = merged[merged.length - 1]
    if (last && gap.start <= last.end) last.end = Math.max(last.end, gap.end)
    else merged.push({ ...gap })
  }
  return merged
}

/** The shared ceiling when it is a positive number, else the largest count, never below 1. */
export function resolveMaxCount(buckets: readonly CleanBucket[], maxCount?: number): number {
  if (isFiniteNumber(maxCount) && maxCount > 0) return maxCount
  const largest = buckets.reduce((max, b) => Math.max(max, b.count), 0)
  return largest > 0 ? largest : 1
}

/**
 * The intensity step, 0 for nothing and 1..steps otherwise. A positive count is never 0; a count at
 * or above the ceiling is the top step; zero, null and NaN are 0.
 */
export function binCount(
  count: number | null | undefined,
  max: number,
  scale: ActivityScale = 'sqrt',
  steps: number = INTENSITY_STEPS
): number {
  if (!isFiniteNumber(count) || count <= 0) return 0
  const top = Math.max(1, Math.floor(steps))
  const ceiling = isFiniteNumber(max) && max > 0 ? max : count
  const ratio = Math.min(1, count / ceiling)
  const shaped =
    scale === 'linear'
      ? ratio
      : scale === 'log'
        ? Math.log1p(count) / Math.log1p(Math.max(count, ceiling))
        : Math.sqrt(ratio)
  return clamp(Math.ceil(shaped * top), 1, top)
}
