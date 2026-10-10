import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import type { ListNavigationKeyEvent } from '../../../../hooks/useListNavigation'
import { EmptyState } from '../../empty-state'
import { useSurfaceMode } from '../../surface'
import { silverRed } from '../kit/silverRed'
import { resolveColumns } from './BarListCells'
import { ModelRow, OverflowRow, SkeletonRows } from './BarListParts'
import { useRowTips, type RowTips } from './BarListTip'
import {
  buildBarListModel,
  readoutName,
  normalizeMaxRows,
  type BarListMarker,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'

export type { BarListMarker, BarListRow, BarListValueFormatter } from './bar-list-model'

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
   * Hides each row's value after its bar. The value stays in the row's accessible name and in the
   * tip that hover, keyboard focus or a long press on the row opens.
   */
  isValueHidden?: boolean
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

// RN's ViewProps has no key handler; RNW delivers the DOM event, bubbled from the focused row.
interface KeyDownProps {
  onKeyDown?: (event: ListNavigationKeyEvent) => void
}

/** The list's key handler: the arrow keys first, then whatever the caller passed. */
function keyDownProps(tips: RowTips | null, caller: KeyDownProps['onKeyDown']): KeyDownProps {
  if (!tips) return caller ? { onKeyDown: caller } : {}
  return {
    onKeyDown: (event) => {
      tips.onKeyDown(event)
      caller?.(event)
    },
  }
}

/** One marker object for as long as its fields hold, so an inline literal does not rebuild the model. */
function useStableMarker(marker: BarListMarker | undefined): BarListMarker | undefined {
  const isSet = marker !== undefined
  const { value, label, formatValue } = marker ?? {}
  return useMemo(
    () => (isSet ? { value: value as number, label: label as string, formatValue } : undefined),
    [isSet, value, label, formatValue]
  )
}

/**
 * BarList: a ranked horizontal bar list. Each row is a label, a bar sized as a fraction of the
 * largest value (or `max`), a value and an optional secondary value. Rows beyond `maxRows` fold
 * into one overflow row. Bars are silver; a flagged row's bar is red, a quieter red for `warning`
 * (near a limit) and the full red for `error` (over it). The flag's label is not printed in the
 * row: it lives in the row's tip and its accessible name. A list with a flagged row, or with
 * `isValueHidden`, opens a tip on each row and is one tab stop.
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
  isValueHidden = false,
  isLoading = false,
  emptyState,
  className,
  ...props
}: BarListProps) {
  const palette = silverRed(useSurfaceMode())
  const marker = useStableMarker(referenceMarker)
  const model = useMemo(
    () =>
      buildBarListModel(rows, {
        max,
        referenceMarker: marker,
        sort,
        maxRows,
        formatValue,
        formatSecondary,
      }),
    [rows, max, marker, sort, maxRows, formatValue, formatSecondary]
  )
  const tips = useRowTips(
    model.shownCount,
    isValueHidden || model.flaggedCount > 0 || model.marker !== null
  )
  const columns = resolveColumns(model.columnChars, isValueHidden)
  const { onKeyDown: callerKeyDown, ...viewProps } = props as typeof props & KeyDownProps

  if (isLoading) {
    const count = Math.min(normalizeMaxRows(maxRows), SKELETON_ROWS)
    return (
      <View
        role={LIST_ROLE}
        accessibilityLabel={accessibilityLabel}
        aria-busy
        className={className}
        {...viewProps}
      >
        <SkeletonRows count={count} size={size} />
      </View>
    )
  }

  if (model.inputCount === 0) {
    return (
      <View
        role="group"
        accessibilityLabel={accessibilityLabel}
        className={className}
        {...viewProps}
      >
        {emptyState ?? <EmptyState title="No data" className="py-4" />}
      </View>
    )
  }

  return (
    <View
      role={LIST_ROLE}
      accessibilityLabel={readoutName(accessibilityLabel, model)}
      className={cn('gap-stack-sm', className)}
      {...keyDownProps(tips, callerKeyDown)}
      {...viewProps}
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
