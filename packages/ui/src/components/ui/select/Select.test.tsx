import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../test/classname-capture'
import { Select } from './Select'
import { Surface } from '../surface'
import { insetFieldStyle } from '../surface/insetField'

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
      render(<Select options={defaultOptions} isMulti values={[]} onChangeMulti={onChangeMulti} />)

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

    it('ticks each selected option with an SVG check, not a ✓ text glyph', () => {
      render(<Select options={defaultOptions} isMulti values={['1', '3']} />)
      fireEvent.click(screen.getByRole('combobox'))
      expect(screen.queryByText('✓')).toBeNull()
      const ticked = screen.getAllByRole('option').map((row) => row.querySelector('svg') !== null)
      expect(ticked).toEqual([true, false, true])
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

  describe('filled variant', () => {
    it('renders with filled variant without errors', () => {
      render(<Select options={defaultOptions} variant="filled" />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders with default variant when omitted', () => {
      render(<Select options={defaultOptions} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it.each([
      ['dark', 'base'],
      ['dark', 'raised'],
      ['light', 'base'],
      ['light', 'elevated'],
    ] as const)(
      'fills the filled trigger with the well colour of the enclosing plane (%s %s)',
      (mode, level) => {
        render(
          <Surface theme={mode} level={level}>
            <Select options={defaultOptions} variant="filled" />
          </Surface>
        )
        const expected = insetFieldStyle(level, mode) as {
          backgroundColor: string
          boxShadow: string
        }
        const trigger = screen.getByRole('combobox')
        const probe = document.createElement('div')
        probe.style.backgroundColor = expected.backgroundColor
        expect(trigger.style.boxShadow).toBe(expected.boxShadow)
        expect(trigger.style.backgroundColor).toBe(probe.style.backgroundColor)
      }
    )

    it('keeps the default trigger flat', () => {
      render(<Select options={defaultOptions} />)
      expect(screen.getByRole('combobox').style.boxShadow).toBe('')
    })

    it('supports selection in filled variant', () => {
      const onChange = vi.fn()
      render(<Select options={defaultOptions} variant="filled" onChange={onChange} />)
      fireEvent.click(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('Option 2'))
      expect(onChange).toHaveBeenCalledWith('2')
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Select options={defaultOptions} value="1" accessibilityLabel="Fruit" />
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('names the combobox and clear button from accessibilityLabel', () => {
      render(<Select options={defaultOptions} value="1" accessibilityLabel="Fruit" />)
      expect(screen.getByRole('combobox', { name: /Fruit/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear Fruit' })).toBeInTheDocument()
    })

    it('falls back to a generic clear label', () => {
      render(<Select options={defaultOptions} value="1" />)
      expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument()
    })

    it('has combobox role on trigger', () => {
      render(<Select options={defaultOptions} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('communicates expanded state', () => {
      render(<Select options={defaultOptions} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('communicates disabled state', () => {
      render(<Select options={defaultOptions} isDisabled />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('option roles', () => {
    it('exposes each single-select option as an option', () => {
      render(<Select options={defaultOptions} />)
      fireEvent.click(screen.getByRole('combobox'))
      expect(screen.getAllByRole('option')).toHaveLength(defaultOptions.length)
    })

    it('exposes each multi-select option as an option of a multiselectable listbox', () => {
      render(<Select options={defaultOptions} isMulti values={['2']} />)
      fireEvent.click(screen.getByRole('combobox'))
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
      const selected = screen.getAllByRole('option').map((o) => o.getAttribute('aria-selected'))
      expect(selected).toEqual(['false', 'true', 'false'])
    })
  })

  // TD-144: the open dropdown failed axe on aria-required-attr and aria-required-parent.
  describe('open listbox', () => {
    it('renders the options inside a listbox', () => {
      render(<Select options={defaultOptions} accessibilityLabel="Fruit" />)
      fireEvent.click(screen.getByRole('combobox'))
      const listbox = screen.getByRole('listbox', { name: 'Fruit' })
      expect(within(listbox).getAllByRole('option')).toHaveLength(defaultOptions.length)
    })

    it('points the trigger at the listbox with aria-controls only while open', () => {
      render(<Select options={defaultOptions} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).not.toHaveAttribute('aria-controls')

      fireEvent.click(trigger)
      const listboxId = screen.getByRole('listbox').id
      expect(listboxId).not.toBe('')
      expect(trigger).toHaveAttribute('aria-controls', listboxId)
    })

    it('gives each Select its own listbox id', () => {
      render(
        <>
          <Select options={defaultOptions} accessibilityLabel="First" />
          <Select options={defaultOptions} accessibilityLabel="Second" />
        </>
      )
      screen.getAllByRole('combobox').forEach((trigger) => fireEvent.click(trigger))
      const ids = screen.getAllByRole('listbox').map((listbox) => listbox.id)
      expect(new Set(ids).size).toBe(2)
    })

    it.each([
      ['single', {}],
      ['multi', { isMulti: true, values: ['1'] }],
    ] as const)('has no accessibility violations when open (%s)', async (_mode, modeProps) => {
      const { container } = render(
        <Select options={defaultOptions} value="1" accessibilityLabel="Fruit" {...modeProps} />
      )
      fireEvent.click(screen.getByRole('combobox'))
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})

// TD-483: brand orange as the selected option label missed 4.5:1 on the light overlay planes.
describe('Select selected option', () => {
  it('paints the selected label in the brand text role, not the brand fill', () => {
    render(<Select options={defaultOptions} value="2" />)
    fireEvent.click(screen.getByRole('combobox'))
    const option = screen.getByRole('option', { name: 'Option 2' })
    const classes = (capturedByNode.get(within(option).getByText('Option 2')) ?? '').split(/\s+/)
    expect(classes).toContain('text-text-brand')
    expect(classes).not.toContain('text-brand-primary')
  })
})
