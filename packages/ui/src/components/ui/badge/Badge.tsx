import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Indicator, type IndicatorColor } from '../indicator'

export type BadgeVariant = 'solid' | 'subtle' | 'outline'
export type BadgeColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends ViewProps {
  /** Visual variant */
  variant?: BadgeVariant
  /** Color scheme */
  color?: BadgeColor
  /** Size */
  size?: BadgeSize
  /** Show a leading indicator dot */
  dot?: boolean
  /** Color for the dot indicator (defaults to match badge color) */
  dotColor?: IndicatorColor
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const variantColorStyles: Record<BadgeVariant, Record<BadgeColor, string>> = {
  solid: {
    default: 'bg-hairline-strong text-text-inverse',
    primary: 'bg-brand-primary text-text-inverse',
    secondary: 'bg-brand-secondary text-text-inverse',
    success: 'bg-status-success text-text-inverse',
    error: 'bg-status-error text-text-inverse',
    warning: 'bg-status-warning text-text-inverse',
    info: 'bg-status-info text-text-inverse',
  },
  subtle: {
    default: 'bg-surface-raised text-text-secondary',
    primary: 'bg-brand-primary-subtle text-brand-primary',
    secondary: 'bg-brand-secondary-subtle text-brand-secondary',
    success: 'bg-status-success-subtle text-status-success',
    error: 'bg-status-error-subtle text-status-error',
    warning: 'bg-status-warning-subtle text-status-warning',
    info: 'bg-status-info-subtle text-status-info',
  },
  outline: {
    default: 'border border-hairline-strong text-text-secondary',
    primary: 'border border-brand-primary text-brand-primary',
    secondary: 'border border-brand-secondary text-brand-secondary',
    success: 'border border-status-success text-status-success',
    error: 'border border-status-error text-status-error',
    warning: 'border border-status-warning text-status-warning',
    info: 'border border-status-info text-status-info',
  },
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

/**
 * Badge component for status indicators and labels.
 *
 * @example
 * <Badge color="success">Active</Badge>
 * <Badge variant="outline" color="warning">Pending</Badge>
 */
export function Badge({
  variant = 'subtle',
  color = 'default',
  size = 'md',
  dot,
  dotColor,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <View
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        variantColorStyles[variant][color],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <Indicator
          size="xs"
          color={dotColor ?? (color === 'default' || color === 'secondary' ? 'default' : color as IndicatorColor)}
          className="mr-0.5"
        />
      )}
      {typeof children === 'string' ? (
        <Text className="text-inherit font-medium">{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}

export interface BadgeTextProps {
  children: React.ReactNode
  className?: string
}

/**
 * Text component for Badge content.
 */
export function BadgeText({ children, className }: BadgeTextProps) {
  return (
    <Text className={cn('text-inherit font-medium', className)}>
      {children}
    </Text>
  )
}
