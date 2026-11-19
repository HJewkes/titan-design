// Shapes of the assembled ActivityStrip model, apart from the builder so the summary can import them.
import type {
  ActivityBucket,
  ActivityGap,
  ActivityScale,
  CleanBucket,
  TimeRange,
} from './activity-strip-clean'
import type { Column } from './activity-strip-geometry'

export interface GapMark {
  offset: number
  size: number
  label?: string
}

export interface ActivityStripModel {
  domain: TimeRange
  bucketMs: number
  length: number
  maxCount: number
  scale: ActivityScale
  buckets: CleanBucket[]
  gaps: ActivityGap[]
  columns: Array<Column & { step: number }>
  gapMarks: GapMark[]
  unknownCount: number
  totalCount: number
  activeBuckets: number
  busiest: CleanBucket | null
  longestGapMs: number
}

export interface ActivityStripModelInput {
  buckets: readonly ActivityBucket[]
  gaps?: readonly ActivityGap[]
  domain?: TimeRange | null
  bucketMs?: number
  maxCount?: number
  scale?: ActivityScale
  length: number
}
