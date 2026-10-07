import { describe, expect, it } from 'vitest'
import { ratchetProblems } from './ratchet'

const messages = {
  added: (items: string[]) => `added ${items.join(',')}`,
  stale: (items: string[]) => `stale ${items.join(',')}`,
}

describe('ratchetProblems', () => {
  it('reports nothing when the baseline matches', () => {
    expect(ratchetProblems(['a', 'b'], ['b', 'a'], messages)).toEqual([])
  })

  it('reports growth before staleness, each as one problem', () => {
    expect(ratchetProblems(['a', 'c', 'd'], ['a', 'b'], messages)).toEqual([
      'added c,d',
      'stale b',
    ])
  })
})
