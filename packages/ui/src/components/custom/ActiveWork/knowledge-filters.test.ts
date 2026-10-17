import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import { NOTE_KINDS, SOURCE_TYPES } from './knowledge-class'
import {
  EMPTY_KNOWLEDGE_FILTERS,
  countUndatedExcluded,
  filterKnowledge,
  knowledgeDate,
  knowledgeFacetCounts,
  parseKnowledgeDate,
  toKnowledgeSortRows,
  uniqueKnowledge,
  type KnowledgeFilters,
  type KnowledgeItem,
} from './knowledge-filters'
import {
  KNOWLEDGE_HOSTILE,
  KNOWLEDGE_ITEMS,
  KNOWLEDGE_NOW,
  KNOWLEDGE_SOURCES_ONLY,
  fixtureNote,
} from './knowledge-fixture'

const SLUGS = ['garden', 'kiln', 'tidepool', 'orrery']
const DATES = ['2026-09-29', '2026-08-01', '2026-02-30', 'not-a-date', '2026-09-30T08:00:00.000Z']

const itemArb: fc.Arbitrary<KnowledgeItem> = fc
  .record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    record: fc.constantFrom('note' as const, 'source' as const),
    initiative: fc.constantFrom(...SLUGS),
    title: fc.string({ maxLength: 20 }),
    noteKind: fc.option(fc.constantFrom(...NOTE_KINDS), { nil: undefined }),
    sourceType: fc.option(fc.constantFrom(...SOURCE_TYPES), { nil: undefined }),
    created: fc.option(fc.constantFrom(...DATES), { nil: undefined }),
    mtime: fc.option(fc.constantFrom(...DATES), { nil: undefined }),
    tags: fc.option(fc.array(fc.constantFrom('soil', 'glaze', 'tides')), { nil: undefined }),
  })
  .map((item) => ({ ...item, path: `/synthetic/${item.initiative}/${item.id}` }))

const filtersArb: fc.Arbitrary<KnowledgeFilters> = fc.record({
  query: fc.constantFrom('', 'soil', 'GARDEN', 'a b', '  '),
  initiatives: fc.subarray(SLUGS),
  records: fc.subarray(['note' as const, 'source' as const]),
  noteKinds: fc.subarray(NOTE_KINDS),
  sourceTypes: fc.subarray(SOURCE_TYPES),
  dateRange: fc.constantFrom('all' as const, '7d' as const, '30d' as const, '90d' as const),
})

describe('filterKnowledge properties', () => {
  it('filtering returns a subsequence and is idempotent', () => {
    fcAssert(
      fc.property(fc.array(itemArb, { maxLength: 30 }), filtersArb, (items, filters) => {
        const before = [...items]
        const once = filterKnowledge(items, filters, KNOWLEDGE_NOW)
        expect(items).toEqual(before)
        let cursor = 0
        for (const kept of once) {
          cursor = items.indexOf(kept, cursor) + 1
          expect(cursor).toBeGreaterThan(0)
        }
        expect(filterKnowledge(once, filters, KNOWLEDGE_NOW)).toEqual(once)
      })
    )
  })

  it('empty filters return every item', () => {
    fcAssert(
      fc.property(fc.array(itemArb, { maxLength: 30 }), (items) => {
        expect(filterKnowledge(items, EMPTY_KNOWLEDGE_FILTERS, KNOWLEDGE_NOW)).toEqual(items)
      })
    )
  })

  it('facet counts sum to the item count per facet', () => {
    fcAssert(
      fc.property(fc.array(itemArb, { maxLength: 30 }), (items) => {
        const counts = knowledgeFacetCounts(items)
        const sum = (record: Record<string, number>) =>
          Object.values(record).reduce((a, b) => a + b, 0)
        expect(sum(counts.initiatives)).toBe(items.length)
        expect(sum(counts.records)).toBe(items.length)
        const notes = items.filter((item) => item.record === 'note' && item.noteKind)
        const sources = items.filter((item) => item.record === 'source' && item.sourceType)
        expect(sum(counts.noteKinds)).toBe(notes.length)
        expect(sum(counts.sourceTypes)).toBe(sources.length)
      })
    )
  })
})

describe('filterKnowledge', () => {
  const withFilters = (patch: Partial<KnowledgeFilters>) => ({
    ...EMPTY_KNOWLEDGE_FILTERS,
    ...patch,
  })

  it('a date range keeps undated sources out and counts them', () => {
    const filters = withFilters({ dateRange: '30d' })
    const kept = filterKnowledge(KNOWLEDGE_SOURCES_ONLY, filters, KNOWLEDGE_NOW)
    expect(kept.every((item) => knowledgeDate(item) !== undefined)).toBe(true)
    expect(kept.map((item) => item.title)).not.toContain('Undated pointer')
    expect(countUndatedExcluded(KNOWLEDGE_SOURCES_ONLY, filters, KNOWLEDGE_NOW)).toBe(2)
  })

  it('counts no undated items when the range is any date', () => {
    expect(
      countUndatedExcluded(KNOWLEDGE_SOURCES_ONLY, EMPTY_KNOWLEDGE_FILTERS, KNOWLEDGE_NOW)
    ).toBe(0)
  })

  it('30d includes the item exactly 30 days old and drops the one a day older', () => {
    // A day-only date is midnight UTC, so from a midnight reference 2026-08-31 is exactly 30 days old.
    const now = Date.parse('2026-09-30T00:00:00.000Z')
    const note = fixtureNote('garden', { kind: 'fyi', title: 'Boundary', age: 0 })
    const items = [
      { ...note, id: 'thirty', created: '2026-08-31' },
      { ...note, id: 'thirty-one', created: '2026-08-30' },
    ]
    const kept = filterKnowledge(items, withFilters({ dateRange: '30d' }), now)
    expect(kept.map((item) => item.id)).toEqual(['thirty'])
  })

  it('treats a kind and a type as one facet: a note kind alone hides every source', () => {
    const kept = filterKnowledge(
      KNOWLEDGE_ITEMS,
      withFilters({ noteKinds: ['gotcha'] }),
      KNOWLEDGE_NOW
    )
    expect(kept).toHaveLength(4)
    expect(kept.every((item) => item.noteKind === 'gotcha')).toBe(true)
  })

  it('unions a note kind with a source type', () => {
    const filters = withFilters({ noteKinds: ['gotcha'], sourceTypes: ['pr'] })
    const kept = filterKnowledge(KNOWLEDGE_ITEMS, filters, KNOWLEDGE_NOW)
    expect(kept.some((item) => item.sourceType === 'pr')).toBe(true)
    expect(kept.some((item) => item.noteKind === 'gotcha')).toBe(true)
    expect(kept.every((item) => item.noteKind === 'gotcha' || item.sourceType === 'pr')).toBe(true)
  })

  it('matches every query word, case-insensitively, across title, path, initiative and tags', () => {
    const kept = filterKnowledge(
      KNOWLEDGE_ITEMS,
      withFilters({ query: 'GARDEN soil' }),
      KNOWLEDGE_NOW
    )
    expect(kept.map((item) => item.title).sort()).toEqual([
      'Raised beds drain slower after rain',
      'Soil acidity by bed',
    ])
  })

  it('treats the query as literal text, not a pattern', () => {
    expect(filterKnowledge(KNOWLEDGE_ITEMS, withFilters({ query: '.*(' }), KNOWLEDGE_NOW)).toEqual(
      []
    )
    const kept = filterKnowledge(
      KNOWLEDGE_HOSTILE,
      withFilters({ query: '<script>' }),
      KNOWLEDGE_NOW
    )
    expect(kept).toHaveLength(1)
  })
})

describe('parseKnowledgeDate', () => {
  it('refuses a day that does not exist, which Date.parse would roll into March', () => {
    expect(Number.isFinite(Date.parse('2026-02-30'))).toBe(true)
    expect(parseKnowledgeDate('2026-02-30')).toBeUndefined()
  })

  it('reads ISO days and times, and nothing else', () => {
    expect(parseKnowledgeDate('2026-02-28')).toBe(Date.UTC(2026, 1, 28))
    expect(parseKnowledgeDate('2026-09-30T08:00:00.000Z')).toBe(Date.UTC(2026, 8, 30, 8))
    expect(parseKnowledgeDate('September 30')).toBeUndefined()
    expect(parseKnowledgeDate(undefined)).toBeUndefined()
  })

  it('lists a note by when it was written and a source by when it changed', () => {
    const [note, source] = [KNOWLEDGE_ITEMS[0]!, KNOWLEDGE_ITEMS[5]!]
    expect(knowledgeDate(note)).toBe(parseKnowledgeDate(note.created))
    expect(source.created).toBeUndefined()
    expect(knowledgeDate(source)).toBe(parseKnowledgeDate(source.mtime))
  })
})

describe('uniqueKnowledge', () => {
  it('keeps the first item for a duplicated id', () => {
    const unique = uniqueKnowledge(KNOWLEDGE_HOSTILE)
    expect(unique).toHaveLength(KNOWLEDGE_HOSTILE.length - 1)
    expect(unique.map((item) => item.title)).toContain('First copy of a duplicated id')
    expect(unique.map((item) => item.title)).not.toContain('Second copy of a duplicated id')
  })
})

describe('toKnowledgeSortRows', () => {
  it('leaves an impossible date absent, so the table sorts it last', () => {
    const rows = toKnowledgeSortRows(KNOWLEDGE_HOSTILE)
    const impossible = rows.find((row) => row.created === '2026-02-30')
    expect(impossible?.date).toBeUndefined()
    expect(rows.find((row) => row.record === 'note')?.kind).toBe('fyi')
  })
})
