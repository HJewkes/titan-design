import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { fcAssert } from '../../../test/property'

import { HOSTILE_LABELS, PALETTE_DEFAULT, PALETTE_HOSTILE, PALETTE_MISSING } from './fixtures'
import {
  asyncResultsReducer,
  buildSections,
  fuzzyMatch,
  initialAsyncResults,
  nextOptionIndex,
  rankItems,
  RECENT_SECTION_ID,
  UNGROUPED_SECTION_ID,
} from './palette-model'
import type { AsyncResultsState } from './palette-model'
import type { CommandItem } from './types'

const fold = (text: string): string[] =>
  Array.from({ length: text.length }, (_, i) => text[i].toLowerCase())

/** Reference: a case-insensitive subsequence test by UTF-16 code unit. */
function isSubsequence(query: string, text: string): boolean {
  const needle = fold(query)
  const haystack = fold(text)
  let q = 0
  for (let t = 0; t < haystack.length && q < needle.length; t += 1)
    if (haystack[t] === needle[q]) q += 1
  return q === needle.length
}

const smallText = fc.string({
  unit: fc.constantFrom('a', 'b', 'A', 'B', 'c', ' ', '-', '.', '*'),
  maxLength: 12,
})
const hostileText = fc.oneof(
  fc.string({ unit: 'grapheme', maxLength: 20 }),
  fc.string({
    unit: fc.constantFrom('.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'),
  }),
  fc.constantFrom(...Object.values(HOSTILE_LABELS))
)

const labels = (items: { item: CommandItem }[]) => items.map((entry) => entry.item.label)
const ids = (items: { item: CommandItem }[]) => items.map((entry) => entry.item.id)

describe('fuzzyMatch', () => {
  it('matches exactly when the query is a case-insensitive subsequence of the text', () => {
    fcAssert(
      fc.property(smallText, smallText, (query, text) => {
        expect(fuzzyMatch(query, text) !== null).toBe(isSubsequence(query, text))
      })
    )
  })

  it('returns ranges in bounds, ascending and non-overlapping that spell the query', () => {
    fcAssert(
      fc.property(smallText, smallText, (query, text) => {
        const match = fuzzyMatch(query, text)
        if (!match) return
        let previousEnd = -1
        for (const { start, end } of match.ranges) {
          expect(start).toBeGreaterThan(previousEnd)
          expect(end).toBeGreaterThan(start)
          expect(end).toBeLessThanOrEqual(text.length)
          previousEnd = end
        }
        const spelled = match.ranges.map(({ start, end }) => text.slice(start, end)).join('')
        expect(fold(spelled)).toEqual(fold(query))
      })
    )
  })

  it('never throws on regex metacharacters, emoji, right-to-left or empty strings', () => {
    fcAssert(
      fc.property(hostileText, hostileText, (query, text) => {
        expect(() => fuzzyMatch(query, text)).not.toThrow()
        expect(() => fuzzyMatch(text, query)).not.toThrow()
      })
    )
  })

  it('never throws on 10,000-character inputs and still finds a scattered match', () => {
    const long = `${'ab'.repeat(4_999)}xy`

    expect(fuzzyMatch(long, long)?.ranges).toEqual([{ start: 0, end: 10_000 }])
    expect(fuzzyMatch('axy', long)).not.toBeNull()
    expect(fuzzyMatch('.*', long)).toBeNull()
  })

  it('matches everything with score 0 and no ranges when the query is empty', () => {
    expect(fuzzyMatch('', 'Settings')).toEqual({ score: 0, ranges: [] })
    expect(fuzzyMatch('', '')).toEqual({ score: 0, ranges: [] })
  })

  it('prefers a word-start run over the leftmost scattered hit', () => {
    expect(fuzzyMatch('set', 'Asset settings')?.ranges).toEqual([{ start: 6, end: 9 }])
  })
})

describe('rankItems', () => {
  const items: CommandItem[] = [
    { id: 'asset', label: 'Asset list' },
    { id: 'reset', label: 'Reset' },
    { id: 'settings', label: 'Settings' },
    { id: 'none', label: 'Home' },
  ]

  it('puts "Settings" above "Reset" above "Asset list" for the query "set"', () => {
    expect(rankItems(items, 'set').map((ranked) => ranked.item.label)).toEqual([
      'Settings',
      'Reset',
      'Asset list',
    ])
  })

  it('puts a word start above a mid-word hit', () => {
    const ranked = rankItems(
      [
        { id: 'mid', label: 'Upset' },
        { id: 'word', label: 'Big set' },
      ],
      'set'
    )

    expect(ranked.map((entry) => entry.item.id)).toEqual(['word', 'mid'])
  })

  it('matches description and keywords below the same match on a label, with no label ranges', () => {
    const ranked = rankItems(
      [
        { id: 'keyword', label: 'Home', keywords: ['dashboard'] },
        { id: 'description', label: 'Lamps', description: 'dashboard' },
        { id: 'label', label: 'dashboard' },
      ],
      'dash'
    )

    expect(ranked.map((entry) => entry.item.id)).toEqual(['label', 'keyword', 'description'])
    expect(ranked[1].ranges).toEqual([])
  })

  it('keeps every item in its given order when the query is empty', () => {
    expect(rankItems(items, '').map((ranked) => ranked.item.id)).toEqual(
      items.map((item) => item.id)
    )
  })
})

describe('buildSections', () => {
  const arbitraryItem = fc.record({
    id: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f'),
    label: smallText,
    groupId: fc.option(fc.constantFrom('g1', 'g2', 'unknown'), { nil: undefined }),
  })
  const arbitraryInput = fc.record({
    query: smallText,
    items: fc.array(arbitraryItem, { maxLength: 10 }),
    asyncItems: fc.array(arbitraryItem, { maxLength: 6 }),
    recentItems: fc.array(arbitraryItem, { maxLength: 4 }),
    maxResults: fc.integer({ min: 0, max: 12 }),
    groups: fc.constant([
      { id: 'g1', label: 'One' },
      { id: 'g2', label: 'Two' },
      { id: 'g1', label: 'Duplicate' },
    ]),
  })

  it('lists each id at most once, in the flat order of its sections, within maxResults', () => {
    fcAssert(
      fc.property(arbitraryInput, (input) => {
        const { sections, options } = buildSections(input)

        expect(new Set(ids(options)).size).toBe(options.length)
        expect(options).toEqual(sections.flatMap((section) => section.options))
        expect(options.length).toBeLessThanOrEqual(input.maxResults)
        expect(sections.every((section) => section.options.length > 0)).toBe(true)
      })
    )
  })

  it('shows recents first, then static items in their given order, when the query is empty', () => {
    const { sections } = buildSections({ ...PALETTE_DEFAULT, query: '  ' })

    expect(sections[0]).toMatchObject({ id: RECENT_SECTION_ID, label: 'Recent' })
    expect(labels(sections[0].options)).toEqual(
      labels(PALETTE_DEFAULT.recentItems.map((item) => ({ item })))
    )
    expect(sections.map((section) => section.id)).toEqual([
      RECENT_SECTION_ID,
      'pages',
      'articles',
      'people',
    ])
    expect(ids(sections[1].options)).toEqual(['page-home', 'page-assets', 'page-reset'])
  })

  it('omits the recents when the query is not empty', () => {
    const { sections } = buildSections({ ...PALETTE_DEFAULT, query: 'set' })

    expect(sections.map((section) => section.id)).not.toContain(RECENT_SECTION_ID)
  })

  it('puts items with no group or an unknown group in a trailing "Other" section and leaves empty groups out', () => {
    const { sections } = buildSections({
      ...PALETTE_MISSING,
      query: '',
      ungroupedLabel: 'Elsewhere',
    })

    expect(sections.map((section) => section.id)).toEqual(['articles', UNGROUPED_SECTION_ID])
    expect(sections[1]).toMatchObject({ label: 'Elsewhere' })
    expect(ids(sections[1].options)).toEqual(['loose-1', 'loose-2'])
  })

  it('appends async items to their groups in the order returned, after the static matches', () => {
    const asyncItems: CommandItem[] = [
      { id: 'z-weak', label: 'zz unrelated set', groupId: 'pages' },
      { id: 'a-strong', label: 'Setup', groupId: 'pages' },
    ]
    const { sections } = buildSections({ ...PALETTE_DEFAULT, query: 'set', asyncItems })

    expect(ids(sections[0].options)).toEqual([
      'page-settings',
      'page-reset',
      'page-assets',
      'z-weak',
      'a-strong',
    ])
    expect(sections[0].options[3].matches).toEqual([])
  })

  it('keeps the first occurrence in display order of an id shared by the static, async and recent lists', () => {
    const asyncItems = [
      { id: PALETTE_HOSTILE.items[1].id, label: 'Shared from async', groupId: 'pages' },
    ]
    const empty = buildSections({ ...PALETTE_HOSTILE, query: '' })
    const typed = buildSections({ ...PALETTE_HOSTILE, query: 'shared', asyncItems })

    expect(labels(empty.options).filter((label) => label.startsWith('Shared'))).toEqual([
      'Shared id from the recent list',
    ])
    expect(labels(typed.options)).toEqual(['Shared id from the static list'])
  })

  it('names a duplicated group by its first entry', () => {
    const { sections } = buildSections({ ...PALETTE_HOSTILE, query: '' })

    expect(sections.find((section) => section.id === 'pages')?.label).toBe('Go to')
  })

  it('cuts the list at maxResults, defaulting to 50', () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ id: `n${i}`, label: `note ${i}` }))

    expect(buildSections({ query: 'note', items: many }).options).toHaveLength(50)
    expect(buildSections({ query: 'note', items: many, maxResults: 3 }).options).toHaveLength(3)
  })
})

describe('nextOptionIndex', () => {
  const rows = (disabled: boolean[]) => disabled.map((isDisabled) => ({ item: { isDisabled } }))

  it('returns an enabled index, or the same index when no option is enabled', () => {
    fcAssert(
      fc.property(
        fc.array(fc.boolean(), { maxLength: 8 }),
        fc.integer({ min: -1, max: 8 }),
        fc.constantFrom('ArrowDown' as const, 'ArrowUp' as const),
        (disabled, start, key) => {
          const options = rows(disabled)
          const index = Math.min(start, options.length - 1)
          const next = nextOptionIndex(options, index, key)

          if (disabled.every(Boolean)) expect(next).toBe(index)
          else expect(options[next].item.isDisabled).toBe(false)
        }
      )
    )
  })

  it('wraps Down from the last row and Up from the first row', () => {
    const options = rows([false, false, false])

    expect(nextOptionIndex(options, 2, 'ArrowDown')).toBe(0)
    expect(nextOptionIndex(options, 0, 'ArrowUp')).toBe(2)
  })

  it('skips disabled rows, including a disabled first row', () => {
    const options = rows([true, false, true, false])

    expect(nextOptionIndex(options, -1, 'ArrowDown')).toBe(1)
    expect(nextOptionIndex(options, 1, 'ArrowDown')).toBe(3)
    expect(nextOptionIndex(options, 3, 'ArrowDown')).toBe(1)
    expect(nextOptionIndex(options, -1, 'ArrowUp')).toBe(3)
  })

  it('stays put when every row is disabled or there are no rows', () => {
    expect(nextOptionIndex(rows([true, true]), 0, 'ArrowDown')).toBe(0)
    expect(nextOptionIndex(rows([]), -1, 'ArrowUp')).toBe(-1)
  })
})

describe('asyncResultsReducer', () => {
  const fresh: CommandItem[] = [{ id: 'fresh', label: 'Fresh result' }]
  const stale: CommandItem[] = [{ id: 'stale', label: 'Stale result' }]
  const pending = (requestId: number, query: string): AsyncResultsState =>
    asyncResultsReducer(initialAsyncResults, { type: 'request', requestId, query })

  it('applies the response to the pending request', () => {
    const state = asyncResultsReducer(pending(1, 'se'), {
      type: 'resolve',
      requestId: 1,
      items: fresh,
    })

    expect(state).toMatchObject({ status: 'resolved', query: 'se', items: fresh })
  })

  it('ignores a result for an older query, before and after the newer one resolves', () => {
    const newer = asyncResultsReducer(pending(1, 'se'), {
      type: 'request',
      requestId: 2,
      query: 'set',
    })
    const lateFirst = asyncResultsReducer(newer, { type: 'resolve', requestId: 1, items: stale })
    const resolved = asyncResultsReducer(lateFirst, { type: 'resolve', requestId: 2, items: fresh })
    const lateAfter = asyncResultsReducer(resolved, { type: 'resolve', requestId: 1, items: stale })

    expect(lateFirst).toBe(newer)
    expect(lateAfter).toBe(resolved)
    expect(lateAfter.items).toEqual(fresh)
  })

  it('ignores a rejection of an older request', () => {
    const newer = asyncResultsReducer(pending(1, 'se'), {
      type: 'request',
      requestId: 2,
      query: 'set',
    })

    expect(
      asyncResultsReducer(newer, { type: 'reject', requestId: 1, error: new Error('old') })
    ).toBe(newer)
  })

  it('ignores a response that arrives after a reset', () => {
    const reset = asyncResultsReducer(pending(1, 'se'), { type: 'reset' })

    expect(asyncResultsReducer(reset, { type: 'resolve', requestId: 1, items: stale })).toBe(reset)
    expect(reset.status).toBe('idle')
  })

  it('sets the error on a rejection and keeps the static results on screen', () => {
    const error = new Error('offline')
    const state = asyncResultsReducer(pending(1, 'set'), { type: 'reject', requestId: 1, error })
    const { options } = buildSections({
      ...PALETTE_DEFAULT,
      query: state.query,
      asyncItems: state.items,
    })

    expect(state).toMatchObject({ status: 'rejected', error, items: [] })
    expect(ids(options)).toEqual(['page-settings', 'page-reset', 'page-assets'])
  })

  it('clears the previous results and error when a new request starts', () => {
    const failed = asyncResultsReducer(pending(1, 'se'), {
      type: 'reject',
      requestId: 1,
      error: 'x',
    })
    const next = asyncResultsReducer(failed, { type: 'request', requestId: 2, query: 'set' })

    expect(next).toEqual({
      status: 'pending',
      requestId: 2,
      query: 'set',
      items: [],
      error: undefined,
    })
  })
})
