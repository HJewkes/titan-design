import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Badge, BadgeText } from './Badge'

describe('Badge', () => {
  it('renders string children correctly', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders BadgeText compound component', () => {
    render(
      <Badge>
        <BadgeText>Status</BadgeText>
      </Badge>
    )
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('applies default variant (subtle) and color (default)', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with all variant options', () => {
    const variants = ['solid', 'subtle', 'outline'] as const
    variants.forEach((variant) => {
      const { unmount } = render(<Badge variant={variant}>Test</Badge>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all color options', () => {
    const colors = ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'] as const
    colors.forEach((color) => {
      const { unmount } = render(<Badge color={color}>Test</Badge>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Badge size={size}>Test</Badge>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('passes additional props through', () => {
    render(<Badge testID="badge-test">Test</Badge>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  describe('BadgeText', () => {
    it('renders children', () => {
      render(<BadgeText>Label</BadgeText>)
      expect(screen.getByText('Label')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      render(<BadgeText className="extra">Label</BadgeText>)
      expect(screen.getByText('Label')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Badge color="success">
          <BadgeText>Active</BadgeText>
        </Badge>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
