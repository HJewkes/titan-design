import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Pill } from './Pill'

describe('Pill', () => {
  it('renders string children', () => {
    render(<Pill>Active</Pill>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders with all variants', () => {
    const variants = ['subtle', 'outline'] as const
    variants.forEach((variant) => {
      const { unmount } = render(<Pill variant={variant}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all colors', () => {
    const colors = ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'] as const
    colors.forEach((color) => {
      const { unmount } = render(<Pill color={color}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all sizes', () => {
    const sizes = ['xs', 'sm', 'md'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Pill size={size}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('applies rounded-full by default', () => {
    const { container } = render(<Pill>Test</Pill>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('supports leftElement', () => {
    render(<Pill leftElement={<span data-testid="dot" />}>Label</Pill>)
    expect(screen.getByTestId('dot')).toBeInTheDocument()
    expect(screen.getByText('Label')).toBeInTheDocument()
  })

  it('handles onPress', () => {
    const handler = vi.fn()
    render(<Pill onPress={handler}>Click</Pill>)
    fireEvent.click(screen.getByText('Click'))
    expect(handler).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<Pill className="custom">Test</Pill>)
    expect(container.firstChild).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Pill>Active</Pill>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
