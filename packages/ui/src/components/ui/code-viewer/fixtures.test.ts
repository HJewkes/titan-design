import { describe, expect, it } from 'vitest'
import {
  FIXTURE_SHA,
  endLineMismatch,
  missingSource,
  realFixtures,
  syntheticFixtures,
  type SourceExcerpt,
} from './fixtures'

const EXCERPT_LINE_CAP = 80
// One trailing terminator adds no line, matching editor numbering (contract section 1).
const lineCount = (text: string): number =>
  text.replace(/(\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/).length
const DELIBERATELY_BAD = new Set(['endLineMismatch', 'badNumbers', 'invertedRange'])

describe('CodeViewer fixtures: shape', () => {
  it('pins a full commit sha', () => {
    expect(FIXTURE_SHA).toMatch(/^[0-9a-f]{40}$/)
  })

  describe.each(Object.entries(realFixtures))('real fixture %s', (_name, fx: SourceExcerpt) => {
    it('carries a git blob id and a commit origin', () => {
      expect(fx.contentHash).toMatch(/^[0-9a-f]{40}$/)
      expect(fx.origin).toBe('commit')
    })

    it('has an endLine that matches its text and respects the 80-line cap', () => {
      expect(fx.startLine).toBeGreaterThanOrEqual(1)
      expect(fx.endLine).toBe(fx.startLine + lineCount(fx.text) - 1)
      expect(lineCount(fx.text)).toBeLessThanOrEqual(EXCERPT_LINE_CAP)
    })

    it('has no trailing newline and no carriage returns', () => {
      expect(fx.text.endsWith('\n')).toBe(false)
      expect(fx.text).not.toContain('\r')
    })

    it('keeps every highlight inclusive, ordered and inside the window', () => {
      for (const { startLine, endLine } of fx.highlights) {
        expect(Number.isInteger(startLine) && Number.isInteger(endLine)).toBe(true)
        expect(startLine).toBeLessThanOrEqual(endLine)
        expect(startLine).toBeGreaterThanOrEqual(fx.startLine)
        expect(endLine).toBeLessThanOrEqual(fx.endLine)
      }
    })
  })

  it('marks only the clipped Tooltip finding as truncated', () => {
    expect(realFixtures.tooltipLongFunction.truncated).toBe(true)
    expect(realFixtures.tooltipLongFunction.highlights).toEqual([{ startLine: 83, endLine: 157 }])
    expect(realFixtures.proseTwoRanges.truncated).toBe(false)
  })

  it('covers the long-line and non-ASCII cases the real files exist for', () => {
    const longest = Math.max(...realFixtures.longLineReal.text.split('\n').map((l) => l.length))
    expect(longest).toBeGreaterThan(1000)
    expect(realFixtures.unicodeReal.text).toContain('—')
  })

  describe('scale fixtures', () => {
    it('reach 5,000 and 10,000 lines with highlights inside the window', () => {
      const { scale5k, scale10k } = syntheticFixtures
      expect(lineCount(scale5k.text)).toBe(5000)
      expect(lineCount(scale10k.text)).toBe(10000)
      expect(scale5k.highlights.map((h) => h.startLine)).toEqual([10, 2500, 4990])
    })
  })

  describe('degenerate fixtures', () => {
    it('are well-formed except where the name says otherwise', () => {
      for (const [name, fx] of Object.entries(syntheticFixtures)) {
        if (DELIBERATELY_BAD.has(name)) continue
        expect(fx.endLine, name).toBe(fx.startLine + lineCount(fx.text) - 1)
      }
    })

    it('counts a trailing newline and CR variants as the plan says', () => {
      const { trailingNewline, crlf, loneCr, oneLine, empty } = syntheticFixtures
      expect(trailingNewline.text).toBe('a\nb\n')
      expect(trailingNewline.endLine).toBe(2)
      expect(crlf.text).toBe('a\r\nb\r\n')
      expect(loneCr.text).toBe('a\rb')
      expect(oneLine.text).toBe('export {}')
      expect(empty.text).toBe('')
    })

    it('encodes each malformed input the line model must repair', () => {
      const f = syntheticFixtures
      expect(f.rangePastEof.highlights).toEqual([{ startLine: 18, endLine: 40 }])
      expect(f.rangeOutside.highlights).toEqual([{ startLine: 50, endLine: 60 }])
      expect(f.invertedRange.highlights[0]!.endLine).toBeLessThan(
        f.invertedRange.highlights[0]!.startLine
      )
      expect(endLineMismatch.endLine).toBe(30)
      expect(lineCount(endLineMismatch.text)).toBe(25)
      expect(f.badNumbers.startLine).toBe(0)
      expect(Number.isNaN(f.badNumbers.highlights[0]!.endLine)).toBe(true)
      expect(f.bigStartLine.startLine).toBe(99996)
      expect(f.line2000.text).toHaveLength(2000)
      expect(f.line10000.text).toHaveLength(10000)
    })

    it('gives every missing-source value a reason and no excerpt', () => {
      expect(missingSource.map((m) => m.excerptMissing)).toEqual([
        'changed-since-snapshot',
        'not-in-export',
        'no-source',
      ])
      expect(missingSource.every((m) => m.excerpt === null)).toBe(true)
    })
  })
})
