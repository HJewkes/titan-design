import { describe, it, expect } from 'vitest'
import { formatTenths, formatTrimmedDecimal, formatUsd } from './number-format'

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

describe('formatUsd', () => {
  it('renders dollars to the cent with a thousands separator', () => {
    expect(formatUsd(4.81)).toBe('$4.81')
    expect(formatUsd(4812.5)).toBe('$4,812.50')
    expect(formatUsd(0)).toBe('$0.00')
  })

  it('renders a positive amount under a cent as under a cent, not as zero', () => {
    expect(formatUsd(0.004)).toBe('<$0.01')
  })

  it('renders a non-finite amount as the placeholder, never NaN', () => {
    expect(formatUsd(Number.NaN)).toBe('—')
    expect(formatUsd(Number.POSITIVE_INFINITY)).toBe('—')
  })
})
