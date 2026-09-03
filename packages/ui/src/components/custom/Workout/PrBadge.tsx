// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Animated, Easing, type ViewProps } from 'react-native'
import { StarIcon } from './icons'
import { BaseBadge } from './BaseBadge'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']

export type PRType = 'e1rm' | 'weight' | 'reps' | 'volume' | 'velocity'

export interface PrBadgeProps extends ViewProps {
  /** PR type determines auto-generated label */
  type?: PRType
  /** Display label (e.g., "PR e1RM", "PR 5RM"). Auto-generated from type if omitted. */
  label?: string
  /** Show only the star icon, no text label */
  compact?: boolean
  /** Trigger pop animation on mount */
  animate?: boolean
  className?: string
}

const typeLabels: Record<PRType, string> = {
  e1rm: 'PR e1RM',
  weight: 'PR Weight',
  reps: 'PR Reps',
  volume: 'PR Volume',
  velocity: 'PR Velocity',
}

export function PrBadge({
  type = 'e1rm',
  label: labelProp,
  compact = false,
  animate = true,
  className,
  ...props
}: PrBadgeProps) {
  const resolvedLabel = labelProp ?? typeLabels[type]
  const [scale] = useState(() => new Animated.Value(animate ? 0.8 : 1))
  const [opacity] = useState(() => new Animated.Value(animate ? 0 : 1))

  useEffect(() => {
    if (!animate) return

    // HTML demo uses a 3-keyframe sequence; bezier approximation is close enough for native
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
    ]).start()
  }, [animate, scale, opacity])

  const badge = compact ? (
    <View
      className={className}
      accessibilityRole="image"
      accessibilityLabel={`Personal record: ${resolvedLabel}`}
      testID="pr-badge-star"
      {...props}
    >
      <StarIcon size={14} color={BRAND_PRIMARY} fill={BRAND_PRIMARY} strokeWidth={2} />
    </View>
  ) : (
    <BaseBadge
      variant="pr"
      className={className}
      accessibilityLabel={`Personal record: ${resolvedLabel}`}
      {...props}
    >
      <Text
        style={{
          fontSize: 12,
          color: BRAND_PRIMARY,
          fontWeight: '700',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {'\u2605'} {resolvedLabel}
      </Text>
    </BaseBadge>
  )

  if (animate) {
    return (
      <Animated.View style={{ transform: [{ scale }], opacity }} testID="pr-badge-animated">
        {badge}
      </Animated.View>
    )
  }

  return badge
}
