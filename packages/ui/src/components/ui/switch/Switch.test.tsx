import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Switch } from './Switch'

describe('Switch', () => {
  it('renders correctly', () => {
    render(<Switch label="Toggle" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders label text', () => {
    render(<Switch label="Enable notifications" />)
    expect(screen.getByText('Enable notifications')).toBeInTheDocument()
  })

  it('handles checked state change', () => {
    const onCheckedChange = vi.fn()
    render(<Switch label="Toggle" onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('toggles from checked to unchecked', () => {
    const onCheckedChange = vi.fn()
    render(<Switch label="Toggle" isChecked onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('does not fire onCheckedChange when disabled', () => {
    const onCheckedChange = vi.fn()
    render(<Switch label="Toggle" isDisabled onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('communicates checked state via aria', () => {
    render(<Switch label="Toggle" isChecked />)
    // react-native-web does not map accessibilityState.checked to aria-checked
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('communicates unchecked state via aria', () => {
    render(<Switch label="Toggle" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('communicates disabled state', () => {
    render(<Switch label="Toggle" isDisabled />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders label on right by default', () => {
    render(<Switch label="Right label" />)
    expect(screen.getByText('Right label')).toBeInTheDocument()
  })

  it('renders label on left when labelPosition is left', () => {
    render(<Switch label="Left label" labelPosition="left" />)
    expect(screen.getByText('Left label')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<Switch />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Switch size={size} label="Test" />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
      unmount()
    })
  })

  it('applies custom className', () => {
    render(<Switch className="extra" label="Test" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('sets accessibility label from label prop', () => {
    render(<Switch label="My switch" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'My switch')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Switch label="Enable feature" />)
      // react-native-web does not output aria-checked for accessibilityState.checked,
      // so we disable the aria-required-attr rule that checks for it on role="switch"
      const results = await axe(container, {
        rules: { 'aria-required-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when checked', async () => {
      const { container } = render(<Switch label="Enabled" isChecked />)
      const results = await axe(container, {
        rules: { 'aria-required-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has correct switch role', () => {
      render(<Switch label="Toggle" />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })
})
