import { test, expect } from '@playwright/test'
import { colorTokenNames, expectedByTheme } from './token-source'

/**
 * Runtime token-resolution guard (TD-05.03).
 *
 * Loads the token specimen (NativeWind + theme CSS configured), and for every
 * color token asserts the browser's COMPUTED color equals the source-of-truth
 * value in `src/theme/config.ts` — in both dark and light. This complements
 * TD-05.08's source-level config-vs-global.css drift guard: this one catches a
 * theme-config change that silently alters what a token resolves to in the
 * BROWSER (e.g. a wrong `var()` mapping or an unresolved variable).
 *
 * Scope: color tokens only. `-rgb` decompositions (not standalone colors) and
 * the non-color font / easing / duration tokens are excluded — they don't
 * surface as a comparable computed color; a `bg-*` swatch of them resolves to
 * `rgba(0, 0, 0, 0)`.
 */

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

function parseColor(value: string): Rgba | null {
  const v = value.trim()
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    }
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => p.trim())
    if (parts.length < 3) return null
    return {
      r: Number(parts[0]),
      g: Number(parts[1]),
      b: Number(parts[2]),
      a: parts[3] != null ? Number(parts[3]) : 1,
    }
  }
  return null
}

function colorsEqual(a: Rgba | null, b: Rgba | null): boolean {
  if (!a || !b) return false
  return a.r === b.r && a.g === b.g && a.b === b.b && Math.abs(a.a - b.a) <= 0.02
}

test.describe('token resolution: browser computed value matches config source of truth', () => {
  test('the token set is non-empty (guards a broken token source)', () => {
    expect(colorTokenNames.length).toBeGreaterThan(50)
  })

  for (const theme of ['dark', 'light'] as const) {
    test(`${theme}: all ${colorTokenNames.length} color tokens resolve to their config value`, async ({
      page,
    }) => {
      await page.goto('/tokens.html', { waitUntil: 'networkidle' })
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('light', t === 'light')
      }, theme)

      const expected = expectedByTheme[theme]
      const mismatches: string[] = []

      for (const name of colorTokenNames) {
        const swatch = page.locator(`[data-token="${name}"]`)
        await expect(swatch, `missing swatch for ${name}`).toHaveCount(1)
        const computed = await swatch.evaluate(
          (el) => getComputedStyle(el).backgroundColor,
        )
        if (!colorsEqual(parseColor(expected[name]), parseColor(computed))) {
          mismatches.push(`${name}: config="${expected[name]}" computed="${computed}"`)
        }
      }

      expect(mismatches, `Token resolution mismatches (${theme}):\n${mismatches.join('\n')}`).toEqual(
        [],
      )
    })
  }
})
