/**
 * TD-480 — the separator token must stay visible on every plane in both modes.
 * `hairline-default` is alpha, so it is composited over each plane before the
 * L* delta is read.
 */
import { describe, it, expect } from 'vitest'
import { getSemanticColors } from './tokens/semantic'

const MIN_DELTA_L = 7
const PLANES = [
  'background-base',
  'surface-base',
  'surface-raised',
  'surface-elevated',
  'surface-overlay',
] as const

type Rgb = [number, number, number]

const parse = (v: string): { rgb: Rgb; alpha: number } => {
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16)
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 }
  }
  const [r, g, b, a = '1'] = v
    .slice(v.indexOf('(') + 1, -1)
    .split(',')
    .map((x) => x.trim())
  return { rgb: [Number(r), Number(g), Number(b)], alpha: Number(a) }
}

const lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

const lstar = ([r, g, b]: Rgb) => {
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y
}

const over = (fill: string, plane: string): Rgb => {
  const { rgb, alpha } = parse(fill)
  const base = parse(plane).rgb
  return rgb.map((c, i) => c * alpha + base[i] * (1 - alpha)) as Rgb
}

describe.each(['light', 'dark'] as const)('hairline-default contrast (%s)', (mode) => {
  const colors = getSemanticColors(mode)
  it.each(PLANES)(`separates from %s by delta L* >= ${MIN_DELTA_L}`, (plane) => {
    const delta = Math.abs(
      lstar(over(colors['hairline-default'], colors[plane])) - lstar(parse(colors[plane]).rgb)
    )
    expect(delta).toBeGreaterThanOrEqual(MIN_DELTA_L)
  })
})
