import { formatDurationMs } from '../../../../utils/time-format'
import type { ActivityStripModel } from './activity-strip-types'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** One sentence per case: Empty, Only gaps, One item, and the general span, total, busiest and gaps. */
export function summarizeActivity(model: ActivityStripModel): string {
  const { activeBuckets, totalCount, busiest, gaps, unknownCount, longestGapMs } = model
  const gapText =
    gaps.length === 0
      ? ''
      : `, ${plural(gaps.length, 'gap')}${gaps.length > 1 ? `, longest ${formatDurationMs(longestGapMs)}` : ` of ${formatDurationMs(longestGapMs)}`}`
  const unknownText = unknownCount > 0 ? `, ${plural(unknownCount, 'bucket')} with no count` : ''
  if (activeBuckets === 0) {
    if (gaps.length === 0 && unknownCount === 0) return 'No activity.'
    return `No activity${gapText}${unknownText}.`
  }
  const span = formatDurationMs(model.domain.end - model.domain.start)
  const lead = `Activity over ${span}: ${plural(totalCount, 'event')} in ${plural(activeBuckets, 'active bucket')}`
  const busiestText =
    activeBuckets > 1 && busiest ? `, busiest bucket ${plural(busiest.count, 'event')}` : ''
  return `${lead}${busiestText}${gapText}${unknownText}.`
}
