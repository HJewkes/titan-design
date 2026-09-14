import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface DataRowProps extends ViewProps {
  /** Descriptive label shown on the left -- string renders as Text, ReactNode renders inside a View */
  label: React.ReactNode
  /** Value shown on the right -- string renders as Text, ReactNode renders inside a View */
  value: React.ReactNode
  /** Additional className applied to the label element */
  labelClassName?: string
  /** Additional className applied to the value element */
  valueClassName?: string
  /** Additional className applied to the root container */
  className?: string
}

/**
 * A label-and-value row: the dense rung of the row ladder. ListItem is the loose
 * one at 16 across and 12 down; DataRow is 12 across and 8 down, so a list of
 * facts reads tighter than a list of things you can tap (AW-142 wave three).
 *
 * `gap-inline-md` is a floor, not a gutter: `justify-between` spreads label and
 * value apart wherever there is room, and the gap only asserts itself once a
 * long label would otherwise touch its value.
 *
 * A caller that supplies its own horizontal inset overrides this one — `px-0`
 * on the row — rather than nesting two.
 */
export function DataRow({
  label,
  value,
  labelClassName,
  valueClassName,
  className,
  ...props
}: DataRowProps) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between gap-inline-md px-inset-md py-inset-sm',
        className
      )}
      {...props}
    >
      {typeof label === 'string' ? (
        <Text className={cn('text-sm text-text-secondary', labelClassName)}>{label}</Text>
      ) : (
        <View className={cn(labelClassName)}>{label}</View>
      )}
      {typeof value === 'string' ? (
        <Text className={cn('text-sm font-medium text-text-primary', valueClassName)}>{value}</Text>
      ) : (
        <View className={cn(valueClassName)}>{value}</View>
      )}
    </View>
  )
}
