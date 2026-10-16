import { describe, expect, it } from 'vitest'
import {
  FIRST_USE,
  MATRIX_WIDTHS,
  STRESS_COPY_WORD_BUDGET,
  STRESS_NUMBERS,
  STRESS_STRINGS,
} from './stress'

const words = (text: string) => text.trim().split(/\s+/)

const isAscending = (values: readonly number[]) =>
  values.every((value, index) => index === 0 || value > values[index - 1])

describe('STRESS_STRINGS', () => {
  const { S1, S2, S3, S4, S5 } = STRESS_STRINGS

  it('orders S-1, S-2 and S-3 from shortest to longest', () => {
    expect(words(S1)).toHaveLength(1)
    expect(S1.length).toBeLessThan(S2.length)
    expect(S2.length).toBeLessThan(S3.length)
  })

  it('makes S-3 a multi-word label of 40 to 50 characters', () => {
    expect(S3.length).toBeGreaterThanOrEqual(40)
    expect(S3.length).toBeLessThanOrEqual(50)
    expect(words(S3).length).toBeGreaterThan(1)
  })

  it('makes S-4 a single token of 30 or more characters with no whitespace', () => {
    expect(S4.length).toBeGreaterThanOrEqual(30)
    expect(S4).not.toMatch(/\s/)
  })

  it('makes S-5 exactly one word over the copy budget', () => {
    expect(words(S5)).toHaveLength(STRESS_COPY_WORD_BUDGET + 1)
  })
})

describe('STRESS_NUMBERS', () => {
  const { N1, N2, N3, N4, N5, N6 } = STRESS_NUMBERS

  it('covers zero, singular and plural in N-1', () => {
    expect(N1).toEqual([0, 1, 2])
  })

  it('steps N-2 through every digit count from one to five', () => {
    expect(isAscending(N2)).toBe(true)
    const digitCounts = new Set(N2.map((value) => String(value).length))
    expect(digitCounts).toEqual(new Set([1, 2, 3, 4, 5]))
  })

  it('crosses the minute and hour boundaries in N-3', () => {
    expect(isAscending(N3)).toBe(true)
    expect(N3.every(Number.isInteger)).toBe(true)
    expect(N3).toEqual(expect.arrayContaining([59, 60, 3600]))
  })

  it('mixes negative, zero, positive and fractional deltas in N-4', () => {
    expect(N4.some((value) => value < 0)).toBe(true)
    expect(N4).toContain(0)
    expect(N4.some((value) => value > 0)).toBe(true)
    expect(N4.some((value) => !Number.isInteger(value))).toBe(true)
  })

  it('holds null, undefined and the first-use marker in N-5', () => {
    expect(N5).toContain(null)
    expect(N5).toContain(undefined)
    expect(N5).toContain(FIRST_USE)
  })

  it('pairs a met goal with an exceeded goal in N-6', () => {
    expect(N6.some(({ current, target }) => current === target)).toBe(true)
    expect(N6.some(({ current, target }) => current > target)).toBe(true)
  })
})

describe('MATRIX_WIDTHS', () => {
  it('lists the W-1 widths in ascending order from the 320 floor', () => {
    expect(MATRIX_WIDTHS).toEqual([320, 360, 560, 720, 1280])
    expect(isAscending(MATRIX_WIDTHS)).toBe(true)
  })
})
