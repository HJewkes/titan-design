import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Chip } from './Chip'
import { capturedClassNames } from '../../../test/classname-capture'
import { resolveAll, siblingSource, sizeClasses } from '../../../test/spacing-resolver'

describe('Chip', () => {
  it('renders children correctly', () => {
    render(<Chip>Label</Chip>)
    expect(screen.getByText('Label')).toBeInTheDocument()
  })

  it('renders as a View when not clickable', () => {
    const { container } = render(<Chip>Static</Chip>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders as a Pressable when onPress is provided', () => {
    render(<Chip onPress={() => {}}>Clickable</Chip>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles press events', () => {
    const onPress = vi.fn()
    render(<Chip onPress={onPress}>Click me</Chip>)
    fireEvent.click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not fire onPress when disabled', () => {
    const onPress = vi.fn()
    render(
      <Chip onPress={onPress} isDisabled>
        Disabled
      </Chip>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders delete button when onDelete is provided', () => {
    const onDelete = vi.fn()
    render(<Chip onDelete={onDelete}>Dismissible</Chip>)
    expect(screen.getByLabelText('Remove')).toBeInTheDocument()
  })

  it('handles delete events', () => {
    const onDelete = vi.fn()
    render(<Chip onDelete={onDelete}>Dismissible</Chip>)
    fireEvent.click(screen.getByLabelText('Remove'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('renders leftElement', () => {
    render(<Chip leftElement={<span data-testid="icon">icon</span>}>With Icon</Chip>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders with all variant options', () => {
    const variants = ['solid', 'subtle', 'outline'] as const
    variants.forEach((variant) => {
      const { unmount } = render(<Chip variant={variant}>Test</Chip>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all color options', () => {
    const colors = [
      'default',
      'primary',
      'secondary',
      'success',
      'error',
      'warning',
      'info',
    ] as const
    colors.forEach((color) => {
      const { unmount } = render(<Chip color={color}>Test</Chip>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Chip size={size}>Test</Chip>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<Chip className="extra">Test</Chip>)
    expect(container.firstChild).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations for static chip', async () => {
      const { container } = render(<Chip>Label</Chip>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for clickable chip', async () => {
      const { container } = render(<Chip onPress={() => {}}>Clickable</Chip>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has button role when clickable', () => {
      render(<Chip onPress={() => {}}>Clickable</Chip>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('delete button has accessible label', () => {
      render(<Chip onDelete={() => {}}>Tag</Chip>)
      expect(screen.getByLabelText('Remove')).toBeInTheDocument()
    })
  })
})

/**
 * Chip's squish geometry, pinned (AW-142 wave two).
 *
 * Chip already measured 8/2, 12/4, 16/6 at every rung, so naming the tokens
 * moved no pixels. That is exactly what this test is for: it fails the day the
 * ramp moves under Chip without anyone editing Chip.
 */
describe('Chip geometry resolves to the squish tokens', () => {
  const source = siblingSource(import.meta.url, 'Chip.tsx')
  const classes = (level: string) => sizeClasses(source, 'sizeStyles', level, 'container')

  const ramp = [
    ['sm', ['8px', '2px']],
    ['md', ['12px', '4px']],
    ['lg', ['16px', '6px']],
  ] as const

  it.each(ramp)('%s uses the squish tokens', (level) => {
    expect(classes(level).slice(0, 2)).toEqual([`px-squish-x-${level}`, `py-squish-y-${level}`])
  })

  it.each(ramp)('%s measures what Chip shipped before the tokens', (level, pixels) => {
    expect(resolveAll(classes(level).slice(0, 2))).toEqual([...pixels])
  })
})

describe('Chip isSelected and rightElement', () => {
  const classesOf = (testID: string) => (capturedClassNames.get(testID) ?? '').split(/\s+/)

  it('a pressable chip with isSelected reports aria-pressed true', () => {
    render(
      <Chip onPress={() => {}} isSelected>
        Notes
      </Chip>
    )
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('isSelected false reports aria-pressed false', () => {
    render(
      <Chip onPress={() => {}} isSelected={false}>
        Notes
      </Chip>
    )
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('a pressable chip without isSelected has no aria-pressed attribute', () => {
    render(<Chip onPress={() => {}}>Notes</Chip>)
    expect(screen.getByRole('button', { name: 'Notes' })).not.toHaveAttribute('aria-pressed')
  })

  it('isSelected without onPress renders no button and no aria-pressed', () => {
    const { container } = render(<Chip isSelected>Notes</Chip>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-pressed]')).toBeNull()
  })

  it('a selected chip carries the solid face of its colour, and both states carry the border class', () => {
    render(
      <>
        <Chip testID="on" color="primary" variant="outline" onPress={() => {}} isSelected>
          On
        </Chip>
        <Chip testID="off" color="primary" variant="outline" onPress={() => {}} isSelected={false}>
          Off
        </Chip>
        <Chip testID="off-subtle" color="primary" onPress={() => {}} isSelected={false}>
          Off
        </Chip>
      </>
    )
    expect(classesOf('on')).toContain('bg-brand-primary-solid')
    expect(classesOf('off')).not.toContain('bg-brand-primary-solid')
    for (const id of ['on', 'off', 'off-subtle']) {
      expect(classesOf(id)).toContain('border')
      expect(classesOf(id)).not.toContain('border-0')
    }
  })

  it('a disabled selected chip keeps aria-pressed true and does not fire onPress', () => {
    const onPress = vi.fn()
    render(
      <Chip onPress={onPress} isSelected isDisabled>
        Notes
      </Chip>
    )
    const button = screen.getByRole('button', { name: 'Notes' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('rightElement renders after the label and before the delete button', () => {
    render(
      <Chip rightElement={<span data-testid="count">12</span>} onDelete={() => {}}>
        Notes
      </Chip>
    )
    const label = screen.getByText('Notes')
    const count = screen.getByTestId('count')
    const remove = screen.getByLabelText('Remove')
    expect(label.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(count.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it.each([
    ['selected', { onPress: () => {}, isSelected: true }],
    ['unselected', { onPress: () => {}, isSelected: false }],
    ['selected and disabled', { onPress: () => {}, isSelected: true, isDisabled: true }],
    ['selected without onPress', { isSelected: true }],
  ])('has no axe violations when %s', async (_, props) => {
    const { container } = render(<Chip {...props}>Notes</Chip>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
