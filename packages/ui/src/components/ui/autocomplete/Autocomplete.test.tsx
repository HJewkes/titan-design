import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Autocomplete } from './Autocomplete'

const defaultOptions = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' },
]

const optionsWithDescriptions = [
  { value: 'user1', label: 'John Doe', description: 'john@example.com' },
  { value: 'user2', label: 'Jane Smith', description: 'jane@example.com' },
]

function typeInInput(input: HTMLElement, text: string) {
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: text } })
}

describe('Autocomplete', () => {
  it('renders with placeholder', () => {
    render(<Autocomplete options={defaultOptions} placeholder="Search fruits..." />)
    expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument()
  })

  it('renders default placeholder', () => {
    render(<Autocomplete options={defaultOptions} />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('renders label', () => {
    render(<Autocomplete options={defaultOptions} label="Fruit" />)
    expect(screen.getByText('Fruit')).toBeInTheDocument()
  })

  it('renders required indicator', () => {
    render(<Autocomplete options={defaultOptions} label="Fruit" isRequired />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders helper text', () => {
    render(<Autocomplete options={defaultOptions} helperText="Pick your favorite" />)
    expect(screen.getByText('Pick your favorite')).toBeInTheDocument()
  })

  it('renders error message instead of helper text', () => {
    render(
      <Autocomplete
        options={defaultOptions}
        helperText="Pick one"
        errorMessage="This field is required"
      />
    )
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument()
  })

  it('filters options based on input', () => {
    render(<Autocomplete options={defaultOptions} />)
    const input = screen.getByPlaceholderText('Search...')

    typeInInput(input, 'App')
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.queryByText('Banana')).not.toBeInTheDocument()
  })

  it('shows no options text when no results match', () => {
    render(<Autocomplete options={defaultOptions} />)
    const input = screen.getByPlaceholderText('Search...')

    typeInInput(input, 'Zzzz')
    expect(screen.getByText('No options found')).toBeInTheDocument()
  })

  it('shows custom no options text', () => {
    render(<Autocomplete options={defaultOptions} noOptionsText="Nothing here" />)
    const input = screen.getByPlaceholderText('Search...')

    typeInInput(input, 'Zzzz')
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn()
    render(<Autocomplete options={defaultOptions} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Search...')

    typeInInput(input, 'Apple')
    fireEvent.click(screen.getByText('Apple'))
    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('calls onInputChange when input text changes', () => {
    const onInputChange = vi.fn()
    render(<Autocomplete options={defaultOptions} onInputChange={onInputChange} />)
    const input = screen.getByPlaceholderText('Search...')

    typeInInput(input, 'Ban')
    expect(onInputChange).toHaveBeenCalledWith('Ban')
  })

  it('shows clear button when value is selected', () => {
    render(<Autocomplete options={defaultOptions} value="1" isClearable />)
    expect(screen.getByLabelText('Clear selection')).toBeInTheDocument()
  })

  it('calls onChange with null when clear is pressed', () => {
    const onChange = vi.fn()
    render(<Autocomplete options={defaultOptions} value="1" onChange={onChange} isClearable />)

    fireEvent.click(screen.getByLabelText('Clear selection'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('does not show clear button when isClearable is false', () => {
    render(<Autocomplete options={defaultOptions} value="1" isClearable={false} />)
    expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument()
  })

  describe('minChars', () => {
    it('does not show options until minimum characters are typed', () => {
      render(<Autocomplete options={defaultOptions} minChars={3} />)
      const input = screen.getByPlaceholderText('Search...')

      typeInInput(input, 'Ap')
      expect(screen.queryByText('Apple')).not.toBeInTheDocument()
      expect(screen.getByText('Type at least 3 characters')).toBeInTheDocument()
    })

    it('shows options after minimum characters are typed', () => {
      render(<Autocomplete options={defaultOptions} minChars={3} />)
      const input = screen.getByPlaceholderText('Search...')

      typeInInput(input, 'App')
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })

    it('shows custom minCharsText', () => {
      render(<Autocomplete options={defaultOptions} minChars={3} minCharsText="Keep typing..." />)
      const input = screen.getByPlaceholderText('Search...')

      typeInInput(input, 'A')
      expect(screen.getByText('Keep typing...')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading indicator when isLoading', () => {
      render(<Autocomplete options={defaultOptions} isLoading />)
      const input = screen.getByPlaceholderText('Search...')
      // The loading spinner icon is always visible, but loading text is in the dropdown
      // which requires isOpen=true. Focus to open dropdown.
      fireEvent.focus(input)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows custom loading text', () => {
      render(<Autocomplete options={defaultOptions} isLoading loadingText="Fetching..." />)
      const input = screen.getByPlaceholderText('Search...')
      fireEvent.focus(input)
      expect(screen.getByText('Fetching...')).toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('renders as disabled', () => {
      render(<Autocomplete options={defaultOptions} isDisabled />)
      const input = screen.getByPlaceholderText('Search...')
      // react-native-web renders TextInput with editable=false as readonly
      expect(input).toHaveAttribute('readonly')
    })

    it('does not show clear button when disabled', () => {
      render(<Autocomplete options={defaultOptions} value="1" isDisabled isClearable />)
      expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument()
    })
  })

  describe('options with descriptions', () => {
    it('renders option descriptions', () => {
      render(<Autocomplete options={optionsWithDescriptions} />)
      const input = screen.getByPlaceholderText('Search...')

      typeInInput(input, 'John')
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('filters by description text', () => {
      render(<Autocomplete options={optionsWithDescriptions} />)
      const input = screen.getByPlaceholderText('Search...')

      typeInInput(input, 'jane@')
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  describe('custom filter function', () => {
    it('uses custom filter function', () => {
      const filterFn = vi.fn().mockReturnValue(true)
      render(<Autocomplete options={defaultOptions} filterFn={filterFn} />)
      const input = screen.getByPlaceholderText('Search...')

      typeInInput(input, 'test')
      expect(filterFn).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Autocomplete options={defaultOptions} label="Search" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has accessible label on input', () => {
      render(<Autocomplete options={defaultOptions} label="Search fruits" />)
      expect(screen.getByLabelText('Search fruits')).toBeInTheDocument()
    })

    it('clear button has accessible label', () => {
      render(<Autocomplete options={defaultOptions} value="1" isClearable />)
      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument()
    })
  })
})
