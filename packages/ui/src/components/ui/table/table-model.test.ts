import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { fcAssert } from '../../../test/property'

import { hostileFixture, tableFixtures, type FindingRow, type TableFixture } from './fixtures'
import {
  MAX_BLOCK_ROWS,
  activeFilterCount,
  alignRange,
  clearFilters,
  facetCounts,
  facetOptions,
  filterRows,
  missingRanges,
  toggleSetFilter,
  windowSlice,
  type TableFilterColumn,
  type TableFilters,
} from './table-model'

const fixtureNamed = (name: string): TableFixture => {
  const fixture = tableFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`missing fixture ${name}`)
  return fixture
}

const columns: TableFilterColumn<FindingRow>[] = [
  { key: 'rule' },
  { key: 'severity' },
  { key: 'message' },
  { key: 'kind', accessor: (row) => row.node.kind },
  { key: 'path', accessor: (row) => row.node.path },
]

const defaultRows = fixtureNamed('Default').rows
const veryLarge = fixtureNamed('Very large')
const sparse = fixtureNamed('Sparse window')

const filtersArb = fc.dictionary(
  fc.constantFrom('rule', 'severity', 'kind', 'message', 'unknown'),
  fc.oneof(
    fc.array(fc.constantFrom('max-file-loc', 'max-cyclomatic-per-function', 'error', 'file', 'x')),
    fc.constantFrom('', ' LOC ', 'sym-1', 'packages', 'no-such-text')
  )
) as fc.Arbitrary<TableFilters>

const isSubsequence = <T>(sub: readonly T[], full: readonly T[]): boolean => {
  let at = 0
  for (const item of sub) {
    while (at < full.length && full[at] !== item) at++
    if (at === full.length) return false
    at++
  }
  return true
}

describe('filterRows properties', () => {
  it('returns a subsequence of the input: never adds, duplicates or reorders', () => {
    fcAssert(
      fc.property(filtersArb, fc.integer({ min: 0, max: 60 }), (filters, take) => {
        const rows = defaultRows.slice(0, take)
        expect(isSubsequence(filterRows(rows, filters, columns), rows)).toBe(true)
      })
    )
  })

  it('restores the input for empty filters and after clearFilters', () => {
    expect(filterRows(defaultRows, {}, columns)).toBe(defaultRows)
    fcAssert(
      fc.property(filtersArb, (filters) => {
        const cleared = clearFilters(filters)
        expect(filterRows(defaultRows, cleared, columns)).toEqual(defaultRows)
        expect(activeFilterCount(cleared, columns)).toBe(0)
      })
    )
  })

  it('passes a row iff every filtered field has its value in that field set', () => {
    const values = fc.array(fc.constantFrom('error', 'warning', 'info'))
    const rules = fc.array(fc.constantFrom('max-file-loc', 'max-cyclomatic-per-function', 'nope'))
    fcAssert(
      fc.property(values, rules, (severity, rule) => {
        const kept = new Set(filterRows(veryLarge.rows, { severity, rule }, columns))
        for (const row of veryLarge.rows.slice(0, 2000)) {
          const inSet = (set: string[], value: string) => set.length === 0 || set.includes(value)
          const expected = inSet(severity, row.severity) && inSet(rule, row.rule)
          expect(kept.has(row)).toBe(expected)
        }
      })
    )
  })

  it('calls an accessor at most once per row per active filter', () => {
    let calls = 0
    const counted: TableFilterColumn<FindingRow>[] = [
      { key: 'severity', accessor: (row) => (calls++, row.severity) },
    ]
    filterRows(defaultRows, { severity: ['error'] }, counted)
    expect(calls).toBeLessThanOrEqual(defaultRows.length)
  })
})

describe('filterRows', () => {
  it('matches text case-insensitively and trims the term', () => {
    const rows = filterRows(defaultRows, { path: '  VELOCITYSTRIP ' }, columns)

    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.node.path.toLowerCase().includes('velocitystrip'))).toBe(true)
  })

  it('treats a blank text term as no filter', () => {
    expect(filterRows(defaultRows, { path: '   ' }, columns)).toBe(defaultRows)
  })

  it('ignores a filter on an unknown column', () => {
    expect(filterRows(defaultRows, { 'stale-column': ['x'] }, columns)).toBe(defaultRows)
  })

  it('ORs within a field and ANDs across fields', () => {
    const either = filterRows(
      defaultRows,
      { rule: ['max-file-loc', 'max-cyclomatic-per-function'] },
      columns
    )
    const both = filterRows(
      defaultRows,
      { rule: ['max-cyclomatic-per-function'], path: 'VelocityStrip' },
      columns
    )

    expect(either).toHaveLength(60)
    expect(both.map((row) => row.id)).toEqual([
      'max-cyclomatic-per-function|packages/ui/src/components/custom/Workout/VelocityStrip.tsx',
    ])
  })

  it('answers none for the Filtered empty fixture filter', () => {
    const { rows, filters } = fixtureNamed('Filtered empty')

    expect(filterRows(rows, filters ?? {}, columns)).toEqual([])
  })

  it('does not throw on the Hostile fixture, with any filter', () => {
    const { rows, filters } = hostileFixture

    expect(() => filterRows(rows, filters ?? {}, columns)).not.toThrow()
    expect(() => filterRows(rows, { message: 'nan', kind: ['file'] }, columns)).not.toThrow()
    expect(() =>
      filterRows([null, undefined, {}] as never[], { rule: ['x'] }, columns)
    ).not.toThrow()
  })
})

describe('toggleSetFilter, clearFilters and activeFilterCount', () => {
  it('adds, removes and drops an emptied field', () => {
    const one = toggleSetFilter({}, 'rule', 'a')
    const two = toggleSetFilter(one, 'rule', 'b')

    expect(two).toEqual({ rule: ['a', 'b'] })
    expect(toggleSetFilter(two, 'rule', 'a')).toEqual({ rule: ['b'] })
    expect(toggleSetFilter(one, 'rule', 'a')).toEqual({})
  })

  it('does not mutate its input', () => {
    const filters = Object.freeze({ rule: Object.freeze(['a']) })

    expect(() => toggleSetFilter(filters, 'rule', 'b')).not.toThrow()
    expect(() => clearFilters(filters, 'rule')).not.toThrow()
  })

  it('clears one field or all', () => {
    const filters = { rule: ['a'], path: 'x' }

    expect(clearFilters(filters, 'rule')).toEqual({ path: 'x' })
    expect(clearFilters(filters)).toEqual({})
  })

  it('counts active fields and skips blank, empty and unknown ones', () => {
    const filters = { rule: ['a'], severity: [], path: ' ', message: 'x', stale: ['y'] }

    expect(activeFilterCount(filters, columns)).toBe(2)
  })
})

describe('facetOptions', () => {
  it('keeps a selected value with count 0, listed or not in the source', () => {
    const counts = { error: 4, warning: 0 }

    expect(facetOptions(counts, ['warning', 'info'])).toEqual([
      { value: 'error', count: 4, isSelected: false },
      { value: 'warning', count: 0, isSelected: true },
      { value: 'info', count: 0, isSelected: true },
    ])
  })

  it('lists the source counts of the Default fixture in source order', () => {
    const { facets } = fixtureNamed('Default')

    expect(facetOptions(facets.rule).map((o) => o.count)).toEqual([3, 57])
  })

  it('reads missing, negative and non-finite counts as 0 on the Hostile fixture', () => {
    const odd = { a: Number.NaN, b: -3, c: Number.POSITIVE_INFINITY }

    expect(facetOptions(odd).map((o) => o.count)).toEqual([0, 0, 0])
    expect(facetOptions(undefined, ['x'])).toEqual([{ value: 'x', count: 0, isSelected: true }])
    expect(() => facetOptions(hostileFixture.facets.rule, ['rule-not-there'])).not.toThrow()
  })
})

describe('facetCounts', () => {
  it('counts the Default fixture rules as its recorded facet answer', () => {
    const { facets } = fixtureNamed('Default')

    expect(facetCounts(defaultRows, { key: 'rule' })).toEqual(facets.rule)
  })

  it('reads through the accessor, skips blank cells and keeps prototype names as values', () => {
    const rows = [{ v: 'a' }, { v: null }, { v: '__proto__' }, { v: 'a' }, {}]

    const counts = facetCounts(rows, { key: 'v', accessor: (row) => row.v })

    expect(counts).toEqual({ a: 2, ['__proto__']: 1 })
    expect(Object.keys(counts)).toEqual(['a', '__proto__'])
  })
})

const rangeArb = fc.record({
  start: fc.integer({ min: -5, max: 12000 }),
  end: fc.integer({ min: -5, max: 12000 }),
})

describe('alignRange', () => {
  it('is block-aligned, inside 0..rowCount and at most 500 rows', () => {
    fcAssert(
      fc.property(
        rangeArb,
        fc.integer({ min: 0, max: 12000 }),
        fc.integer({ min: 1, max: 700 }),
        (range, rowCount, block) => {
          const { start, end } = alignRange(range, rowCount, block)
          const size = Math.min(block, MAX_BLOCK_ROWS)

          expect(start % size).toBe(0)
          expect(end === rowCount || end % size === 0).toBe(true)
          expect(start).toBeGreaterThanOrEqual(0)
          expect(end).toBeLessThanOrEqual(rowCount)
          expect(end).toBeGreaterThanOrEqual(start)
          expect(end - start).toBeLessThanOrEqual(MAX_BLOCK_ROWS)
        }
      )
    )
  })

  it('covers a request that fits inside the cap', () => {
    fcAssert(
      fc.property(
        fc.integer({ min: 0, max: 9000 }),
        fc.integer({ min: 1, max: 100 }),
        (start, length) => {
          const rowCount = 10000
          const result = alignRange({ start, end: start + length }, rowCount, 100)

          expect(result.start).toBeLessThanOrEqual(start)
          expect(result.end).toBeGreaterThanOrEqual(Math.min(start + length, rowCount))
        }
      )
    )
  })

  it('never leaves the Hostile row count sequence', () => {
    for (const rowCount of hostileFixture.rowCountSequence ?? []) {
      const { end } = alignRange({ start: 0, end: 10000 }, rowCount)
      expect(end).toBeLessThanOrEqual(rowCount)
    }
    expect(alignRange({ start: Number.NaN, end: Number.POSITIVE_INFINITY }, Number.NaN)).toEqual({
      start: 0,
      end: 0,
    })
  })
})

describe('missingRanges and windowSlice on the Sparse window fixture', () => {
  const total = sparse.total
  const loaded = sparse.loaded ?? { start: 0, end: 0 }
  const isLoaded = (i: number) => i >= loaded.start && i < loaded.end

  it('reports no block while the window sits in the loaded rows', () => {
    expect(missingRanges({ start: 0, end: 300 }, total, isLoaded)).toEqual([])
  })

  it('reports each unloaded block of a window that runs past the loaded rows', () => {
    expect(missingRanges({ start: 450, end: 650 }, total, isLoaded)).toEqual([
      { start: 500, end: 600 },
      { start: 600, end: 700 },
    ])
  })

  it('clips to the row count', () => {
    expect(missingRanges({ start: 9950, end: 20000 }, total, isLoaded)).toEqual([
      { start: 9900, end: 10000 },
    ])
  })

  it('slices loaded rows and leaves unloaded slots undefined', () => {
    const slots = windowSlice((i) => sparse.rows[i], { start: 498, end: 502 }, total)

    expect(slots.map((row) => row?.id)).toEqual([
      sparse.rows[498].id,
      sparse.rows[499].id,
      undefined,
      undefined,
    ])
    expect(windowSlice((i) => sparse.rows[i], { start: 9998, end: 12000 }, total)).toHaveLength(2)
  })
})
