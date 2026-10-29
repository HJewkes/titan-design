import React, { useCallback, useContext } from 'react'
import { Platform, View, Text, type ViewProps } from 'react-native'
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

// react-native-web drops a `title` prop on Text, so the hover hint is set on the DOM node directly.
function useWebTitle(title: string | undefined) {
  return useCallback(
    (node: unknown) => {
      if (Platform.OS !== 'web' || !title || !(node instanceof HTMLElement)) return
      node.setAttribute('title', title)
    },
    [title]
  )
}

/**
 * Table data cell. String content stays on one line and ends in an ellipsis when
 * the column is too narrow; on web the full value shows on hover.
 */
export function TableCell({
  align = 'left',
  width,
  className,
  children,
  ...props
}: TableCellProps) {
  const { density } = useContext(TableContext)
  const titleRef = useWebTitle(typeof children === 'string' ? children : undefined)
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
        <Text
          ref={titleRef}
          numberOfLines={1}
          className={cn(density === 'dense' ? 'text-xs' : 'text-sm', 'text-text-primary')}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}
