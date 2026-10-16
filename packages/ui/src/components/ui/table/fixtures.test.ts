import { describe, expect, it } from 'vitest'
import {
  buildSyntheticFindings,
  countFacets,
  defaultFixture,
  hostileFixture,
  tableFixtures,
  type FindingRow,
  type TableFixture,
} from './fixtures'

const byName = (name: string): TableFixture => {
  const fixture = tableFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`no fixture ${name}`)
  return fixture
}
const ids = (fixture: TableFixture): string[] => fixture.rows.map((r) => r.id)
const sum = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((total, n) => total + n, 0)
const nonHostile = tableFixtures.filter((f) => !f.hostile).map((f) => [f.name, f] as const)
const complete = nonHostile.filter(([, f]) => f.rows.length === f.total)

const FIELD: Record<string, (row: FindingRow) => string | undefined> = {
  severity: (row) => row.severity,
  rule: (row) => row.rule,
}

/** OR within a field, AND across fields: the filter semantics the contract fixes. */
const applyFilters = (rows: FindingRow[], filters: Record<string, readonly string[]>) =>
  rows.filter((row) =>
    Object.entries(filters).every(
      ([field, values]) => values.length === 0 || values.includes(FIELD[field](row) ?? '')
    )
  )

describe('Table fixtures', () => {
  it('lists every contract fixture once', () => {
    expect(tableFixtures.map((f) => f.name).sort()).toEqual(
      [
        'Baseline',
        'Default',
        'Empty',
        'Filtered empty',
        'Hostile',
        'Long content',
        'Missing baseline',
        'Null cells',
        'One item',
        'Sparse window',
        'Very large',
      ].sort()
    )
  })

  it('marks only Hostile as hostile', () => {
    expect(tableFixtures.filter((f) => f.hostile)).toEqual([hostileFixture])
  })

  it.each(nonHostile)('%s has unique row ids', (_name, fixture) => {
    expect(new Set(ids(fixture)).size).toBe(fixture.rows.length)
  })

  it.each(nonHostile)('%s has every facet summing to total', (_name, fixture) => {
    for (const [field, counts] of Object.entries(fixture.facets)) {
      expect(sum(counts), field).toBe(fixture.total)
    }
  })

  it.each(complete)('%s has facets equal to a recount of its rows', (_name, fixture) => {
    expect(fixture.facets).toEqual(countFacets(fixture.rows))
  })

  it.each(tableFixtures.map((f) => [f.name, f] as const))(
    '%s is labelled, and says so when synthetic',
    (_name, fixture) => {
      expect(fixture.label.length).toBeGreaterThan(0)
      if (fixture.source !== 'real') expect(fixture.label).toMatch(/synthetic/)
    }
  )

  it('carries no home path, email or private excerpt', () => {
    const text = JSON.stringify(tableFixtures)
    for (const pattern of [
      /\/Users\//,
      /\/home\//,
      /~\//,
      /\.claude/,
      /[\w.+-]+@[\w-]+\.[\w.-]+/,
    ]) {
      expect(text).not.toMatch(pattern)
    }
    for (const row of tableFixtures.flatMap((f) => f.rows)) {
      expect(row).not.toHaveProperty('excerpt')
      expect(row).not.toHaveProperty('why')
    }
  })
})

describe('Default, the real titan-design list', () => {
  it('holds the 60 real findings, labelled with repo and commit', () => {
    expect(defaultFixture.source).toBe('real')
    expect(defaultFixture.label).toMatch(/titan-design/)
    expect(defaultFixture.label).toMatch(/028e30b1/)
    expect(defaultFixture.rows).toHaveLength(60)
    expect(defaultFixture.total).toBe(60)
  })

  it('keeps the recorded facets literally', () => {
    expect(defaultFixture.facets).toEqual({
      rule: { 'max-cyclomatic-per-function': 3, 'max-file-loc': 57 },
      severity: { error: 60 },
      tool: { check: 60 },
      provenance: { derived: 60 },
      kind: { file: 60 },
      child: { 'packages/': 60 },
    })
  })

  it('ids every row by rule and path', () => {
    for (const row of defaultFixture.rows) expect(row.id).toBe(`${row.rule}|${row.node.path}`)
  })
})

describe('scale fixtures', () => {
  it('Very large has 10,000 rows', () => {
    const fixture = byName('Very large')
    expect(fixture.rows).toHaveLength(10000)
    expect(fixture.total).toBe(10000)
  })

  it('builds the same synthetic findings on every call', () => {
    expect(buildSyntheticFindings(10000).map((r) => r.id)).toEqual(ids(byName('Very large')))
    expect(buildSyntheticFindings(200)).toEqual(buildSyntheticFindings(200))
  })

  it('Sparse window loads rows 0 to 499 of 10,000, with facets over all 10,000', () => {
    const sparse = byName('Sparse window')
    const veryLarge = byName('Very large')
    expect(sparse.total).toBe(10000)
    expect(sparse.loaded).toEqual({ start: 0, end: 500 })
    expect(ids(sparse)).toEqual(ids(veryLarge).slice(0, 500))
    expect(sparse.facets).toEqual(veryLarge.facets)
  })
})

describe('state fixtures', () => {
  it('Filtered empty has rows that its filters reduce to none', () => {
    const fixture = byName('Filtered empty')
    expect(fixture.rows.length).toBeGreaterThan(0)
    expect(applyFilters(fixture.rows, fixture.filters ?? {})).toHaveLength(0)
  })

  it('Null cells has a row with no measure, a destination and a three-part id', () => {
    const nulls = byName('Null cells').rows.filter((r) => r.excess === null)
    expect(nulls).toHaveLength(1)
    expect(nulls[0].value).toBeUndefined()
    expect(nulls[0].destination).toBeTruthy()
    expect(nulls[0].id.split('|')).toHaveLength(3)
  })

  it('Missing baseline has no status and says why', () => {
    const fixture = byName('Missing baseline')
    expect(fixture.rows.every((r) => r.status === undefined)).toBe(true)
    expect(fixture.unavailable?.status).toBeTruthy()
  })

  it('Baseline covers all five statuses', () => {
    const statuses = new Set(byName('Baseline').rows.map((r) => r.status))
    expect([...statuses].sort()).toEqual(['carryover', 'improved', 'new', 'resolved', 'worsened'])
  })

  it('Long content has a path of at least 60 characters and a 200-character message', () => {
    const { rows } = byName('Long content')
    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row.node.path.length).toBeGreaterThanOrEqual(60)
    expect(row.message).toHaveLength(200)
  })
})

describe('Hostile', () => {
  const { rows, facets, filters, rowCountSequence } = hostileFixture
  const facetValues = Object.values(facets).flatMap((counts) => Object.keys(counts))

  it('repeats an id', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBeLessThan(rows.length)
  })

  it('has a zero facet count and a facet value no row carries', () => {
    expect(Object.values(facets).flatMap((counts) => Object.values(counts))).toContain(0)
    expect(facets.rule).toHaveProperty('rule-with-no-rows')
    expect(rows.some((r) => r.rule === 'rule-with-no-rows')).toBe(false)
  })

  it('filters on a value the facets do not list', () => {
    const filtered = Object.values(filters ?? {}).flat()
    expect(filtered.some((value) => !facetValues.includes(value))).toBe(true)
  })

  it('has non-finite excess and a row count that shrinks', () => {
    const excess = rows.map((r) => r.excess)
    expect(excess).toContain(Number.POSITIVE_INFINITY)
    expect(excess.some((e) => Number.isNaN(e))).toBe(true)
    expect(rowCountSequence?.[1]).toBeLessThan(rowCountSequence?.[0] ?? 0)
  })
})
