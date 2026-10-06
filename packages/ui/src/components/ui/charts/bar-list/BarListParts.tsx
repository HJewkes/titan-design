import type { ReactNode } from 'react'
import { View, type DimensionValue } from 'react-native'
import { cn } from '../../../../utils/cn'
import { Skeleton } from '../../skeleton'
import { Typography } from '../../typography'
import { resolveColor } from '../../../../theme/resolve-color'
import { formatCompact } from '../../../../utils/number-format'
import type { ListNavigationItemProps } from '../../../../hooks/useListNavigation'
import type { SilverRedPair } from '../kit/silverRed'
import { hiddenFromAssistiveTech, LISTITEM_ROLE, TABULAR } from './shared'
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
import { TipRow } from './BarListTip'

/** A text a row can print after its bar. */
export type BarListReadout = 'value' | 'flag'

export const ALL_READOUTS: BarListReadout[] = ['value', 'flag']

/** True when `readouts` leaves out a readout, so the rows need a tip to show it. */
export function hidesReadout(readouts: readonly BarListReadout[]): boolean {
  return ALL_READOUTS.some((readout) => !readouts.includes(readout))
}

/** Which trailing cells the rows render: a part some shown row has, and that `readouts` shows. */
export interface BarListColumns {
  value: boolean
  secondary: boolean
  flag: boolean
}

export function resolveColumns(
  chars: BarListColumnChars,
  readouts: readonly BarListReadout[]
): BarListColumns {
  return {
    value: chars.value > 0 && readouts.includes('value'),
    secondary: chars.secondary > 0,
    flag: chars.flag > 0 && readouts.includes('flag'),
  }
}

export interface RowViewProps {
  entry: BarListModelRow
  layout: 'inline' | 'stacked'
  size: 'sm' | 'md'
  fill: string
  texts: ReturnType<typeof rowTexts>
  /** Character width of each trailing cell, the same for every row of a list. */
  columnChars: BarListColumnChars
  columns: BarListColumns
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

// RN's DimensionValue omits `ch`; react-native-web passes it through to CSS. Set on the Text
// itself, `ch` is that text's own font, so the mono column is exact.
const ch = (chars: number) => `${chars}ch` as unknown as DimensionValue
// The caption cells are not monospace, so each is sized a character wider than its text.
const CAPTION_PAD_CHARS = 1

/** The cells after the bar, in the order value, secondary, flag; an absent part leaves its cell empty. */
function Cells({
  texts,
  columnChars,
  columns,
}: Pick<RowViewProps, 'texts' | 'columnChars' | 'columns'>) {
  return (
    <>
      {columns.value ? (
        <Typography
          variant="mono"
          color="primary"
          align="right"
          style={[TABULAR, { minWidth: ch(columnChars.value) }]}
          testID="bar-list-value"
        >
          {texts.value}
        </Typography>
      ) : null}
      {columns.secondary ? (
        <Typography
          variant="caption"
          color="secondary"
          align="right"
          style={[TABULAR, { width: ch(columnChars.secondary + CAPTION_PAD_CHARS) }]}
          testID="bar-list-secondary"
        >
          {texts.secondary}
        </Typography>
      ) : null}
      {columns.flag ? (
        <Typography
          variant="caption"
          color="inherit"
          className="text-text-error leading-normal"
          style={{ width: ch(columnChars.flag + CAPTION_PAD_CHARS) }}
          testID="bar-list-flag"
        >
          {texts.flag}
        </Typography>
      ) : null}
    </>
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
