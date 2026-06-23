// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Animated, type ViewProps, type ViewStyle } from 'react-native'

export type IntensityBarOrientation = 'vertical' | 'horizontal'

export interface IntensityBarProps extends ViewProps {
  /** Current intensity level 0-1 */
  level: number
  /** MRV/overexertion threshold position 0-1 */
  threshold?: number
  /** Orientation */
  orientation?: IntensityBarOrientation
  /** Height for vertical (default 24px) or width for horizontal */
  size?: number
  /** Width for vertical (default 6px) or height for horizontal */
  thickness?: number
  /** Show threshold label ("MRV") */
  showThresholdLabel?: boolean
  className?: string
}

const TRACK_BG = 'rgba(255,255,255,0.06)'
const THRESHOLD_COLOR = '#FFFFFF'
const LABEL_COLOR = '#6B7280'

/** Fill color by intensity zone: teal 0-0.4, amber 0.4-0.7, red 0.7-1.0. */
function getZoneColor(level: number): string {
  if (level >= 0.7) return '#D14343'
  if (level >= 0.4) return '#FFB020'
  return '#14B8A6'
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function IntensityBar({
  level,
  threshold,
  orientation = 'vertical',
  size = 24,
  thickness = 6,
  showThresholdLabel,
  className,
  ...props
}: IntensityBarProps) {
  const isVertical = orientation === 'vertical'
  const clampedLevel = clamp01(level)
  const percentage = Math.round(clampedLevel * 100)
  const zoneColor = getZoneColor(clampedLevel)

  const [fillAnim] = useState(() => new Animated.Value(clampedLevel))

  useEffect(() => {
    const animation = Animated.timing(fillAnim, {
      toValue: clampedLevel,
      duration: 250,
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [clampedLevel, fillAnim])

  const fillSizePercent = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const trackStyle = isVertical
    ? { width: thickness, height: size }
    : { width: size, height: thickness }

  const fillStyle = isVertical
    ? {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: fillSizePercent,
      }
    : {
        position: 'absolute' as const,
        top: 0,
        bottom: 0,
        left: 0,
        width: fillSizePercent,
      }

  const thresholdLineStyle: ViewStyle | undefined =
    threshold != null
      ? isVertical
        ? {
            position: 'absolute' as const,
            bottom: `${clamp01(threshold) * 100}%`,
            left: -2,
            right: -2,
            height: 1,
            backgroundColor: THRESHOLD_COLOR,
            zIndex: 4,
          }
        : {
            position: 'absolute' as const,
            left: `${clamp01(threshold) * 100}%`,
            top: -2,
            bottom: -2,
            width: 1,
            backgroundColor: THRESHOLD_COLOR,
            zIndex: 4,
          }
      : undefined

  return (
    <View
      className={className}
      style={{ alignItems: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      accessibilityLabel={`Intensity level: ${percentage}%`}
      testID="intensity-bar"
      {...props}
    >
      <View
        style={{
          ...trackStyle,
          borderRadius: 3,
          backgroundColor: TRACK_BG,
          position: 'relative',
          overflow: 'visible',
        }}
        accessibilityElementsHidden
      >
        <Animated.View
          style={{
            ...fillStyle,
            borderRadius: 3,
            backgroundColor: zoneColor,
            zIndex: 2,
          }}
          testID="intensity-fill"
        />

        {threshold != null && (
          <View style={thresholdLineStyle} testID="intensity-threshold" />
        )}
      </View>
      {showThresholdLabel && threshold != null && (
        <Text
          style={{
            fontSize: 8,
            fontWeight: '500',
            color: LABEL_COLOR,
            fontFamily: 'Inter, sans-serif',
            marginTop: 6,
          }}
          accessibilityElementsHidden
          testID="intensity-threshold-label"
        >
          MRV
        </Text>
      )}
    </View>
  )
}
