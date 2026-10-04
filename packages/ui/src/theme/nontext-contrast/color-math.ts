/**
 * Colour maths for the non-text contrast gate (TD-486): parse a semantic token
 * value, composite alpha over a plane, then measure WCAG contrast or CIELAB L*.
 */
export type Rgb = readonly [number, number, number]
export interface Rgba {
  rgb: Rgb
  alpha: number
}

const HEX = /^#([0-9a-f]{6})$/i
const RGBA = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i

export function parseColor(value: string): Rgba {
  const hex = HEX.exec(value)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 }
  }
  const fn = RGBA.exec(value)
  if (fn) return { rgb: [+fn[1], +fn[2], +fn[3]], alpha: fn[4] === undefined ? 1 : +fn[4] }
  throw new Error(`Cannot parse colour "${value}"`)
}

/** `fg` laid over an opaque `bg`; an opaque `fg` returns itself. */
export function composite(fg: Rgba, bg: Rgb): Rgb {
  const mix = (i: number) => fg.rgb[i] * fg.alpha + bg[i] * (1 - fg.alpha)
  return [mix(0), mix(1), mix(2)]
}

const linear = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** CIELAB L* (D65), the lightness axis the repo's separator floors are written in. */
export function lightness(rgb: Rgb): number {
  const y = luminance(rgb)
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y
}
