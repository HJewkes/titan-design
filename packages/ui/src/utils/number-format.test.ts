import { describe, it, expect } from 'vitest'
import { formatTrimmedDecimal } from './number-format'

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
