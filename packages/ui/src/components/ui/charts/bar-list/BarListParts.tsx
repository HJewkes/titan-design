import type { ReactNode } from 'react'
import { View, type DimensionValue, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import { Skeleton } from '../../skeleton'
import { Typography } from '../../typography'
import { resolveColor } from '../../../../theme/resolve-color'
import { formatCompact } from '../../../../utils/number-format'
import type { SilverRedPair } from '../kit/silverRed'
import {
  cleanValue,
  NO_VALUE_TEXT,
  overflowLabel,
  rowLabel,
  type BarListModel,
  type BarListModelRow,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'

export const hiddenFromAssistiveTech = {
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
}

export interface RowViewProps {
  entry: BarListModelRow
  layout: 'inline' | 'stacked'
  size: 'sm' | 'md'
  fill: string
  valueText: string
  secondaryText: string | null
  /** Width of the values cell in characters, the same for every row of a list. */
  valuesChars: number
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

// RN's DimensionValue omits `ch`; react-native-web passes it through to CSS.
// Digits of equal width, so the values column does not jitter between rows.
const TABULAR = { fontVariant: ['tabular-nums' as const] }

function Values({
  valueText,
  secondaryText,
  entry,
  width,
}: Pick<RowViewProps, 'valueText' | 'secondaryText' | 'entry'> & { width?: string }) {
  const { row } = entry
  return (
    <View
      className={cn('flex-row items-baseline gap-inline-sm', width && 'shrink-0 justify-end')}
      style={width ? { width: width as unknown as DimensionValue } : undefined}
      testID="bar-list-values"
    >
      {row.flag ? (
        <Typography variant="caption" color="inherit" className="text-text-error">
          {row.flag.label}
        </Typography>
      ) : null}
      {secondaryText ? (
        <Typography variant="caption" color="secondary">
          {secondaryText}
        </Typography>
      ) : null}
      <Typography variant="mono" color="primary" style={TABULAR}>
        {valueText}
      </Typography>
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
        <View className="flex-row items-baseline justify-between gap-inline-md">
          <View className="flex-1">
            <Label entry={entry} size={size} />
          </View>
          <Values {...props} />
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
      <Values {...props} width={`${props.valuesChars + VALUES_PAD_CHARS}ch`} />
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

// RN's Role union omits 'listitem'; RNW passes it through to the DOM.
const LISTITEM_ROLE = 'listitem' as ViewProps['role']

/** One list item, named in words; its painted content is hidden from assistive tech. */
export function RowItem({ name, children }: { name: string; children: ReactNode }) {
  return (
    <View role={LISTITEM_ROLE} accessibilityLabel={name} testID="bar-list-row">
      {children}
    </View>
  )
}

// The caption parts are not monospace, so the column is sized a character wider than the text.
const VALUES_PAD_CHARS = 1

interface ModelRowProps extends Pick<RowViewProps, 'entry' | 'layout' | 'size'> {
  shownCount: number
  sort: 'descending' | 'none'
  valuesChars: number
  palette: SilverRedPair
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
  valuesChars,
  palette,
  formatValue = formatCompact,
  formatSecondary = formatCompact,
  ...layoutProps
}: ModelRowProps) {
  const { row } = entry
  const value = cleanValue(row.value)
  const secondary = cleanValue(row.secondaryValue)
  const name = rowLabel(
    { row, rank: entry.rank, shownCount, sort },
    { formatValue, formatSecondary }
  )
  return (
    <RowItem name={name}>
      <View {...hiddenFromAssistiveTech}>
        <RowContent
          entry={entry}
          fill={rowFill(row, palette)}
          valueText={value === null ? NO_VALUE_TEXT : formatValue(value, row)}
          secondaryText={secondary === null ? null : formatSecondary(secondary, row)}
          valuesChars={valuesChars}
          {...layoutProps}
        />
      </View>
    </RowItem>
  )
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
