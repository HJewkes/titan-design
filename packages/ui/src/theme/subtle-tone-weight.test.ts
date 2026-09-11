/**
 * AW-133 — the `-subtle` fill and the text on it, as a gate.
 *
 * The status family had one token doing two incompatible jobs. `status-error`
 * and `brand-secondary` sit at ramp rung 600 so a white label reads on them as a
 * solid fill; that same depth made them unreadable as TEXT on a dark plane, and a
 * subtle Pill in those tones measured 2.9-3.1 against its own fill. The four
 * lighter tones had the mirror problem. Splitting the roles fixed it: `on-*-subtle`
 * is text on the subtle fill, levelled at rung 300.
 *
 * The numbers run in CI so a future retune cannot quietly reopen it.
 */
import { describe, it, expect } from 'vitest'
import { greyRamp } from './tokens/primitives'
import { semanticColorsDark } from './tokens/semantic'

const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const srgb2lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const relLum = (rgb: number[]) => {
  const [r, g, b] = rgb.map(srgb2lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
/** OKLab lightness — the perceptual axis the ramps were generated on. */
const oklabL = (rgb: number[]) => {
  const [r, g, b] = rgb.map(srgb2lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

const parseRgba = (v: string): { rgb: number[]; alpha: number } => {
  const m = v.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`expected an rgba() subtle fill, got "${v}"`)
  const parts = m[1].split(',').map((n) => parseFloat(n.trim()))
  return { rgb: parts.slice(0, 3), alpha: parts[3] ?? 1 }
}
const composite = (fill: string, plane: string) => {
  const { rgb, alpha } = parseRgba(fill)
  const bg = hex2rgb(plane)
  return rgb.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)))
}

/** The two planes a subtle pill actually lands on. */
const PAGE = greyRamp[925]
const CARD = greyRamp[875]

/**
 * `brand` is the documented exception (operator, AW-133): its subtle label stays
 * the exact `orange[400]` brand hue rather than levelling with the rest, so the
 * Voltras tone never drifts. That costs it ~4.2 on a raised card. Every other
 * tone clears AA on both planes.
 */
const TONES = [
  { name: 'brand', fill: 'brand-primary-subtle', text: 'on-brand-primary-subtle', min: 4.0 },
  {
    name: 'accent',
    fill: 'brand-secondary-subtle',
    text: 'on-brand-secondary-subtle',
    min: 4.5,
  },
  {
    name: 'success',
    fill: 'status-success-subtle',
    text: 'on-status-success-subtle',
    min: 4.5,
  },
  { name: 'warning', fill: 'status-warning-subtle', text: 'on-status-warning-subtle', min: 4.5 },
  { name: 'error', fill: 'status-error-subtle', text: 'on-status-error-subtle', min: 4.5 },
  { name: 'info', fill: 'status-info-subtle', text: 'on-status-info-subtle', min: 4.5 },
] as const

describe('subtle tone weight (dark)', () => {
  it.each(TONES)('$name text clears its floor on both planes', ({ fill, text, min }) => {
    const label = hex2rgb(semanticColorsDark[text])
    for (const plane of [PAGE, CARD]) {
      const composited = composite(semanticColorsDark[fill], plane)
      expect(contrast(label, composited)).toBeGreaterThanOrEqual(min)
    }
  })

  // The original defect was a WEIGHT mismatch, not only a contrast one: the family
  // spanned OKLCH L 0.550-0.813, so accent and error read as a different rung of
  // the system. Hold the five levelled tones in a tight band; brand sits below it
  // by decision, so it is measured separately above.
  it('levels the five non-brand tones to one weight', () => {
    const ls = TONES.filter((t) => t.name !== 'brand').map((t) =>
      oklabL(hex2rgb(semanticColorsDark[t.text]))
    )
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.06)
  })

  // A fill whose hue drifts from its label's re-opens the split this fixed.
  it('draws each fill from the same hue family as its label', () => {
    for (const { fill, text, name } of TONES) {
      if (name === 'brand') continue
      const fillRgb = parseRgba(semanticColorsDark[fill]).rgb
      const labelRgb = hex2rgb(semanticColorsDark[text])
      expect(fillRgb).toEqual(labelRgb)
    }
  })
})
