import { describe, expect, it } from 'vitest'
import {
  baselineKey,
  blankProblems,
  contrastProblems,
  interleaveForShards,
  pairCounts,
  sortedPairs,
  withoutSiblingPairs,
} from './contrast-stories'

describe('interleaveForShards', () => {
  const ids = [
    ...Array.from({ length: 30 }, (_, i) => `components-atoms-a--story-${i}`),
    ...Array.from({ length: 30 }, (_, i) => `lab-decisions-b--story-${i}`),
  ]

  it('keeps every id once, in an order that does not depend on the input order', () => {
    const ordered = interleaveForShards(ids)
    expect([...ordered].sort()).toEqual([...ids].sort())
    expect(interleaveForShards([...ids].reverse())).toEqual(ordered)
  })

  it('spreads a prefix that the alphabetical index would put in one shard', () => {
    const ordered = interleaveForShards(ids)
    const thirds = [ordered.slice(0, 20), ordered.slice(20, 40), ordered.slice(40)]
    for (const third of thirds) {
      expect(third.some((id) => id.startsWith('lab-'))).toBe(true)
      expect(third.some((id) => id.startsWith('components-'))).toBe(true)
    }
  })
})

describe('pairCounts', () => {
  it('counts violating nodes by foreground|background pair, sorted by pair', () => {
    const counts = pairCounts([
      { fgColor: '#888684', bgColor: '#252321' },
      { fgColor: '#ff7900', bgColor: '#ffffff' },
      { fgColor: '#888684', bgColor: '#252321' },
    ])

    expect(Object.entries(counts)).toEqual([
      ['#888684|#252321', 2],
      ['#ff7900|#ffffff', 1],
    ])
  })

  it('records a node axe reported without colours under unknown', () => {
    expect(pairCounts([{}])).toEqual({ 'unknown|unknown': 1 })
  })
})

describe('contrastProblems', () => {
  const key = baselineKey('components-atoms-badge--default', 'light')

  it('passes a story whose pairs and counts match its entry', () => {
    const counts = { '#ff7900|#ffffff': 2 }
    expect(contrastProblems(key, counts, counts)).toEqual([])
  })

  it('passes a clean story with no entry', () => {
    expect(contrastProblems(key, {})).toEqual([])
  })

  it('fails a pair the baseline does not list', () => {
    const problems = contrastProblems(key, { '#ff7900|#ffffff': 1 })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('#ff7900|#ffffff x1 (baseline x0)')
    expect(problems[0]).toContain('may only shrink')
  })

  it('fails a count above the baseline', () => {
    const problems = contrastProblems(key, { '#ff7900|#ffffff': 3 }, { '#ff7900|#ffffff': 2 })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('x3 (baseline x2)')
  })

  it('fails as stale a count below the baseline or a pair that no longer occurs', () => {
    const problems = contrastProblems(
      key,
      { '#ff7900|#ffffff': 1 },
      { '#ff7900|#ffffff': 2, '#888684|#252321': 4 }
    )
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('fewer')
    expect(problems[0]).toContain('#ff7900|#ffffff x1 (baseline x2)')
    expect(problems[0]).toContain('#888684|#252321 x0 (baseline x4)')
    expect(problems[0]).toContain('pnpm contrast:baseline')
  })

  it('reports growth and staleness of different pairs as two problems', () => {
    const problems = contrastProblems(key, { a: 1 }, { b: 1 })
    expect(problems).toHaveLength(2)
  })
})

describe('blankProblems', () => {
  const id = 'lab-design-archive-fable-directions--index'
  const reason = '#storybook-root has a zero-size box (1280x0, 1 children)'

  it('passes a listed story that renders blank', () => {
    expect(blankProblems(id, reason, true)).toEqual([])
  })

  it('passes an unlisted story that renders', () => {
    expect(blankProblems(id, null, false)).toEqual([])
  })

  it('fails an unlisted blank story, so a new blank story cannot skip the gate', () => {
    const problems = blankProblems(id, reason, false)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('renders blank')
    expect(problems[0]).toContain('contrast-blank-stories.json does not list it')
  })

  it('fails a listed story that now renders, until it is removed', () => {
    const problems = blankProblems(id, null, true)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('now renders')
    expect(problems[0]).toContain('Remove it')
  })
})

describe('sortedPairs', () => {
  it('orders pairs so a regenerated baseline diffs cleanly', () => {
    expect(Object.keys(sortedPairs({ b: 1, a: 2 }))).toEqual(['a', 'b'])
  })
})

describe('withoutSiblingPairs', () => {
  const tags = ['autodocs', 'width-matrix']
  const baseline = { 'a-card--default dark': { 'x|y': 5 } }

  it('drops the pairs the sibling Default baselines, whatever the count', () => {
    const observed = { 'x|y': 35, 'p|q': 7 }
    expect(withoutSiblingPairs('a-card--widths', tags, 'dark', observed, baseline)).toEqual({
      'p|q': 7,
    })
  })

  it('keeps a pair the sibling lacks, so it fails as today', () => {
    const observed = { 'p|q': 7 }
    expect(withoutSiblingPairs('a-card--widths', tags, 'dark', observed, baseline)).toEqual(
      observed
    )
  })

  it('gates unchanged without a baselined sibling Default in that theme', () => {
    const observed = { 'x|y': 35 }
    expect(withoutSiblingPairs('a-card--widths', tags, 'light', observed, baseline)).toEqual(
      observed
    )
    expect(withoutSiblingPairs('b-card--widths', tags, 'dark', observed, baseline)).toEqual(
      observed
    )
  })

  it('leaves a story without the width-matrix tag alone', () => {
    const observed = { 'x|y': 35 }
    expect(withoutSiblingPairs('a-card--other', ['autodocs'], 'dark', observed, baseline)).toEqual(
      observed
    )
  })
})
