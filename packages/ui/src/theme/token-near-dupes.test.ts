import { describe, it, expect } from 'vitest'
import { deltaE } from './color-checks'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'
import baseline from './tokens/near-dupe-baseline.json'

// Two semantic colours closer than this, yet not the same value, read as one colour that was
// retyped. Exact aliases (same primitive, ΔE 0) are deliberate and allowed.
const NEAR_DUPE_DELTA_E = 3
const HEX6 = /^#[0-9a-fA-F]{6}$/
// Surface and background planes are deliberate tonal neighbours (TD-30 plan, near-duplicate risk).
const PLANE_ROLE = /^(surface|background)-/
const MODES: ThemeMode[] = ['dark', 'light']

function nearDuplicatePairs(colors: Record<string, string>): string[] {
  const roles = Object.keys(colors)
    .filter((role) => HEX6.test(colors[role]) && !PLANE_ROLE.test(role))
    .sort()
  const pairs: string[] = []
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const d = deltaE(colors[roles[i]], colors[roles[j]])
      if (d > 0 && d < NEAR_DUPE_DELTA_E) pairs.push(`${roles[i]} | ${roles[j]}`)
    }
  }
  return pairs
}

function diffAgainstBaseline(found: string[], recorded: readonly string[]) {
  return {
    added: found.filter((pair) => !recorded.includes(pair)),
    stale: recorded.filter((pair) => !found.includes(pair)),
  }
}

describe('semantic colours: near-duplicates', () => {
  for (const mode of MODES) {
    it(`${mode}: only baselined pairs sit within ΔE ${NEAR_DUPE_DELTA_E} of each other`, () => {
      const { added } = diffAgainstBaseline(
        nearDuplicatePairs(getSemanticColors(mode)),
        baseline[mode]
      )

      expect(
        added,
        `New near-duplicate pair(s) in ${mode}. Alias the existing primitive or pick a distinct colour; the baseline only shrinks.`
      ).toEqual([])
    })

    it(`${mode}: the baseline lists no pair that has been resolved`, () => {
      const { stale } = diffAgainstBaseline(
        nearDuplicatePairs(getSemanticColors(mode)),
        baseline[mode]
      )

      expect(
        stale,
        `Stale baseline entr(ies) in ${mode}: remove them from theme/tokens/near-dupe-baseline.json.`
      ).toEqual([])
    })
  }
})

describe('near-duplicate gate catches a retyped colour', () => {
  const palette = { 'brand-a': '#336699', 'brand-b': '#4488CC', 'surface-x': '#336699' }

  it('accepts an exact alias of an existing colour', () => {
    expect(nearDuplicatePairs({ ...palette, 'brand-alias': '#336699' })).toEqual([])
  })

  it('ignores surface and background planes', () => {
    expect(nearDuplicatePairs({ ...palette, 'surface-y': '#346699' })).toEqual([])
  })

  it('fails a new colour within ΔE 3 of an existing one', () => {
    const found = nearDuplicatePairs({ ...palette, 'brand-new': '#346699' })

    expect(found).toEqual(['brand-a | brand-new'])
    expect(diffAgainstBaseline(found, []).added).toEqual(found)
  })

  it('reports a baseline entry that no longer matches as stale', () => {
    expect(diffAgainstBaseline([], ['brand-a | brand-old']).stale).toEqual(['brand-a | brand-old'])
  })
})
