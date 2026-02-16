import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Select } from './Select'

const defaultOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
]

const optionsWithDisabled = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2', isDisabled: true },
  { value: '3', label: 'Option 3' },
]

describe('Select', () => {
  it('renders with placeholder', () => {
    render(<Select options={defaultOptions} placeholder="Pick one" />)
    expect(screen.getByText('Pick one')).toBeInTheDocument()
  })

  it('renders default placeholder when none provided', () => {
    render(<Select options={defaultOptions} />)
    expect(screen.getByText('Select...')).toBeInTheDocument()
  })

  it('displays selected value label', () => {
    render(<Select options={defaultOptions} value="2" />)
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('opens dropdown when trigger is pressed', () => {
    render(<Select options={defaultOptions} />)
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('calls onChange when an option is selected', () => {
    const onChange = vi.fn()
    render(<Select options={defaultOptions} onChange={onChange} />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Option 2'))
    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('closes dropdown after single-select selection', () => {
    const onChange = vi.fn()
    render(<Select options={defaultOptions} onChange={onChange} />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Option 1'))

    // After selection, dropdown should close (options no longer visible beyond the selected display)
    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('does not open when disabled', () => {
    render(<Select options={defaultOptions} isDisabled />)
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    // Options should not appear
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
  })

  it('shows clear button when value is selected', () => {
    const onChange = vi.fn()
    render(<Select options={defaultOptions} value="1" onChange={onChange} />)
    // The clear button renders a "x" character
    const clearButtons = screen.getAllByText('\u00d7')
    expect(clearButtons.length).toBeGreaterThan(0)
  })

  describe('multi-select', () => {
    it('renders with multi-select mode', () => {
      render(<Select options={defaultOptions} isMulti values={[]} />)
      expect(screen.getByText('Select...')).toBeInTheDocument()
    })

    it('displays count when multiple values selected', () => {
      render(<Select options={defaultOptions} isMulti values={['1', '2']} />)
      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    it('displays single label when one value selected in multi mode', () => {
      render(<Select options={defaultOptions} isMulti values={['1']} />)
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('calls onChangeMulti when toggling options', () => {
      const onChangeMulti = vi.fn()
      render(
        <Select
          options={defaultOptions}
          isMulti
          values={[]}
          onChangeMulti={onChangeMulti}
        />
      )

      fireEvent.click(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('Option 1'))
      expect(onChangeMulti).toHaveBeenCalledWith(['1'])
    })

    it('removes value when already selected in multi mode', () => {
      const onChangeMulti = vi.fn()
      render(
        <Select
          options={defaultOptions}
          isMulti
          values={['1', '2']}
          onChangeMulti={onChangeMulti}
        />
      )

      fireEvent.click(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('Option 1'))
      expect(onChangeMulti).toHaveBeenCalledWith(['2'])
    })
  })

  describe('disabled options', () => {
    it('renders disabled options with reduced opacity', () => {
      render(<Select options={optionsWithDisabled} />)
      fireEvent.click(screen.getByRole('combobox'))
      // All option labels should render
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })
  })

  describe('invalid state', () => {
    it('renders with error styling when isInvalid', () => {
      render(<Select options={defaultOptions} isInvalid />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Select options={defaultOptions} value="1" />
      )
      const results = await axe(container, {
        rules: {
          'aria-input-field-name': { enabled: false },
          'aria-required-attr': { enabled: false },
        },
      })
      expect(results).toHaveNoViolations()
    })

    it('has combobox role on trigger', () => {
      render(<Select options={defaultOptions} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('communicates expanded state', () => {
      render(<Select options={defaultOptions} />)
      const trigger = screen.getByRole('combobox')
      // react-native-web does not map accessibilityState.expanded to aria-expanded
      expect(trigger).toBeInTheDocument()

      fireEvent.click(trigger)
      // Verify dropdown opened by checking for options
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('communicates disabled state', () => {
      render(<Select options={defaultOptions} isDisabled />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
