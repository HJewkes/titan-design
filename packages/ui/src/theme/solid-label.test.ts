/**
 * AW-141 — what label a SOLID fill carries, as a gate.
 *
 * `Pill` and `Button` disagreed, and each failed AA exactly where the other passed.
 * Pill put the dark inverse label on every tone, which failed on the two DARK fills
 * (accent 3.69, error 3.83). Button put white on every tone, which failed on the four
 * BRIGHT ones (warning 1.82, success 1.93, brand 2.63, info 3.12).
 *
 * The cause was not the label. Four solid fills were bright ramp steps and two were
 * dark ones, so no single label could serve both groups. A tinted label drawn from
 * each tone's own ramp does not rescue them either: `brand-secondary` and
 * `status-error` are themselves rung 600, so even the darkest step of their own hue
 * only reaches ~3.6 on them. Lifting those two FILLS one rung is what lets all six
 * share one label.
 */
import { describe, it, expect } from 'vitest'
import { primitiveRamps } from './tokens/primitives'
import { semanticColorsDark, semanticColorsLight } from './tokens/semantic'

const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const srgb2lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const relLum = (hex: string) => {
  const [r, g, b] = hex2rgb(hex).map(srgb2lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const SOLID_TONES = [
  { name: 'brand', fill: 'brand-primary-solid', label: 'on-brand-primary' },
  { name: 'accent', fill: 'brand-secondary-solid', label: 'on-brand-secondary' },
  { name: 'success', fill: 'status-success-solid', label: 'on-status-success' },
  { name: 'warning', fill: 'status-warning-solid', label: 'on-status-warning' },
  { name: 'error', fill: 'status-error-solid', label: 'on-status-error' },
  { name: 'info', fill: 'status-info-solid', label: 'on-status-info' },
] as const

describe('solid label (dark)', () => {
  it.each(SOLID_TONES)('$name label clears AA on its solid fill', ({ fill, label }) => {
    expect(contrast(semanticColorsDark[label], semanticColorsDark[fill])).toBeGreaterThanOrEqual(
      4.5
    )
  })

  // The whole point of lifting the two fills was that ONE label serves all six. If a
  // future change splits them again, the uniformity the operator asked for is gone
  // even though every tone might still clear AA individually.
  it('uses one label colour across every solid tone', () => {
    const labels = new Set(SOLID_TONES.map((t) => semanticColorsDark[t.label]))
    expect(labels.size).toBe(1)
  })

  // Guards the lift itself. Aliasing these back to rung 600 would restore a dark
  // fill under a dark label — the original defect — and the per-tone assertion
  // above would catch it, but this names the cause rather than the symptom. The
  // dark base tones moved up to rung 500 too (item 42), so the fill and the base
  // tone now share a step; what matters is that neither fill is back on 600.
  it('keeps the two lifted fills off rung 600', () => {
    expect(semanticColorsDark['brand-secondary-solid']).toBe(primitiveRamps.cyan[500])
    expect(semanticColorsDark['status-error-solid']).toBe(primitiveRamps.red[500])
  })
})

/**
 * Decision 0003, the light solid ladder: a light solid sits on step 600 of its hue
 * under a white label, with two named exceptions the owner picked at step 500, brand
 * (orange, 3.74) and warning (amber, 3.63). Both clear the 3:1 large-text floor and
 * are declared in contrast-baseline.json. Info sits on blue[600] like the rest of the
 * ladder, so it clears 4.5:1.
 */
const LIGHT_DECLARED_MISSES = ['brand', 'warning'] as const
const lightMisses = SOLID_TONES.filter((t) =>
  (LIGHT_DECLARED_MISSES as readonly string[]).includes(t.name)
)
const lightPasses = SOLID_TONES.filter((t) => !lightMisses.includes(t))

describe('solid label (light)', () => {
  it('uses one white label across every solid tone', () => {
    const labels = new Set(SOLID_TONES.map((t) => semanticColorsLight[t.label]))
    expect(labels).toEqual(new Set([semanticColorsLight['text-inverse']]))
  })

  it.each(lightPasses)('$name label clears AA on its solid fill', ({ fill, label }) => {
    expect(contrast(semanticColorsLight[label], semanticColorsLight[fill])).toBeGreaterThanOrEqual(
      4.5
    )
  })

  it.each(lightMisses)('$name label reads at large-text AA, a declared miss', ({ fill, label }) => {
    const ratio = contrast(semanticColorsLight[label], semanticColorsLight[fill])
    expect(ratio).toBeGreaterThanOrEqual(3)
    expect(ratio).toBeLessThan(4.5)
  })

  it('puts the brand solid on orange[500] under white at 3.7 or better', () => {
    expect(semanticColorsLight['brand-primary-solid']).toBe(primitiveRamps.orange[500])
    expect(
      contrast(semanticColorsLight['on-brand-primary'], semanticColorsLight['brand-primary-solid'])
    ).toBeGreaterThanOrEqual(3.7)
  })

  it('steps brand hover and active one rung down from the solid in turn', () => {
    expect(semanticColorsLight['brand-primary-hover']).toBe(primitiveRamps.orange[600])
    expect(semanticColorsLight['brand-primary-active']).toBe(primitiveRamps.orange[700])
  })
})
