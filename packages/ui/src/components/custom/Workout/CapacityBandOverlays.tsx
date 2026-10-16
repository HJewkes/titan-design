import { View, Pressable, Animated } from 'react-native'
import { formatChartDate } from '../../../utils/workout-format'
import {
  DOT_SIZE,
  PADDING_BOTTOM,
  PADDING_LEFT,
  PADDING_TOP,
  workoutDotLabel,
  type CapacityBandColors,
  type BandPoint,
  type CapacityBandScale,
  type LoadDot,
} from './capacityBandGeometry'
import { Typography } from '../../ui/typography'

/** Y axis conceptual label (no numbers). */
export function YAxisLabel({ plotHeight }: { plotHeight: number }) {
  return (
    <Typography
      variant="caption"
      color="tertiary"
      className="leading-tight"
      style={{
        position: 'absolute',
        left: PADDING_LEFT / 2 - 14,
        top: PADDING_TOP + plotHeight / 2 - 7,
        width: 32,
        textAlign: 'center',
        fontSize: 9,
        fontFamily: 'Inter, sans-serif',
        transform: [{ rotate: '-90deg' }],
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="capacity-band-chart-y-axis-label"
    >
      Load
    </Typography>
  )
}

interface XAxisLabelsProps {
  band: BandPoint[]
  toX: (date: string) => number
  height: number
  labelStride: number
}

/** X axis date labels (subset to avoid overlap). */
export function XAxisLabels({ band, toX, height, labelStride }: XAxisLabelsProps) {
  return (
    <>
      {band.map((point, i) => {
        if (i % labelStride !== 0 && i !== band.length - 1) return null
        return (
          <Typography
            key={`x-${point.date}`}
            variant="caption"
            color="tertiary"
            className="leading-tight"
            style={{
              position: 'absolute',
              left: toX(point.date) - 14,
              top: height - PADDING_BOTTOM + 2,
              width: 28,
              textAlign: 'center',
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="capacity-band-chart-x-label"
          >
            {formatChartDate(point.date)}
          </Typography>
        )
      })}
    </>
  )
}

interface WorkoutDotMarkProps {
  workout: LoadDot
  anim: Animated.Value | undefined
  scale: CapacityBandScale
  colors: CapacityBandColors
  onWorkoutPress?: (workout: LoadDot) => void
}

function WorkoutDotMark({ workout, anim, scale, colors, onWorkoutPress }: WorkoutDotMarkProps) {
  const cx = scale.toX(workout.date)
  const cy = scale.toY(workout.load)
  const color = colors.dots[workout.status]
  const dotStyle = {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: color,
    borderWidth: 2,
    borderColor: colors.dotBorder,
  }
  const label = workoutDotLabel(workout)
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: cx - DOT_SIZE / 2,
        top: cy - DOT_SIZE / 2,
        transform: [{ scale: anim ?? 1 }],
      }}
      testID="capacity-band-chart-dot-wrapper"
    >
      {onWorkoutPress ? (
        <Pressable
          onPress={() => onWorkoutPress(workout)}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={dotStyle}
          testID="capacity-band-chart-dot"
        />
      ) : (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={dotStyle}
          testID="capacity-band-chart-dot"
        />
      )}
    </Animated.View>
  )
}

interface WorkoutDotsProps {
  workouts: LoadDot[]
  dotAnims: Animated.Value[]
  scale: CapacityBandScale
  colors: CapacityBandColors
  onWorkoutPress?: (workout: LoadDot) => void
}

/** Workout dots — scale in after the band draws. */
export function WorkoutDots({
  workouts,
  dotAnims,
  scale,
  colors,
  onWorkoutPress,
}: WorkoutDotsProps) {
  return (
    <>
      {workouts.map((workout, i) => (
        <WorkoutDotMark
          key={`dot-${workout.date}-${i}`}
          workout={workout}
          anim={dotAnims[i]}
          scale={scale}
          colors={colors}
          onWorkoutPress={onWorkoutPress}
        />
      ))}
    </>
  )
}
