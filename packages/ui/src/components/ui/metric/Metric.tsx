import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import type { PillTone } from '../pill'

export type MetricTrend = 'up' | 'down' | 'neutral'
/** Cross-axis placement of the figure and its label. */
export type MetricAlign = 'start' | 'center' | 'end'
/** The `PillTone`s that read as text on any plane; `brand-secondary` stays a fill accent. */
export type MetricTone = Exclude<PillTone, 'brand-secondary'>

export interface MetricProps extends ViewProps {
  value: string
  label: string
  unit?: string
  trend?: MetricTrend
  size?: 'sm' | 'md' | 'lg'
  /** Aligns the figure and label to the start, centre or end of the column. Defaults to `center`. */
  align?: MetricAlign
  /** Colours the value from a semantic token. Omitted, the value keeps `text-text-primary`. */
  tone?: MetricTone
  className?: string
  /** Merged onto the value text, e.g. `leading-none` to sit the figure tight under a header. */
  valueClassName?: string
  /** Merged onto the label text, e.g. to hold it at one size whatever the figure's `size`. */
  labelClassName?: string
}

const sizeConfig = {
  sm: { value: 'text-lg font-bold', label: 'text-xs', unit: 'text-xs' },
  md: { value: 'text-2xl font-bold', label: 'text-xs', unit: 'text-sm' },
  lg: { value: 'text-4xl font-bold', label: 'text-sm', unit: 'text-base' },
}

const alignClasses: Record<MetricAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
}

const toneClasses: Record<MetricTone, string> = {
  neutral: 'text-text-primary',
  brand: 'text-brand-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  error: 'text-status-error',
  info: 'text-status-info',
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
  align = 'center',
  tone = 'neutral',
  className,
  valueClassName,
  labelClassName,
  testID,
  ...props
}: MetricProps) {
  const styles = sizeConfig[size]

  return (
    <View className={cn(alignClasses[align], className)} testID={testID} {...props}>
      <View className="flex-row items-baseline gap-1">
        <Text className={cn(styles.value, toneClasses[tone], valueClassName)}>{value}</Text>
        {unit && <Text className={cn(styles.unit, 'text-text-tertiary')}>{unit}</Text>}
        {trend && <Text className={cn(styles.unit, trendColors[trend])}>{trendArrows[trend]}</Text>}
      </View>
      <Text
        className={cn(styles.label, 'text-text-secondary mt-1', labelClassName)}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
    </View>
  )
}

export interface MetricGroupProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function MetricGroup({ className, children, ...props }: MetricGroupProps) {
  const items = React.Children.toArray(children)

  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          <View className="flex-1 items-center">{child}</View>
          {i < items.length - 1 && (
            <View className="w-px h-8 bg-hairline mx-2" testID="metric-divider" />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}
