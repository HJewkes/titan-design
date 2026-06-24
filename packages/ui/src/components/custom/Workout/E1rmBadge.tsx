// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, Pressable, Animated, type ViewProps } from 'react-native'
import { Crown } from 'lucide-react'

export type E1rmBadgeSize = 'sm' | 'md' | 'lg'

export interface E1rmBadgeProps extends ViewProps {
  value: number
  unit?: 'lbs' | 'kg'
  /** Show crown icon */
  showIcon?: boolean
  isPr?: boolean
  /** Percentage delta from previous mesocycle */
  delta?: number
  /** Size variant */
  size?: E1rmBadgeSize
  onPress?: () => void
  className?: string
}

const sizeConfig: Record<E1rmBadgeSize, { fontSize: number; paddingH: number; paddingV: number; iconSize: number }> = {
  sm: { fontSize: 9, paddingH: 6, paddingV: 2, iconSize: 10 },
  md: { fontSize: 10, paddingH: 8, paddingV: 2, iconSize: 12 },
  lg: { fontSize: 12, paddingH: 10, paddingV: 4, iconSize: 14 },
}

export function E1rmBadge({
  value,
  unit = 'lbs',
  showIcon = true,
  isPr,
  delta,
  size = 'md',
  onPress,
  className,
  ...props
}: E1rmBadgeProps) {
  const [scaleAnim] = useState(() => new Animated.Value(1))
  const config = sizeConfig[size]

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }

  const iconColor = isPr ? '#FF7900' : '#9CA3AF'

  const deltaLabel = delta != null ? `, ${delta >= 0 ? '+' : ''}${delta}% change` : ''
  const fullLabel = `Estimated one rep max: ${value} ${unit}${deltaLabel}`

  const badge = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: isPr ? 'rgba(255, 121, 0, 0.12)' : '#1F1F1F',
        backgroundColor: isPr ? 'rgba(255, 121, 0, 0.12)' : '#1C1C1C',
        paddingHorizontal: config.paddingH,
        paddingVertical: config.paddingV,
      }}
      accessibilityLabel={`Estimated one rep max: ${value} ${unit}`}
      testID="e1rm-badge"
      {...props}
    >
      {showIcon && (
        <View
          accessibilityElementsHidden
          testID="e1rm-icon"
        >
          <Crown size={config.iconSize} color={iconColor} strokeWidth={2} />
        </View>
      )}
      <Text
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: '600',
          fontSize: config.fontSize,
          color: isPr ? '#FF7900' : '#9CA3AF',
        }}
      >
        {isPr ? '\u2733 ' : ''}{value} {unit}
      </Text>
      {delta != null && (
        <Text
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: config.fontSize,
            marginLeft: 4,
            color: delta >= 0 ? '#4caf50' : '#ef5350',
          }}
          testID="e1rm-delta"
        >
          {delta >= 0 ? '+' : ''}
          {delta}%
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={fullLabel}
          testID="e1rm-badge-pressable"
        >
          {badge}
        </Pressable>
      </Animated.View>
    )
  }

  return badge
}
