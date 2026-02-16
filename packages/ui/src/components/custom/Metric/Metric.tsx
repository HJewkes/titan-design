import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type MetricTrend = 'up' | 'down' | 'neutral'

export interface MetricProps extends ViewProps {
  value: string
  label: string
  unit?: string
  trend?: MetricTrend
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { value: 'text-lg font-bold', label: 'text-xs', unit: 'text-xs' },
  md: { value: 'text-2xl font-bold', label: 'text-xs', unit: 'text-sm' },
  lg: { value: 'text-4xl font-bold', label: 'text-sm', unit: 'text-base' },
}

const trendColors: Record<MetricTrend, string> = {
  up: 'text-result-improve',
  down: 'text-result-degrade',
  neutral: 'text-result-inconclusive',
}

const trendArrows: Record<MetricTrend, string> = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
}

export function Metric({
  value,
  label,
  unit,
  trend,
  size = 'md',
  className,
  ...props
}: MetricProps) {
  const styles = sizeConfig[size]

  return (
    <View className={cn('items-center', className)} {...props}>
      <View className="flex-row items-baseline gap-1">
        <Text className={cn(styles.value, 'text-text-primary')}>{value}</Text>
        {unit && (
          <Text className={cn(styles.unit, 'text-text-tertiary')}>{unit}</Text>
        )}
        {trend && (
          <Text className={cn(styles.unit, trendColors[trend])}>
            {trendArrows[trend]}
          </Text>
        )}
      </View>
      <Text className={cn(styles.label, 'text-text-secondary mt-1')}>
        {label}
      </Text>
    </View>
  )
}

export interface MetricGroupProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function MetricGroup({
  className,
  children,
  ...props
}: MetricGroupProps) {
  const items = React.Children.toArray(children)

  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          <View className="flex-1 items-center">{child}</View>
          {i < items.length - 1 && (
            <View
              className="w-px h-8 bg-divider mx-2"
              testID="metric-divider"
            />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}
