import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface EmptyStateProps extends ViewProps {
  /** Icon component to display */
  icon?: React.ComponentType<{ size?: number; className?: string }>
  /** Draw the icon bare above the title, without the rounded well behind it */
  isIconBare?: boolean
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Action element (usually a button) */
  action?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Empty state component for when there's no data to display.
 *
 * @example
 * <EmptyState
 *   icon={InboxIcon}
 *   title="No messages"
 *   description="You don't have any messages yet."
 *   action={<Button>Compose</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  isIconBare = false,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-6', className)} {...props}>
      {Icon && (
        <View className={cn('mb-4', !isIconBare && 'p-4 rounded-full bg-background-subtle')}>
          <Icon size={32} className="text-text-tertiary" />
        </View>
      )}

      <Text className="text-lg font-semibold text-text-primary text-center mb-2">{title}</Text>

      {!!description && (
        <Text className="text-sm text-text-secondary text-center max-w-xs mb-6">{description}</Text>
      )}

      {!!action && <View className="mt-2">{action}</View>}
    </View>
  )
}
