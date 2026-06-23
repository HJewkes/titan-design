// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing, type ViewProps } from 'react-native'

export interface IntensityBarProps extends ViewProps {
  /** Intensity as percentage (0-100+). Values over 100 trigger overflow bulge. */
  level: number
  /** Target percentage (0-100). Blue target line position. */
  target?: number
  height?: number
  showLabel?: boolean
  className?: string
}

function getFillStyle(level: number): Record<string, unknown> {
  if (level > 100) {
    if (level >= 130) return { backgroundColor: '#7A1C1C' }
    if (level >= 120) return { backgroundColor: '#A62626' }
    return { backgroundColor: '#D14343' }
  }
  if (level >= 95) {
    return {
      backgroundImage: 'linear-gradient(to top, #FFB020 0%, #FF7900 50%, #D14343 100%)',
    }
  }
  if (level >= 75) return { backgroundColor: '#FFB020' }
  return { backgroundColor: '#14B8A6' }
}

function getBulgeSize(level: number): number {
  if (level >= 130) return 11
  if (level >= 120) return 10
  if (level >= 110) return 8
  return 0
}

function getBulgeColor(level: number): string {
  if (level >= 130) return '#7A1C1C'
  if (level >= 120) return '#A62626'
  return '#D14343'
}

function isNearTarget(level: number, target: number | undefined): boolean {
  if (target == null) return false
  return Math.abs(level - target) <= 2
}

export function IntensityBar({
  level,
  target,
  height = 36,
  showLabel,
  className,
  ...props
}: IntensityBarProps) {
  const fillPct = Math.min(level, 100)
  const fillHeight = (fillPct / 100) * height
  const isOver = level > 100
  const bulgeSize = isOver ? getBulgeSize(level) : 0
  const percentage = Math.round(level)
  const nearTarget = isNearTarget(level, target)

  const bulgeGlowAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (level < 120) {
      bulgeGlowAnim.setValue(0)
      return
    }

    const duration = level >= 130 ? 1500 : 2000
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bulgeGlowAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(bulgeGlowAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [level, bulgeGlowAnim])

  const fillStyle = getFillStyle(level)
  const atTargetGlow = nearTarget
    ? { boxShadow: '0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15)' }
    : undefined

  return (
    <View
      className={className}
      style={{ alignItems: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.min(percentage, 100) }}
      accessibilityLabel={`Intensity level: ${percentage}%`}
      testID="intensity-bar"
      {...props}
    >
      <View
        style={{ width: 6, height, borderRadius: 3, backgroundColor: '#333333', position: 'relative', overflow: 'visible' }}
        accessibilityElementsHidden
      >
        {/* Bulge circle behind fill */}
        {isOver && bulgeSize > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 3 - bulgeSize / 2,
              width: bulgeSize,
              height: bulgeSize,
              borderRadius: bulgeSize / 2,
              backgroundColor: getBulgeColor(level),
              zIndex: 1,
              ...(level >= 120
                ? {
                    boxShadow: bulgeGlowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        '0 0 0 0 rgba(209, 67, 67, 0)',
                        '0 0 3px 1px rgba(209, 67, 67, 0.25)',
                      ],
                    }),
                  }
                : {}),
            }}
            testID="intensity-bulge"
          />
        )}

        {/* Fill bar */}
        <View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: 3,
              height: isOver ? height : fillHeight,
              zIndex: 2,
              transition: 'height 0.3s ease',
            },
            fillStyle as Record<string, unknown>,
            atTargetGlow as Record<string, unknown>,
          ]}
          testID="intensity-fill"
        />

        {/* Target line */}
        {target != null && (
          <View
            style={{
              position: 'absolute',
              bottom: (target / 100) * height - 0.75,
              left: -3,
              right: -3,
              height: 1.5,
              backgroundColor: 'rgba(33, 150, 243, 0.5)',
              zIndex: 4,
            }}
            testID="intensity-target"
          />
        )}
      </View>
      {showLabel && (
        <Text
          style={{
            fontSize: 8,
            color: '#6B7280',
            fontFamily: '"Nunito Sans", sans-serif',
            marginTop: 6,
          }}
          accessibilityElementsHidden
          testID="intensity-label"
        >
          {percentage}%
        </Text>
      )}
    </View>
  )
}
