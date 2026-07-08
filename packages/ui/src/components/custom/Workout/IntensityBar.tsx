// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Animated,
  type ViewProps,
  type ViewStyle,
  type DimensionValue,
} from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

const t = getSemanticColors('dark')

export type IntensityBarOrientation = 'vertical' | 'horizontal'

export interface IntensityBarProps extends ViewProps {
  /** Current intensity level; 1 == 100% of target. Values >1 render as over-target. */
  level: number
  /** Target position 0-1. When the level sits at this target the fill gains an at-target glow. */
  threshold?: number
  /** Orientation */
  orientation?: IntensityBarOrientation
  /** Height for vertical (default 24px) or width for horizontal */
  size?: number
  /** Width for vertical (default 6px) or height for horizontal */
  thickness?: number
  /** Show the "MRV" threshold label under the bar */
  showThresholdLabel?: boolean
  className?: string
}

const TRACK_BG = '#333333'
const LABEL_COLOR = '#6B7280'
const TARGET_LINE_COLOR = 'rgba(33, 150, 243, 0.5)'
const AT_TARGET_GLOW = '0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15)'

// Zone colors graded by TRUE percentage (level * 100).
const ZONE = {
  building: t['status-success'], // teal   — below target ramp-up
  approaching: t['status-warning'], // amber  — nearing target
  target: t['brand-primary'], // brand  — exactly at target
  over1: t['status-error'], // red    — mild over-target
  over2: WORKOUT_TOKENS.intensity.over2, // deep red — moderate over-target
  over3: WORKOUT_TOKENS.intensity.over3, // darkest red — severe over-target
} as const

type OverTier = 0 | 1 | 2 | 3

interface Zone {
  color: string
  over: OverTier
}

const BULGE_SIZE: Record<Exclude<OverTier, 0>, number> = { 1: 8, 2: 10, 3: 11 }

/** Map a true percentage to its fill color and over-target tier. */
function zoneForPct(pct: number): Zone {
  if (pct >= 125) return { color: ZONE.over3, over: 3 }
  if (pct >= 115) return { color: ZONE.over2, over: 2 }
  if (pct > 100) return { color: ZONE.over1, over: 1 }
  if (pct === 100) return { color: ZONE.target, over: 0 }
  if (pct >= 75) return { color: ZONE.approaching, over: 0 }
  return { color: ZONE.building, over: 0 }
}

function clampFill(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** True when the level rests on the supplied target (within 5%). */
function isAtTarget(pct: number, threshold?: number): boolean {
  if (threshold == null) return false
  return Math.abs(pct - Math.round(threshold * 100)) <= 5
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
  const fillLevel = clampFill(level)
  const pct = Math.round(Math.max(0, level) * 100)
  const zone = zoneForPct(pct)
  const atTarget = isAtTarget(pct, threshold)

  const [fillAnim] = useState(() => new Animated.Value(fillLevel))

  useEffect(() => {
    const animation = Animated.timing(fillAnim, {
      toValue: fillLevel,
      duration: 250,
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [fillLevel, fillAnim])

  const fillSizePercent = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const trackStyle = isVertical
    ? { width: thickness, height: size }
    : { width: size, height: thickness }

  const fillStyle = isVertical
    ? { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: fillSizePercent }
    : { position: 'absolute' as const, top: 0, bottom: 0, left: 0, width: fillSizePercent }

  const bulgeSize = zone.over === 0 ? 0 : BULGE_SIZE[zone.over]
  const bulgeStyle: ViewStyle = {
    position: 'absolute',
    width: bulgeSize,
    height: bulgeSize,
    borderRadius: bulgeSize / 2,
    backgroundColor: zone.color,
    zIndex: 1,
    ...(isVertical
      ? { top: 0, left: '50%', transform: [{ translateX: -bulgeSize / 2 }] }
      : { right: 0, top: '50%', transform: [{ translateY: -bulgeSize / 2 }] }),
  }

  const targetPct: DimensionValue = `${clampFill(threshold ?? 0) * 100}%`
  const targetLineStyle: ViewStyle = isVertical
    ? {
        position: 'absolute',
        bottom: targetPct,
        left: -3,
        right: -3,
        height: 1.5,
        backgroundColor: TARGET_LINE_COLOR,
        zIndex: 4,
      }
    : {
        position: 'absolute',
        left: targetPct,
        top: -3,
        bottom: -3,
        width: 1.5,
        backgroundColor: TARGET_LINE_COLOR,
        zIndex: 4,
      }

  return (
    <View
      className={className}
      style={{ alignItems: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      accessibilityLabel={`Intensity level: ${pct}%`}
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
            backgroundColor: zone.color,
            zIndex: 2,
            ...(atTarget ? { boxShadow: AT_TARGET_GLOW } : null),
          }}
          testID="intensity-fill"
        />

        {zone.over !== 0 && <View style={bulgeStyle} testID="intensity-bulge" />}

        {threshold != null && <View style={targetLineStyle} testID="intensity-target" />}
      </View>

      <Text
        style={{
          fontSize: 8,
          color: LABEL_COLOR,
          fontFamily: '"Nunito Sans", sans-serif',
          marginTop: 6,
        }}
        accessibilityElementsHidden
        testID="intensity-label"
      >
        {pct}%
      </Text>

      {showThresholdLabel && threshold != null && (
        <Text
          style={{
            fontSize: 8,
            fontWeight: '500',
            color: LABEL_COLOR,
            fontFamily: 'Inter, sans-serif',
            marginTop: 2,
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
