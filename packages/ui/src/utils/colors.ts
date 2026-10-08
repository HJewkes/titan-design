/**
 * Color utility functions for the design system.
 *
 * `lighten`/`darken` are re-exported from `theme/color-utils`, which does the
 * HSV math. They are hover/state adjustments, not a depth ladder — planes come
 * from the grey ramp.
 */

export { lighten, darken } from '../theme/color-utils'

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
