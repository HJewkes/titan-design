import React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import {
  type ElevationLevel,
  getElevationSurface,
  getElevationShadow,
  getBaseSurfaceColor,
  type GlowIntensity,
  getGlowShadow,
} from '../../../theme/elevation'

export interface SurfaceProps extends ViewProps {
  elevation?: ElevationLevel
  glowColor?: string
  glowIntensity?: GlowIntensity
  theme?: 'light' | 'dark'
  className?: string
  children: React.ReactNode
}

export function Surface({
  elevation = 0,
  glowColor,
  glowIntensity,
  theme = 'dark',
  className,
  style,
  children,
  ...props
}: SurfaceProps) {
  const baseColor = getBaseSurfaceColor(theme)
  const surfaceColor = getElevationSurface(baseColor, elevation, theme)
  const shadowStyle = getElevationShadow(baseColor, elevation, theme)
  const glowStyle = glowColor ? getGlowShadow(glowColor, glowIntensity) : {}

  return (
    <View
      className={cn('rounded-2xl', className)}
      style={[
        { backgroundColor: surfaceColor },
        shadowStyle,
        glowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}
