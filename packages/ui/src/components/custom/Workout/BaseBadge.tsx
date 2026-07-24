// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactNode } from 'react'
import { View, Pressable, Animated, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

export type BaseBadgeVariant = 'plain' | 'pr'
export type BaseBadgeSize = 'sm' | 'md' | 'lg'

export interface BaseBadgeProps extends ViewProps {
  /** Visual variant — plain (neutral) or pr (brand-primary-subtle) */
  variant?: BaseBadgeVariant
  /** Size variant */
  size?: BaseBadgeSize
  /** Optional icon rendered left of children; hidden from a11y tree */
  icon?: ReactNode
  onPress?: () => void
  className?: string
  children?: ReactNode
}

export const baseBadgeSizeConfig: Record<
  BaseBadgeSize,
  { fontSize: number; paddingH: number; paddingV: number; iconSize: number }
> = {
  sm: { fontSize: 9, paddingH: 6, paddingV: 2, iconSize: 10 },
  md: { fontSize: 10, paddingH: 8, paddingV: 2, iconSize: 12 },
  lg: { fontSize: 12, paddingH: 10, paddingV: 4, iconSize: 14 },
}

const variantColors: Record<BaseBadgeVariant, { backgroundColor: string; borderColor: string }> = {
  plain: { backgroundColor: t['surface-raised'], borderColor: '#1F1F1F' },
  pr: {
    backgroundColor: 'rgba(255, 121, 0, 0.12)',
    borderColor: 'rgba(255, 121, 0, 0.3)',
  },
}

export function BaseBadge({
  variant = 'plain',
  size = 'md',
  icon,
  onPress,
  className,
  children,
  ...props
}: BaseBadgeProps) {
  const [scaleAnim] = useState(() => new Animated.Value(1))
  const config = baseBadgeSizeConfig[size]
  const colors = variantColors[variant]

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

  const badge = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        // borderRadius 2 is intentional per workout-tokens.ts (squared-off pill)
        borderRadius: 2,
        borderWidth: 1,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        paddingHorizontal: config.paddingH,
        paddingVertical: config.paddingV,
      }}
      {...props}
    >
      {icon != null && (
        <View accessibilityElementsHidden testID="base-badge-icon">
          {icon}
        </View>
      )}
      {children}
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
          accessibilityLabel={props.accessibilityLabel}
          testID="base-badge-pressable"
        >
          {badge}
        </Pressable>
      </Animated.View>
    )
  }

  return badge
}
