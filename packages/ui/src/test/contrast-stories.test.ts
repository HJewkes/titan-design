import { describe, expect, it } from 'vitest'
import { baselineKey, contrastProblems, pairCounts, sortedPairs } from './contrast-stories'

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

describe('sortedPairs', () => {
  it('orders pairs so a regenerated baseline diffs cleanly', () => {
    expect(Object.keys(sortedPairs({ b: 1, a: 2 }))).toEqual(['a', 'b'])
  })
})
