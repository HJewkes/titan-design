// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { alpha } from '../../../utils/colors'
import {
  PADDING_BOTTOM,
  PADDING_LEFT,
  PADDING_RIGHT,
  PADDING_TOP,
  capacityBandLayout,
  capacityBandScale,
  capacityBandSummary,
  type CapacityBandColors,
  type CapacityBandDataPoint,
  type CapacityBandProjection,
  type WorkoutDot,
  type WorkoutDotStatus,
} from './capacityBandGeometry'
import { useCapacityBandEntrance } from './useCapacityBandEntrance'
import { CapacityBandPlot } from './CapacityBandPlot'
import { WorkoutDots, XAxisLabels, YAxisLabel } from './CapacityBandOverlays'

export type {
  CapacityBandDataPoint,
  CapacityBandProjection,
  WorkoutDot,
  WorkoutDotStatus,
} from './capacityBandGeometry'

/** The chart's colours in the given theme. */
function chartColors(mode: ThemeMode): CapacityBandColors {
  const t = getSemanticColors(mode)
  const success = t['status-success']
  return {
    success,
    info: t['status-info'],
    /** Dot outline: text-primary ring so load dots read on the band fill and any
     *  surface (matches the MesoStatusCard gauge-marker convention). */
    dotBorder: t['text-primary'],
    bandFill: alpha(success, 0.1),
    bandEdge: alpha(success, 0.45),
    projectionFill: alpha(success, 0.05),
    dots: {
      within: success,
      above: t['status-warning'],
      below: t['status-info'],
    } satisfies Record<WorkoutDotStatus, string>,
  }
}

export interface CapacityBandChartProps extends ViewProps {
  /** Capacity band shape over time. */
  band: CapacityBandDataPoint[]
  /** Workout sessions plotted as dots. */
  workouts: WorkoutDot[]
  /** Optional forward projection (next few days). */
  projection?: CapacityBandProjection
  /** Chart width in px. */
  width: number
  /** Chart height in px. */
  height: number
  /** Called when a workout dot is tapped. */
  onWorkoutPress?: (workout: WorkoutDot) => void
  className?: string
}

/**
 * Gentler-Streak-inspired fatigue visualization. Renders a shaded capacity
 * band (between a rolling MEV/MRV estimate), workout sessions as colored dots
 * positioned by load, and an optional dashed forward projection that diverges
 * for "keep training" (rises) versus "rest" (drops). View-based, no SVG:
 * the band fill is a run of vertical columns and the edges/projection are
 * rotated line Views (same technique as Sparkline).
 *
 * @example
 * <CapacityBandChart
 *   band={band}
 *   workouts={workouts}
 *   projection={{ withTraining, withRest }}
 *   width={320}
 *   height={180}
 *   onWorkoutPress={(w) => openSession(w)}
 * />
 */
export function CapacityBandChart({
  band,
  workouts,
  projection,
  width,
  height,
  onWorkoutPress,
  className,
  ...props
}: CapacityBandChartProps) {
  const colors = chartColors(useSurfaceMode())
  const { reveal, dotAnims } = useCapacityBandEntrance(band.length, workouts.length)

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM

  const scale = useMemo(
    () => capacityBandScale(band, workouts, projection, plotWidth, plotHeight),
    [band, workouts, projection, plotWidth, plotHeight]
  )

  if (band.length === 0) {
    return (
      <View
        style={{ width, height }}
        className={className}
        accessibilityRole="image"
        accessibilityLabel="Training capacity band chart, no data"
        testID="capacity-band-chart-empty"
        {...props}
      />
    )
  }

  const layout = capacityBandLayout(band, projection, scale)
  const revealWidth = reveal.interpolate({ inputRange: [0, 1], outputRange: [0, width] })

  return (
    <View
      style={{ width, height, position: 'relative' }}
      className={className}
      testID="capacity-band-chart-root"
      {...props}
    >
      {/* Static visual layer carries the image role; interactive dots live as
          siblings so the image role has no focusable descendants. */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        accessibilityRole="image"
        accessibilityLabel={capacityBandSummary(workouts)}
        testID="capacity-band-chart"
      >
        <CapacityBandPlot
          layout={layout}
          colors={colors}
          revealWidth={revealWidth}
          width={width}
          height={height}
        />
        <YAxisLabel plotHeight={plotHeight} />
        <XAxisLabels band={band} toX={scale.toX} height={height} labelStride={layout.labelStride} />
      </View>

      <WorkoutDots
        workouts={workouts}
        dotAnims={dotAnims}
        scale={scale}
        colors={colors}
        onWorkoutPress={onWorkoutPress}
      />
    </View>
  )
}
