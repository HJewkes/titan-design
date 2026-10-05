import React, { useContext } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { CELL_PADDING, FLEX_CELL, TableContext } from './TableContext'

export interface TableCellProps extends ViewProps {
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Cell width in pixels */
  width?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Table data cell.
 */
export function TableCell({
  align = 'left',
  width,
  className,
  children,
  ...props
}: TableCellProps) {
  const { density } = useContext(TableContext)
  const alignStyles = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end',
  }

  return (
    <View
      role="cell"
      style={width ? { width } : FLEX_CELL}
      className={cn('justify-center', CELL_PADDING[density], alignStyles[align], className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={cn(density === 'dense' ? 'text-xs' : 'text-sm', 'text-text-primary')}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}
