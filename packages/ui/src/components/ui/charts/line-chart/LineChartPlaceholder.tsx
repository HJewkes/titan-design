import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

import { cn } from '../../../../utils/cn'
import { EmptyState } from '../../empty-state'

export interface LineChartPlaceholderProps extends ViewProps {
  width: number
  height: number
  /** Names the metric in the default message. */
  metricLabel: string
  /** Replaces the default message. */
  emptyState?: ReactNode
  className?: string
}

/** What LineChart shows with no series or no finite value: a box of the chart's size, no axes. */
export function LineChartPlaceholder({
  width,
  height,
  metricLabel,
  emptyState,
  className,
  style,
  ...props
}: LineChartPlaceholderProps) {
  return (
    <View
      testID="line-chart-empty"
      className={cn('items-center justify-center overflow-hidden', className)}
      style={[style, { width, height }]}
      {...props}
    >
      {emptyState ?? (
        <EmptyState title="No data" description={`${metricLabel} has no values to plot yet.`} />
      )}
    </View>
  )
}
