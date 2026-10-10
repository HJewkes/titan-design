import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../test/classname-capture'
import type { ViewProps } from 'react-native'
import { Checkbox, CheckboxGroup } from './Checkbox'

const viewClassNames: string[][] = []

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const React = await import('react')
  const View = React.forwardRef<unknown, ViewProps & { className?: string }>((props, ref) => {
    viewClassNames.push((props.className ?? '').split(/\s+/))
    return React.createElement(actual.View, { ...props, ref } as ViewProps)
  })
  const { captureClassName } = await import('../../../test/classname-capture')
  const Text = captureClassName(actual.Text as React.ComponentType<{ className?: string }>)
  return { ...actual, View, Text }
})

describe('Checkbox', () => {
  it('flips its own state on press when uncontrolled and calls onCheckedChange', () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox label="Toggle" defaultIsChecked={false} onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('checkbox')
    expect(control).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  it('seeds uncontrolled state from defaultIsChecked', () => {
    render(<Checkbox label="Toggle" defaultIsChecked />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('stays controlled when isChecked is given', () => {
    render(<Checkbox label="Toggle" isChecked={false} defaultIsChecked />)
    const control = screen.getByRole('checkbox')
    fireEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'false')
  })

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

  it('emits aria-checked true when checked', () => {
    render(<Checkbox isChecked label="Checked" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('emits aria-checked false when unchecked', () => {
    render(<Checkbox label="Unchecked" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
  })

  it('emits aria-checked mixed when indeterminate', () => {
    render(<Checkbox isIndeterminate label="Mixed" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
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
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations when checked', async () => {
      const { container } = render(<Checkbox label="Checked" isChecked />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations for CheckboxGroup', async () => {
      const { container } = render(
        <CheckboxGroup label="Options">
          <Checkbox label="A" />
          <Checkbox label="B" />
        </CheckboxGroup>
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('unchecked boundary', () => {
    it('draws the unchecked box with border-input, not a hairline', () => {
      viewClassNames.length = 0
      render(<Checkbox label="Accept terms" />)
      const box = viewClassNames.find((classes) => classes.includes('border-2'))
      expect(box).toContain('border-border-input')
      expect(box?.filter((c) => c.startsWith('border-hairline'))).toEqual([])
    })
  })

  it('renders no empty text node for an empty label', () => {
    render(<Checkbox label="" helperText="Help" />)
    const helper = screen.getByText('Help')
    expect(helper.parentElement?.childNodes).toHaveLength(1)
  })
})

describe('Checkbox label face', () => {
  it('sets the item label in the heading face', () => {
    render(<Checkbox label="Accept terms" />)

    expect(capturedByNode.get(screen.getByText('Accept terms'))).toContain('font-heading')
  })

  it('sets the group label in the heading face', () => {
    render(
      <CheckboxGroup label="Preferences">
        <Checkbox label="One" />
      </CheckboxGroup>
    )

    expect(capturedByNode.get(screen.getByText('Preferences'))).toContain('font-heading')
  })
})
