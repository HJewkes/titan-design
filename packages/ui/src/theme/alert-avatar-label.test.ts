/**
 * TD-482a — the label on an Alert solid fill and on the Avatar fallback clears AA.
 *
 * Alert solid sat on `status-<tone>`, a step that is not the tone's solid fill, so the
 * label missed 4.5 on dark error (3.83). Avatar fallback sat on `hairline-strong` with
 * the inverse text colour (1.4-2.9). Both now read the tokens made for the pairing.
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

describe('Alert solid label (dark)', () => {
  it.each(TONES)('%s label clears AA on its -solid fill', (tone) => {
    const ratio = contrast(
      semanticColorsDark[`on-status-${tone}`],
      semanticColorsDark[`status-${tone}-solid`]
    )
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})

describe('Alert solid label (light)', () => {
  // The light `on-status-*` tokens are white, which misses on amber 500 and blue 500, so the
  // Alert reads `text-primary` there (Alert.tsx `onSolidLight`); TD-412 owns the token values.
  it.each([
    ['success', 'on-status-success'],
    ['error', 'on-status-error'],
    ['warning', 'text-primary'],
    ['info', 'text-primary'],
  ] as const)('%s label on %s clears AA on its -solid fill', (tone, label) => {
    const ratio = contrast(semanticColorsLight[label], semanticColorsLight[`status-${tone}-solid`])
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['warning', 'info'] as const)(
    'documents why: white misses AA on the light %s -solid fill',
    (tone) => {
      const ratio = contrast(
        semanticColorsLight[`on-status-${tone}`],
        semanticColorsLight[`status-${tone}-solid`]
      )
      expect(ratio).toBeLessThan(4.5)
    }
  )
})

describe('Avatar fallback label', () => {
  it.each([
    ['dark', semanticColorsDark],
    ['light', semanticColorsLight],
  ] as const)('avatar-text clears AA on avatar-background (%s)', (_mode, colors) => {
    expect(contrast(colors['avatar-text'], colors['avatar-background'])).toBeGreaterThanOrEqual(4.5)
  })
})
