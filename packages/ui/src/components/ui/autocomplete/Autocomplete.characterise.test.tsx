import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { loadComposedStories } from '../../../test/composed-stories'
import { Autocomplete, type AutocompleteProps } from './Autocomplete'

const stories = await loadComposedStories(
  (file) => file === 'ui/autocomplete/Autocomplete.stories.tsx'
)

const options = [
  { value: 'apple', label: 'Apple', description: 'Red fruit' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'avocado', label: 'Avocado', isDisabled: true },
  { value: 'banana', label: 'Banana' },
]

const fixtures: Record<string, { props: Partial<AutocompleteProps>; typed?: string }> = {
  'open and empty': { props: {} },
  'open with matches and a selection': { props: { value: 'apricot' }, typed: 'ap' },
  'open matching on a description': { props: {}, typed: 'red' },
  'open with no matches': { props: { noOptionsText: 'Nothing' }, typed: 'zzz' },
  'open below min chars': { props: { minChars: 3 }, typed: 'a' },
  'open below min chars with custom text': {
    props: { minChars: 3, minCharsText: 'More please' },
    typed: 'a',
  },
  'open while loading': { props: { isLoading: true, loadingText: 'Wait' }, typed: 'a' },
  'open with renderOption': {
    props: {
      renderOption: (option, isHighlighted) => <Text>{`${option.label}:${isHighlighted}`}</Text>,
    },
    typed: 'a',
  },
  'open with a custom filter': {
    props: { filterFn: (option, input) => option.value.endsWith(input) },
    typed: 'o',
  },
  'invalid, required, disabled and selected': {
    props: {
      label: 'Fruit',
      isRequired: true,
      isDisabled: true,
      errorMessage: 'Bad',
      value: 'apple',
    },
  },
  'helper text, not clearable, selected': {
    props: { helperText: 'Pick one', isClearable: false, value: 'banana' },
  },
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Autocomplete characterisation', () => {
  it('discovers the Autocomplete stories', () => {
    expect(stories.length).toBeGreaterThan(0)
  })

  for (const { name, Story } of stories) {
    it(`story ${name}`, () => {
      const { container } = render(<Story />)
      expect(container).toMatchSnapshot()
    })
  }

  for (const [name, { props, typed }] of Object.entries(fixtures)) {
    it(name, () => {
      const { container } = render(
        <Autocomplete options={options} label="Fruit" className="extra" {...props} />
      )
      const input = screen.getByPlaceholderText('Search...')
      fireEvent.focus(input)
      if (typed !== undefined) fireEvent.change(input, { target: { value: typed } })
      expect(container).toMatchSnapshot()
    })
  }

  it('selects, blurs and clears', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(<Autocomplete options={options} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Search...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'ban' } })
    fireEvent.click(screen.getByText('Banana'))
    rerender(<Autocomplete options={options} onChange={onChange} value="banana" />)
    fireEvent.blur(input)
    act(() => vi.advanceTimersByTime(200))
    expect(container).toMatchSnapshot('selected')
    fireEvent.click(screen.getByLabelText('Clear selection'))
    rerender(<Autocomplete options={options} onChange={onChange} value={null} />)
    expect(container).toMatchSnapshot('cleared')
    expect(onChange.mock.calls).toEqual([['banana'], [null]])
  })
})
