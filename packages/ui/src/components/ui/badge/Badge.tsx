import React from 'react'
import { Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Indicator, type IndicatorColor } from '../indicator'
import { Pill, type PillTone, type PillVariant } from '../pill'

export type BadgeVariant = 'solid' | 'subtle' | 'outline'
export type BadgeColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
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

const colorToTone: Record<BadgeColor, PillTone> = {
  default: 'neutral',
  primary: 'brand',
  secondary: 'brand-secondary',
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

/** Badge keeps its own geometry; Pill supplies structure, tone and the slots. */
const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5',
  md: 'px-2 py-0.5',
  lg: 'px-2.5 py-1',
}

const textSizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
}

function dotIndicatorColor(color: BadgeColor, dotColor?: IndicatorColor): IndicatorColor {
  if (dotColor) return dotColor
  return color === 'default' || color === 'secondary' ? 'default' : (color as IndicatorColor)
}

/**
 * Badge — a `Pill` preset for status indicators and labels.
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
    <Pill
      variant={variant as PillVariant}
      tone={colorToTone[color]}
      leading={
        dot ? (
          <Indicator size="xs" color={dotIndicatorColor(color, dotColor)} className="mr-0.5" />
        ) : undefined
      }
      className={cn(
        'justify-center self-auto gap-0',
        variant === 'outline' ? 'border' : 'border-0',
        sizeStyles[size],
        className
      )}
      textClassName={cn('font-sans font-medium', textSizeStyles[size])}
      {...props}
    >
      {children}
    </Pill>
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
  return <Text className={cn('text-inherit font-medium', className)}>{children}</Text>
}
