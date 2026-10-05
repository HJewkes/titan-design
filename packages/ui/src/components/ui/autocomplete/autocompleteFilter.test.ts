import { describe, expect, it } from 'vitest'
import { defaultFilterFn, dropdownContent, filterOptions } from './autocompleteFilter'

const options = [
  { value: 'apple', label: 'Apple', description: 'Red fruit' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', description: 'Stone FRUIT' },
]

describe('defaultFilterFn', () => {
  it('matches the label case-insensitively', () => {
    expect(defaultFilterFn(options[1], 'NAN')).toBe(true)
  })

  it('matches the description when the label misses', () => {
    expect(defaultFilterFn(options[2], 'fruit')).toBe(true)
  })

  it('rejects an option without a description when the label misses', () => {
    expect(defaultFilterFn(options[1], 'fruit')).toBe(false)
  })
})

describe('filterOptions', () => {
  it('returns nothing until the input reaches minChars', () => {
    expect(filterOptions(options, 'ap', 3, defaultFilterFn)).toEqual([])
  })

  it('keeps the options the filter accepts, in order', () => {
    expect(filterOptions(options, 'fruit', 0, defaultFilterFn).map((o) => o.value)).toEqual([
      'apple',
      'cherry',
    ])
  })

  it('uses a custom filter', () => {
    const byValueEnd = (option: { value: string }, input: string) => option.value.endsWith(input)
    expect(filterOptions(options, 'y', 0, byValueEnd).map((o) => o.value)).toEqual(['cherry'])
  })
})

describe('dropdownContent', () => {
  const base = { inputValue: '', minChars: 0, isLoading: false, isOpen: true, matchCount: 2 }

  it('shows options when open with matches', () => {
    expect(dropdownContent(base)).toEqual({
      showMinCharsMessage: false,
      showNoResults: false,
      showOptions: true,
    })
  })

  it('shows the min-chars message instead of options below minChars', () => {
    expect(dropdownContent({ ...base, inputValue: 'a', minChars: 3 })).toEqual({
      showMinCharsMessage: true,
      showNoResults: false,
      showOptions: false,
    })
  })

  it('shows no results once minChars is met with no matches, unless loading', () => {
    expect(dropdownContent({ ...base, matchCount: 0 }).showNoResults).toBe(true)
    expect(dropdownContent({ ...base, matchCount: 0, isLoading: true }).showNoResults).toBe(false)
  })

  it('hides options while closed', () => {
    expect(dropdownContent({ ...base, isOpen: false }).showOptions).toBe(false)
  })
})
