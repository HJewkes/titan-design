import React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type DividerOrientation = 'horizontal' | 'vertical'

export interface DividerProps extends ViewProps {
  /** Divider orientation */
  orientation?: DividerOrientation
  /** Additional className */
  className?: string
}

/**
 * Divider component for visual separation of content.
 *
 * @example
 * <Divider />
 * <Divider orientation="vertical" />
 */
export function Divider({ orientation = 'horizontal', className, ...props }: DividerProps) {
  return (
    <View
      accessibilityRole="none"
      className={cn(
        'bg-divider',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
      {...props}
    />
  )
}
