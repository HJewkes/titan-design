import React, { useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { type GlowIntensity, getGlowShadow } from '../../../theme/elevation'
import { SurfaceContext, type SurfaceContextValue } from './SurfaceContext'
import { useResolvedSurface, type SurfaceDepthProps } from './resolveSurface'

export interface SurfaceProps extends ViewProps, SurfaceDepthProps {
  glowColor?: string
  glowIntensity?: GlowIntensity
  /** Round the corners. Defaults on for a lifted or pressed surface, off for an absolute plane. */
  rounded?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * A container that OWNS its background and establishes an on-surface colour
 * context. Depth is relative to the enclosing Surface:
 *  - `raise` / positive `elevation`: step up the ramp and wear the lift
 *    treatment (rim-light + ambient shadow). Clamps at `overlay`.
 *  - `pressed` / negative `elevation`: step down with an inner-shadow recess.
 *  - `level` (absolute): a flat grey plane straight from a token, for shell
 *    roots only (shell = background, page = base). No lift.
 *  - nothing: sit flat on the inherited plane.
 * Descendants read the surface via {@link useOnSurfaceColor} / {@link useSurfaceMode}
 * rather than hard-coding `getSemanticColors('dark')`.
 */
export function Surface({
  elevation,
  level,
  raise,
  pressed = false,
  lift,
  liftOptions,
  glowColor,
  glowIntensity,
  theme,
  rounded,
  className,
  style,
  children,
  ...props
}: SurfaceProps) {
  const resolved = useResolvedSurface({
    elevation,
    level,
    raise,
    pressed,
    lift,
    liftOptions,
    theme,
  })
  const glowStyle = glowColor ? getGlowShadow(glowColor, glowIntensity) : {}
  const applyRounded = rounded ?? (pressed || level == null)

  const value = useMemo<SurfaceContextValue>(
    () => ({ mode: resolved.mode, level: resolved.plane }),
    [resolved.mode, resolved.plane]
  )

  return (
    <SurfaceContext.Provider value={value}>
      <View
        className={cn(applyRounded && 'rounded-2xl', className)}
        // backgroundColor first so a caller `style` can still override it.
        style={[
          { backgroundColor: resolved.backgroundColor },
          resolved.depthStyle,
          glowStyle,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </SurfaceContext.Provider>
  )
}
