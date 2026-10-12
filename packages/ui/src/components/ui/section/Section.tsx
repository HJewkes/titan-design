import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../typography'

export interface SectionProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function Section({ className, children, ...props }: SectionProps) {
  return (
    <View className={cn('mb-6', className)} {...props}>
      {children}
    </View>
  )
}

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, trailing, className }: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between mb-3 px-inset-xs', className)}>
      <View className="flex-1 gap-stack-sm">
        <Typography variant="h6" className="text-sm">
          {title}
        </Typography>
        {!!subtitle && <Text className="text-xs text-text-secondary">{subtitle}</Text>}
      </View>
      {!!trailing && <View>{trailing}</View>}
    </View>
  )
}

export interface SectionContentProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function SectionContent({ className, children, ...props }: SectionContentProps) {
  return (
    <View className={cn(className)} {...props}>
      {children}
    </View>
  )
}
