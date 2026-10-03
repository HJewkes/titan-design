import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import type { ColorToken } from '../../../../theme/resolve-color'
import { EmptyState } from '../../empty-state'
import { ModelRow, OverflowRow, SkeletonRows } from './BarListParts'
import {
  buildBarListModel,
  readoutName,
  normalizeMaxRows,
  type BarListModel,
  type BarListRow,
  type BarListRowContext,
} from './bar-list-model'

export type { BarListModel, BarListRow, BarListRowContext } from './bar-list-model'

export interface BarListProps extends Omit<ViewProps, 'children'> {
  rows: BarListRow[]
  /** Names the list; the summary is appended to it for assistive tech. */
  accessibilityLabel: string
  /** Value that fills a whole bar. Defaults to the largest value. */
  max?: number
  /** `descending` ranks by value; `none` keeps input order (a funnel). */
  sort?: 'descending' | 'none'
  /** Rows shown before the rest fold into one overflow row. */
  maxRows?: number
  layout?: 'inline' | 'stacked'
  size?: 'sm' | 'md'
  /** Label column width in px, inline layout only. */
  labelWidth?: number
  /** Bar fill for every row without its own `color`. Defaults to `brand-primary`. */
  color?: ColorToken
  formatValue?: (value: number, row: BarListRow) => string
  formatSecondary?: (value: number, row: BarListRow) => string
  formatOverflow?: (hiddenCount: number, hiddenTotal: number) => string
  formatRowLabel?: (row: BarListRow, context: BarListRowContext) => string
  summarize?: (model: BarListModel) => string
  onRowPress?: (row: BarListRow) => void
  isLoading?: boolean
  isDisabled?: boolean
  emptyState?: ReactNode
  className?: string
}

// RN's Role union omits 'list'; RNW passes it through to the DOM.
const LIST_ROLE = 'list' as ViewProps['role']
const DEFAULT_LABEL_WIDTH = 96
const SKELETON_ROWS = 5

/**
 * BarList: a ranked horizontal bar list. Each row is a label, a bar sized as a fraction of the
 * largest value (or `max`), a value and an optional secondary value. Rows beyond `maxRows` fold
 * into one overflow row.
 *
 * @example
 * <BarList accessibilityLabel="Tool calls" rows={[{ id: 'bash', label: 'Bash', value: 412 }]} />
 */
export function BarList({
  rows,
  accessibilityLabel,
  max,
  sort = 'descending',
  maxRows,
  layout = 'inline',
  size = 'md',
  labelWidth = DEFAULT_LABEL_WIDTH,
  color = 'brand-primary',
  formatValue,
  formatSecondary,
  formatOverflow,
  formatRowLabel,
  summarize,
  onRowPress,
  isLoading = false,
  isDisabled = false,
  emptyState,
  className,
  ...props
}: BarListProps) {
  const model = useMemo(
    () => buildBarListModel(rows, { max, sort, maxRows, formatValue }),
    [rows, max, sort, maxRows, formatValue]
  )

  if (isLoading) {
    const count = Math.min(normalizeMaxRows(maxRows), SKELETON_ROWS)
    return (
      <View
        role={LIST_ROLE}
        accessibilityLabel={accessibilityLabel}
        aria-busy
        className={className}
        {...props}
      >
        <SkeletonRows count={count} size={size} />
      </View>
    )
  }

  if (model.inputCount === 0) {
    return (
      <View className={className} {...props}>
        {emptyState ?? <EmptyState title="No data" className="py-4" />}
      </View>
    )
  }

  return (
    <View
      role={LIST_ROLE}
      accessibilityLabel={readoutName(accessibilityLabel, model, summarize)}
      className={cn('gap-stack-sm', className)}
      {...props}
    >
      {model.rows.map((entry) => (
        <ModelRow
          key={`${entry.row.id}:${entry.index}`}
          entry={entry}
          shownCount={model.shownCount}
          layout={layout}
          size={size}
          labelWidth={labelWidth}
          color={color}
          formatValue={formatValue}
          formatSecondary={formatSecondary}
          formatRowLabel={formatRowLabel}
          onRowPress={onRowPress}
          isDisabled={isDisabled}
        />
      ))}
      <OverflowRow model={model} formatOverflow={formatOverflow} />
    </View>
  )
}
