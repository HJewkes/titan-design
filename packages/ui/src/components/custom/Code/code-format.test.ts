import { describe, it, expect } from 'vitest'
import { pluralize } from './code-format'

describe('pluralize', () => {
  it('uses the singular for exactly one', () => {
    expect(pluralize(1, 'file', 'files')).toBe('1 file')
  })

  it('uses the plural for zero and for many', () => {
    expect(pluralize(0, 'file', 'files')).toBe('0 files')
    expect(pluralize(12, 'file', 'files')).toBe('12 files')
  })
})
