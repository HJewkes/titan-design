import React, { useMemo } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { cn } from '../../../utils/cn'
import { type ThemeMode } from '../../../theme/tokens/semantic'
import {
  type ElevationLevel,
  getElevationSurface,
  getElevationShadow,
  getPressedRecessShadow,
  getBaseSurfaceColor,
  type GlowIntensity,
  getGlowShadow,
} from '../../../theme/elevation'
import {
  SurfaceContext,
  surfaceBackground,
  pressedLevel,
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
   * Named grey plane (shell / rail / stage). Sets the background directly
   * from a semantic surface token — reaching the darker nav/page planes the
   * lighten model can't — and drops the default rounding + auto shadow so the
   * plane reads full-bleed. Composable with `elevation`'s glow.
   */
  level?: SurfaceLevel
  /**
   * Sunken "well": render ONE ramp step DOWN from the parent surface's level —
   * the symmetric twin of a raised surface stepping up — and add an inner-shadow
   * recess so the surface reads pressed (darker fill + inset shadow). Relative to
   * the enclosing Surface's level (not this surface's own `level`), and clamped
   * at the ramp's `inset` floor so it never underflows. One level of depth only.
   */
  pressed?: boolean
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
 *  - `level` (named): a flat grey plane straight from a semantic token,
 *    for the shell / rail / stage backgrounds.
 * Either way, descendants read the surface via {@link useOnSurfaceColor} /
 * {@link useSurfaceMode} rather than hard-coding `getSemanticColors('dark')`.
 */
export function Surface({
  elevation = 0,
  level,
  pressed = false,
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

  // Three grounded ways to own a background, in precedence order:
  //  - pressed: a well ONE ramp step DOWN from the parent level (relative),
  //    with an inner-shadow recess — clamps at the `inset` floor.
  //  - level (named plane): a flat grey plane straight from a token.
  //  - elevation (numeric): the raised-card model — lighten-from-base + shadow.
  const baseColor = getBaseSurfaceColor(mode)
  const resolvedLevel = pressed ? pressedLevel(inherited.level) : (level ?? inherited.level)

  let backgroundColor: string
  let shadowStyle: ViewStyle
  if (pressed) {
    backgroundColor = surfaceBackground(resolvedLevel, mode)
    shadowStyle = getPressedRecessShadow(backgroundColor, mode)
  } else if (isPlane) {
    backgroundColor = surfaceBackground(level, mode)
    // Planes own a flat full-bleed background — no depth shadow.
    shadowStyle = {}
  } else {
    backgroundColor = getElevationSurface(baseColor, elevation, mode)
    shadowStyle = getElevationShadow(baseColor, elevation, mode)
  }

  const glowStyle = glowColor ? getGlowShadow(glowColor, glowIntensity) : {}
  // A pressed well and the card model round by default; a flat plane doesn't.
  const applyRounded = rounded ?? (pressed || !isPlane)

  const value = useMemo<SurfaceContextValue>(
    () => ({ mode, level: resolvedLevel }),
    [mode, resolvedLevel]
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
