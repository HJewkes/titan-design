import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Skeleton } from '../../skeleton'
import { Typography } from '../../typography'
import { resolveColor } from '../../../../theme/resolve-color'
import { formatCompact } from '../../../../utils/number-format'
import type { ListNavigationItemProps } from '../../../../hooks/useListNavigation'
import type { SilverRedPair } from '../kit/silverRed'
import { hiddenFromAssistiveTech, LISTITEM_ROLE } from './shared'
import { Bar } from './BarListBar'
import {
  overflowLabel,
  rowLabel,
  rowTexts,
  rowTip,
  type BarListColumnChars,
  type BarListModel,
  type BarListModelMarker,
  type BarListModelRow,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'
import { Cells, type BarListColumns, type CellsProps } from './BarListCells'
import { TipRow } from './BarListTip'

export { hiddenFromAssistiveTech }

export interface RowViewProps extends CellsProps {
  entry: BarListModelRow
  layout: 'inline' | 'stacked'
  size: 'sm' | 'md'
  fill: string
  /** Where the reference line sits on the track, or null when none is drawn. */
  markerFraction: number | null
}

function Label({ entry, size }: { entry: BarListModelRow; size: 'sm' | 'md' }) {
  return (
    <Typography variant={size === 'sm' ? 'caption' : 'body2'} color="primary" truncate>
      {entry.row.label}
    </Typography>
  )
}

export function RowContent(props: RowViewProps) {
  const { entry, layout, size, fill, markerFraction } = props
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
          <Bar fraction={entry.fraction} fill={fill} size={size} markerFraction={markerFraction} />
        </View>
      </View>
    )
  }
  return (
    <View className="flex-row items-center gap-inline-md">
      <View className="w-24">
        <Label entry={entry} size={size} />
      </View>
      <Bar fraction={entry.fraction} fill={fill} size={size} markerFraction={markerFraction} />
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
  marker: BarListModelMarker | null
  palette: SilverRedPair
  /** The row's place in the roving tab stop; null renders a static row with no tip. */
  tipItem: ListNavigationItemProps | null
  formatValue?: BarListValueFormatter
  formatSecondary?: (value: number, row: BarListRow) => string
}

// A row's own `color` wins; otherwise the flag decides, and both flag tones share one red.
function rowFill(row: BarListRow, palette: SilverRedPair): string {
  if (row.color) return resolveColor(row.color)
  return row.flag ? palette.flag : palette.neutral
}

/** One data row: derives its texts, fill and accessible name, then paints them. */
export function ModelRow({
  entry,
  shownCount,
  sort,
  columnChars,
  columns,
  marker,
  palette,
  tipItem,
  formatValue = formatCompact,
  formatSecondary = formatCompact,
  ...layoutProps
}: ModelRowProps) {
  const { row } = entry
  const formatters = { formatValue, formatSecondary }
  const reachedMarker = marker && entry.reachesMarker ? marker.label : null
  const name = rowLabel({ row, rank: entry.rank, shownCount, sort, reachedMarker }, formatters)
  const content = (
    <View {...hiddenFromAssistiveTech}>
      <RowContent
        entry={entry}
        fill={rowFill(row, palette)}
        texts={rowTexts(row, formatters)}
        columnChars={columnChars}
        columns={columns}
        markerFraction={marker?.fraction ?? null}
        {...layoutProps}
      />
    </View>
  )
  if (tipItem) {
    return (
      <TipRow name={name} tip={rowTip(row, formatValue, marker)} item={tipItem}>
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
