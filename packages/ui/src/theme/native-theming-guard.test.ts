import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { darkThemeCSSVars, lightThemeCSSVars } from './config'
import { getSemanticColors } from './tokens/semantic'

/**
 * Native-theming guard (TD-04.11 / VW-20).
 *
 * On native, titan resolves colors two ways, and BOTH can silently render black
 * if a token is undefined:
 *   1. `className` (e.g. `text-text-secondary`) → tailwind config → a
 *      `var(--color-*)` custom property that `ThemeProvider` registers at runtime
 *      via nativewind `vars(darkThemeCSSVars)`. A tailwind color pointing at a var
 *      the theme maps don't define is unset on native → black text/fill.
 *   2. `resolveColor(token)` → `getSemanticColors(mode)[token]` hex on native /
 *      `var(--color-${token})` on web. A token missing a hex value, or whose
 *      `--color-<token>` var is undefined, renders black (native) or unset (web).
 *
 * This is the exact class of bug that shipped in the 09.33a swap and was only
 * caught on-device. `config.completeness.test.ts` proves the theme maps mirror
 * global.css (the definition side); this guard covers the USAGE side — every
 * color token the design system references must resolve to a defined token in
 * both modes. Static (no render), so it runs in the fast project.
 */

const require = createRequire(import.meta.url)
const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tailwindConfig = require(path.join(uiRoot, 'tailwind.config.js')) as any
const colorTree = tailwindConfig.theme?.extend?.colors ?? {}

// Flatten the nested tailwind color tree into `class-suffix -> leaf value`.
// `DEFAULT` collapses onto its parent (tailwind's `brand.primary.DEFAULT` -> the
// `brand-primary` class).
function flattenColors(
  node: Record<string, unknown>,
  prefix: string[] = [],
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = key === 'DEFAULT' ? prefix : [...prefix, key]
    if (value && typeof value === 'object') {
      Object.assign(out, flattenColors(value as Record<string, unknown>, nextPrefix))
    } else if (typeof value === 'string') {
      out[nextPrefix.join('-')] = value
    }
  }
  return out
}

const colorLeaves = flattenColors(colorTree)
const definedDark = new Set(Object.keys(darkThemeCSSVars))
const definedLight = new Set(Object.keys(lightThemeCSSVars))

function varReference(value: string): string | null {
  const match = value.match(/var\((--color-[a-z0-9-]+)\)/)
  return match ? match[1] : null
}

// Accept hex, rgb/rgba, and hsl/hsla; reject empty/undefined. (No token should be
// literally "#000"/"black" in these maps, but that's a design choice, not a
// resolution bug, so we only assert a *valid, present* color here.)
const VALID_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))$/i

describe('native theming guard (no color token renders black on native)', () => {
  it('sanity: tailwind colors and theme maps flattened to non-trivial sets', () => {
    expect(Object.keys(colorLeaves).length).toBeGreaterThan(50)
    expect(definedDark.size).toBeGreaterThan(90)
    expect(definedLight.size).toBe(definedDark.size)
  })

  it('every tailwind color className resolves to a var defined in BOTH native vars maps', () => {
    const undefinedDark: string[] = []
    const undefinedLight: string[] = []
    for (const [suffix, value] of Object.entries(colorLeaves)) {
      const ref = varReference(value)
      if (!ref) continue // literal color (nativewind preset default) — always resolves
      if (!definedDark.has(ref)) undefinedDark.push(`${suffix} -> ${value}`)
      if (!definedLight.has(ref)) undefinedLight.push(`${suffix} -> ${value}`)
    }
    expect(
      undefinedDark,
      'tailwind colors point at vars missing from darkThemeCSSVars (className renders black on native dark)',
    ).toEqual([])
    expect(
      undefinedLight,
      'tailwind colors point at vars missing from lightThemeCSSVars (className renders black on native light)',
    ).toEqual([])
  })

  it('every resolveColor/getSemanticColors token has a valid hex AND a matching --color-<token> var', () => {
    for (const mode of ['dark', 'light'] as const) {
      const colors = getSemanticColors(mode)
      const defined = mode === 'dark' ? definedDark : definedLight
      const invalidValues: string[] = []
      const missingVars: string[] = []
      for (const [token, value] of Object.entries(colors)) {
        if (typeof value !== 'string' || !VALID_COLOR.test(value)) {
          invalidValues.push(`${token} = ${JSON.stringify(value)}`)
        }
        // resolveColor's web path returns `var(--color-${token})`; that var must exist.
        if (!defined.has(`--color-${token}`)) missingVars.push(token)
      }
      expect(
        invalidValues,
        `getSemanticColors('${mode}') has tokens with no valid color (renders black/unset on native)`,
      ).toEqual([])
      expect(
        missingVars,
        `resolveColor tokens missing a --color-<token> in ${mode} vars (renders unset on web)`,
      ).toEqual([])
    }
  })
})
