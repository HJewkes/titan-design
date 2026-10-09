import fc from 'fast-check'
import { describe, expect, it, vi } from 'vitest'
import { fcAssert } from '../../../test/property'
import { realFixtures, syntheticFixtures, type SourceExcerpt } from './fixtures'
import {
  buildLineModel,
  contentWidth,
  expandTabs,
  gutterDigits,
  highlightSummary,
  normalizeRanges,
  rangeEdges,
  rangesByLine,
  scrollIndexFor,
  splitLines,
} from './lineModel'
import type { LineRange } from './types'

const silent = () => {}
const singleLine = fc.string({ minLength: 1 }).filter((s) => !/[\r\n]/.test(s) && s[0] !== '﻿')
const multiLine = fc
  .array(fc.constantFrom('a', ' ', '\t', '\r', '\n', '\r\n'))
  .map((parts) => parts.join(''))
const window = fc
  .tuple(fc.integer({ min: 1, max: 200 }), fc.integer({ min: 0, max: 100 }))
  .map(([first, span]) => ({ first, last: first + span }))
const lineRange = fc
  .tuple(fc.integer({ min: -50, max: 400 }), fc.integer({ min: 0, max: 80 }))
  .map(([startLine, span]): LineRange => ({ startLine, endLine: startLine + span }))

describe('splitLines', () => {
  it('counts the lines of a join as the sum of its parts', () => {
    fcAssert(
      fc.property(singleLine, singleLine, (a, b) => {
        expect(splitLines(`${a}\n${b}`)).toHaveLength(splitLines(a).length + splitLines(b).length)
      })
    )
  })

  it('round-trips to the text with line breaks normalized and one trailing break dropped', () => {
    fcAssert(
      fc.property(multiLine, (text) => {
        const expected = text.replace(/\r\n|\r/g, '\n').replace(/\n$/, '')
        expect(splitLines(text).join('\n')).toBe(expected)
      })
    )
  })

  it('numbers lines like an editor and paints no CR or BOM', () => {
    expect(splitLines('')).toEqual([])
    expect(splitLines('a\nb\n')).toEqual(['a', 'b'])
    expect(splitLines('a\r\nb\r\n')).toEqual(['a', 'b'])
    expect(splitLines('a\rb')).toEqual(['a', 'b'])
    expect(splitLines('﻿a\n\nb')).toEqual(['a', '', 'b'])
  })
})

describe('normalizeRanges', () => {
  it('keeps every run inside the window, ordered and apart', () => {
    fcAssert(
      fc.property(fc.array(lineRange), window, (ranges, { first, last }) => {
        const runs = normalizeRanges(ranges, first, last, silent)
        runs.forEach((run, i) => {
          expect(first <= run.startLine && run.startLine <= run.endLine).toBe(true)
          expect(run.endLine <= last).toBe(true)
          if (i > 0) expect(run.startLine).toBeGreaterThan(runs[i - 1].endLine)
        })
      })
    )
  })

  it('maps a line to a run exactly when the run covers it', () => {
    fcAssert(
      fc.property(fc.array(lineRange), window, (ranges, { first, last }) => {
        const runs = normalizeRanges(ranges, first, last, silent)
        const byLine = rangesByLine(runs)
        for (let line = first - 1; line <= last + 1; line++) {
          const covering = runs.findIndex((r) => r.startLine <= line && line <= r.endLine)
          expect(byLine.get(line)).toBe(covering === -1 ? undefined : covering)
        }
      })
    )
  })

  it('covers exactly the input lines that fall inside the window', () => {
    fcAssert(
      fc.property(fc.array(lineRange), window, (ranges, { first, last }) => {
        const expected = new Set<number>()
        for (const { startLine, endLine } of ranges) {
          for (let line = Math.max(startLine, first); line <= Math.min(endLine, last); line++) {
            expected.add(line)
          }
        }
        const covered = rangesByLine(normalizeRanges(ranges, first, last, silent))
        expect([...covered.keys()].sort((a, b) => a - b)).toEqual(
          [...expected].sort((a, b) => a - b)
        )
      })
    )
  })

  it('changes nothing when it normalizes its own output', () => {
    fcAssert(
      fc.property(fc.array(lineRange), window, (ranges, { first, last }) => {
        const once = normalizeRanges(ranges, first, last, silent)
        const twice = normalizeRanges(once, first, last, silent)
        const spans = (runs: typeof once) => runs.map((r) => [r.startLine, r.endLine])
        expect(spans(twice)).toEqual(spans(once))
      })
    )
  })

  it('drops an inverted span with a warning instead of swapping it', () => {
    const warn = vi.fn()
    expect(normalizeRanges([{ startLine: 12, endLine: 8 }], 1, 20, warn)).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('12 to 8'))
  })

  it('drops a range wholly outside and clips one partly outside', () => {
    const ranges = [
      { startLine: 50, endLine: 60 },
      { startLine: 18, endLine: 40 },
      { startLine: -3, endLine: 2 },
    ]
    expect(normalizeRanges(ranges, 1, 20, silent)).toEqual([
      { startLine: 1, endLine: 2, labels: [] },
      { startLine: 18, endLine: 20, labels: [] },
    ])
  })

  it('merges overlapping and nested ranges and keeps both labels', () => {
    const overlapping = [
      { startLine: 6, endLine: 12, label: 'b' },
      { startLine: 3, endLine: 8, label: 'a' },
    ]
    expect(normalizeRanges(overlapping, 1, 30, silent)).toEqual([
      { startLine: 3, endLine: 12, labels: ['a', 'b'] },
    ])
    const nested = [
      { startLine: 2, endLine: 20, label: 'outer' },
      { startLine: 5, endLine: 6, label: 'inner' },
    ]
    expect(normalizeRanges(nested, 1, 20, silent)).toEqual([
      { startLine: 2, endLine: 20, labels: ['outer', 'inner'] },
    ])
  })

  it('drops non-integer and non-finite ends without a warning', () => {
    const warn = vi.fn()
    expect(normalizeRanges([{ startLine: 1.5, endLine: Number.NaN }], 1, 5, warn)).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('gutter, edges and scroll index', () => {
  it('sizes the gutter from the last line number', () => {
    expect(gutterDigits(9)).toBe(1)
    expect(gutterDigits(10)).toBe(2)
    expect(gutterDigits(4999 + 4321)).toBe(4)
    expect(gutterDigits(10000)).toBe(5)
    expect(gutterDigits(99996 + 9)).toBe(6)
  })

  it('gives a five-digit gutter to 5,000 lines starting at 9,321', () => {
    const text = Array.from({ length: 5000 }, (_, i) => `l${i}`).join('\n')
    const model = buildLineModel({ text, startLine: 9321 }, silent)
    expect(model.lastLine).toBe(14320)
    expect(model.gutterDigits).toBe(5)
  })

  it('offsets the scroll index by the start line and clamps outside the span', () => {
    expect(scrollIndexFor(120 + 7, 120, 40)).toBe(7)
    expect(scrollIndexFor(120, 120, 40)).toBe(0)
    expect(scrollIndexFor(3, 120, 40)).toBe(0)
    expect(scrollIndexFor(999, 120, 40)).toBe(39)
  })

  it('caps a one-line run as single and a longer run as first, middle and last', () => {
    const runs = [
      { startLine: 4, endLine: 4, labels: [] },
      { startLine: 8, endLine: 10, labels: [] },
    ]
    expect(rangeEdges(4, runs)).toBe('single')
    expect([8, 9, 10].map((line) => rangeEdges(line, runs))).toEqual(['first', 'middle', 'last'])
    expect(rangeEdges(5, runs)).toBeNull()
  })

  it('clamps a start line below 1 to 1 with a warning', () => {
    const warn = vi.fn()
    expect(buildLineModel({ text: 'a', startLine: 0 }, warn).startLine).toBe(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('startLine 0'))
  })
})

describe('fixtures through the line model', () => {
  const all: Record<string, SourceExcerpt> = { ...realFixtures, ...syntheticFixtures }

  it.each(Object.entries(all))('%s lands every run inside its rows', (_, fx) => {
    const model = buildLineModel(fx, silent)
    for (const run of model.runs) {
      expect(run.startLine).toBeGreaterThanOrEqual(model.startLine)
      expect(run.endLine).toBeLessThanOrEqual(model.lastLine)
    }
  })

  it.each(Object.entries(realFixtures))('%s keeps its rows and highlights intact', (_, fx) => {
    const model = buildLineModel(fx, silent)
    expect([model.startLine, model.lastLine]).toEqual([fx.startLine, fx.endLine])
    for (const span of fx.highlights) {
      for (let line = span.startLine; line <= span.endLine; line++) {
        expect(model.runByLine.has(line)).toBe(true)
      }
    }
  })

  it('applies the contract outcome of each degenerate fixture', () => {
    const rowsAndRuns = (fx: SourceExcerpt) => {
      const model = buildLineModel(fx, silent)
      return [model.lines.length, model.runs.map((r) => [r.startLine, r.endLine])]
    }
    expect(rowsAndRuns(syntheticFixtures.trailingNewline)).toEqual([2, []])
    expect(rowsAndRuns(syntheticFixtures.rangePastEof)).toEqual([20, [[18, 20]]])
    expect(rowsAndRuns(syntheticFixtures.rangeOutside)).toEqual([20, []])
    expect(rowsAndRuns(syntheticFixtures.invertedRange)).toEqual([20, []])
    expect(rowsAndRuns(syntheticFixtures.allLinesHighlighted)).toEqual([20, [[1, 20]]])
    expect(rowsAndRuns(syntheticFixtures.endLineMismatch)).toEqual([25, []])
  })

  it('warns with both numbers when endLine disagrees with the text, and the text wins', () => {
    const warn = vi.fn()
    const model = buildLineModel(syntheticFixtures.endLineMismatch, warn)
    expect(model.lastLine).toBe(25)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/endLine 30\b.*\bline 25\b/))
  })

  it.each(Object.entries(realFixtures))('%s matches its endLine without a warning', (_, fx) => {
    const warn = vi.fn()
    buildLineModel(fx, warn)
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('tabs and content width', () => {
  const tabbed = fc.array(fc.constantFrom('a', ' ', '\t', '\u4f60')).map((parts) => parts.join(''))

  it('expands each tab to the next tab stop', () => {
    expect(expandTabs('\tindented')).toBe('    indented')
    expect(expandTabs('mid\tline')).toBe('mid line')
    expect(expandTabs('ab\tc', 2)).toBe('ab  c')
    expect(expandTabs('a\tb', 8)).toBe('a       b')
    expect(expandTabs('no tabs')).toBe('no tabs')
  })

  it('falls back to four columns for a tab size that is not a positive integer', () => {
    expect(expandTabs('\tx', 0)).toBe('    x')
    expect(expandTabs('\tx', Number.NaN)).toBe('    x')
  })

  it('leaves no tab, keeps every other character, and ends each tab on a stop', () => {
    fcAssert(
      fc.property(tabbed, fc.integer({ min: 1, max: 8 }), (line, tabSize) => {
        const expanded = expandTabs(line, tabSize)
        expect(expanded).not.toContain('\t')
        expect(expanded.replace(/ /g, '')).toBe(line.replace(/[ \t]/g, ''))
        const prefixBeforeLastTab = line.slice(0, line.lastIndexOf('\t') + 1)
        expect([...expandTabs(prefixBeforeLastTab, tabSize)].length % tabSize).toBe(0)
      })
    )
  })

  it('measures the longest line in columns, tabs expanded and a code point as one', () => {
    expect(contentWidth([], 7)).toBe(0)
    expect(contentWidth(['ab', 'abcd', 'a'], 7)).toBe(28)
    expect(contentWidth(['\tx'], 10)).toBe(50)
    expect(contentWidth(['\tx'], 10, 2)).toBe(30)
    expect(contentWidth(['\u{1f600}\u{1f680}'], 10)).toBe(20)
  })

  it('agrees with the expanded text for every line', () => {
    fcAssert(
      fc.property(fc.array(tabbed), fc.integer({ min: 1, max: 8 }), (lines, tabSize) => {
        const longest = Math.max(0, ...lines.map((line) => [...expandTabs(line, tabSize)].length))
        expect(contentWidth(lines, 1, tabSize)).toBe(longest)
      })
    )
  })
})

describe('highlightSummary', () => {
  it('says nothing when no line is flagged', () => {
    expect(highlightSummary([])).toBeNull()
  })

  it('names one run per merged range, a single line in the singular, with its labels', () => {
    const runs = normalizeRanges(
      [
        { startLine: 3, endLine: 8, label: 'long function' },
        { startLine: 6, endLine: 12, label: 'deep nesting' },
        { startLine: 27, endLine: 27 },
      ],
      1,
      30,
      silent
    )
    expect(highlightSummary(runs)).toBe(
      'Flagged: lines 3 to 12 (long function, deep nesting), line 27'
    )
  })
})
