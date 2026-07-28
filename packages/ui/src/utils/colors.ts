/**
 * Color utility functions for the design system
 *
 * lighten/darken are re-exported from shadows.ts which uses HSV-based
 * color math for more perceptually consistent results across hues.
 */

export { lighten, darken } from '../theme/color-utils'

export type StatusType = 'success' | 'error' | 'warning' | 'info'
export type ResultType = 'improve' | 'degrade' | 'inconclusive' | 'neutral'

/**
 * Get the semantic color token for a status type.
 *
 * @param status - The status type
 * @returns The CSS variable reference for the status color
 *
 * @example
 * const color = getStatusColor('success') // 'var(--color-status-success)'
 */
export function getStatusColor(status: StatusType): string {
  return `var(--color-status-${status})`
}

/**
 * Get the semantic color token for a result type.
 *
 * @param result - The result type
 * @returns The CSS variable reference for the result color
 *
 * @example
 * const color = getResultColor('improve') // 'var(--color-result-improve)'
 */
export function getResultColor(result: ResultType): string {
  return `var(--color-result-${result})`
}

/**
 * Apply alpha/opacity to a color.
 * Works with hex colors and rgb values.
 *
 * @param color - The color value (hex or rgb)
 * @param opacity - Opacity value between 0 and 1
 * @returns The color with alpha applied
 *
 * @example
 * alpha('#5048E5', 0.5) // 'rgba(80, 72, 229, 0.5)'
 * alpha('rgb(80, 72, 229)', 0.5) // 'rgba(80, 72, 229, 0.5)'
 */
export function alpha(color: string, opacity: number): string {
  // Clamp opacity between 0 and 1
  const clampedOpacity = Math.max(0, Math.min(1, opacity))

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    let r: number, g: number, b: number

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else {
      return color
    }

    return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`
  }

  // Handle rgb colors
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch
    return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`
  }

  // Handle rgba colors - replace the alpha value
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/)
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch
    return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`
  }

  return color
}

/**
 * Determine if a color is light or dark.
 * Useful for determining text color contrast.
 *
 * @param color - Hex color value
 * @returns 'light' or 'dark'
 *
 * @example
 * getLuminance('#FFFFFF') // 'light'
 * getLuminance('#000000') // 'dark'
 */
export function getLuminance(color: string): 'light' | 'dark' {
  if (!color.startsWith('#')) return 'dark'

  const hex = color.slice(1)
  let r: number, g: number, b: number

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else {
    return 'dark'
  }

  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? 'light' : 'dark'
}

/**
 * Get a contrasting text color for a given background.
 *
 * @param backgroundColor - The background color (hex)
 * @returns 'white' or 'black' for contrast
 *
 * @example
 * getContrastText('#5048E5') // 'white'
 * getContrastText('#FFFFFF') // 'black'
 */
export function getContrastText(backgroundColor: string): string {
  return getLuminance(backgroundColor) === 'light' ? '#000000' : '#FFFFFF'
}

