/**
 * TD-231: contrast as a gate over the pairs the theme declares, in both modes.
 *
 * The registry is `tokens/contrast-pairs.ts`. A pair below its floor today is
 * recorded in `tokens/contrast-baseline.json`, which only shrinks: a new failure
 * fails here, and so does a baselined pair that has started to pass. Regenerate
 * with `node scripts/update-contrast-baseline.mjs`.
 */
import { describe, it, expect } from 'vitest'
import { contrast } from './color-checks'
import {
  CONTENT_PLANES,
  CONTRAST_MODES,
  CONTRAST_PAIRS,
  failingContrastPairs,
  measureContrastPairs,
  TEXT_PLANES,
  type ContrastPair,
} from './tokens/contrast-pairs'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'
import baseline from './tokens/contrast-baseline.json'

const PAIRED_ROLE = /^(text|on)-/

function unpairedRoles(
  colors: Record<string, string>,
  pairs: readonly ContrastPair[],
  mode: ThemeMode
) {
  const paired = new Set(pairs.filter((p) => p.modes.includes(mode)).map((p) => p.fg))
  return Object.keys(colors).filter((key) => PAIRED_ROLE.test(key) && !paired.has(key))
}

function diffAgainstBaseline(failing: string[], recorded: readonly string[]) {
  return {
    added: failing.filter((id) => !recorded.includes(id)),
    stale: recorded.filter((id) => !failing.includes(id)),
  }
}

function describeFailures(mode: ThemeMode, ids: string[]) {
  const byId = new Map(measureContrastPairs(mode).map((m) => [m.id, m]))
  return ids
    .map((id) => {
      const { ratio, floor } = byId.get(id)!
      return `${id}: ${ratio.toFixed(2)}:1, needs ${floor}`
    })
    .join('\n')
}

describe('declared contrast pairs', () => {
  for (const mode of CONTRAST_MODES) {
    it(`${mode}: every text- and on- role has at least one pair`, () => {
      expect(
        unpairedRoles(getSemanticColors(mode), CONTRAST_PAIRS, mode),
        `Add a pair with a floor to theme/tokens/contrast-pairs.ts for each role listed.`
      ).toEqual([])
    })

    it(`${mode}: no pair falls below its floor unless baselined`, () => {
      const { added } = diffAgainstBaseline(failingContrastPairs(mode), baseline[mode])

      expect(
        added,
        `New contrast failure(s) in ${mode}:\n${describeFailures(mode, added)}\n` +
          'Raise the foreground or the fill; the baseline only shrinks.'
      ).toEqual([])
    })

    it(`${mode}: the baseline lists no pair that now passes`, () => {
      const { stale } = diffAgainstBaseline(failingContrastPairs(mode), baseline[mode])

      expect(
        stale,
        `Stale baseline entr(ies) in ${mode}: run node scripts/update-contrast-baseline.mjs.`
      ).toEqual([])
    })
  }

  /**
   * The roles must stay ORDERED as well as legible. A migration that lifted
   * tertiary until it out-contrasted secondary would pass every floor while
   * destroying the hierarchy the three roles exist to express.
   */
  it.each(CONTRAST_MODES)(
    '%s: keeps primary > secondary > tertiary on every text plane',
    (mode) => {
      const colors: Record<string, string> = getSemanticColors(mode)
      for (const plane of TEXT_PLANES) {
        const [pri, sec, ter] = (['text-primary', 'text-secondary', 'text-tertiary'] as const).map(
          (role) => contrast(colors[role], colors[plane])
        )
        expect(
          pri,
          `on ${plane}: primary ${pri.toFixed(2)} vs secondary ${sec.toFixed(2)}`
        ).toBeGreaterThan(sec)
        expect(
          sec,
          `on ${plane}: secondary ${sec.toFixed(2)} vs tertiary ${ter.toFixed(2)}`
        ).toBeGreaterThan(ter)
      }
    }
  )
})

describe('the contrast gate catches', () => {
  const colors = {
    'text-a': '#FFFFFF',
    'surface-a': '#000000',
    'fill-a': 'rgba(255, 255, 255, 0.5)',
  }
  const pairs: ContrastPair[] = [{ fg: 'text-a', bg: 'surface-a', floor: 7, modes: ['dark'] }]

  it('a new text- role added with no pair', () => {
    expect(unpairedRoles({ ...colors, 'text-new': '#FFFFFF' }, pairs, 'dark')).toEqual(['text-new'])
  })

  it('a retune that drops a pair below its floor', () => {
    expect(failingContrastPairs('dark', pairs, colors)).toEqual([])
    const retuned = { ...colors, 'text-a': '#444444' }

    const failing = failingContrastPairs('dark', pairs, retuned)

    expect(failing).toEqual(['text-a on surface-a'])
    expect(diffAgainstBaseline(failing, []).added).toEqual(failing)
  })

  it('a baseline entry that now passes', () => {
    expect(diffAgainstBaseline([], ['text-a on surface-a']).stale).toEqual(['text-a on surface-a'])
  })

  it('a label on a translucent fill, measured over each plane it lands on', () => {
    const subtle: ContrastPair = {
      fg: 'text-a',
      bg: 'fill-a',
      floor: 4.5,
      modes: ['dark'],
      over: ['surface-a'],
    }

    const [measured] = measureContrastPairs('dark', [subtle], colors)

    expect(measured.id).toBe('text-a on fill-a over surface-a')
    expect(measured.ratio).toBeCloseTo(contrast('#FFFFFF', '#808080'), 5)
  })

  it('a pair that names a colour the theme does not have', () => {
    const typo: ContrastPair = { fg: 'text-a', bg: 'surface-typo', floor: 3, modes: ['dark'] }
    expect(() => measureContrastPairs('dark', [typo], colors)).toThrow(/surface-typo/)
  })
})

/**
 * TD-488: a control outline is the only cue that an outlined input is there, so it
 * owes WCAG 1.4.11's 3:1 against whichever plane the control sits on.
 */
describe('border-input on the content planes (light)', () => {
  const light = getSemanticColors('light')

  it.each(CONTENT_PLANES)('clears 3:1 on %s', (plane) => {
    const ratio = contrast(light['border-input'], light[plane])
    expect(
      ratio,
      `border-input ${light['border-input']} on ${plane} ${light[plane]} is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(3)
  })
})
