import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { useOnSurfaceColor } from '../../ui/surface'
import { GoalTrajectoryPlot } from './GoalTrajectoryPlot'
import { CalibratingInfo } from './GoalTrajectoryCalibrating'
import { GoalTrajectoryWeekTips } from './GoalTrajectoryWeekTips'
import { STATUS_LABEL } from './goalTrajectoryChartModel'
import type { GoalTrajectoryStatus } from './GoalTrajectoryChartGeometry'
import type { TrajectoryChartPlot } from './useGoalTrajectoryChart'

interface PartProps {
  width: number
  height: number
  className: string | undefined
  viewProps: ViewProps
}

export function GoalTrajectoryChartEmpty({
  width,
  height,
  metricLabel,
  status,
  className,
  viewProps,
}: PartProps & { metricLabel: string; status: GoalTrajectoryStatus }) {
  const statusLabel = STATUS_LABEL[status]
  const axisColor = useOnSurfaceColor('tertiary')
  return (
    <View
      style={{ width, height }}
      className={cn('items-center justify-center', className)}
      accessibilityRole="image"
      accessibilityLabel={`${metricLabel} trajectory chart. ${statusLabel}: no band yet.`}
      testID="goal-trajectory-chart-empty"
      {...viewProps}
    >
      <Text style={{ color: axisColor, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
        {statusLabel} — no band yet
      </Text>
    </View>
  )
}

export function GoalTrajectoryChartFrame({
  chart,
  width,
  height,
  currentWeek,
  className,
  viewProps,
}: PartProps & { chart: TrajectoryChartPlot; currentWeek: number | undefined }) {
  const { marks, overhang } = chart
  return (
    <View style={{ width }} className={cn(className)} testID="goal-trajectory-chart" {...viewProps}>
      <View
        style={{ width, height }}
        accessibilityRole="image"
        accessibilityLabel={chart.label}
        testID="goal-trajectory-chart-canvas"
      >
        <GoalTrajectoryPlot
          geometry={chart.geometry}
          palette={chart.palette}
          width={width}
          height={height}
          ruleLabels={chart.ruleLabels}
          gridLabels={chart.gridLabels}
          weeks={chart.plotWeeks}
          weekStride={chart.weekStride}
          showYLabels={chart.showYLabels}
          style={chart.plotStyle}
          entrance={chart.entrance}
          calibrating={marks}
          {...(currentWeek !== undefined ? { currentWeek } : {})}
        />
      </View>
      {overhang > 0 && (
        <View style={{ height: overhang }} testID="goal-trajectory-chart-overhang" />
      )}
      {!!marks && <CalibratingInfo marks={marks} note={chart.note} palette={chart.palette} />}
      <GoalTrajectoryWeekTips tips={chart.tips} width={width} height={height} />
    </View>
  )
}
