// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactNode } from 'react'
import { View, Pressable, Animated, type ViewProps } from 'react-native'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { alpha } from '../../../utils/colors'
import { cn } from '../../../utils/cn'

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

export const baseBadgeSizeConfig: Record<BaseBadgeSize, { fontSize: number; iconSize: number }> = {
  sm: { fontSize: 9, iconSize: 10 },
  md: { fontSize: 10, iconSize: 12 },
  lg: { fontSize: 12, iconSize: 14 },
}

/** 6 and 10 are on the numeric scale but off the squish-x ramp (4/8/12/16). */
const sizePadding: Record<BaseBadgeSize, string> = {
  sm: 'px-1.5 py-squish-y-sm',
  md: 'px-squish-x-sm py-squish-y-sm',
  lg: 'px-2.5 py-squish-y-md',
}

/** Resolved per render from the enclosing Surface's mode, never frozen at import (VW-316). */
function variantColors(
  mode: ThemeMode
): Record<BaseBadgeVariant, { backgroundColor: string; borderColor: string }> {
  const t = getSemanticColors(mode)
  return {
    plain: { backgroundColor: t['surface-raised'], borderColor: t['hairline-default'] },
    pr: {
      backgroundColor: alpha(t['brand-primary'], 0.12),
      borderColor: alpha(t['brand-primary'], 0.3),
    },
  }
}

/**
 * @deprecated Use `<Pill tone="…" variant="…">` — removed after AW-127 consumer migration.
 */
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
  const colors = variantColors(useSurfaceMode())[variant]

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
      className={cn('flex-row items-center gap-inline-sm', sizePadding[size], className)}
      style={{
        // borderRadius 2 is intentional per workout-tokens.ts (squared-off pill)
        borderRadius: 2,
        borderWidth: 1,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
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
