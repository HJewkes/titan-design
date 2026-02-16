/**
 * Neumorphic Shadow Utilities
 * 
 * Neumorphism creates soft, extruded UI using dual opposing shadows.
 * - Light source assumed from top-left
 * - Raised elements: dark shadow bottom-right, light highlight top-left
 * - Pressed elements: inverted with `inset` shadows
 */

import { Platform, type ViewStyle } from 'react-native'

// ============================================================================
// Color Math Utilities
// ============================================================================

/**
 * Parse a hex color to RGB values (0-255).
 * Supports both #RGB and #RRGGBB formats.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '')
  
  let r: number, g: number, b: number
  
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16)
    g = parseInt(cleaned[1] + cleaned[1], 16)
    b = parseInt(cleaned[2] + cleaned[2], 16)
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16)
    g = parseInt(cleaned.slice(2, 4), 16)
    b = parseInt(cleaned.slice(4, 6), 16)
  } else {
    return null
  }
  
  return { r, g, b }
}

/**
 * Convert RGB (0-255) to HSV (h: 0-360, s: 0-1, v: 0-1).
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min
  
  // Value
  const v = max
  
  // Saturation
  const s = max === 0 ? 0 : delta / max
  
  // Hue
  let h = 0
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6)
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2)
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4)
    }
  }
  if (h < 0) h += 360
  
  return { h, s, v }
}

/**
 * Convert HSV (h: 0-360, s: 0-1, v: 0-1) to RGB (0-255).
 */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  
  let rPrime = 0, gPrime = 0, bPrime = 0
  
  if (h >= 0 && h < 60) {
    rPrime = c; gPrime = x; bPrime = 0
  } else if (h >= 60 && h < 120) {
    rPrime = x; gPrime = c; bPrime = 0
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = c; bPrime = x
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = x; bPrime = c
  } else if (h >= 240 && h < 300) {
    rPrime = x; gPrime = 0; bPrime = c
  } else {
    rPrime = c; gPrime = 0; bPrime = x
  }
  
  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  }
}

/**
 * Convert RGB values to hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Lighten a color by increasing its HSV Value component.
 * 
 * @param hex - The hex color to lighten
 * @param amount - Amount to increase V by (0-1)
 */
export function lighten(hex: string, amount: number = 0.1): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const newV = Math.min(1, hsv.v + amount)
  
  const newRgb = hsvToRgb(hsv.h, hsv.s, newV)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Darken a color by decreasing its HSV Value component.
 * 
 * @param hex - The hex color to darken
 * @param amount - Amount to decrease V by (0-1)
 */
export function darken(hex: string, amount: number = 0.1): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const newV = Math.max(0, hsv.v - amount)
  
  const newRgb = hsvToRgb(hsv.h, hsv.s, newV)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Get hover colors for a button based on its background color.
 * Automatically adapts intensity based on the color's luminance.
 * 
 * @param bgColor - The button's background color (hex)
 * @param intensity - How strong the hover effect should be ('subtle' | 'medium' | 'strong')
 */
export function getHoverColors(
  bgColor: string, 
  intensity: 'subtle' | 'medium' | 'strong' = 'medium'
): { raised: string; pressed: string } {
  const amounts = {
    subtle: 0.01,
    medium: 0.02,
    strong: 0.03,
  }
  
  const amount = amounts[intensity]
  
  return {
    raised: lighten(bgColor, amount),  // Raised hover: lighten (lifting up)
    pressed: darken(bgColor, amount),  // Pressed hover: darken (pressing down)
  }
}

/**
 * Check if a color is considered "dark" (for choosing text color).
 * Uses HSV Value component for simplicity.
 */
export function isDark(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return true
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  return hsv.v < 0.6
}

/**
 * Shadow configuration for different surface colors.
 * Each surface needs calibrated light/dark shadow colors.
 * 
 * - dark: soft shadow for depth (bottom-right)
 * - light: sharp rim highlight (top-left) - higher opacity for crisp edge
 * - darker: deeper shadow for pressed/inset states
 */
export const shadowColors = {
  // For charcoal surfaces (~#2C2C2C to #3C3C3C)
  charcoal: {
    dark: 'rgba(0, 0, 0, 0.5)',
    light: 'rgba(255, 255, 255, 0.12)', // brighter for crisp rim light
    darker: 'rgba(0, 0, 0, 0.6)',
  },
  // For neutral dark surfaces (~#1F2937)
  neutralDark: {
    dark: 'rgba(0, 0, 0, 0.4)',
    light: 'rgba(255, 255, 255, 0.08)',
    darker: 'rgba(0, 0, 0, 0.5)',
  },
  // For light surfaces (white/light gray backgrounds)
  neutralLight: {
    dark: 'rgba(0, 0, 0, 0.15)',     // Visible dark shadow for depth on light backgrounds
    light: 'rgba(255, 255, 255, 1)', // Bright highlight for raised effect (visible on light gray)
    darker: 'rgba(0, 0, 0, 0.2)',    // Deeper shadow for pressed states
  },
}

export type ShadowIntensity = 'subtle' | 'medium' | 'strong'
export type ShadowSurface = keyof typeof shadowColors

interface ShadowConfig {
  offset: number
  blur: number
}

const intensityConfig: Record<ShadowIntensity, ShadowConfig> = {
  subtle: { offset: 1, blur: 2 },   // very light, barely visible
  medium: { offset: 2, blur: 4 },   // noticeable but restrained
  strong: { offset: 2, blur: 5 },   // slightly deeper blur, same offset as medium
}

/**
 * Creates a raised (elevated) neumorphic shadow.
 * Element appears to float above the surface.
 * 
 * Uses a soft dark shadow (bottom-right) and a sharp rim light (top-left).
 */
export function createRaisedShadow(
  surface: ShadowSurface = 'charcoal',
  intensity: ShadowIntensity = 'medium'
): ViewStyle {
  const colors = shadowColors[surface]
  const { offset, blur } = intensityConfig[intensity]
  
  // Rim light is sharper: same offset as shadow, but minimal blur for crisp edge
  const rimBlur = 1 // Very tight blur for crisp rim
  
  return Platform.select({
    web: {
      boxShadow: `${offset}px ${offset}px ${blur}px ${colors.dark}, -${offset}px -${offset}px ${rimBlur}px ${colors.light}`,
    } as any,
    default: {
      // React Native shadow approximation (limited compared to web)
      shadowColor: '#000',
      shadowOffset: { width: offset, height: offset },
      shadowOpacity: 0.3,
      shadowRadius: blur / 2,
      elevation: offset,
    },
  }) as ViewStyle
}

/**
 * Creates a pressed (inset) neumorphic shadow.
 * Element appears pushed into the surface.
 * 
 * Uses a soft dark inset shadow (top-left) and a thin sharp rim light (bottom-right).
 */
export function createPressedShadow(
  surface: ShadowSurface = 'charcoal',
  intensity: ShadowIntensity = 'medium'
): ViewStyle {
  const colors = shadowColors[surface]
  const { offset, blur } = intensityConfig[intensity]
  
  // Rim light is always thin and subtle for pressed states
  const rimOffset = 1 // Fixed thin rim
  const rimBlur = 1   // Very tight blur for crisp edge
  
  return Platform.select({
    web: {
      boxShadow: `inset ${offset}px ${offset}px ${blur}px ${colors.darker}, inset -${rimOffset}px -${rimOffset}px ${rimBlur}px ${colors.light}`,
    } as any,
    default: {
      // React Native doesn't support inset shadows, approximate with darker bg
      shadowOpacity: 0,
      elevation: 0,
    },
  }) as ViewStyle
}

/**
 * Creates a flat (no shadow) style for hover states.
 */
export function createFlatShadow(): ViewStyle {
  return Platform.select({
    web: {
      boxShadow: 'none',
    } as any,
    default: {
      shadowOpacity: 0,
      elevation: 0,
    },
  }) as ViewStyle
}

/**
 * Creates a hover shadow for raised elements.
 * Reduces shadow depth but keeps a subtle rim light to maintain visual boundary.
 */
export function createRaisedHoverShadow(
  surface: ShadowSurface = 'charcoal',
  intensity: ShadowIntensity = 'medium'
): ViewStyle {
  const colors = shadowColors[surface]
  const { offset, blur } = intensityConfig[intensity]
  
  // Reduce shadow depth by half for hover, keep minimal rim light
  const hoverOffset = Math.max(1, Math.round(offset / 2))
  const hoverBlur = Math.max(1, Math.round(blur / 2))
  const rimBlur = 1
  
  return Platform.select({
    web: {
      // Keep same offsets as normal state for rim to prevent "shrinking" effect
      boxShadow: `${hoverOffset}px ${hoverOffset}px ${hoverBlur}px ${colors.dark}, -${offset}px -${offset}px ${rimBlur}px ${colors.light}`,
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

/**
 * Creates a hover shadow for pressed elements.
 * Reduces shadow depth but keeps a subtle rim light to maintain visual boundary.
 */
export function createPressedHoverShadow(
  surface: ShadowSurface = 'charcoal',
  intensity: ShadowIntensity = 'medium'
): ViewStyle {
  const colors = shadowColors[surface]
  const { offset, blur } = intensityConfig[intensity]
  
  // Reduce shadow depth by half for hover, keep minimal rim light
  const hoverOffset = Math.max(1, Math.round(offset / 2))
  const hoverBlur = Math.max(1, Math.round(blur / 2))
  const rimBlur = 1
  
  return Platform.select({
    web: {
      // Keep rim offset at 1px (same as pressed normal) to prevent "shrinking" effect
      boxShadow: `inset ${hoverOffset}px ${hoverOffset}px ${hoverBlur}px ${colors.darker}, inset -1px -1px ${rimBlur}px ${colors.light}`,
    } as any,
    default: {
      shadowOpacity: 0,
      elevation: 0,
    },
  }) as ViewStyle
}

/**
 * Pre-built shadow presets for common use cases.
 */
export const neumorphicShadows = {
  // Charcoal surface shadows (for dark toolbars, cards)
  charcoal: {
    raised: {
      subtle: createRaisedShadow('charcoal', 'subtle'),
      medium: createRaisedShadow('charcoal', 'medium'),
      strong: createRaisedShadow('charcoal', 'strong'),
    },
    raisedHover: {
      subtle: createRaisedHoverShadow('charcoal', 'subtle'),
      medium: createRaisedHoverShadow('charcoal', 'medium'),
      strong: createRaisedHoverShadow('charcoal', 'strong'),
    },
    pressed: {
      subtle: createPressedShadow('charcoal', 'subtle'),
      medium: createPressedShadow('charcoal', 'medium'),
      strong: createPressedShadow('charcoal', 'strong'),
    },
    pressedHover: {
      subtle: createPressedHoverShadow('charcoal', 'subtle'),
      medium: createPressedHoverShadow('charcoal', 'medium'),
      strong: createPressedHoverShadow('charcoal', 'strong'),
    },
    flat: createFlatShadow(),
  },
  // Neutral dark surface shadows
  neutralDark: {
    raised: {
      subtle: createRaisedShadow('neutralDark', 'subtle'),
      medium: createRaisedShadow('neutralDark', 'medium'),
      strong: createRaisedShadow('neutralDark', 'strong'),
    },
    raisedHover: {
      subtle: createRaisedHoverShadow('neutralDark', 'subtle'),
      medium: createRaisedHoverShadow('neutralDark', 'medium'),
      strong: createRaisedHoverShadow('neutralDark', 'strong'),
    },
    pressed: {
      subtle: createPressedShadow('neutralDark', 'subtle'),
      medium: createPressedShadow('neutralDark', 'medium'),
      strong: createPressedShadow('neutralDark', 'strong'),
    },
    pressedHover: {
      subtle: createPressedHoverShadow('neutralDark', 'subtle'),
      medium: createPressedHoverShadow('neutralDark', 'medium'),
      strong: createPressedHoverShadow('neutralDark', 'strong'),
    },
    flat: createFlatShadow(),
  },
  // Neutral light surface shadows
  neutralLight: {
    raised: {
      subtle: createRaisedShadow('neutralLight', 'subtle'),
      medium: createRaisedShadow('neutralLight', 'medium'),
      strong: createRaisedShadow('neutralLight', 'strong'),
    },
    raisedHover: {
      subtle: createRaisedHoverShadow('neutralLight', 'subtle'),
      medium: createRaisedHoverShadow('neutralLight', 'medium'),
      strong: createRaisedHoverShadow('neutralLight', 'strong'),
    },
    pressed: {
      subtle: createPressedShadow('neutralLight', 'subtle'),
      medium: createPressedShadow('neutralLight', 'medium'),
      strong: createPressedShadow('neutralLight', 'strong'),
    },
    pressedHover: {
      subtle: createPressedHoverShadow('neutralLight', 'subtle'),
      medium: createPressedHoverShadow('neutralLight', 'medium'),
      strong: createPressedHoverShadow('neutralLight', 'strong'),
    },
    flat: createFlatShadow(),
  },
}
