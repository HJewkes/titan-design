import { describe, expect, it } from 'vitest'
import { hasSelection, isValueSelected, selectDisplayLabel, toggleValue } from './selectModel'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
]
const single = (value: string | null | undefined) => ({ isMulti: false, value, values: [] })
const multi = (values: string[]) => ({ isMulti: true, value: null, values })

describe('toggleValue', () => {
  it('adds a value that is absent', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b'])
  })
  it('removes a value that is present', () => {
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('isValueSelected', () => {
  it('compares the single value in single mode', () => {
    expect(isValueSelected(single('a'), 'a')).toBe(true)
    expect(isValueSelected(single('a'), 'b')).toBe(false)
  })
  it('checks membership in multi mode', () => {
    expect(isValueSelected(multi(['a', 'b']), 'b')).toBe(true)
    expect(isValueSelected(multi(['a']), 'b')).toBe(false)
  })
})

describe('hasSelection', () => {
  it('is false for null, undefined and an empty list', () => {
    expect(hasSelection(single(null))).toBe(false)
    expect(hasSelection(single(undefined))).toBe(false)
    expect(hasSelection(multi([]))).toBe(false)
  })
  it('is true for a value or a non-empty list', () => {
    expect(hasSelection(single('a'))).toBe(true)
    expect(hasSelection(multi(['a']))).toBe(true)
  })
})

describe('selectDisplayLabel', () => {
  it('shows the placeholder when nothing is selected', () => {
    expect(selectDisplayLabel(single(null), options, 'Pick')).toBe('Pick')
    expect(selectDisplayLabel(multi([]), options, 'Pick')).toBe('Pick')
  })
  it('shows the label of a single value', () => {
    expect(selectDisplayLabel(single('b'), options, 'Pick')).toBe('Beta')
  })
  it('shows the label of one multi value', () => {
    expect(selectDisplayLabel(multi(['c']), options, 'Pick')).toBe('Gamma')
  })
  it('falls back to the placeholder for an unknown value', () => {
    expect(selectDisplayLabel(single('z'), options, 'Pick')).toBe('Pick')
  })
  it('counts several multi values', () => {
    expect(selectDisplayLabel(multi(['a', 'b', 'c']), options, 'Pick')).toBe('3 selected')
  })
})
