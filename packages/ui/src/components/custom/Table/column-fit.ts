import { useCallback, useMemo, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

/**
 * One column's terms for the fit calculation: how much room it needs, and where
 * it sits in the drop order.
 */
export interface TableColumnFit {
  /** Matches the key the caller renders the column under. */
  key: string
  /**
   * Narrowest width in px at which the column still reads — its header label
   * plus the sort affordance, or its content, whichever is wider. Real numbers
   * matter here: the fit is arithmetic over these, not a guess at a breakpoint.
   */
  minWidth: number
  /**
   * Drop order: the lowest number leaves first. A column with no `dropPriority`
   * never drops, which is what keeps the identifying columns on screen when the
   * table runs out of room.
   */
  dropPriority?: number
}

export interface ColumnFitResult {
  /** The keys still rendered, in declaration order. */
  visibleKeys: string[]
  /** What the survivors need. Hand to `Table`'s `contentMinWidth`. */
  contentMinWidth: number
  /** Nothing droppable is left and the survivors still overflow: the table scrolls. */
  isScrolling: boolean
}

// Ties keep declaration order, so a duplicated priority drops left to right rather than at random.
function dropOrder(columns: TableColumnFit[]): TableColumnFit[] {
  return columns
    .map((column, index) => ({ column, index }))
    .filter((entry) => entry.column.dropPriority !== undefined)
    .sort((a, b) => a.column.dropPriority! - b.column.dropPriority! || a.index - b.index)
    .map((entry) => entry.column)
}

/**
 * Drops columns one at a time in the declared order until the rest fit, then
 * stops. Dropping cannot take an undroppable column, so once those are all that
 * is left the table overflows on purpose and scrolls horizontally — scroll is
 * the floor under dropping, not an alternative to it.
 *
 * `available` of `null` means "not measured yet": everything renders.
 */
export function fitColumns(columns: TableColumnFit[], available: number | null): ColumnFitResult {
  const dropped = new Set<string>()
  let needed = columns.reduce((total, column) => total + column.minWidth, 0)

  if (available !== null) {
    for (const column of dropOrder(columns)) {
      if (needed <= available) break
      dropped.add(column.key)
      needed -= column.minWidth
    }
  }

  return {
    visibleKeys: columns.filter((column) => !dropped.has(column.key)).map((column) => column.key),
    contentMinWidth: needed,
    isScrolling: available !== null && needed > available,
  }
}

export interface UseMeasuredWidthResult {
  /** The measured width, or `null` until the first layout pass. */
  width: number | null
  onLayout: (event: LayoutChangeEvent) => void
}

/**
 * The width of whatever it is attached to, from the `onLayout` pass every other
 * width-aware table here already uses — no resize observer, and no window
 * width standing in for a column that lives inside a much narrower card.
 *
 * `override` pins the width instead of measuring, so a story or a test can hold
 * one breakpoint still.
 */
export function useMeasuredWidth(override?: number): UseMeasuredWidthResult {
  const [measured, setMeasured] = useState<number | null>(null)
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width),
    []
  )
  return { width: override ?? measured, onLayout }
}

export interface UseColumnFitResult extends ColumnFitResult {
  isVisible: (key: string) => boolean
}

/**
 * {@link fitColumns} as a hook, with a membership test for the render pass.
 *
 * @example
 * const { width, onLayout } = useMeasuredWidth()
 * const fit = useColumnFit(COLUMNS, width)
 * <View onLayout={onLayout}>
 *   <Table contentMinWidth={fit.contentMinWidth}>
 *     {COLUMNS.filter((c) => fit.isVisible(c.key)).map(renderColumn)}
 *   </Table>
 * </View>
 */
export function useColumnFit(
  columns: TableColumnFit[],
  available: number | null
): UseColumnFitResult {
  const fit = useMemo(() => fitColumns(columns, available), [columns, available])
  const visible = useMemo(() => new Set(fit.visibleKeys), [fit])
  return { ...fit, isVisible: (key: string) => visible.has(key) }
}
