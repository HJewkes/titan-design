/**
 * The dark `-subtle` fill and the text on it, as a gate (AW-133, re-based by decision 0004).
 *
 * AW-133 split `on-*-subtle` from the base tone: the base is tuned to carry a white label
 * as a solid fill, which made the two deepest tones unreadable as text on a dark plane. It
 * levelled the labels at rung 300 over a 12% wash, with two operator exceptions: brand on
 * orange[400], and error on red[400] over a thinner wash because red[300] read pink there.
 *
 * Decision 0004 replaces the wash with the opaque hue[900] cell of the colour family and
 * levels every tone, the two exceptions included, at hue[300]. On a deep opaque fill the
 * fill carries the hue, and the pair measures 6.9 to 7.7:1 on every plane, because an
 * opaque fill is the same colour on every plane. The numbers run in CI so a retune cannot
 * quietly reopen the split.
 */
import { describe, it, expect } from 'vitest'
import { contrast } from './color-checks'
import { primitiveRamps as ramp } from './tokens/primitives'
import { semanticColorsDark } from './tokens/semantic'

const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const srgb2lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
/** OKLab lightness — the perceptual axis the ramps were generated on. */
const oklabL = (hex: string) => {
  const [r, g, b] = hex2rgb(hex).map(srgb2lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

const TONES = [
  { name: 'brand', fill: 'brand-primary-subtle', text: 'on-brand-primary-subtle', hue: 'orange' },
  {
    name: 'accent',
    fill: 'brand-secondary-subtle',
    text: 'on-brand-secondary-subtle',
    hue: 'cyan',
  },
  {
    name: 'success',
    fill: 'status-success-subtle',
    text: 'on-status-success-subtle',
    hue: 'green',
  },
  {
    name: 'warning',
    fill: 'status-warning-subtle',
    text: 'on-status-warning-subtle',
    hue: 'amber',
  },
  { name: 'error', fill: 'status-error-subtle', text: 'on-status-error-subtle', hue: 'red' },
  { name: 'info', fill: 'status-info-subtle', text: 'on-status-info-subtle', hue: 'blue' },
] as const

describe('subtle tone weight (dark)', () => {
  it.each(TONES)(
    '$name fill is the opaque hue[900] cell under a hue[300] label',
    ({ fill, text, hue }) => {
      expect(semanticColorsDark[fill]).toBe(ramp[hue][900])
      expect(semanticColorsDark[text]).toBe(ramp[hue][300])
    }
  )

  it.each(TONES)('$name text clears AA on its fill', ({ fill, text }) => {
    expect(contrast(semanticColorsDark[text], semanticColorsDark[fill])).toBeGreaterThanOrEqual(4.5)
  })

  // The original defect was a WEIGHT mismatch, not only a contrast one: the family
  // spanned OKLCH L 0.550-0.813, so accent and error read as a different rung of the
  // system. Decision 0004 removed the two exceptions, so all six hold one band.
  it('levels every tone to one weight', () => {
    const ls = TONES.map((t) => oklabL(semanticColorsDark[t.text]))
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.06)
  })
})
