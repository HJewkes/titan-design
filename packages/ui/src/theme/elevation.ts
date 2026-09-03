/**
 * Elevation System
 *
 * A unified depth system where each elevation level corresponds to:
 * - Calculated surface color (derived from base using lighten)
 * - Shadow intensity and style (raised/pressed)
 * - Dynamically calculated shadow colors (derived from surface color)
 * - Semantic name for reference
 *
 * Elevation range: -2 (deep inset) to +5 (floating overlay)
 *
 * Negative elevations: Inset/pressed elements (sunken into surface)
 * Zero elevation: Base surface (background/page level)
 * Positive elevations: Raised elements (floating above surface)
 *
 * All colors are calculated dynamically from a base surface color,
 * allowing for custom surfaces and consistent color relationships.
 *
 * Lighting Model: Light source from upper-right corner
 * - Raised elements are always lighter than base (consistent across themes)
 * - Base colors must allow sufficient lightening in both themes
 */

import { Platform, type ViewStyle } from 'react-native'
import { lighten, darken, hexToRgb, rgbToHsv, hsvToRgb, rgbToHex } from './color-utils'
import { semanticColorsLight, semanticColorsDark } from './tokens/semantic'

export type ElevationLevel = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5

export interface ElevationConfig {
  /** Semantic name for this elevation level */
  name: string
  /** Amount to lighten base color (0-1) */
  colorAdjustment: number
  /** Shadow intensity */
  shadowIntensity: 'subtle' | 'medium' | 'strong'
  /** Shadow style: raised (floating) or pressed (inset) */
  shadowStyle: 'raised' | 'pressed'
  /** Description of use case */
  description: string
}

export const elevationSystem: Record<ElevationLevel, ElevationConfig> = {
  // Deep inset (recessed input fields, deeply pressed buttons)
  [-2]: {
    name: 'deep-inset',
    colorAdjustment: 0,
    shadowIntensity: 'strong',
    shadowStyle: 'pressed',
    description: 'Deeply recessed elements (e.g., input fields, deeply pressed buttons)',
  },

  // Shallow inset (pressed buttons, sunken panels)
  [-1]: {
    name: 'inset',
    colorAdjustment: 0,
    shadowIntensity: 'medium',
    shadowStyle: 'pressed',
    description: 'Shallow inset elements (e.g., pressed buttons, sunken panels within cards)',
  },

  // Base level (page background, default surface)
  [0]: {
    name: 'base',
    colorAdjustment: 0,
    shadowIntensity: 'subtle',
    shadowStyle: 'raised',
    description: 'Base surface level (page background, default containers)',
  },

  // Level 1: Subtle elevation (outline cards, subtle containers)
  [1]: {
    name: 'subtle',
    // The whole ladder was re-spaced in TD-07.16. It used to run
    // 0.01/0.02/0.04/0.06/0.08, where the first step was ~2 RGB values — under
    // the perceptual floor, so level 1 existed in the type system and nowhere on
    // screen. With drop-shadow now gated off below FLOATING_ELEVATION_MIN, TONE
    // is the only thing separating 0-3, so every step has to actually land.
    // Even 0.025 spacing, verified in elevation.test.ts as ΔL* > 1 per step.
    colorAdjustment: 0.025,
    shadowIntensity: 'subtle',
    shadowStyle: 'raised',
    description: 'Subtle elevation (outline cards, subtle containers)',
  },

  // Level 2: Standard elevation (default cards, buttons)
  [2]: {
    name: 'standard',
    colorAdjustment: 0.05,
    shadowIntensity: 'medium',
    shadowStyle: 'raised',
    description: 'Standard elevation (default cards, raised buttons)',
  },

  // Level 3: Prominent elevation (important cards, modals)
  [3]: {
    name: 'prominent',
    colorAdjustment: 0.075,
    shadowIntensity: 'strong',
    shadowStyle: 'raised',
    description: 'Prominent elevation (important cards, modals, dropdowns)',
  },

  // Level 4: High elevation (overlays, popovers)
  [4]: {
    name: 'high',
    colorAdjustment: 0.10,
    shadowIntensity: 'strong',
    shadowStyle: 'raised',
    description: 'High elevation (overlays, popovers, tooltips)',
  },

  // Level 5: Floating (toasts, floating action buttons)
  [5]: {
    name: 'floating',
    colorAdjustment: 0.13,
    shadowIntensity: 'strong',
    shadowStyle: 'raised',
    description: 'Floating elevation (toasts, floating action buttons, highest z-index)',
  },
}

/**
 * Calculate rim light color from the BASE color.
 * Creates a consistent bright highlight with opacity that scales with elevation.
 *
 * The rim light represents light hitting the edge of raised elements from a
 * consistent light source. Uses ABSOLUTE HSV value (not relative lightening)
 * for consistent intensity across all surface colors.
 *
 * For colored surfaces: preserves hue/saturation, sets value to fixed bright level
 * For gray surfaces: uses white with appropriate opacity
 *
 * @param baseColor - The base surface color (hex)
 * @param level - Elevation level (used to scale opacity)
 */
function calculateRimLightColor(baseColor: string, level: ElevationLevel): string {
  const rgb = hexToRgb(baseColor)
  if (!rgb) {
    return 'rgba(255, 255, 255, 0.5)'
  }

  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const isLight = hsv.v > 0.6
  const isSaturated = hsv.s > 0.3 // Colored (not gray)

  // Opacity scales with elevation to compensate for lighter surfaces at higher levels
  // Range: +0% at level 1 to +20% at level 5
  const absLevel = Math.abs(level)
  const opacityBoost = Math.max(0, (absLevel - 1) * 0.05) // +5% per level above 1 (0% to 20%)

  if (isSaturated) {
    // For colored surfaces, preserve hue and saturation but set value to fixed bright level
    // This ensures consistent rim light intensity across all colored surfaces
    const rimLightValue = 0.95 // Fixed bright value for rim light
    const rimLightRgb = hsvToRgb(hsv.h, hsv.s * 0.3, rimLightValue) // Reduce saturation for brighter appearance

    // Base opacity + elevation boost, capped at 1.0
    const baseOpacity = isLight ? 0.9 : 0.5
    const finalOpacity = Math.min(1, baseOpacity + opacityBoost)
    return `rgba(${rimLightRgb.r}, ${rimLightRgb.g}, ${rimLightRgb.b}, ${finalOpacity.toFixed(2)})`
  } else {
    // For gray/neutral surfaces, use white with appropriate opacity
    const baseOpacity = isLight ? 0.9 : 0.12
    const finalOpacity = Math.min(1, baseOpacity + opacityBoost)
    return `rgba(255, 255, 255, ${finalOpacity.toFixed(2)})`
  }
}

/**
 * Calculate dark shadow colors from the surface color.
 * The dark shadow is cast BY the element, so it should match the surface color.
 *
 * Uses ABSOLUTE HSV value (not relative darkening) for consistent shadow intensity
 * across all surface colors - simulating a consistent light source.
 *
 * For colored surfaces: preserves hue/saturation, sets value to fixed dark level
 * For gray surfaces: uses black with appropriate opacity
 */
function calculateDarkShadowColors(surfaceColor: string): {
  dark: string
  darker: string
} {
  const rgb = hexToRgb(surfaceColor)
  if (!rgb) {
    return {
      dark: 'rgba(0, 0, 0, 0.3)',
      darker: 'rgba(0, 0, 0, 0.4)',
    }
  }

  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const isLight = hsv.v > 0.6
  const isSaturated = hsv.s > 0.3

  if (isSaturated) {
    // For colored surfaces, preserve hue and saturation but set value to fixed dark level
    // This ensures consistent shadow intensity across all colored surfaces
    const darkShadowValue = 0.15 // Fixed dark value for shadows
    const darkShadowRgb = hsvToRgb(hsv.h, hsv.s, darkShadowValue)

    if (isLight) {
      return {
        dark: `rgba(${darkShadowRgb.r}, ${darkShadowRgb.g}, ${darkShadowRgb.b}, 0.3)`,
        darker: `rgba(${darkShadowRgb.r}, ${darkShadowRgb.g}, ${darkShadowRgb.b}, 0.4)`,
      }
    } else {
      return {
        dark: `rgba(${darkShadowRgb.r}, ${darkShadowRgb.g}, ${darkShadowRgb.b}, 0.5)`,
        darker: `rgba(${darkShadowRgb.r}, ${darkShadowRgb.g}, ${darkShadowRgb.b}, 0.6)`,
      }
    }
  } else {
    // For gray surfaces, use standard black shadows
    if (isLight) {
      return {
        dark: 'rgba(0, 0, 0, 0.2)',
        darker: 'rgba(0, 0, 0, 0.3)',
      }
    } else {
      return {
        dark: 'rgba(0, 0, 0, 0.5)',
        darker: 'rgba(0, 0, 0, 0.6)',
      }
    }
  }
}

/**
 * Get rim light size config.
 * Fixed 1px offset and blur for a consistent, crisp rim highlight.
 * Opacity scaling (in calculateRimLightColor) handles elevation differences.
 */
function getRimLightConfig(): { offset: number; blur: number } {
  return {
    offset: 1, // Fixed 1px for crisp rim
    blur: 1, // Tight blur for crisp edge
  }
}

/**
 * Get elevation configuration for a given level
 */
export function getElevationConfig(level: ElevationLevel): ElevationConfig {
  return elevationSystem[level]
}

// Simple cache for elevation surface colors
const elevationSurfaceCache = new Map<string, string>()
const MAX_CACHE_SIZE = 100

function getCacheKey(baseColor: string, level: ElevationLevel, theme: 'light' | 'dark'): string {
  return `${baseColor}-${level}-${theme}`
}

function calculateElevationSurface(
  baseColor: string,
  level: ElevationLevel,
  theme: 'light' | 'dark'
): string {
  const config = elevationSystem[level]

  if (config.colorAdjustment === 0) {
    return baseColor
  }

  // For raised elevations (positive), always lighten (consistent lighting model)
  // Light source is from upper-right, so raised elements are always lighter
  // For inset elevations (negative), we keep base color (shadow creates depth)
  if (level < 0) {
    return baseColor // Inset elements use base color
  }

  // Always lighten for raised elements (consistent across themes)
  // Base colors must be chosen to allow sufficient lightening in dark mode
  return lighten(baseColor, config.colorAdjustment)
}

/**
 * Calculate surface color for an elevation level from a base color.
 * Results are cached to avoid redundant calculations.
 *
 * @param baseColor - Base surface color (hex)
 * @param level - Elevation level
 * @param theme - Current theme ('light' or 'dark')
 * @returns Calculated surface color (hex)
 */
export function getElevationSurface(
  baseColor: string,
  level: ElevationLevel,
  theme: 'light' | 'dark'
): string {
  const cacheKey = getCacheKey(baseColor, level, theme)

  // Check cache
  if (elevationSurfaceCache.has(cacheKey)) {
    return elevationSurfaceCache.get(cacheKey)!
  }

  // Calculate
  const result = calculateElevationSurface(baseColor, level, theme)

  // Cache result (with size limit to prevent memory leaks)
  if (elevationSurfaceCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (simple FIFO)
    const firstKey = elevationSurfaceCache.keys().next().value!
    elevationSurfaceCache.delete(firstKey)
  }
  elevationSurfaceCache.set(cacheKey, result)

  return result
}

// Cache for shadow styles (less frequently used, smaller cache)
const elevationShadowCache = new Map<string, ViewStyle>()
const MAX_SHADOW_CACHE_SIZE = 50

function getShadowCacheKey(
  baseColor: string,
  level: ElevationLevel,
  theme: 'light' | 'dark',
  isHovered: boolean
): string {
  return `${baseColor}-${level}-${theme}-${isHovered}`
}

function calculateElevationShadow(
  baseColor: string,
  level: ElevationLevel,
  theme: 'light' | 'dark',
  isHovered: boolean = false
): ViewStyle {
  const config = elevationSystem[level]

  // Base level has no shadow
  if (level === 0) {
    return {}
  }

  // Calculate the actual elevated surface color
  const elevatedSurfaceColor = calculateElevationSurface(baseColor, level, theme)

  // Rim light: calculated from BASE color (consistent across all elevations)
  // This represents a consistent light source - only size changes with elevation
  const rimLightColor = calculateRimLightColor(baseColor, level)

  // Dark shadow: calculated from ELEVATED surface color
  // The shadow is cast by the element, so it should match the surface
  const darkShadowColors = calculateDarkShadowColors(elevatedSurfaceColor)

  // Get shadow intensity config (for dark shadow)
  const intensityConfig = {
    subtle: { offset: 1, blur: 2 },
    medium: { offset: 2, blur: 4 },
    strong: { offset: 2, blur: 5 },
  }

  const { offset, blur } = intensityConfig[config.shadowIntensity]

  // Get rim light config (scales with elevation level)
  const rimConfig = getRimLightConfig()

  if (config.shadowStyle === 'pressed') {
    // Inset shadow (pressed elements)
    if (isHovered) {
      // Reduce shadow depth for hover
      const hoverOffset = Math.max(1, Math.round(offset / 2))
      const hoverBlur = Math.max(1, Math.round(blur / 2))
      return Platform.select({
        web: {
          boxShadow: `inset ${hoverOffset}px ${hoverOffset}px ${hoverBlur}px ${darkShadowColors.darker}, inset -${rimConfig.offset}px -${rimConfig.offset}px ${rimConfig.blur}px ${rimLightColor}`,
        } as any,
        default: {
          shadowOpacity: 0,
          elevation: 0,
        },
      }) as ViewStyle
    }

    return Platform.select({
      web: {
        boxShadow: `inset ${offset}px ${offset}px ${blur}px ${darkShadowColors.darker}, inset -${rimConfig.offset}px -${rimConfig.offset}px ${rimConfig.blur}px ${rimLightColor}`,
      } as any,
      default: {
        shadowOpacity: 0,
        elevation: 0,
      },
    }) as ViewStyle
  } else {
    // Raised shadow (floating elements)
    if (isHovered) {
      // Reduce shadow depth for hover
      const hoverOffset = Math.max(1, Math.round(offset / 2))
      const hoverBlur = Math.max(1, Math.round(blur / 2))
      return Platform.select({
        web: {
          boxShadow: `${hoverOffset}px ${hoverOffset}px ${hoverBlur}px ${darkShadowColors.dark}, -${rimConfig.offset}px -${rimConfig.offset}px ${rimConfig.blur}px ${rimLightColor}`,
        } as any,
        default: {
          shadowColor: '#000',
          shadowOffset: { width: hoverOffset, height: hoverOffset },
          shadowOpacity: 0.2,
          shadowRadius: hoverBlur / 2,
          elevation: hoverOffset,
        },
      }) as ViewStyle
    }

    return Platform.select({
      web: {
        boxShadow: `${offset}px ${offset}px ${blur}px ${darkShadowColors.dark}, -${rimConfig.offset}px -${rimConfig.offset}px ${rimConfig.blur}px ${rimLightColor}`,
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: offset, height: offset },
        shadowOpacity: 0.3,
        shadowRadius: blur / 2,
        elevation: offset,
      },
    }) as ViewStyle
  }
}

/**
 * Get shadow style for an elevation level, calculated dynamically from surface color.
 * Results are cached to avoid redundant calculations.
 *
 * @param baseColor - Base surface color (hex)
 * @param level - Elevation level
 * @param theme - Current theme ('light' or 'dark')
 * @param isHovered - Whether element is hovered
 * @returns ViewStyle with shadow properties
 */
/**
 * The lowest elevation that still casts an outward shadow.
 *
 * On a near-black surface a drop-shadow is inert: at levels 1-3 the shadow is
 * dark-on-dark and contributes nothing a viewer can see, while still costing a
 * composite layer. Material dropped shadow-as-hierarchy for the same reason.
 * Inline hierarchy is the hairline's job (`hairline-*`), which composites by a
 * constant amount over any plane.
 *
 * At 4+ the element is genuinely FLOATING over a backdrop — menu, popover,
 * toast — where a large soft shadow describes separation from the page rather
 * than a rank in a stack. Those should also carry a hairline ring.
 */
export const FLOATING_ELEVATION_MIN: ElevationLevel = 4

export function getElevationShadow(
  baseColor: string,
  level: ElevationLevel,
  theme: 'light' | 'dark',
  isHovered: boolean = false
): ViewStyle {
  const cacheKey = getShadowCacheKey(baseColor, level, theme, isHovered)

  // Check cache
  if (elevationShadowCache.has(cacheKey)) {
    return elevationShadowCache.get(cacheKey)!
  }

  // Calculate shadow. Outward drop-shadow is gated to FLOATING levels only —
  // see FLOATING_ELEVATION_MIN. Inset levels keep theirs; a recess reads from
  // the inner shadow, which is a different mechanism from a cast shadow.
  const result =
    level > 0 && level < FLOATING_ELEVATION_MIN
      ? {}
      : calculateElevationShadow(baseColor, level, theme, isHovered)

  // Cache result
  if (elevationShadowCache.size >= MAX_SHADOW_CACHE_SIZE) {
    const firstKey = elevationShadowCache.keys().next().value!
    elevationShadowCache.delete(firstKey)
  }
  elevationShadowCache.set(cacheKey, result)

  return result
}

/**
 * Elevation level backing a `<Surface pressed>` recess: the shallow `inset`
 * (-1) step. Pressed exposes ONE level of depth — pressed-2 is intentionally
 * not surfaced (the deeper `-2` deep-inset stays available to `elevation`).
 */
export const PRESSED_ELEVATION_LEVEL: ElevationLevel = -1

/**
 * Inner-shadow recess for a pressed (sunken) surface, tuned to the well's own
 * fill colour so the rim/shadow tints track the darker fill. Composes WITH the
 * darker pressed fill: on web it adds an inset boxShadow; on the native path
 * (no inset-shadow support) it's a no-op and the recess reads via the fill
 * alone — so a pressed surface stays legibly sunken with or without the shadow.
 *
 * @param fillColor - The pressed surface's own fill (one ramp step down).
 * @param theme - Current theme ('light' or 'dark').
 */
export function getPressedRecessShadow(fillColor: string, theme: 'light' | 'dark'): ViewStyle {
  return getElevationShadow(fillColor, PRESSED_ELEVATION_LEVEL, theme)
}

/**
 * Get base surface color from theme.
 * This is the foundation color that all elevations are calculated from.
 *
 * IMPORTANT: Base colors must be chosen to allow sufficient lightening.
 *
 * **Light Mode**: Cannot use `#FFFFFF` (white) - cannot lighten white!
 *   - Use `#F3F4F6` (neutral[100]) - can lighten to `#FAFAFA` → `#FFFFFF`
 *   - This allows raised elevations to be lighter (closer to white)
 *
 * **Dark Mode**: Need lighter base to allow sufficient lightening
 *   - Use `surface-elevated` (#2A2827, TD-surface-tokens ramp) - allows further lightening
 *
 * Can be overridden to use custom base colors for special cases.
 */
export function getBaseSurfaceColor(theme: 'light' | 'dark'): string {
  // Use semantic token values so elevation colors stay in sync with the token pipeline.
  // Light mode: surface-raised (#F3F4F6 / neutral[100]) - NOT white, so we can lighten it
  // Dark mode: surface-elevated (#2A2827, TD-surface-tokens ramp) - allows sufficient lightening

  return theme === 'light'
    ? semanticColorsLight['surface-raised']
    : semanticColorsDark['surface-elevated']
}

/**
 * Component-specific elevation ranges
 * Defines which elevation levels each component type can use
 */
export const componentElevationRanges = {
  button: {
    allowed: [2] as const,
    default: 2 as const,
    hover: 3 as const,
  },
  card: {
    allowed: [1, 2, 3] as const,
    default: 2 as const,
    hover: 3 as const,
  },
  input: {
    allowed: [-2, -1, 0] as const,
    default: -1 as const,
  },
  overlay: {
    allowed: [4, 5] as const,
    default: 4 as const,
  },
} as const

export type ComponentType = keyof typeof componentElevationRanges

/**
 * Validate and clamp elevation to component's allowed range
 */
export function getValidatedElevation(
  component: ComponentType,
  requested: ElevationLevel
): ElevationLevel {
  const range = componentElevationRanges[component]
  if ((range.allowed as readonly ElevationLevel[]).includes(requested)) {
    return requested
  }
  // Clamp to nearest allowed elevation
  const sorted = [...range.allowed].sort((a, b) => a - b)
  if (requested < sorted[0]) return sorted[0]
  if (requested > sorted[sorted.length - 1]) return sorted[sorted.length - 1]
  // Find closest
  return sorted.reduce((prev, curr) =>
    Math.abs(curr - requested) < Math.abs(prev - requested) ? curr : prev
  ) as ElevationLevel
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
 * Get a glow shadow style for emphasis/active states.
 *
 * Creates a colored radial glow around an element, useful for:
 * - Active recording indicators (orange glow)
 * - Success states (green glow)
 * - Error/danger indicators (red glow)
 * - Focus rings and attention-drawing elements
 *
 * @param color - Glow color (hex string, e.g. '#FF7900')
 * @param intensity - Glow intensity level
 * @returns ViewStyle with platform-specific shadow properties
 */
export function getGlowShadow(color: string, intensity: GlowIntensity = 'medium'): ViewStyle {
  const config = glowConfig[intensity]
  const rgb = hexToRgb(color)
  if (!rgb) return {}

  return Platform.select({
    web: {
      boxShadow: `0 0 ${config.blur}px ${config.spread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${config.opacity})`,
    } as any,
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: config.opacity,
      shadowRadius: config.blur / 2,
      elevation: 0,
    },
  }) as ViewStyle
}
