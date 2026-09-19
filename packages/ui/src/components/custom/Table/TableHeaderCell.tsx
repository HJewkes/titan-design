import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { cn } from '../../../utils/cn'
import { Tooltip } from '../../ui/tooltip'
import { CELL_PADDING, FLEX_CELL, TableContext } from './TableContext'
import { columnSortState, type ColumnSortState } from './useTableState'

export interface TableHeaderCellProps extends Omit<PressableProps, 'children'> {
  /** Sort key for this column */
  sortKey?: string
  /** Full column name behind an abbreviated label: shown on hover and used as the accessible sort name. */
  tooltip?: string
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Cell width in pixels */
  width?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const HEADER_ALIGN = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

/**
 * Table header cell with optional sorting.
 */
export function TableHeaderCell({
  sortKey,
  tooltip,
  align = 'left',
  width,
  className,
  children,
  onPress,
  ...props
}: TableHeaderCellProps) {
  const { sortColumn, sortDirection, onSort, density } = useContext(TableContext)
  const sort = columnSortState(sortKey, sortColumn, sortDirection, !!onSort)
  const cellStyle = width ? { width } : FLEX_CELL

  if (sort.isSortable && sortKey && onSort) {
    return (
      <SortableHeaderCell
        sort={sort}
        tooltip={tooltip}
        cellStyle={cellStyle}
        accessibilityLabel={`Sort by ${tooltip ?? children}`}
        onPress={(e) => {
          onSort(sortKey)
          onPress?.(e)
        }}
        className={cn(
          'flex-row items-center',
          CELL_PADDING[density],
          HEADER_ALIGN[align],
          'web:hover:bg-interactive-hover active:bg-interactive-active',
          className
        )}
        {...props}
      >
        {children}
      </SortableHeaderCell>
    )
  }

  return (
    <View
      role="columnheader"
      style={cellStyle}
      className={cn(
        'flex-row items-center overflow-hidden',
        CELL_PADDING[density],
        HEADER_ALIGN[align],
        className
      )}
    >
      <HeaderTooltip label={tooltip}>
        <HeaderLabel isSorted={sort.isSorted}>{children}</HeaderLabel>
      </HeaderTooltip>
    </View>
  )
}

interface SortableHeaderCellProps extends Omit<PressableProps, 'children'> {
  sort: ColumnSortState
  tooltip?: string
  cellStyle: StyleProp<ViewStyle>
  className?: string
  children?: React.ReactNode
}

// columnheader cell wraps the sort button so it carries proper table
// semantics (role + aria-sort) while the inner control keeps its button role.
function SortableHeaderCell({
  sort,
  tooltip,
  cellStyle,
  children,
  ...pressableProps
}: SortableHeaderCellProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <View
      role="columnheader"
      aria-sort={sort.ariaSort}
      // A label and its sort glyph belong to one column: clipped is recoverable, painted over the neighbour is not.
      className="overflow-hidden"
      style={cellStyle}
    >
      <HeaderTooltip label={tooltip}>
        <Pressable
          accessibilityRole="button"
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          {...pressableProps}
        >
          <HeaderLabel isSorted={sort.isSorted}>{children}</HeaderLabel>
          {/* Idle glyphs stay in layout but invisible, so the header reads quiet and nothing shifts on hover. */}
          <Text
            className={cn(
              'ml-1 text-xs',
              sort.isSorted ? 'text-text-primary' : 'text-text-tertiary'
            )}
            style={{ opacity: sort.isSorted || hovered ? 1 : 0 }}
          >
            {sort.glyph}
          </Text>
        </Pressable>
      </HeaderTooltip>
    </View>
  )
}

function HeaderLabel({ isSorted, children }: { isSorted: boolean; children?: React.ReactNode }) {
  return (
    <Text
      className={cn(
        'text-xs font-semibold uppercase tracking-wider text-text-secondary',
        isSorted && 'text-text-primary'
      )}
    >
      {children}
    </Text>
  )
}

// The tooltip wraps the sort button rather than sitting inside it: a nested Pressable would take the press.
function HeaderTooltip({ label, children }: { label?: string; children: React.ReactNode }) {
  if (!label) return <>{children}</>
  return (
    <Tooltip label={label} usePortal>
      {children}
    </Tooltip>
  )
}
