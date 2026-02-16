import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface DataRowProps extends ViewProps {
  /** Descriptive label shown on the left */
  label: string
  /** Value shown on the right -- string renders as Text, ReactNode renders inside a View */
  value: React.ReactNode
  /** Additional className applied to the value element */
  valueClassName?: string
  /** Additional className applied to the root container */
  className?: string
}

export function DataRow({ label, value, valueClassName, className, ...props }: DataRowProps) {
  return (
    <View className={cn('flex-row items-center justify-between py-2', className)} {...props}>
      <Text className="text-sm text-text-secondary">{label}</Text>
      {typeof value === 'string' ? (
        <Text className={cn('text-sm font-medium text-text-primary', valueClassName)}>
          {value}
        </Text>
      ) : (
        <View className={cn(valueClassName)}>{value}</View>
      )}
    </View>
  )
}
