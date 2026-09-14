import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Pill } from './Pill'
import { resolveAll, siblingSource, sizeClasses } from '../../../test/spacing-resolver'

describe('Pill', () => {
  it('renders string children', () => {
    render(<Pill>Active</Pill>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders with all variants', () => {
    const variants = ['solid', 'subtle', 'outline'] as const
    variants.forEach((variant) => {
      const { unmount } = render(<Pill variant={variant}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all colors', () => {
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
      const { unmount } = render(<Pill color={color}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all tones', () => {
    const tones = [
      'neutral',
      'brand',
      'brand-secondary',
      'success',
      'warning',
      'error',
      'info',
    ] as const
    tones.forEach((tone) => {
      const { unmount } = render(<Pill tone={tone}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Pill size={size}>Test</Pill>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders a tone-matched dot for leading="dot"', () => {
    render(
      <Pill tone="success" leading="dot">
        Active
      </Pill>
    )
    expect(screen.getByTestId('pill-dot')).toBeInTheDocument()
  })

  it('renders each tone with a leading dot', () => {
    const tones = ['neutral', 'brand', 'brand-secondary', 'error'] as const
    tones.forEach((tone) => {
      const { unmount } = render(
        <Pill tone={tone} leading="dot">
          Test
        </Pill>
      )
      expect(screen.getByTestId('pill-dot')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders a leading icon node', () => {
    render(<Pill leading={<span data-testid="icon" />}>Label</Pill>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.queryByTestId('pill-dot')).not.toBeInTheDocument()
  })

  it('renders a trailing slot', () => {
    render(<Pill trailing={<span data-testid="dismiss" />}>Label</Pill>)
    expect(screen.getByTestId('dismiss')).toBeInTheDocument()
  })

  it('does not fire onPress when disabled', () => {
    const handler = vi.fn()
    render(
      <Pill onPress={handler} isDisabled>
        Click
      </Pill>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('maps the legacy color prop onto a tone', () => {
    render(
      <Pill color="primary" leading="dot">
        Legacy
      </Pill>
    )
    expect(screen.getByText('Legacy')).toBeInTheDocument()
    expect(screen.getByTestId('pill-dot')).toBeInTheDocument()
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

    it('has no accessibility violations with a leading dot', async () => {
      const { container } = render(
        <Pill tone="success" leading="dot">
          Active
        </Pill>
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations when interactive', async () => {
      const { container } = render(<Pill onPress={() => {}}>Filter</Pill>)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('exposes a button role when interactive', () => {
      render(<Pill onPress={() => {}}>Filter</Pill>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})

/**
 * Pill's squish geometry, pinned (AW-142 wave two).
 *
 * The three rungs are the shared squish ramp — the same 8/2, 12/4, 16/6 that
 * Badge and Chip now measure. The pixel numbers are spelled out rather than
 * imported: they are what the ramp is FOR, so a token move has to fail here.
 */
describe('Pill geometry resolves to the squish tokens', () => {
  const source = siblingSource(import.meta.url, 'Pill.tsx')
  const classes = (level: string) => sizeClasses(source, 'sizeStyles', level, 'container')

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

  it('has no rung outside sm/md/lg', () => {
    expect(source.match(/^\s{2}(xs|xl):/m)).toBeNull()
  })
})

describe('Pill deprecated size aliases', () => {
  it('maps xs onto sm and xl onto lg', () => {
    const source = siblingSource(import.meta.url, 'Pill.tsx')
    expect(source).toMatch(/sizeAliases[^=]*= \{ xs: 'sm', xl: 'lg' \}/)
  })

  it('does not warn at runtime — the deprecation is a type, not a console line', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Pill size="xs">Legacy</Pill>)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
