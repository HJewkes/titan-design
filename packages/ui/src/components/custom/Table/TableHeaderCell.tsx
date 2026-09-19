import React, { useContext, useState } from 'react'
import { View, Text, Pressable, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Tooltip } from '../../ui/tooltip'
import { CELL_PADDING, FLEX_CELL, TableContext } from './TableContext'

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
  // The sort cycle ends at direction null with the column still set; that is unsorted, not "still descending".
  const isSorted = !!sortKey && sortColumn === sortKey && sortDirection != null
  const isSortable = !!sortKey && !!onSort
  const [hovered, setHovered] = useState(false)
  const ariaSort = isSorted
    ? sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
        ? 'descending'
        : 'none'
    : 'none'

  const handlePress = (e: any) => {
    if (isSortable && sortKey) {
      onSort(sortKey)
    }
    onPress?.(e)
  }

  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  const label = (
    <Text
      className={cn(
        'text-xs font-semibold uppercase tracking-wider text-text-secondary',
        isSorted && 'text-text-primary'
      )}
    >
      {children}
    </Text>
  )

  // The tooltip wraps the sort button rather than sitting inside it: a nested Pressable would take the press.
  const withTooltip = (node: React.ReactNode) =>
    tooltip ? (
      <Tooltip label={tooltip} usePortal>
        {node}
      </Tooltip>
    ) : (
      node
    )

  const content = (
    <>
      {label}
      {isSortable && (
        // Idle glyphs stay in layout but invisible, so the header reads quiet and nothing shifts on hover.
        <Text
          className={cn('ml-1 text-xs', isSorted ? 'text-text-primary' : 'text-text-tertiary')}
          style={{ opacity: isSorted || hovered ? 1 : 0 }}
        >
          {isSorted ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </Text>
      )}
    </>
  )

  if (isSortable) {
    // columnheader cell wraps the sort button so it carries proper table
    // semantics (role + aria-sort) while the inner control keeps its button role.
    return (
      <View
        role="columnheader"
        aria-sort={ariaSort}
        // A label and its sort glyph belong to one column: clipped is recoverable, painted over the neighbour is not.
        className="overflow-hidden"
        style={width ? { width } : FLEX_CELL}
      >
        {withTooltip(
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${tooltip ?? children}`}
            onPress={handlePress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            className={cn(
              'flex-row items-center',
              CELL_PADDING[density],
              alignStyles[align],
              'web:hover:bg-interactive-hover active:bg-interactive-active',
              className
            )}
            {...props}
          >
            {content}
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View
      role="columnheader"
      style={width ? { width } : FLEX_CELL}
      className={cn(
        'flex-row items-center overflow-hidden',
        CELL_PADDING[density],
        alignStyles[align],
        className
      )}
    >
      {withTooltip(content)}
    </View>
  )
}
