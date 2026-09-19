import React from 'react'
import { View, Text } from 'react-native'
import { cn } from '../../../utils/cn'

export interface TableEmptyStateProps {
  /** Title for empty state */
  title?: string
  /** Description for empty state */
  description?: string
  /** Action button/element */
  action?: React.ReactNode
  /** Custom icon */
  icon?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Empty state component for tables with no data.
 */
export function TableEmptyState({
  title = 'No data',
  description = 'There are no items to display.',
  action,
  icon,
  className,
}: TableEmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-4', className)}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-text-primary mb-1">{title}</Text>
      <Text className="text-sm text-text-secondary text-center mb-4">{description}</Text>
      {action}
    </View>
  )
}
