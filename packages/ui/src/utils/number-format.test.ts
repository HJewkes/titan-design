import { describe, it, expect } from 'vitest'
import { formatTenths, formatBytes, formatTrimmedDecimal } from './number-format'

describe('formatTrimmedDecimal', () => {
  it('renders an integer bare', () => {
    expect(formatTrimmedDecimal(82, 1)).toBe('82')
    expect(formatTrimmedDecimal(0, 2)).toBe('0')
  })

  it('renders a non-integer to the requested decimal places', () => {
    expect(formatTrimmedDecimal(1.234, 1)).toBe('1.2')
    expect(formatTrimmedDecimal(0.5, 2)).toBe('0.50')
  })
})

describe('formatTenths', () => {
  it('always shows one decimal place, signed when negative', () => {
    expect(formatTenths(1.5)).toBe('1.5')
    expect(formatTenths(0)).toBe('0.0')
    expect(formatTenths(-0.6)).toBe('-0.6')
  })
})

describe('formatBytes', () => {
  it('scales to the largest unit that keeps the value above one', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 kB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2 MB')
  })

  it('reads a negative, zero or non-finite count as zero', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-1)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
  })
})
