import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../../utils/cn'
import { Skeleton } from '../../skeleton'
import { Typography } from '../../typography'
import { resolveColor } from '../../../../theme/resolve-color'
import { formatCompact } from '../../../../utils/number-format'
import type { SilverRedScheme } from '../kit/silverRed'
import { hiddenFromAssistiveTech, LISTITEM_ROLE } from './shared'
import {
  overflowLabel,
  rowLabel,
  rowTexts,
  rowTip,
  type BarListColumnChars,
  type BarListModel,
  type BarListModelRow,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'
import { Cells, type BarListColumns, type CellsProps } from './BarListCells'
import { TipRow, type BarListTipItem } from './BarListTip'

export interface RowViewProps extends CellsProps {
  entry: BarListModelRow
  layout: 'inline' | 'stacked'
  size: 'sm' | 'md'
  fill: string
}

function Bar({ fraction, fill, size }: { fraction: number; fill: string; size: 'sm' | 'md' }) {
  return (
    <View
      className={cn(
        'flex-1 overflow-hidden rounded-full bg-hairline',
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}
      testID="bar-list-track"
      {...hiddenFromAssistiveTech}
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${fraction * 100}%`, backgroundColor: fill }}
        testID="bar-list-fill"
      />
    </View>
  )
}

function Label({ entry, size }: { entry: BarListModelRow; size: 'sm' | 'md' }) {
  return (
    <Typography variant={size === 'sm' ? 'caption' : 'body2'} color="primary" truncate>
      {entry.row.label}
    </Typography>
  )
}

export function RowContent(props: RowViewProps) {
  const { entry, layout, size, fill } = props
  if (layout === 'stacked') {
    return (
      <View className="gap-1">
        <View className="flex-row items-baseline gap-inline-md">
          <View className="flex-1">
            <Label entry={entry} size={size} />
          </View>
          <Cells {...props} />
        </View>
        {entry.row.description ? (
          <Typography variant="caption" color="secondary" truncate>
            {entry.row.description}
          </Typography>
        ) : null}
        <View className="flex-row">
          <Bar fraction={entry.fraction} fill={fill} size={size} />
        </View>
      </View>
    )
  }
  return (
    <View className="flex-row items-center gap-inline-md">
      <View className="w-24">
        <Label entry={entry} size={size} />
      </View>
      <Bar fraction={entry.fraction} fill={fill} size={size} />
      <Cells {...props} />
    </View>
  )
}

export function SkeletonRows({ count, size }: { count: number; size: 'sm' | 'md' }) {
  return (
    <View className="gap-stack-sm">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rounded" width="100%" height={size === 'sm' ? 16 : 20} />
      ))}
    </View>
  )
}

/** One list item, named in words; its painted content is hidden from assistive tech. */
export function RowItem({ name, children }: { name: string; children: ReactNode }) {
  return (
    <View role={LISTITEM_ROLE} accessibilityLabel={name} testID="bar-list-row">
      {children}
    </View>
  )
}

interface ModelRowProps extends Pick<RowViewProps, 'entry' | 'layout' | 'size'> {
  shownCount: number
  sort: 'descending' | 'none'
  columnChars: BarListColumnChars
  columns: BarListColumns
  palette: SilverRedScheme
  /** The row's place in the roving tab stop; null renders a static row with no tip. */
  tipItem: BarListTipItem | null
  formatValue?: BarListValueFormatter
  formatSecondary?: (value: number, row: BarListRow) => string
}

// A row's own `color` wins; otherwise the flag's tone decides: `warning` is near, `error` is over.
function rowFill(row: BarListRow, palette: SilverRedScheme): string {
  if (row.color) return resolveColor(row.color)
  if (!row.flag) return palette.neutral
  return row.flag.tone === 'warning' ? palette.near : palette.over
}

/** One data row: derives its texts, fill and accessible name, then paints them. */
export function ModelRow({
  entry,
  shownCount,
  sort,
  columnChars,
  columns,
  palette,
  tipItem,
  formatValue = formatCompact,
  formatSecondary = formatCompact,
  ...layoutProps
}: ModelRowProps) {
  const { row } = entry
  const formatters = { formatValue, formatSecondary }
  const name = rowLabel({ row, rank: entry.rank, shownCount, sort }, formatters)
  const content = (
    <View {...hiddenFromAssistiveTech}>
      <RowContent
        entry={entry}
        fill={rowFill(row, palette)}
        texts={rowTexts(row, formatters)}
        columnChars={columnChars}
        columns={columns}
        {...layoutProps}
      />
    </View>
  )
  if (tipItem) {
    return (
      <TipRow name={name} tip={rowTip(row, formatValue)} item={tipItem}>
        {content}
      </TipRow>
    )
  }
  return <RowItem name={name}>{content}</RowItem>
}

/** The text-only row that stands for every row past the cap. */
export function OverflowRow({ model }: { model: BarListModel }) {
  if (model.hiddenCount === 0) return null
  return (
    <View role={LISTITEM_ROLE} testID="bar-list-overflow">
      <Typography variant="caption" color="secondary">
        {overflowLabel(model)}
      </Typography>
    </View>
  )
}
