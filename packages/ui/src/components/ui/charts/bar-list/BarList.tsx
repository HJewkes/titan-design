import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import { EmptyState } from '../../empty-state'
import { useSurfaceMode } from '../../surface'
import { silverRed } from '../kit/silverRed'
import { ALL_READOUTS, hidesReadout, resolveColumns, type BarListReadout } from './BarListCells'
import { ModelRow, OverflowRow, SkeletonRows } from './BarListParts'
import { useRowTips } from './BarListTip'
import {
  buildBarListModel,
  readoutName,
  normalizeMaxRows,
  type BarListMarker,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'

export type { BarListMarker, BarListRow, BarListValueFormatter } from './bar-list-model'
export type { BarListReadout } from './BarListCells'

/** Props of {@link BarList}. */
export interface BarListProps extends Omit<ViewProps, 'children'> {
  /** The data, one row per bar. Sorted and capped by `sort` and `maxRows`. */
  rows: BarListRow[]
  /** Names the list; the summary is appended to it for assistive tech. */
  accessibilityLabel: string
  /** Value that fills a whole bar. Defaults to the largest value. */
  max?: number
  /** One labelled line on the value axis (a cutoff, a budget). It never changes the scale. */
  referenceMarker?: BarListMarker
  /** `descending` ranks by value; `none` keeps input order (a funnel). */
  sort?: 'descending' | 'none'
  /** Rows shown before the rest fold into one overflow row. */
  maxRows?: number
  /** `inline` puts label, bar and value on one line; `stacked` puts the bar under them. */
  layout?: 'inline' | 'stacked'
  /** Text size and bar thickness. */
  size?: 'sm' | 'md'
  /** Formats each row's value, and the total of the rows past the cap (called without a row). */
  formatValue?: BarListValueFormatter
  /** Formats each row's `secondaryValue`. */
  formatSecondary?: (value: number, row: BarListRow) => string
  /**
   * Which readouts each row prints after its bar. A hidden one stays in the row's accessible name
   * and in a tip that hover, keyboard focus or a long press on the row opens. Default both.
   */
  readouts?: BarListReadout[]
  /** Shows skeleton rows in place of the data. */
  isLoading?: boolean
  /** Replaces the default empty state, shown when `rows` is empty. */
  emptyState?: ReactNode
  /** Tailwind classes merged onto the list root. */
  className?: string
}

// RN's Role union omits 'list'; RNW passes it through to the DOM.
const LIST_ROLE = 'list' as ViewProps['role']
const SKELETON_ROWS = 5

/**
 * BarList: a ranked horizontal bar list. Each row is a label, a bar sized as a fraction of the
 * largest value (or `max`), a value and an optional secondary value. Rows beyond `maxRows` fold
 * into one overflow row. Bars are silver; a flagged row's bar is red. When `readouts` hides a
 * readout, each row opens a tip that shows it, and the list is one tab stop.
 *
 * @example
 * <BarList accessibilityLabel="Tool calls" rows={[{ id: 'bash', label: 'Bash', value: 412 }]} />
 */
export function BarList({
  rows,
  accessibilityLabel,
  max,
  referenceMarker,
  sort = 'descending',
  maxRows,
  layout = 'inline',
  size = 'md',
  formatValue,
  formatSecondary,
  readouts = ALL_READOUTS,
  isLoading = false,
  emptyState,
  className,
  ...props
}: BarListProps) {
  const palette = silverRed(useSurfaceMode())
  const model = useMemo(
    () =>
      buildBarListModel(rows, {
        max,
        referenceMarker,
        sort,
        maxRows,
        formatValue,
        formatSecondary,
      }),
    [rows, max, referenceMarker, sort, maxRows, formatValue, formatSecondary]
  )
  const tips = useRowTips(model.shownCount, hidesReadout(readouts) || model.marker !== null)
  const columns = resolveColumns(model.columnChars, readouts)

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
      // RN's ViewProps has no key handler; RNW delivers the DOM event, bubbled from the focused row.
      {...(tips ? { onKeyDown: tips.onKeyDown } : {})}
      {...props}
    >
      {model.rows.map((entry, index) => (
        <ModelRow
          key={`${entry.row.id}:${entry.index}`}
          entry={entry}
          shownCount={model.shownCount}
          sort={model.sort}
          columnChars={model.columnChars}
          columns={columns}
          marker={model.marker}
          tipItem={tips ? tips.getItemProps(index) : null}
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
