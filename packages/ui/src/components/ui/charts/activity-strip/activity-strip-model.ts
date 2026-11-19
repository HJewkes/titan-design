// Pure model for ActivityStrip: assembles the cleaned buckets, gaps, columns and totals.
import {
  binCount,
  cleanBuckets,
  cleanGaps,
  resolveBucketMs,
  resolveDomain,
  resolveMaxCount,
  type CleanBucket,
} from './activity-strip-clean'
import type { ActivityStripModel, ActivityStripModelInput } from './activity-strip-types'
import { columnMax, columnsOf, offsetOfTime } from './activity-strip-geometry'

export * from './activity-strip-clean'
export * from './activity-strip-geometry'
export type * from './activity-strip-types'
export { summarizeActivity } from './activity-strip-summary'

const busiestOf = (buckets: readonly CleanBucket[]): CleanBucket | null =>
  buckets.reduce<CleanBucket | null>(
    (best, b) => (b.count > 0 && (!best || b.count > best.count) ? b : best),
    null
  )

export function buildActivityStripModel(input: ActivityStripModelInput): ActivityStripModel {
  const bucketMs = resolveBucketMs(input.bucketMs)
  const { buckets, unknownCount } = cleanBuckets(input.buckets ?? [])
  const domain = resolveDomain(buckets, input.gaps ?? [], bucketMs, input.domain)
  const gaps = cleanGaps(input.gaps ?? [], domain)
  const maxCount = resolveMaxCount(buckets, input.maxCount)
  const scale = input.scale ?? 'sqrt'
  const size = columnsOf(input.length)
  const columns = columnMax(buckets, domain, size, bucketMs).map((c) => ({
    ...c,
    step: binCount(c.count, maxCount, scale),
  }))
  const gapMarks = gaps.map((gap) => {
    const offset = offsetOfTime(gap.start, domain, size)
    return { offset, size: offsetOfTime(gap.end, domain, size) - offset, label: gap.label }
  })
  const inDomain = buckets.filter((b) => b.start < domain.end && b.start + bucketMs > domain.start)
  return {
    domain,
    bucketMs,
    length: size,
    maxCount,
    scale,
    buckets,
    gaps,
    columns,
    gapMarks,
    unknownCount,
    totalCount: inDomain.reduce((sum, b) => sum + b.count, 0),
    activeBuckets: inDomain.filter((b) => b.count > 0).length,
    busiest: busiestOf(inDomain),
    longestGapMs: gaps.reduce((max, g) => Math.max(max, g.end - g.start), 0),
  }
}
