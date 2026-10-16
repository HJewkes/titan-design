import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import { selectedSet, toggleMultiple, toggleSingle, uniqueOptions } from './facet-bar-model'

const values = fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'x', 'y'), { maxLength: 12 })

describe('toggleMultiple', () => {
  it('adds an absent value and removes a present one', () => {
    expect(toggleMultiple(['a'], 'b', ['a', 'b', 'c'])).toEqual(['a', 'b'])
    expect(toggleMultiple(['a', 'b'], 'a', ['a', 'b', 'c'])).toEqual(['b'])
  })

  it('returns values in options order', () => {
    expect(toggleMultiple(['c'], 'a', ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })

  it('keeps a value that has no option, after the known ones', () => {
    expect(toggleMultiple(['gone', 'c'], 'a', ['a', 'b', 'c'])).toEqual(['a', 'c', 'gone'])
  })

  it('toggling the same value twice returns the same set', () => {
    fcAssert(
      fc.property(values, fc.constantFrom('a', 'b', 'x'), values, (current, pressed, order) => {
        const once = toggleMultiple(current, pressed, order)
        const twice = toggleMultiple(once, pressed, order)
        expect(new Set(twice)).toEqual(new Set(current))
      })
    )
  })

  it('the result never holds a duplicate, for any input array with duplicates', () => {
    fcAssert(
      fc.property(values, fc.constantFrom('a', 'x'), values, (current, pressed, order) => {
        const result = toggleMultiple(current, pressed, order)
        expect(new Set(result).size).toBe(result.length)
      })
    )
  })

  it('any current value, pressed value and order never throw', () => {
    fcAssert(
      fc.property(fc.array(fc.string()), fc.string(), fc.array(fc.string()), (c, p, o) => {
        expect(() => toggleMultiple(c, p, o)).not.toThrow()
      })
    )
  })
})

describe('toggleSingle', () => {
  it('returns the pressed value, or null when it was already selected', () => {
    expect(toggleSingle<string>(null, 'a')).toBe('a')
    expect(toggleSingle('b', 'a')).toBe('a')
    expect(toggleSingle('a', 'a')).toBeNull()
  })

  it('single mode never yields more than one value', () => {
    fcAssert(
      fc.property(
        fc.option(fc.constantFrom('a', 'b'), { nil: null }),
        fc.constantFrom('a', 'b'),
        (c, p) => {
          const next = toggleSingle(c, p)
          expect(selectedSet('single', next).size).toBeLessThanOrEqual(1)
        }
      )
    )
  })
})

describe('selectedSet', () => {
  it('treats null and an empty array as nothing selected', () => {
    expect(selectedSet('single', null).size).toBe(0)
    expect(selectedSet('multiple', []).size).toBe(0)
  })

  it('holds the single value, or every array member', () => {
    expect([...selectedSet('single', 'a')]).toEqual(['a'])
    expect([...selectedSet('multiple', ['a', 'b'])]).toEqual(['a', 'b'])
  })
})

describe('uniqueOptions', () => {
  it('keeps the first of two options with one value', () => {
    const result = uniqueOptions([
      { value: 'alpha', label: 'First' },
      { value: 'beta', label: 'Beta' },
      { value: 'alpha', label: 'Second' },
    ])
    expect(result.map((o) => o.label)).toEqual(['First', 'Beta'])
  })
})
