// The sentence a LineChart image is named by (TD-34 S3): metric, latest value, change over the
// comparable span, gaps and index changes. One sentence per chart, or one per facet.
import type { CleanSeries, FinitePoint, LineSummaryOptions } from './types'

const defaultFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const defaultFormatY = (y: number): string => defaultFormat.format(y)

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

/** Finite points sharing the latest finite point's `segmentKey`: the span a trend may cross. */
function comparableSpan(clean: CleanSeries): FinitePoint[] {
  const finite = clean.segments.flat()
  const latestKey = finite[finite.length - 1]?.point.segmentKey
  let start = finite.length
  while (start > 0 && finite[start - 1]?.point.segmentKey === latestKey) start--
  return finite.slice(start)
}

function trendClause(span: FinitePoint[], format: (y: number) => string): string {
  const first = span[0]
  const last = span[span.length - 1]
  if (!first || !last || span.length < 2) return 'one value, no trend'
  const change = last.y - first.y
  if (change === 0) return `unchanged from ${format(first.y)}`
  return `${change > 0 ? 'up' : 'down'} ${format(Math.abs(change))} from ${format(first.y)}`
}

function seriesSentence(clean: CleanSeries, format: (y: number) => string): string {
  const span = comparableSpan(clean)
  const latest = span[span.length - 1]
  const clauses = latest ? [`latest ${format(latest.y)}`, trendClause(span, format)] : ['no values']
  if (clean.indexChanges > 0) {
    clauses.push(`not comparable across ${plural(clean.indexChanges, 'index change')}`)
  }
  if (clean.gaps > 0) clauses.push(plural(clean.gaps, 'gap'))
  if (clean.dropped > 0) clauses.push(`${plural(clean.dropped, 'unreadable value')} skipped`)
  return `${clean.series.label}: ${clauses.join(', ')}.`
}

/**
 * Names the chart: the metric, then per series its latest value and its change since the last
 * index change. One finite value claims no trend. No series or no finite value says no data.
 */
export function summarizeLines(
  cleaned: readonly CleanSeries[],
  options: LineSummaryOptions
): string {
  const format = options.formatY ?? defaultFormatY
  const metric = options.unit ? `${options.metricLabel} (${options.unit})` : options.metricLabel
  const hasValue = cleaned.some((clean) => clean.segments.length > 0)
  if (!hasValue) return `${metric}: no data.`
  return [`${metric}.`, ...cleaned.map((clean) => seriesSentence(clean, format))].join(' ')
}

/** One sentence per facet, in facet order. */
export function summarizeFacets(
  facets: readonly (readonly CleanSeries[])[],
  options: LineSummaryOptions
): string[] {
  return facets.map((facet) => summarizeLines(facet, options))
}
