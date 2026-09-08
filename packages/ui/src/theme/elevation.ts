/**
 * Elevation — numeric depth that resolves to the grey ramp.
 *
 * A level is a plane on the surface ramp plus the treatment that plane wears:
 *
 *   -2  frame        recessed  (inset well, two planes down)
 *   -1  background   recessed  (inset well, one plane down)
 *    0  base         flat, no treatment
 *    1  elevated     lifted    (tone + rim-light + ambient shadow)
 *    2  raised       lifted
 *    3  overlay      lifted
 *    4  overlay      floating  (same recipe, larger shadow)
 *    5  overlay      floating
 *
 * These are ABSOLUTE readings from the page plane. `<Surface>` and `<Card>`
 * apply the same numbers RELATIVE to the plane they are nested in; see
 * `resolveSurfaceDepth`.
 *
 * No level can produce a colour off the ramp. The previous ladder lightened a
 * base colour in HSV by 2.5% per level and put five of its six stops between
 * ramp steps, drifting warmer as it rose while the ramp is designed to cool.
 * Floating levels share the overlay plane on purpose: past the top of the ramp,
 * separation is the shadow's job, not a lighter grey.
 *
 * Depth is TONE + LIFT by default. The earlier rule that levels 1–3 separate by
 * tone alone (TD-07.16) was reversed on 2026-09-08: the tight upper steps of the
 * ramp (ΔL* 2.5–3) need the second channel, and a soft ambient shadow on a
 * near-black plane is not inert once the rim-light gives it an edge to fall
 * from. See Foundations/Depth.
 */
import { Platform, type ViewStyle } from 'react-native'
import { hexToRgb } from './color-utils'
import { insetWell } from './materials'
import { FLOATING_LIFT_MIN, liftStyle, type LiftOptions, type LiftStep } from './lift'
import { surfaceBackground, type SurfaceLevel } from './surface-planes'
import type { ThemeMode } from './tokens/semantic'

export type ElevationLevel = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5

export const ELEVATION_PLANE: Record<ElevationLevel, SurfaceLevel> = {
  [-2]: 'frame',
  [-1]: 'background',
  [0]: 'base',
  [1]: 'elevated',
  [2]: 'raised',
  [3]: 'overlay',
  [4]: 'overlay',
  [5]: 'overlay',
}

/** The lowest elevation that is floating (menu, popover, toast) rather than content. */
export const FLOATING_ELEVATION_MIN: ElevationLevel = FLOATING_LIFT_MIN

/** Elevation backing a `<Surface pressed>` recess: one plane down. */
export const PRESSED_ELEVATION_LEVEL: ElevationLevel = -1

/** The ramp plane an absolute elevation sits on. */
export function elevationPlane(level: ElevationLevel): SurfaceLevel {
  return ELEVATION_PLANE[level]
}

/** The background hex for an absolute elevation: always a ramp step. */
export function getElevationSurface(level: ElevationLevel, mode: ThemeMode = 'dark'): string {
  return surfaceBackground(ELEVATION_PLANE[level], mode)
}

/**
 * Inner-shadow recess for a pressed (sunken) surface: the `insetWell` material's
 * cut, which the wall calibrated in VW-99. Web only; on native the recess reads
 * from the darker fill alone, which is why the fill is never optional.
 */
export function getPressedRecessShadow(fillColor: string, _mode: ThemeMode = 'dark'): ViewStyle {
  const { boxShadow } = insetWell(fillColor) as unknown as { boxShadow: string }
  return Platform.select({
    web: { boxShadow } as unknown as ViewStyle,
    default: {},
  }) as ViewStyle
}

/**
 * The treatment an absolute elevation wears: a recess below 0, nothing at 0,
 * a lift above it. Compose after `backgroundColor`.
 */
export function getElevationShadow(
  level: ElevationLevel,
  mode: ThemeMode = 'dark',
  opts: LiftOptions = {}
): ViewStyle {
  if (level < 0) return getPressedRecessShadow(getElevationSurface(level, mode), mode)
  if (level === 0) return {}
  return liftStyle(level as LiftStep, mode, opts)
}

// =============================================================================
// Glow Shadow Support
// =============================================================================

export type GlowIntensity = 'subtle' | 'medium' | 'strong'

const glowConfig: Record<GlowIntensity, { blur: number; spread: number; opacity: number }> = {
  subtle: { blur: 12, spread: 0, opacity: 0.25 },
  medium: { blur: 20, spread: 2, opacity: 0.4 },
  strong: { blur: 30, spread: 4, opacity: 0.55 },
}

/**
 * A coloured radial glow around an element, for emphasis and active states:
 * a live recording indicator, a success or error pulse, a focus halo.
 */
export function getGlowShadow(color: string, intensity: GlowIntensity = 'medium'): ViewStyle {
  const config = glowConfig[intensity]
  const rgb = hexToRgb(color)
  if (!rgb) return {}

  return Platform.select({
    web: {
      boxShadow: `0 0 ${config.blur}px ${config.spread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${config.opacity})`,
    } as unknown as ViewStyle,
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: config.opacity,
      shadowRadius: config.blur / 2,
      elevation: 0,
    },
  }) as ViewStyle
}
