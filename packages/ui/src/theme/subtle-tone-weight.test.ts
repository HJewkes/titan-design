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
/** OKLCH chroma — how saturated, independent of how light. */
const oklabChroma = (rgb: number[]) => {
  const [r, g, b] = rgb.map(srgb2lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return Math.sqrt(a * a + bb * bb)
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
 * Four tones level at ramp rung 300. Two are deliberate exceptions, both operator
 * calls during the AW-133 review, and both are held here rather than quietly
 * widening the band:
 *
 * - `brand` keeps the exact `orange[400]` brand hue instead of levelling, so the
 *   Voltras tone never drifts. It is the darkest label and the lowest contrast.
 * - `error` sits at `red[400]`, a rung darker than its siblings. red[300] levelled
 *   perfectly but read PINK: a red that light can only hold ~0.121 OKLCH chroma.
 *   red[400] carries ~0.165 and reads red. Its fill is thinned to 0.08 to buy back
 *   the contrast that darkness costs, which is why it still beats brand's floor.
 */
const TONES = [
  {
    name: 'brand',
    fill: 'brand-primary-subtle',
    text: 'on-brand-primary-subtle',
    min: 4.0,
    levelled: false,
  },
  {
    name: 'accent',
    fill: 'brand-secondary-subtle',
    text: 'on-brand-secondary-subtle',
    min: 4.5,
    levelled: true,
  },
  {
    name: 'success',
    fill: 'status-success-subtle',
    text: 'on-status-success-subtle',
    min: 4.5,
    levelled: true,
  },
  {
    name: 'warning',
    fill: 'status-warning-subtle',
    text: 'on-status-warning-subtle',
    min: 4.5,
    levelled: true,
  },
  {
    name: 'error',
    fill: 'status-error-subtle',
    text: 'on-status-error-subtle',
    min: 4.2,
    levelled: false,
  },
  {
    name: 'info',
    fill: 'status-info-subtle',
    text: 'on-status-info-subtle',
    min: 4.5,
    levelled: true,
  },
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
  // the system. Hold the levelled tones in a tight band; the two exceptions are
  // measured by their own floors above.
  it('levels the unexceptional tones to one weight', () => {
    const ls = TONES.filter((t) => t.levelled).map((t) =>
      oklabL(hex2rgb(semanticColorsDark[t.text]))
    )
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.06)
  })

  // Guards the operator's actual complaint. Levelling error back onto rung 300 would
  // satisfy every other assertion in this file — tighter band, higher contrast — and
  // reintroduce the pink. Chroma is the thing that made it wrong, so chroma is what
  // gets asserted.
  it('keeps error saturated enough to read red rather than pink', () => {
    const c = oklabChroma(hex2rgb(semanticColorsDark['on-status-error-subtle']))
    expect(c).toBeGreaterThanOrEqual(0.15)
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
