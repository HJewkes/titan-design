import type { CheckKind } from '@titan-design/review-schema'

/** sRGB channels 0-255 and alpha 0-1, as the browser computes them. */
export type Rgba = [number, number, number, number]

/** WCAG 2.1 SC 1.4.3 (text, large text) and SC 1.4.11 (non-text). */
export const REQUIRED_RATIO: Record<CheckKind, number> = {
  text: 4.5,
  'large-text': 3,
  'non-text': 3,
}

/** WCAG large text: 18pt (24px), or 14pt (18.66px) when bold. */
const LARGE_TEXT_PX = 24
const LARGE_BOLD_TEXT_PX = 18.66
const BOLD_WEIGHT = 700

export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  if (fontSizePx >= LARGE_TEXT_PX) return true
  return fontWeight >= BOLD_WEIGHT && fontSizePx >= LARGE_BOLD_TEXT_PX
}

export function textKind(fontSizePx: number, fontWeight: number): CheckKind {
  return isLargeText(fontSizePx, fontWeight) ? 'large-text' : 'text'
}

/** Source-over compositing of `top` onto `bottom`; the result is as opaque as both allow. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3] + bottom[3] * (1 - top[3])
  if (a === 0) return [0, 0, 0, 0]
  const channel = (i: number) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a
  return [channel(0), channel(1), channel(2), a]
}

export function withAlpha(color: Rgba, factor: number): Rgba {
  return [color[0], color[1], color[2], color[3] * factor]
}

function linear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of an opaque colour. */
export function luminance([r, g, b]: Rgba): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/** WCAG contrast ratio, 1 to 21. `fg` is composited over `bg`, which must be opaque. */
export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const a = luminance(over(fg, bg))
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Reported ratios round down, so 4.499 never prints as a passing 4.50. */
export function floorRatio(ratio: number): number {
  return Math.floor(ratio * 100) / 100
}

export function toHex(color: Rgba): string {
  const hex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${hex(color[0])}${hex(color[1])}${hex(color[2])}`
}
