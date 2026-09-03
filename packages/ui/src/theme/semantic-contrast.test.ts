/**
 * TD-07.15 — on-surface text contrast, as a gate rather than a document.
 *
 * The warm grey migration was validated for ΔE, L* and warmth long before it
 * was validated for CONTRAST, and the contrast check is the one that found a
 * real defect: `text-tertiary` was failing WCAG large-text on three of the six
 * dark planes and had been for as long as the surface ramp had existed. Nobody
 * had run the numbers because the greys "looked fine".
 *
 * So the numbers run in CI now. If a text token is retuned into a failure, this
 * fails first.
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
const relLum = (hex: string) => {
  const [r, g, b] = hex2rgb(hex).map(srgb2lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Every plane text can land on, darkest first. */
const PLANES = [975, 950, 925, 900, 875, 850] as const

/**
 * Floors per role, not one blanket 4.5. `text-tertiary` is by definition the
 * de-emphasised role — captions, units, disabled labels — so WCAG's large-text
 * 3:1 is the honest bar for it. Holding it to 4.5 would either be a lie we
 * suppress or a change that erases the distinction between the three roles.
 */
const TEXT_ROLES = [
  { role: 'text-primary', min: 7, note: 'body copy — AAA' },
  { role: 'text-secondary', min: 4.5, note: 'supporting copy — AA' },
  { role: 'text-tertiary', min: 3, note: 'de-emphasised — AA large' },
] as const

describe('semantic text on the surface planes (dark)', () => {
  for (const { role, min, note } of TEXT_ROLES) {
    describe(`${role} (${note})`, () => {
      it.each(PLANES)(`clears ${min}:1 on grey-%s`, (plane) => {
        const fg = semanticColorsDark[role as keyof typeof semanticColorsDark] as string
        const ratio = contrast(fg, greyRamp[plane])
        expect(
          ratio,
          `${role} ${fg} on grey-${plane} ${greyRamp[plane]} is ${ratio.toFixed(2)}:1, needs ${min}`,
        ).toBeGreaterThanOrEqual(min)
      })
    })
  }

  /**
   * The roles must stay ORDERED as well as legible. A migration that lifted
   * tertiary until it out-contrasted secondary would pass every check above
   * while destroying the hierarchy the three roles exist to express.
   */
  it('keeps primary > secondary > tertiary in contrast on every plane', () => {
    for (const plane of PLANES) {
      const [pri, sec, ter] = TEXT_ROLES.map(({ role }) =>
        contrast(semanticColorsDark[role as keyof typeof semanticColorsDark] as string, greyRamp[plane]),
      )
      expect(pri, `on grey-${plane}: primary ${pri.toFixed(2)} vs secondary ${sec.toFixed(2)}`).toBeGreaterThan(sec)
      expect(sec, `on grey-${plane}: secondary ${sec.toFixed(2)} vs tertiary ${ter.toFixed(2)}`).toBeGreaterThan(ter)
    }
  })

  // Border visibility is NOT checked here. The separators are alpha now, and a
  // WCAG ratio needs two opaque colours — feeding `rgba(…)` to a hex parser
  // silently yields black, so such a check passes without measuring anything.
  // Alpha separators are validated by compositing them over each plane in
  // `surface.contract.test.ts` (R3 for the hairlines, R4 for border-prominent).
})
