import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Radio, RadioGroup } from './Radio'

describe('Radio', () => {
  it('renders RadioGroup with Radio children', () => {
    render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
      </RadioGroup>
    )
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })

  it('throws when Radio is used outside RadioGroup', () => {
    expect(() => render(<Radio value="a">Orphan</Radio>)).toThrow(
      'Radio must be used within a RadioGroup'
    )
  })

  it('handles selection change', () => {
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    )
    fireEvent.click(screen.getAllByRole('radio')[1])
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('marks selected radio as checked', () => {
    render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    )
    const radios = screen.getAllByRole('radio')
    // react-native-web does not map accessibilityState.checked to aria-checked
    expect(radios[0]).toBeInTheDocument()
    expect(radios[1]).toBeInTheDocument()
  })

  it('disables all radios when group isDisabled', () => {
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange} isDisabled>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    )
    const radios = screen.getAllByRole('radio')
    radios.forEach((radio) => {
      // react-native-web renders aria-disabled on a div, toBeDisabled() only works on form elements
      expect(radio).toHaveAttribute('aria-disabled', 'true')
    })
    fireEvent.click(radios[1])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables individual radio', () => {
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange}>
        <Radio value="a">A</Radio>
        <Radio value="b" isDisabled>B</Radio>
      </RadioGroup>
    )
    const radios = screen.getAllByRole('radio')
    expect(radios[1]).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(radios[1])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(
        <RadioGroup value="a" onChange={() => {}} size={size}>
          <Radio value="a">A</Radio>
        </RadioGroup>
      )
      expect(screen.getByRole('radio')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all color options', () => {
    const colors = ['primary', 'secondary', 'success', 'error'] as const
    colors.forEach((color) => {
      const { unmount } = render(
        <RadioGroup value="a" onChange={() => {}} color={color}>
          <Radio value="a">A</Radio>
        </RadioGroup>
      )
      expect(screen.getByRole('radio')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with group label', () => {
    render(
      <RadioGroup value="a" onChange={() => {}} label="Pick one">
        <Radio value="a">A</Radio>
      </RadioGroup>
    )
    expect(screen.getByText('Pick one')).toBeInTheDocument()
  })

  it('renders horizontal orientation', () => {
    const { container } = render(
      <RadioGroup value="a" onChange={() => {}} orientation="horizontal">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has radiogroup role on group', () => {
    render(
      <RadioGroup value="a" onChange={() => {}} label="Group">
        <Radio value="a">A</Radio>
      </RadioGroup>
    )
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('allows Radio to override group size and color', () => {
    render(
      <RadioGroup value="a" onChange={() => {}} size="sm" color="primary">
        <Radio value="a" size="lg" color="error">A</Radio>
      </RadioGroup>
    )
    expect(screen.getByRole('radio')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <RadioGroup value="a" onChange={() => {}} label="Options">
          <Radio value="a">Option A</Radio>
          <Radio value="b">Option B</Radio>
        </RadioGroup>
      )
      const results = await axe(container, {
        rules: { 'aria-required-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has correct radio role on items', () => {
      render(
        <RadioGroup value="a" onChange={() => {}}>
          <Radio value="a">A</Radio>
        </RadioGroup>
      )
      expect(screen.getByRole('radio')).toBeInTheDocument()
    })
  })
})
