import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Pill } from './Pill'
import { capturedClassNames } from '../../../test/classname-capture'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

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
 * Four rungs on the shared ramp. Badge and Chip take the top three; `xs` is
 * Pill's alone, because nine in-repo call sites already render a 4/1 capsule
 * and folding them into `sm` would have grown all nine without an edit.
 *
 * The pixel numbers are spelled out rather than imported: they are what the
 * ramp is FOR, so a token move has to fail here.
 */
describe('Pill geometry resolves to the squish tokens', () => {
  // `gap-1` spaces the leading slot from the label; it is not part of the squish ramp.
  const classes = (level: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    render(<Pill size={level}>Active</Pill>)
    return spacingClassesAt(screen.getByText('Active').parentElement).filter((c) => c !== 'gap-1')
  }

  const ramp = [
    ['xs', ['px-squish-x-xs', 'py-squish-y-xs'], ['4px', '1px']],
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

  it('has no rung above lg', () => {
    expect(classes('xl')).toEqual(['px-squish-x-lg', 'py-squish-y-lg'])
  })
})

describe('Pill deprecated size alias', () => {
  it('maps xl onto lg, and aliases nothing else', () => {
    const rendered = (['xs', 'sm', 'md', 'lg', 'xl'] as const).map((level) => {
      const { unmount } = render(<Pill size={level}>{level}</Pill>)
      const pill = screen.getByText(level).parentElement
      const label = screen.getByText(level).className
      const spacing = spacingClassesAt(pill).join(' ')
      unmount()
      return `${spacing}|${label}`
    })
    expect(rendered[4]).toBe(rendered[3])
    expect(new Set(rendered.slice(0, 4)).size).toBe(4)
  })

  it('does not warn at runtime — the deprecation is a type, not a console line', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Pill size="xl">Legacy</Pill>)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('Pill neutral faces', () => {
  const classesOf = (testID: string) => (capturedClassNames.get(testID) ?? '').split(/\s+/)

  it.each([
    ['solid', ['bg-text-primary', 'text-text-inverse']],
    ['subtle', ['bg-hairline-subtle', 'text-text-primary']],
  ] as const)('the neutral %s row paints its fill and label', (variant, expected) => {
    render(
      <Pill testID="pill" variant={variant} tone="neutral">
        Active
      </Pill>
    )
    expect(classesOf('pill')).toEqual(expect.arrayContaining([...expected]))
  })

  it.each([
    ['brand', 'text-text-brand'],
    ['brand-secondary', 'text-text-brand-secondary'],
    ['success', 'text-text-success'],
    ['warning', 'text-text-warning'],
    ['error', 'text-text-error'],
    ['info', 'text-text-info'],
  ] as const)('the %s outline label reads from the text token', (tone, label) => {
    render(
      <Pill testID="pill" variant="outline" tone={tone}>
        Active
      </Pill>
    )
    expect(classesOf('pill')).toContain(label)
  })
})

describe('Pill neutral outline', () => {
  it('draws its ring one hairline step above the shared default', () => {
    render(
      <Pill testID="pill" variant="outline" tone="neutral">
        Idle
      </Pill>
    )
    const classes = (capturedClassNames.get('pill') ?? '').split(/\s+/)
    expect(classes).toContain('border-hairline-strong')
    expect(classes).not.toContain('border-hairline')
  })
})

describe('Pill outline error', () => {
  it('keeps the ring on status-error and puts the label on text-error', () => {
    render(
      <Pill testID="pill" variant="outline" tone="error">
        Failed
      </Pill>
    )
    const classes = (capturedClassNames.get('pill') ?? '').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['border-status-error', 'text-text-error']))
    expect(classes).not.toContain('text-status-error')
  })
})
