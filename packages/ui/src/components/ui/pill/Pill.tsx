import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type PillVariant = 'subtle' | 'outline'
export type PillColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
export type PillSize = 'xs' | 'sm' | 'md'

export interface PillProps extends ViewProps {
  /** Pill content */
  children: React.ReactNode
  /** Visual variant */
  variant?: PillVariant
  /** Color scheme */
  color?: PillColor
  /** Size */
  size?: PillSize
  /** Fully rounded (default true) or slight radius */
  rounded?: boolean
  /** Element before the label (e.g., Indicator dot) */
  leftElement?: React.ReactNode
  /** Press handler (makes pill interactive) */
  onPress?: () => void
  /** Additional className */
  className?: string
}

const variantColorStyles: Record<PillVariant, Record<PillColor, string>> = {
  subtle: {
    default: 'bg-surface-raised border-hairline-subtle text-text-secondary',
    primary: 'bg-brand-primary/10 border-brand-primary/25 text-brand-primary',
    secondary: 'bg-brand-secondary/10 border-brand-secondary/25 text-brand-secondary',
    success: 'bg-status-success/10 border-status-success/25 text-status-success',
    error: 'bg-status-error/10 border-status-error/25 text-status-error',
    warning: 'bg-status-warning/10 border-status-warning/25 text-status-warning',
    info: 'bg-status-info/10 border-status-info/25 text-status-info',
  },
  outline: {
    default: 'border-hairline text-text-secondary',
    primary: 'border-brand-primary text-brand-primary',
    secondary: 'border-brand-secondary text-brand-secondary',
    success: 'border-status-success text-status-success',
    error: 'border-status-error text-status-error',
    warning: 'border-status-warning text-status-warning',
    info: 'border-status-info text-status-info',
  },
}

const sizeStyles: Record<PillSize, { container: string; text: string }> = {
  xs: { container: 'px-1 py-px', text: 'text-[9px]' },
  sm: { container: 'px-2 py-0.5', text: 'text-[10px]' },
  md: { container: 'px-2 py-1', text: 'text-[10px]' },
}

export function Pill({
  children,
  variant = 'subtle',
  color = 'default',
  size = 'sm',
  rounded = true,
  leftElement,
  onPress,
  className,
  ...props
}: PillProps) {
  const containerClasses = cn(
    'flex-row items-center gap-1 border self-start shrink-0',
    rounded ? 'rounded-full' : 'rounded',
    variantColorStyles[variant][color],
    sizeStyles[size].container,
    className
  )

  const textClasses = cn('font-heading font-semibold', sizeStyles[size].text, 'text-inherit')

  const content = (
    <>
      {leftElement}
      {typeof children === 'string' ? <Text className={textClasses}>{children}</Text> : children}
    </>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={containerClasses} {...props}>
        {content}
      </Pressable>
    )
  }

  return (
    <View className={containerClasses} {...props}>
      {content}
    </View>
  )
}
