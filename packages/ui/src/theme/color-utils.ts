/**
 * Colour math shared by the depth system.
 *
 * This file used to be `shadows.ts` and shipped a neumorphic shadow builder —
 * dual opposing shadows, dark bottom-right and light top-left. That was removed
 * in TD-07.16. Neumorphism needs a mid-tone background (roughly 75-90%
 * lightness) so BOTH shadows have somewhere to fall; our surfaces sit near 10%,
 * which leaves the dark half nothing to fall onto. It collapsed to a one-sided
 * rim light and read as noise on the wall.
 *
 * Inline depth is a hairline now (`hairline-*`, self-normalising alpha), texture
 * is `materials.ts`, and drop-shadow survives only for genuinely FLOATING
 * things — see `elevation.ts`.
 *
 * What is left here is the HSV/hex maths that `elevation.ts` still uses to
 * derive rim and shadow tints from whatever surface colour it is handed.
 */

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
  
  let rPrime: number, gPrime: number, bPrime: number

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
 * Shadow strength tiers. Retained because `elevation.ts` keys its level table on
 * them; the neumorphic shadow BUILDERS that used to live here are gone.
 */
export type ShadowIntensity = 'subtle' | 'medium' | 'strong'
