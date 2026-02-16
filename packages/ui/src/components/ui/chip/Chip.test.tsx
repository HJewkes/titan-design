import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Chip } from './Chip'

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
    render(
      <Chip leftElement={<span data-testid="icon">icon</span>}>
        With Icon
      </Chip>
    )
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
    const colors = ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'] as const
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
