// FileCard's rows, ordered as codewatch's node panel orders its metrics. Pure; no React.
import { formatTrimmedDecimal } from '../../../utils/number-format'

/** One metric of a file. `null` means it was not measured. */
export interface FileCardMetric {
  /** Stable key, for example `cyclomatic_max`. Known keys take codewatch's place and label. */
  key: string
  /** Display name. Defaults to the known key's label, else the key. */
  label?: string
  /** The measured value; `null` when it was not measured. */
  value: number | null
  /** The file's rank among its peers, 0..100. */
  percentile?: number | null
  /** Change against the baseline. */
  delta?: number | null
}

/** A rendered row: the metric with its label resolved. */
export type FileCardRow = FileCardMetric & { label: string }

/** codewatch's panel order (`template-script-panel.ts`); unknown keys follow in input order. */
export const FILE_CARD_METRIC_ORDER = [
  'loc',
  'function_count',
  'cyclomatic_max',
  'cyclomatic_sum',
  'max_nesting_depth',
  'fan_in',
  'fan_out',
  'instability',
] as const

const KNOWN_LABELS: Record<(typeof FILE_CARD_METRIC_ORDER)[number], string> = {
  loc: 'Lines',
  function_count: 'Functions',
  cyclomatic_max: 'Max complexity',
  cyclomatic_sum: 'Total complexity',
  max_nesting_depth: 'Max nesting',
  fan_in: 'Fan-in',
  fan_out: 'Fan-out',
  instability: 'Instability',
}

const rankOf = (key: string): number => {
  const i = (FILE_CARD_METRIC_ORDER as readonly string[]).indexOf(key)
  return i === -1 ? FILE_CARD_METRIC_ORDER.length : i
}

const labelOf = (metric: FileCardMetric): string =>
  metric.label ?? KNOWN_LABELS[metric.key as keyof typeof KNOWN_LABELS] ?? metric.key

/** The shorthand props of FileCard, as metrics. They come first, so a duplicate key in `metrics` loses. */
export function shorthandMetrics(props: {
  loc?: number
  fanIn?: number
  fanOut?: number
}): FileCardMetric[] {
  const entries: [string, number | undefined][] = [
    ['loc', props.loc],
    ['fan_in', props.fanIn],
    ['fan_out', props.fanOut],
  ]
  return entries.flatMap(([key, value]) => (value === undefined ? [] : [{ key, value }]))
}

/** One row per key, first occurrence kept, in codewatch's order; ties keep input order. */
export function fileCardRows(metrics: readonly FileCardMetric[]): FileCardRow[] {
  const seen = new Set<string>()
  const unique = metrics.filter(({ key }) => !seen.has(key) && Boolean(seen.add(key)))
  return unique
    .map((metric, i) => ({ metric, i }))
    .sort((a, b) => rankOf(a.metric.key) - rankOf(b.metric.key) || a.i - b.i)
    .map(({ metric }) => ({ ...metric, label: labelOf(metric) }))
}

const DECIMALS = 2

/** The value's text: integers bare, others to two places; not measured is a dash. */
export function metricValueText(value: number | null): string {
  return value === null ? '—' : formatTrimmedDecimal(value, DECIMALS)
}

/** The delta's text, `+12` or `-4` as StatusMark signs it; zero and missing have none. */
export function metricDeltaText(delta: number | null | undefined): string | null {
  if (delta === null || delta === undefined || delta === 0) return null
  return `${delta > 0 ? '+' : '-'}${formatTrimmedDecimal(Math.abs(delta), DECIMALS)}`
}
