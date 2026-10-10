/**
 * TD-482a — the label on an Alert solid fill and on the Avatar fallback clears AA.
 *
 * Alert solid sat on `status-<tone>`, a step that is not the tone's solid fill, so the
 * label missed 4.5 on dark error (3.83). Avatar fallback sat on `hairline-strong` with
 * the inverse text colour (1.4-2.9). Both now read the tokens made for the pairing.
 *
 * axe reports text on the paper grain as incomplete, so the rendered contrast gate cannot
 * see solid Alert labels; this token-pair test is their guard.
 */
import { describe, it, expect } from 'vitest'
import { semanticColorsDark, semanticColorsLight } from './tokens/semantic'

const lin = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TONES = ['success', 'info', 'warning', 'error'] as const

type Tone = (typeof TONES)[number]
type Mode = 'dark' | 'light'

const PALETTES = { dark: semanticColorsDark, light: semanticColorsLight } as const

const solidLabelRatio = (mode: Mode, tone: Tone) =>
  contrast(PALETTES[mode][`on-status-${tone}`], PALETTES[mode][`status-${tone}-solid`])

// Shrink-only: solid Alert labels allowed under AA. Each entry fails once it clears 4.5,
// so the list cannot outlive the fix it waits on.
const SUB_AA_SOLID_LABELS: ReadonlyArray<{ mode: Mode; tone: Tone }> = [
  // TD-775: remove when the light info solid fill moves to blue 600.
  { mode: 'light', tone: 'info' },
  // TD-774: named exception, large-text AA.
  { mode: 'light', tone: 'warning' },
]

const isException = (mode: Mode, tone: Tone) =>
  SUB_AA_SOLID_LABELS.some((entry) => entry.mode === mode && entry.tone === tone)

const SOLID_LABEL_CASES = (['dark', 'light'] as const).flatMap((mode) =>
  TONES.map((tone) => [mode, tone] as const)
)

describe('Alert solid label', () => {
  it.each(SOLID_LABEL_CASES.filter(([mode, tone]) => !isException(mode, tone)))(
    '%s %s label clears AA on its -solid fill',
    (mode, tone) => {
      expect(solidLabelRatio(mode, tone)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it.each(SUB_AA_SOLID_LABELS.map(({ mode, tone }) => [mode, tone] as const))(
    '%s %s is still under AA, so its exception entry is not stale',
    (mode, tone) => {
      expect(solidLabelRatio(mode, tone)).toBeLessThan(4.5)
    }
  )

  it.each(SOLID_LABEL_CASES)('%s %s glyph clears large-text AA on its -solid fill', (mode, tone) => {
    expect(solidLabelRatio(mode, tone)).toBeGreaterThanOrEqual(3)
  })
})

describe('Avatar fallback label', () => {
  it.each([
    ['dark', semanticColorsDark],
    ['light', semanticColorsLight],
  ] as const)('avatar-text clears AA on avatar-background (%s)', (_mode, colors) => {
    expect(contrast(colors['avatar-text'], colors['avatar-background'])).toBeGreaterThanOrEqual(4.5)
  })
})
