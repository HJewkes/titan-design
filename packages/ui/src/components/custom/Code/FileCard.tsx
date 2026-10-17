import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { DataRow } from '../../ui/data-row'
import { splitPath } from '../../ui/file-path-label'
import { Pill, type PillTone } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import {
  fileCardRows,
  metricDeltaText,
  metricValueText,
  shorthandMetrics,
  type FileCardMetric,
  type FileCardRow,
} from './file-card-rows'

/** How a file changed against the baseline snapshot. */
export type FileCardStatus = 'added' | 'removed' | 'renamed'

/** Props of {@link FileCard}. */
export interface FileCardProps extends Omit<ViewProps, 'children'> {
  /** The repo-relative path. */
  path: string
  /** Lines of code; the `loc` row. */
  loc?: number
  /** Files that import this one; the `fan_in` row. */
  fanIn?: number
  /** Files this one imports; the `fan_out` row. */
  fanOut?: number
  /** Further metrics. A key the shorthand props already set is dropped. */
  metrics?: readonly FileCardMetric[]
  /** How the file changed against the baseline. Absent means unchanged. */
  status?: FileCardStatus
  /** Tailwind classes merged onto the root. */
  className?: string
}

const STATUS_TONE: Record<FileCardStatus, { label: string; tone: PillTone }> = {
  added: { label: 'Added', tone: 'success' },
  removed: { label: 'Removed', tone: 'error' },
  renamed: { label: 'Renamed', tone: 'info' },
}

const TABULAR = { fontVariant: ['tabular-nums' as const] }

// FilePathLabel's directory is text-tertiary, which misses 4.5:1 on the elevation-3 surface a map
// card sits on; the same split, with the directory in text-secondary, clears it.
function CardPath({ path }: { path: string }) {
  const { dir, base } = splitPath(path)
  return (
    <View className="shrink flex-row flex-wrap items-baseline">
      {dir ? (
        <Typography variant="mono" color="secondary">
          {dir}
        </Typography>
      ) : null}
      <Typography variant="mono" className="text-sm">
        {base}
      </Typography>
    </View>
  )
}

function RowValue({ row }: { row: FileCardRow }) {
  const delta = metricDeltaText(row.delta)
  const hasPercentile = row.percentile !== null && row.percentile !== undefined
  return (
    <View className="flex-row items-baseline gap-inline-sm">
      <Typography variant="mono" className="text-sm" style={TABULAR}>
        {metricValueText(row.value)}
      </Typography>
      {delta !== null && (
        <Typography variant="mono" color="secondary" style={TABULAR}>
          {delta}
        </Typography>
      )}
      {hasPercentile ? (
        <Typography variant="mono" color="secondary" style={TABULAR}>
          {`p${metricValueText(row.percentile ?? null)}`}
        </Typography>
      ) : null}
    </View>
  )
}

/**
 * FileCard: one file's facts for a map card. The path heads it, with its change status; the metric
 * rows follow codewatch's node panel order (lines, functions, complexity, nesting, fan-in, fan-out,
 * instability), then any other metric in the order given.
 *
 * @example
 * <FileCard path="packages/atlas/src/core/router-00.ts" loc={412} fanIn={9} fanOut={4} />
 */
export function FileCard({
  path,
  loc,
  fanIn,
  fanOut,
  metrics = [],
  status,
  className,
  ...props
}: FileCardProps) {
  const rows = fileCardRows([...shorthandMetrics({ loc, fanIn, fanOut }), ...metrics])
  const statusMeta = status === undefined ? undefined : STATUS_TONE[status]
  return (
    <View className={cn('gap-stack-sm', className)} {...props}>
      <View className="flex-row flex-wrap items-center gap-inline-md">
        <CardPath path={path} />
        {statusMeta ? (
          <Pill variant="subtle" size="sm" tone={statusMeta.tone}>
            {statusMeta.label}
          </Pill>
        ) : null}
      </View>
      {rows.length > 0 && (
        <View testID="file-card-rows">
          {rows.map((row) => (
            <DataRow
              key={row.key}
              label={row.label}
              value={<RowValue row={row} />}
              className="px-0 py-inset-xs"
            />
          ))}
        </View>
      )}
    </View>
  )
}
