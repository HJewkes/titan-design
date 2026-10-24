import { describe, it, expect } from 'vitest'
import { darkThemeCSSVars, lightThemeCSSVars } from './config'

/**
 * Each `--color-X-rgb` triple is the decomposition of the `--color-X` hex in
 * the same mode (it feeds `rgba(var(--color-X-rgb), a)` glows). Mutation caught:
 * editing a hex token without its triple, or sharing one triple across modes
 * when the modes' hexes differ (TD-890: dark brand-secondary carried the light
 * triple 48, 123, 155 against the dark hex #2697B7).
 */

type Vars = Record<string, string>

/**
 * Triples that already disagree with their hex. This set only shrinks: fixing
 * one means deleting its entry, and a new drift is not listed so it fails.
 */
const KNOWN_DRIFT = new Set<string>([
  'dark --color-status-error-rgb',
  'dark --color-background-base-rgb',
  'light --color-status-success-rgb',
  'light --color-status-error-vivid-rgb',
  'light --color-status-warning-rgb',
  'light --color-status-info-rgb',
  'light --color-background-base-rgb',
])

function hexToTriple(hex: string): string {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).join(', ')
}

function mismatches(mode: string, vars: Vars): string[] {
  return Object.entries(vars)
    .filter(([name]) => name.endsWith('-rgb'))
    .flatMap(([name, triple]) => {
      const hex = vars[name.replace(/-rgb$/, '')]
      if (!hex?.startsWith('#') || hex.length !== 7) return []
      const expected = hexToTriple(hex)
      return expected === triple ? [] : [`${mode} ${name}: ${triple} != ${hex} (${expected})`]
    })
}

describe('rgb triples match their hex tokens', () => {
  const found = [
    ...mismatches('dark', darkThemeCSSVars as Vars),
    ...mismatches('light', lightThemeCSSVars as Vars),
  ]

  it('has no drift beyond the known set', () => {
    expect(found.filter((m) => !KNOWN_DRIFT.has(m.split(':')[0]))).toEqual([])
  })

  it('checks the brand-secondary triple in both modes', () => {
    expect(darkThemeCSSVars['--color-brand-secondary-rgb']).toBe('38, 151, 183')
    expect(lightThemeCSSVars['--color-brand-secondary-rgb']).toBe('48, 123, 155')
  })
})
