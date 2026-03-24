import React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg'
export type IndicatorColor = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'

export interface IndicatorProps extends ViewProps {
  /** Dot size */
  size?: IndicatorSize
  /** Semantic color */
  color?: IndicatorColor
  /** Custom hex color (overrides color prop) */
  customColor?: string
  /** Add a glow shadow effect */
  glow?: boolean
  /** Add a ring border */
  ring?: boolean
  /** Additional className */
  className?: string
}

const sizeStyles: Record<IndicatorSize, string> = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
}

const colorStyles: Record<IndicatorColor, string> = {
  default: 'bg-text-tertiary',
  primary: 'bg-brand-primary',
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
}

export function Indicator({
  size = 'sm',
  color = 'default',
  customColor,
  glow = false,
  ring = false,
  className,
  style,
  ...props
}: IndicatorProps) {
  const dynamicStyle = {
    ...(typeof style === 'object' ? style : {}),
    ...(customColor ? { backgroundColor: customColor } : {}),
    ...(glow && !customColor ? {} : {}),
    ...(glow && customColor ? { boxShadow: `0 0 6px ${customColor}` } : {}),
  }

  return (
    <View
      className={cn(
        'rounded-full shrink-0',
        sizeStyles[size],
        !customColor && colorStyles[color],
        ring && 'border-2 border-background-base',
        glow && !customColor && color === 'success' && 'shadow-[0_0_6px_rgba(20,184,166,0.6)]',
        glow && !customColor && color === 'error' && 'shadow-[0_0_6px_rgba(239,68,68,0.6)]',
        glow && !customColor && color === 'warning' && 'shadow-[0_0_6px_rgba(245,158,11,0.6)]',
        glow && !customColor && color === 'primary' && 'shadow-[0_0_6px_rgba(255,121,0,0.6)]',
        className
      )}
      style={Object.keys(dynamicStyle).length > 0 ? dynamicStyle : style}
      {...props}
    />
  )
}
