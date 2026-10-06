import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../../test/property'
import {
  barFraction,
  buildBarListModel,
  columnChars,
  normalizeMaxRows,
  overflowLabel,
  rankRows,
  resolveMax,
  rowLabel,
  rowTip,
  summarizeBarList,
  type BarListRow,
} from './bar-list-model'
import { hostileFixture, hostileOptionSets } from './fixtures'

const rowsOf = (...values: (number | null)[]): BarListRow[] =>
  values.map((value, i) => ({ id: `r${i}`, label: `Row ${i}`, value }))

const formatters = {
  formatValue: (v: number) => String(v),
  formatSecondary: (v: number) => `s${v}`,
}

describe('barFraction', () => {
  it('is value over max, clamped to 0..1', () => {
    expect(barFraction(25, 100)).toBe(0.25)
    expect(barFraction(250, 100)).toBe(1)
  })

  it('draws fraction 0 for a negative value', () => {
    expect(barFraction(-5, 10)).toBe(0)
  })
})

describe('resolveMax', () => {
  it('ignores null, NaN and Infinity when taking the data maximum', () => {
    expect(resolveMax(rowsOf(3, null, Number.NaN, Number.POSITIVE_INFINITY, 9))).toBe(9)
  })

  it('resolves all-zero rows to 1 so fractions stay 0', () => {
    const model = buildBarListModel(rowsOf(0, 0, 0))
    expect(model.max).toBe(1)
    expect(model.rows.map((r) => r.fraction)).toEqual([0, 0, 0])
  })

  it('falls back to the data maximum for a max of 0, negative or NaN', () => {
    for (const max of [0, -5, Number.NaN]) expect(resolveMax(rowsOf(4, 8), max)).toBe(8)
  })

  it('trusts a finite positive caller max', () => {
    expect(resolveMax(rowsOf(4, 8), 100)).toBe(100)
  })
})

describe('rankRows', () => {
  it('sorts descending and keeps ties in input order', () => {
    const rows = rowsOf(5, 9, 5, 9)
    const { shown } = rankRows(rows, 'descending', 10)
    expect(shown.map((s) => s.row.id)).toEqual(['r1', 'r3', 'r0', 'r2'])
  })

  it('keeps input order and caps the first N for sort none', () => {
    const { shown, hidden } = rankRows(rowsOf(1, 9, 5), 'none', 2)
    expect(shown.map((s) => s.row.id)).toEqual(['r0', 'r1'])
    expect(hidden.map((r) => r.id)).toEqual(['r2'])
  })

  it('sorts missing values last', () => {
    const { shown } = rankRows(rowsOf(null, 1, Number.NaN, 2), 'descending', 10)
    expect(shown.map((s) => s.row.id)).toEqual(['r3', 'r1', 'r0', 'r2'])
  })
})

describe('negative values', () => {
  it('draw fraction 0 and keep their formatted text', () => {
    const model = buildBarListModel(rowsOf(-5, 10))
    const negative = model.rows.find((r) => r.row.value === -5)
    expect(negative?.fraction).toBe(0)
    const { row, rank } = negative!
    expect(rowLabel({ row, rank, shownCount: 2, sort: 'descending' }, formatters)).toContain(
      'Row 0: -5'
    )
  })
})

describe('maxRows', () => {
  it('clamps 0, a fraction or a negative to at least one whole row', () => {
    expect(normalizeMaxRows(0)).toBe(1)
    expect(normalizeMaxRows(2.5)).toBe(2)
    expect(normalizeMaxRows(-3)).toBe(1)
    expect(normalizeMaxRows(Number.NaN)).toBe(10)
    expect(normalizeMaxRows(undefined)).toBe(10)
  })
})

describe('buildBarListModel properties', () => {
  const valueArb = fc.oneof(
    fc.double({ min: -1e6, max: 1e6 }),
    fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
    fc.constant(null),
    fc.integer({ min: -50, max: 1000 })
  )
  const rowsArb = fc.array(valueArb, { maxLength: 60 }).map((values) => rowsOf(...values))

  it('shown rows plus hidden count equals input count, and the sums add up', () => {
    fcAssert(
      fc.property(rowsArb, fc.integer({ min: 0, max: 30 }), (rows, maxRows) => {
        const model = buildBarListModel(rows, { maxRows })
        const finite = (v: number | null) => (v !== null && Number.isFinite(v) ? v : 0)
        const shownSum = model.rows.reduce((s, r) => s + finite(r.row.value), 0)
        const total = rows.reduce((s, r) => s + finite(r.value), 0)
        expect(model.shownCount + model.hiddenCount).toBe(rows.length)
        expect(shownSum + model.hiddenTotal).toBeCloseTo(total, 3)
      })
    )
  })

  it('never increases down a descending list', () => {
    fcAssert(
      fc.property(rowsArb, (rows) => {
        const values = rankRows(rows, 'descending', 1000).shown.map((s) =>
          s.row.value !== null && Number.isFinite(s.row.value) ? s.row.value : -Infinity
        )
        for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThanOrEqual(values[i - 1])
      })
    )
  })

  it('never throws and keeps every fraction in 0..1 for any rows, max and maxRows', () => {
    fcAssert(
      fc.property(rowsArb, fc.double(), fc.double(), (rows, max, maxRows) => {
        const model = buildBarListModel(rows, { max, maxRows })
        for (const r of model.rows) {
          expect(r.fraction).toBeGreaterThanOrEqual(0)
          expect(r.fraction).toBeLessThanOrEqual(1)
        }
        expect(() => summarizeBarList(model)).not.toThrow()
      })
    )
  })

  it('survives the hostile fixture under every hostile option set', () => {
    for (const options of hostileOptionSets) {
      const model = buildBarListModel(hostileFixture.rows, options)
      expect(model.rows.length).toBeGreaterThanOrEqual(1)
      expect(model.rows.every((r) => r.fraction >= 0 && r.fraction <= 1)).toBe(true)
    }
  })
})

describe('summarizeBarList', () => {
  it('names the shown count, the hidden count and the largest row', () => {
    const rows = [{ id: 'a', label: 'Alpha', value: 90 }, ...rowsOf(5, 4, 3)]
    const summary = summarizeBarList(buildBarListModel(rows, { maxRows: 2 }))
    expect(summary).toContain('Top 2 of 4 items')
    expect(summary).toContain('Largest: Alpha, 90')
    expect(summary).toContain('2 more not shown')
  })

  it("formats the hidden total with the caller's formatValue, called without a row", () => {
    const formatValue = (value: number, row?: BarListRow) =>
      row ? `${value} calls` : `${value} calls in all`
    const model = buildBarListModel(rowsOf(90, 5, 4, 3), { maxRows: 2, formatValue })
    expect(model.hiddenTotalText).toBe('7 calls in all')
    expect(overflowLabel(model)).toBe('2 more · 7 calls in all')
    expect(summarizeBarList(model)).toContain('2 more not shown, totalling 7 calls in all.')
  })

  it('claims no ranking for one row', () => {
    const summary = summarizeBarList(buildBarListModel(rowsOf(58)))
    expect(summary).toBe('1 item: Row 0, 58.')
    expect(summary).not.toMatch(/top|largest/i)
  })

  it('gives the empty sentence for no rows', () => {
    expect(summarizeBarList(buildBarListModel([]))).toBe('No data.')
  })

  it('says in order, not by value, for sort none', () => {
    expect(summarizeBarList(buildBarListModel(rowsOf(1, 2, 3), { sort: 'none' }))).toBe(
      'First 3 of 3 items, in order.'
    )
  })
})

describe('rowLabel', () => {
  it('holds label, value, secondary, flag and rank, omitting absent parts', () => {
    const row: BarListRow = {
      id: 'x',
      label: 'Parser',
      value: 9,
      secondaryValue: 4,
      flag: { tone: 'error', label: 'over 5%' },
    }
    expect(rowLabel({ row, rank: 1, shownCount: 3, sort: 'descending' }, formatters)).toBe(
      'Parser: 9, s4, over 5%, rank 1 of 3'
    )
    const bare: BarListRow = { id: 'y', label: 'Bare', value: null }
    expect(rowLabel({ row: bare, rank: 2, shownCount: 3, sort: 'descending' }, formatters)).toBe(
      'Bare: No value, rank 2 of 3'
    )
  })

  it('claims no rank when the list keeps input order', () => {
    const row: BarListRow = { id: 's', label: 'Signed up', value: 82 }
    expect(rowLabel({ row, rank: 2, shownCount: 5, sort: 'none' }, formatters)).toBe(
      'Signed up: 82'
    )
  })
})

describe('columnChars', () => {
  const flaggedRow: BarListRow = {
    id: 'f',
    label: 'Flagged',
    value: 1234,
    secondaryValue: 7,
    flag: { tone: 'error', label: 'over 5%' },
  }

  it('measures each trailing cell by its widest text among the shown rows', () => {
    const model = buildBarListModel([flaggedRow, ...rowsOf(5, null)], { ...formatters })
    expect(model.columnChars).toEqual({
      value: 'No value'.length,
      secondary: 's7'.length,
      flag: 'over 5%'.length,
    })
  })

  it('gives a part no shown row has a width of 0', () => {
    expect(columnChars(buildBarListModel(rowsOf(1, 22)).rows, formatters)).toEqual({
      value: 2,
      secondary: 0,
      flag: 0,
    })
  })

  it('measures only the shown rows, not the ones past the cap', () => {
    const model = buildBarListModel([...rowsOf(9, 8), flaggedRow], { maxRows: 2, sort: 'none' })
    expect(model.columnChars.flag).toBe(0)
  })
})

describe('rowTip', () => {
  it('pairs the label with the formatted value and ends with the flag label', () => {
    const row: BarListRow = {
      id: 'p',
      label: 'Parser',
      value: 9.1,
      secondaryValue: 4,
      flag: { tone: 'error', label: 'over 5%' },
    }
    expect(rowTip(row, (v) => `${v}%`)).toEqual({
      label: 'Parser',
      valueText: '9.1%',
      flagLabel: 'over 5%',
    })
  })

  it('has no flag line for an unflagged row and names a missing value', () => {
    expect(rowTip({ id: 'b', label: 'Bare', value: null }, String)).toEqual({
      label: 'Bare',
      valueText: 'No value',
      flagLabel: null,
    })
  })

  it('hands the formatter the row, so a per-row format applies in the tip', () => {
    const row: BarListRow = { id: 'r', label: 'Row', value: 3 }
    const formatValue = (value: number, forRow?: BarListRow) => `${value} ${forRow?.id ?? 'none'}`
    expect(rowTip(row, formatValue).valueText).toBe('3 r')
  })
})
