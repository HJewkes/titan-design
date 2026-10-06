import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import { EmptyState } from '../../empty-state'
import { useSurfaceMode } from '../../surface'
import { silverRed } from '../kit/silverRed'
import { ModelRow, OverflowRow, SkeletonRows } from './BarListParts'
import {
  buildBarListModel,
  readoutName,
  normalizeMaxRows,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'

export type { BarListRow, BarListValueFormatter } from './bar-list-model'

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
  /** Formats each row's value, and the total of the rows past the cap (called without a row). */
  formatValue?: BarListValueFormatter
  formatSecondary?: (value: number, row: BarListRow) => string
  isLoading?: boolean
  emptyState?: ReactNode
  className?: string
}

// RN's Role union omits 'list'; RNW passes it through to the DOM.
const LIST_ROLE = 'list' as ViewProps['role']
const SKELETON_ROWS = 5

/**
 * BarList: a ranked horizontal bar list. Each row is a label, a bar sized as a fraction of the
 * largest value (or `max`), a value and an optional secondary value. Rows beyond `maxRows` fold
 * into one overflow row. Bars are silver; a flagged row's bar is red.
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
  formatValue,
  formatSecondary,
  isLoading = false,
  emptyState,
  className,
  ...props
}: BarListProps) {
  const palette = silverRed(useSurfaceMode())
  const model = useMemo(
    () => buildBarListModel(rows, { max, sort, maxRows, formatValue, formatSecondary }),
    [rows, max, sort, maxRows, formatValue, formatSecondary]
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
      accessibilityLabel={readoutName(accessibilityLabel, model)}
      className={cn('gap-stack-sm', className)}
      {...props}
    >
      {model.rows.map((entry) => (
        <ModelRow
          key={`${entry.row.id}:${entry.index}`}
          entry={entry}
          shownCount={model.shownCount}
          sort={model.sort}
          valuesChars={model.valuesChars}
          layout={layout}
          size={size}
          palette={palette}
          formatValue={formatValue}
          formatSecondary={formatSecondary}
        />
      ))}
      <OverflowRow model={model} />
    </View>
  )
}
