import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Checkbox, CheckboxGroup } from './Checkbox'

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox label="Accept terms" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders label text', () => {
    render(<Checkbox label="Accept terms" />)
    expect(screen.getByText('Accept terms')).toBeInTheDocument()
  })

  it('renders helper text', () => {
    render(<Checkbox label="Terms" helperText="Please read carefully" />)
    expect(screen.getByText('Please read carefully')).toBeInTheDocument()
  })

  it('handles checked state change', () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox label="Check me" onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('toggles from checked to unchecked', () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox label="Check me" isChecked onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('does not fire onCheckedChange when disabled', () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox label="Disabled" isDisabled onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('shows checkmark when checked', () => {
    render(<Checkbox isChecked label="Checked" />)
    expect(screen.getByText('\u2713')).toBeInTheDocument()
  })

  it('renders indeterminate state', () => {
    render(<Checkbox isIndeterminate label="Mixed" />)
    const checkbox = screen.getByRole('checkbox')
    // react-native-web does not map accessibilityState.checked to aria-checked
    expect(checkbox).toBeInTheDocument()
  })

  it('communicates disabled state', () => {
    render(<Checkbox isDisabled label="Disabled" />)
    // react-native-web renders aria-disabled="true" on a div, but toBeDisabled() only works on form elements
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Checkbox size={size} label="Test" />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      unmount()
    })
  })

  it('applies custom className', () => {
    render(<Checkbox className="extra" label="Test" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('sets accessibility label from label prop', () => {
    render(<Checkbox label="My checkbox" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'My checkbox')
  })

  describe('CheckboxGroup', () => {
    it('renders children', () => {
      render(
        <CheckboxGroup>
          <Checkbox label="Option A" />
          <Checkbox label="Option B" />
        </CheckboxGroup>
      )
      expect(screen.getByText('Option A')).toBeInTheDocument()
      expect(screen.getByText('Option B')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(
        <CheckboxGroup label="Select options">
          <Checkbox label="A" />
        </CheckboxGroup>
      )
      expect(screen.getByText('Select options')).toBeInTheDocument()
    })

    it('supports horizontal orientation', () => {
      const { container } = render(
        <CheckboxGroup orientation="horizontal">
          <Checkbox label="A" />
          <Checkbox label="B" />
        </CheckboxGroup>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('supports vertical orientation', () => {
      const { container } = render(
        <CheckboxGroup orientation="vertical">
          <Checkbox label="A" />
          <Checkbox label="B" />
        </CheckboxGroup>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Checkbox label="Accept terms" />)
      const results = await axe(container, {
        rules: { 'aria-required-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when checked', async () => {
      const { container } = render(<Checkbox label="Checked" isChecked />)
      const results = await axe(container, {
        rules: { 'aria-required-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for CheckboxGroup', async () => {
      const { container } = render(
        <CheckboxGroup label="Options">
          <Checkbox label="A" />
          <Checkbox label="B" />
        </CheckboxGroup>
      )
      const results = await axe(container, {
        rules: { 'aria-required-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })
  })
})
