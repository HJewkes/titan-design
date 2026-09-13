import React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

type IconBoxColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral'

type IconBoxSize = 'sm' | 'md' | 'lg'

export interface IconBoxProps extends ViewProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  color?: IconBoxColor
  size?: IconBoxSize
  className?: string
}

// `-subtle` is the wash ladder's lightest rung. It replaces a `/10` opacity
// modifier, which emitted no rule at all against a var()-backed token (VW-308).
const colorClasses: Record<IconBoxColor, { bg: string; icon: string }> = {
  primary: { bg: 'bg-brand-primary-subtle', icon: 'text-brand-primary' },
  secondary: { bg: 'bg-brand-secondary-subtle', icon: 'text-brand-secondary' },
  success: { bg: 'bg-status-success-subtle', icon: 'text-status-success' },
  error: { bg: 'bg-status-error-subtle', icon: 'text-status-error' },
  warning: { bg: 'bg-status-warning-subtle', icon: 'text-status-warning' },
  info: { bg: 'bg-status-info-subtle', icon: 'text-status-info' },
  neutral: { bg: 'bg-surface-elevated', icon: 'text-text-secondary' },
}

const sizeClasses: Record<IconBoxSize, { box: string; iconSize: number }> = {
  sm: { box: 'w-8 h-8 rounded-lg', iconSize: 16 },
  md: { box: 'w-10 h-10 rounded-xl', iconSize: 20 },
  lg: { box: 'w-12 h-12 rounded-xl', iconSize: 24 },
}

export function IconBox({
  icon: Icon,
  color = 'neutral',
  size = 'md',
  className,
  ...props
}: IconBoxProps) {
  const colors = colorClasses[color]
  const sizes = sizeClasses[size]

  return (
    <View className={cn('items-center justify-center', colors.bg, sizes.box, className)} {...props}>
      <Icon size={sizes.iconSize} className={colors.icon} />
    </View>
  )
}
