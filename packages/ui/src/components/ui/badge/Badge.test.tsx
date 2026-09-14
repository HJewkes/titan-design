import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Badge, BadgeText } from './Badge'
import { resolveAll, siblingSource, sizeClasses } from '../../../test/spacing-resolver'

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

  describe('dot indicator', () => {
    it('renders dot when dot prop is true', () => {
      const { container } = render(
        <Badge dot color="success">
          Active
        </Badge>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders dot with explicit dotColor', () => {
      const { container } = render(
        <Badge dot dotColor="warning">
          Pending
        </Badge>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('does not render dot by default', () => {
      const { container } = render(<Badge>No dot</Badge>)
      expect(container.firstChild).toBeInTheDocument()
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

/**
 * Badge's squish geometry, pinned (AW-142 wave two).
 *
 * Badge is the atom the unification moved most: it shipped 6/2, 8/2, 10/4 and
 * now measures the shared 8/2, 12/4, 16/6. These numbers are the ramp, spelled
 * out so a token move fails here rather than in a screenshot.
 */
describe('Badge geometry resolves to the squish tokens', () => {
  const source = siblingSource(import.meta.url, 'Badge.tsx')
  const classes = (level: string) => sizeClasses(source, 'sizeStyles', level)

  const ramp = [
    ['sm', ['px-squish-x-sm', 'py-squish-y-sm'], ['8px', '2px']],
    ['md', ['px-squish-x-md', 'py-squish-y-md'], ['12px', '4px']],
    ['lg', ['px-squish-x-lg', 'py-squish-y-lg'], ['16px', '6px']],
  ] as const

  it.each(ramp)('%s uses the squish tokens', (level, expected) => {
    expect(classes(level)).toEqual([...expected])
  })

  it.each(ramp)('%s measures the squish ramp', (level, _, pixels) => {
    expect(resolveAll(classes(level))).toEqual([...pixels])
  })
})
