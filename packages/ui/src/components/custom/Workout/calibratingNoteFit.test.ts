import { describe, expect, it } from 'vitest'
import {
  collides,
  ellipsize,
  fitNote,
  marksAlong,
  textWidth,
  wrapWords,
} from './calibratingNoteFit'

const FONT = 11

describe('textWidth', () => {
  it('grows with the text and weighs wide letters over narrow ones', () => {
    expect(textWidth('', FONT)).toBe(0)
    expect(textWidth('ab', FONT)).toBeGreaterThan(textWidth('a', FONT))
    expect(textWidth('mmmm', FONT)).toBeGreaterThan(textWidth('iiii', FONT))
  })
})

describe('wrapWords', () => {
  it('keeps a note that fits on one line whole', () => {
    expect(wrapWords('No band yet', 200, FONT, 2)).toEqual(['No band yet'])
  })

  it('breaks between words, never inside one', () => {
    const lines = wrapWords('1 more comparable session and more working sets', 160, FONT, 2)
    expect(lines).toHaveLength(2)
    expect(lines?.join(' ')).toBe('1 more comparable session and more working sets')
    for (const line of lines ?? []) expect(textWidth(line, FONT)).toBeLessThanOrEqual(160)
  })

  it('gives up when the words need more lines than allowed or one word is wider than a line', () => {
    expect(wrapWords('one two three four five six seven', 40, FONT, 2)).toBeNull()
    expect(wrapWords('Supercalifragilistic', 40, FONT, 2)).toBeNull()
  })
})

describe('fitNote', () => {
  it('wraps when two lines hold the note', () => {
    const lines = fitNote('1 more comparable session', 130, FONT)
    expect(lines).toHaveLength(2)
    expect(lines.join(' ')).toBe('1 more comparable session')
  })

  it('ends the second line in an ellipsis when two lines are not enough', () => {
    const lines = fitNote('one two three four five six seven eight nine ten', 60, FONT)
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
    for (const line of lines) expect(textWidth(line, FONT)).toBeLessThanOrEqual(60)
  })

  it('cuts one unbroken token to a single line', () => {
    const [line, ...rest] = fitNote('x'.repeat(200), 60, FONT)
    expect(rest).toEqual([])
    expect(line.endsWith('…')).toBe(true)
    expect(textWidth(line, FONT)).toBeLessThanOrEqual(60)
  })
})

describe('ellipsize', () => {
  it('leaves a fitting text alone', () => {
    expect(ellipsize('short', 100, FONT)).toBe('short')
  })
})

describe('collides', () => {
  const rect = { left: 10, right: 50, top: 10, bottom: 20 }

  it('finds a mark whose circle reaches the rectangle', () => {
    expect(collides(rect, [{ x: 55, y: 15, radius: 8 }])).toBe(true)
    expect(collides(rect, [{ x: 70, y: 15, radius: 8 }])).toBe(false)
  })

  it('finds the line between two readings, not only the readings', () => {
    const line = marksAlong(
      [
        { x: 0, y: 15 },
        { x: 100, y: 15 },
      ],
      8,
      4
    )
    expect(collides(rect, line)).toBe(true)
  })
})
