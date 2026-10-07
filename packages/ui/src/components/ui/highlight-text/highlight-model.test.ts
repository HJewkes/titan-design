import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { toSegments } from './highlight-model'

const range = fc.record({
  start: fc.integer({ min: -20, max: 60 }),
  end: fc.integer({ min: -20, max: 60 }),
})
const ranges = fc.array(range, { maxLength: 8 })

describe('toSegments properties', () => {
  it('concatenates back to the input text for any text and ranges', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), ranges, (text, rs) => {
        expect(
          toSegments(text, rs)
            .map((s) => s.text)
            .join('')
        ).toBe(text)
      })
    )
  })

  it('never leaves two match segments adjacent', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), ranges, (text, rs) => {
        const segments = toSegments(text, rs)
        segments.slice(1).forEach((s, i) => {
          expect(s.isMatch && segments[i].isMatch).toBe(false)
        })
      })
    )
  })

  it('never emits an empty match segment', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), ranges, (text, rs) => {
        toSegments(text, rs).forEach((s) => {
          if (s.isMatch) expect(s.text.length).toBeGreaterThan(0)
        })
      })
    )
  })
})

describe('toSegments', () => {
  it('yields one non-match segment for no ranges', () => {
    expect(toSegments('hello', [])).toEqual([{ text: 'hello', isMatch: false }])
  })

  it('does not throw on out-of-bounds or inverted ranges', () => {
    expect(() =>
      toSegments('hello', [
        { start: -5, end: 99 },
        { start: 4, end: 1 },
      ])
    ).not.toThrow()
  })

  it('merges overlapping and adjacent ranges into one match', () => {
    expect(
      toSegments('abcdefg', [
        { start: 3, end: 5 },
        { start: 0, end: 2 },
        { start: 2, end: 4 },
      ])
    ).toEqual([
      { text: 'abcde', isMatch: true },
      { text: 'fg', isMatch: false },
    ])
  })
})
