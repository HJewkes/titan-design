// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  DECIMAL_COUNT,
  KINDS,
  NUMERAL_SPACING,
  NUMERIC_ALIGN,
  RULES,
  TABULAR_FIGURES,
  UNGROUPED_DIGITS,
  judge,
  judgeDecimalCount,
  judgeNumeralSpacing,
  judgeNumericAlign,
  judgeTabularFigures,
  judgeUngroupedDigits,
  tableColumns,
} from './numeral-probes.mjs'
import { PROBE_KINDS, PROBE_RULES } from './probe-suite.mjs'

const fonts = { mono: 'Fixture Mono' }
const PROPORTIONAL = { variant: 'normal', spread: 3.5, live: false }

const box = (id, parent, extra = {}) => ({
  id,
  parent,
  selector: `.n${id.replaceAll('.', '-')}`,
  tag: 'div',
  role: null,
  box: [0, 0, 100, 20],
  text: null,
  ...extra,
})
// A text node: proportional figures in a sans face, its right edge at `right`.
const text = (id, parent, full, { right = 100, figures = {}, family = 'Fixture Sans' } = {}) =>
  box(id, parent, {
    text: {
      fontSize: 14,
      family,
      ownText: full.slice(0, 40),
      left: right - 40,
      right,
      figures: /\d/.test(full) ? { ...PROPORTIONAL, full, ...figures } : null,
    },
  })
const layoutOf = (...nodes) => ({ nodes, audit: { concepts: {}, glyphRoles: {} } })

/**
 * A table (0) with a header row (0.0) and one body row per entry of `rows` (0.1, 0.2, ...). Each
 * cell holds one text node; a cell is a string, or `{ full, right, figures }`.
 */
function table(headers, rows, { headerRight = 100 } = {}) {
  const nodes = [box('0', null, { role: 'table' }), box('0.0', '0', { role: 'row' })]
  headers.forEach((h, c) => {
    nodes.push(box(`0.0.${c}`, '0.0', { role: 'columnheader' }))
    nodes.push(text(`0.0.${c}.0`, `0.0.${c}`, h, { right: headerRight }))
  })
  rows.forEach((cells, r) => {
    const rowId = `0.${r + 1}`
    nodes.push(box(rowId, '0', { role: 'row' }))
    cells.forEach((cell, c) => {
      const { full, ...opts } = typeof cell === 'string' ? { full: cell } : cell
      nodes.push(box(`${rowId}.${c}`, rowId, { role: 'cell' }))
      nodes.push(text(`${rowId}.${c}.0`, `${rowId}.${c}`, full, opts))
    })
  })
  return layoutOf(...nodes)
}
const column = (...cells) =>
  table(
    ['Load'],
    cells.map((c) => [c])
  )

describe('numeral probe module contract', () => {
  it('maps each kind to its numerals rule and joins the probe suite', () => {
    expect(RULES).toEqual({
      [TABULAR_FIGURES]: 'DR-TY-04',
      [NUMERAL_SPACING]: 'DR-TY-14',
      [NUMERIC_ALIGN]: 'DR-DD-01',
      [DECIMAL_COUNT]: 'DR-DD-02',
      [UNGROUPED_DIGITS]: 'DR-DD-04',
    })
    expect(PROBE_KINDS).toEqual(expect.arrayContaining([...KINDS]))
    expect(PROBE_RULES).toMatchObject(RULES)
  })

  it('never throws on nodes missing optional fields', () => {
    const bare = { id: '0', parent: null, selector: '.x', role: 'row', text: { fontSize: 8 } }
    expect(() => judge(layoutOf(bare, { id: '1', parent: '0', role: 'cell' }), {})).not.toThrow()
    expect(judge(undefined)).toEqual([])
  })

  it('reads a table into columns with their header and cells', () => {
    const cols = tableColumns(
      table(
        ['Name', 'Load'],
        [
          ['Squat', '100'],
          ['Bench', '80'],
        ]
      )
    )
    expect(cols.map((c) => [c.header.text, c.cells.map((x) => x.text)])).toEqual([
      ['Name', ['Squat', 'Bench']],
      ['Load', ['100', '80']],
    ])
  })
})

describe('tabular-figures', () => {
  it('reports one finding per column of proportional numerals', () => {
    const found = judgeTabularFigures(column('120', '85', '1,040'), { fonts })
    expect(found).toEqual([
      {
        kind: TABULAR_FIGURES,
        selector: '.n0-1-0-0',
        detail:
          '3 numerals "120" in a table column use proportional figures: "0000" and "1111" differ by 3.5px (limit 0.5px), no tabular-nums',
      },
    ])
  })

  it('passes a column that declares tabular-nums', () => {
    const tnum = { figures: { variant: 'tabular-nums' } }
    expect(
      judgeTabularFigures(column({ full: '120', ...tnum }, { full: '85', ...tnum }), { fonts })
    ).toEqual([])
  })

  it('passes a face whose default figures measure within 0.5px', () => {
    const even = { figures: { spread: 0.25 } }
    expect(judgeTabularFigures(column({ full: '120', ...even }), { fonts })).toEqual([])
  })

  it('passes numerals set in the mono face', () => {
    expect(judgeTabularFigures(column({ full: '120', family: 'Fixture Mono' }), { fonts })).toEqual(
      []
    )
  })

  it('reports a live-region number with proportional figures', () => {
    const live = text('0.0', '0', '01:45', { figures: { live: true } })
    const found = judgeTabularFigures(layoutOf(box('0', null), live), { fonts })
    expect(found.map((f) => [f.kind, f.detail])).toEqual([
      [
        TABULAR_FIGURES,
        'numeral "01:45" in a live region uses proportional figures: "0000" and "1111" differ by 3.5px (limit 0.5px), no tabular-nums',
      ],
    ])
  })

  it('leaves a static number outside tables and live regions alone', () => {
    expect(
      judgeTabularFigures(layoutOf(box('0', null), text('0.0', '0', '3 sets')), { fonts })
    ).toEqual([])
  })
})

describe('numeral-spacing', () => {
  const spaced = (full) => judgeNumeralSpacing(layoutOf(text('0', null, full)))

  it.each(['85 %', '3 ×', '2 x3', '90 s rest', '250 ms'])('reports "%s"', (full) => {
    expect(spaced(full).map((f) => f.kind)).toEqual([NUMERAL_SPACING])
  })

  it.each(['85%', '3×', '90s rest', '250ms', '5 sets', '12 kg', '3 x 10'])(
    'passes "%s"',
    (full) => {
      expect(spaced(full)).toEqual([])
    }
  )

  it('names the spaced pair and the text', () => {
    expect(spaced('Effort 85 %')[0].detail).toBe('"85 %" has a space before "%" in "Effort 85 %"')
  })
})

describe('numeric-align', () => {
  it('passes a right-aligned numeric column under a right-aligned header', () => {
    expect(
      judgeNumericAlign(column({ full: '120', right: 100 }, { full: '85', right: 100.5 }))
    ).toEqual([])
  })

  it('reports numeric cells whose right edges spread over 1px', () => {
    const found = judgeNumericAlign(column({ full: '120', right: 60 }, { full: '85', right: 52 }))
    expect(found).toEqual([
      {
        kind: NUMERIC_ALIGN,
        selector: '.n0-1-0',
        detail: 'numeric column right edges spread 8px (limit 1px)',
      },
    ])
  })

  it('reports a header that ends away from its right-aligned column', () => {
    const layout = table(['Load'], [[{ full: '120' }], [{ full: '85' }]], { headerRight: 40 })
    expect(judgeNumericAlign(layout).map((f) => [f.selector, f.detail])).toEqual([
      ['.n0-0-0', 'header right edge is 60px from its right-aligned numeric column (limit 1px)'],
    ])
  })

  it('counts a sort icon after the header text as its right edge', () => {
    const layout = table(['Load'], [['120'], ['85']], { headerRight: 84 })
    layout.nodes.push(box('0.0.0.1', '0.0.0', { tag: 'svg', box: [84, 0, 16, 16] }))
    expect(judgeNumericAlign(layout)).toEqual([])
  })

  it('ignores a column of names, whose ragged right edge is expected', () => {
    expect(
      judgeNumericAlign(column({ full: 'Squat', right: 60 }, { full: 'Bench press', right: 90 }))
    ).toEqual([])
  })
})

describe('decimal-count', () => {
  it('reports a column mixing decimal places', () => {
    expect(judgeDecimalCount(column('72.5', '80', '81.25'))).toEqual([
      {
        kind: DECIMAL_COUNT,
        selector: '.n0-1-0',
        detail: 'numeric column mixes 0, 1, 2 decimal places (limit 1 count)',
      },
    ])
  })

  it('passes a column with one decimal place throughout, units and grouping included', () => {
    expect(judgeDecimalCount(column('72.5 kg', '1,080.0 kg', '$4.5'))).toEqual([])
  })

  it('judges each column on its own', () => {
    const layout = table(
      ['A', 'B'],
      [
        ['1.5', '10'],
        ['2.5', '20'],
      ]
    )
    expect(judgeDecimalCount(layout)).toEqual([])
  })

  it('skips non-numeric cells in the column', () => {
    expect(judgeDecimalCount(column('72.5', '—', 'n/a', '80.0'))).toEqual([])
  })
})

describe('ungrouped-digits', () => {
  const ungrouped = (full) => judgeUngroupedDigits(layoutOf(text('0', null, full)))

  it.each(['12500 kg', 'Total 104000', '12500kg', '-25000'])('reports "%s"', (full) => {
    expect(ungrouped(full).map((f) => f.kind)).toEqual([UNGROUPED_DIGITS])
  })

  it.each([
    '12,500 kg',
    '12.5k',
    '2026',
    'Order #10482',
    'ID-204815',
    '3.14159',
    'v12345abc',
    'SKU12345',
  ])('passes "%s"', (full) => {
    expect(ungrouped(full)).toEqual([])
  })

  it('names the run and its length', () => {
    expect(ungrouped('Volume 104000 kg')[0].detail).toBe(
      '"104000" has 6 ungrouped digits (limit 4)'
    )
  })
})

describe('judge', () => {
  it('runs every numeral probe over one frame', () => {
    const layout = table(
      ['Load'],
      [[{ full: '72.5 %', right: 60 }], [{ full: '104000', right: 52 }]]
    )
    expect(new Set(judge(layout, { fonts }).map((f) => f.kind))).toEqual(
      new Set([TABULAR_FIGURES, NUMERAL_SPACING, NUMERIC_ALIGN, DECIMAL_COUNT, UNGROUPED_DIGITS])
    )
  })
})
