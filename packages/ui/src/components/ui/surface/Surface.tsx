import React, { useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { type ThemeMode } from '../../../theme/tokens/semantic'
import {
  type ElevationLevel,
  getElevationSurface,
  getElevationShadow,
  getBaseSurfaceColor,
  type GlowIntensity,
  getGlowShadow,
} from '../../../theme/elevation'
import {
  SurfaceContext,
  surfaceBackground,
  useSurface,
  type SurfaceContextValue,
  type SurfaceLevel,
} from './SurfaceContext'

export interface SurfaceProps extends ViewProps {
  /**
   * Numeric depth → a computed lighten + shadow (the raised-card model). The
   * background is derived from the base surface by lightening. Ignored for the
   * background when `level` is set. Default 0 (flat card).
   */
  elevation?: ElevationLevel
  /**
   * Named charcoal plane (shell / rail / stage). Sets the background directly
   * from a semantic surface token — reaching the darker nav/page planes the
   * lighten model can't — and drops the default rounding + auto shadow so the
   * plane reads full-bleed. Composable with `elevation`'s glow.
   */
  level?: SurfaceLevel
  glowColor?: string
  glowIntensity?: GlowIntensity
  /**
   * Theme mode. Also seeds the on-surface colour CONTEXT so descendant text /
   * icons resolve their colour from this surface instead of a `text-*` className
   * that silently fails to black on raw RN. Inherits the nearest Surface /
   * ThemeProvider when omitted (default dark — the wall).
   */
  theme?: ThemeMode
  /** Round the corners. Defaults on for the card model, off for a `level` plane. */
  rounded?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * A container that OWNS its background and establishes an on-surface colour
 * context. Two grounded ways to pick the background:
 *  - `elevation` (numeric): the raised-card model — lighten-from-base + shadow.
 *  - `level` (named): a flat charcoal plane straight from a semantic token,
 *    for the shell / rail / stage backgrounds.
 * Either way, descendants read the surface via {@link useOnSurfaceColor} /
 * {@link useSurfaceMode} rather than hard-coding `getSemanticColors('dark')`.
 */
export function Surface({
  elevation = 0,
  level,
  glowColor,
  glowIntensity,
  theme,
  rounded,
  className,
  style,
  children,
  ...props
}: SurfaceProps) {
  const inherited = useSurface()
  const mode = theme ?? inherited.mode
  const isPlane = level != null

  const baseColor = getBaseSurfaceColor(mode)
  const backgroundColor = isPlane
    ? surfaceBackground(level, mode)
    : getElevationSurface(baseColor, elevation, mode)
  // Planes own a flat full-bleed background; the card model keeps its depth shadow.
  const shadowStyle = isPlane ? {} : getElevationShadow(baseColor, elevation, mode)
  const glowStyle = glowColor ? getGlowShadow(glowColor, glowIntensity) : {}
  const applyRounded = rounded ?? !isPlane

  const value = useMemo<SurfaceContextValue>(
    () => ({ mode, level: level ?? inherited.level }),
    [mode, level, inherited.level]
  )

  return (
    <SurfaceContext.Provider value={value}>
      <View
        className={cn(applyRounded && 'rounded-2xl', className)}
        // backgroundColor first so a caller `style` can still override it.
        style={[{ backgroundColor }, shadowStyle, glowStyle, style]}
        {...props}
      >
        {children}
      </View>
    </SurfaceContext.Provider>
  )
}
