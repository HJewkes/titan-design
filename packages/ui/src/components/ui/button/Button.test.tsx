import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Platform } from 'react-native'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Button, ButtonText, type ButtonColor, type ButtonVariant } from './Button'
import { Surface } from '../surface'
import { contrast } from '../../../theme/color-checks'
import {
  getSemanticColors,
  semanticColorsDark,
  semanticColorsLight,
  type ThemeMode,
} from '../../../theme/tokens/semantic'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'
import { capturedByNode } from '../../../test/classname-capture'

describe('Button', () => {
  it('renders children correctly', () => {
    render(
      <Button>
        <ButtonText>Click me</ButtonText>
      </Button>
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles press events', () => {
    const onPress = vi.fn()
    render(
      <Button onPress={onPress}>
        <ButtonText>Click</ButtonText>
      </Button>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('respects isDisabled prop', () => {
    const onPress = vi.fn()
    render(
      <Button isDisabled onPress={onPress}>
        <ButtonText>Disabled</ButtonText>
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('respects isLoading prop', () => {
    const onPress = vi.fn()
    render(
      <Button isLoading loadingText="Loading..." onPress={onPress}>
        <ButtonText>Submit</ButtonText>
      </Button>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(
      <Button variant="solid" testID="button">
        <ButtonText>Solid</ButtonText>
      </Button>
    )
    // Button should have solid styles
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(
      <Button variant="outline" testID="button">
        <ButtonText>Outline</ButtonText>
      </Button>
    )
    // Button should have outline styles
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies size styles correctly', () => {
    const { rerender } = render(
      <Button size="sm">
        <ButtonText>Small</ButtonText>
      </Button>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(
      <Button size="lg">
        <ButtonText>Large</ButtonText>
      </Button>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies color variants correctly', () => {
    render(
      <Button color="primary">
        <ButtonText>Primary</ButtonText>
      </Button>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Button>
          <ButtonText>Accessible Button</ButtonText>
        </Button>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has correct accessibility role', () => {
      render(
        <Button>
          <ButtonText>Button</ButtonText>
        </Button>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('communicates disabled state to assistive technology', () => {
      render(
        <Button isDisabled>
          <ButtonText>Disabled</ButtonText>
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })
})

/**
 * Button's geometry, pinned (AW-142).
 *
 * The pixel numbers below are the ones Button shipped BEFORE it moved onto the
 * control tokens (`px-4 py-1.5 min-h-[32px]` and its md/lg siblings). They are
 * spelled out rather than imported so this fails if a token value moves.
 * The classes are read from the rendered button, so a change to the size map fails here.
 */
describe('Button geometry resolves to the control tokens', () => {
  const classesFor = (level: 'sm' | 'md' | 'lg') => {
    render(
      <Button size={level}>
        <ButtonText>Go</ButtonText>
      </Button>
    )
    return spacingClassesAt(screen.getByRole('button'))
  }

  const shipped = [
    ['sm', ['px-control-x-sm', 'py-control-y-sm', 'min-h-control-sm'], ['16px', '6px', '32px']],
    ['md', ['px-control-x-md', 'py-control-y-md', 'min-h-control-md'], ['20px', '8px', '40px']],
    ['lg', ['px-control-x-lg', 'py-control-y-lg', 'min-h-control-lg'], ['24px', '10px', '48px']],
  ] as const

  it.each(shipped)('%s uses the control tokens', (level, classes) => {
    expect(classesFor(level)).toEqual([...classes])
  })

  it.each(shipped)('%s still measures what it measured before the tokens', (level, _, pixels) => {
    expect(resolveAll(classesFor(level))).toEqual([...pixels])
  })
})

// TD-789 3b: status-error as text missed 4.5:1 on the grey 100 page.
describe('Button error label', () => {
  it.each(['outline', 'ghost', 'link'] as const)(
    'paints the %s error label in text-error, not status-error',
    (variant) => {
      render(
        <Button variant={variant} color="error">
          <ButtonText>Delete</ButtonText>
        </Button>
      )
      const classes = (capturedByNode.get(screen.getByRole('button')) ?? '').split(/\s+/)
      expect(classes).toContain('text-text-error')
      expect(classes).not.toContain('text-status-error')
    }
  )
})

// Decision 0003: the label and the outline follow the theme. The className and the
// inline colour name the same token, so on web both resolve through the `.light`
// class, and on native the hex comes from the nearest Surface's mode (TD-415).
describe('Button label follows the theme', () => {
  const classesOf = () => (capturedByNode.get(screen.getByRole('button')) ?? '').split(/\s+/)
  const renderButton = (variant: ButtonVariant, color: ButtonColor) =>
    render(
      <Button variant={variant} color={color}>
        <ButtonText>Go</ButtonText>
      </Button>
    )

  it('outline primary reads text-brand as class and CSS variable', () => {
    renderButton('outline', 'primary')
    expect(classesOf()).toContain('text-text-brand')
    expect(classesOf()).not.toContain('text-brand-primary')
    expect(screen.getByRole('button').style.color).toBe('var(--color-text-brand)')
    expect(screen.getByRole('button').style.borderTopColor).toBe('var(--color-brand-primary)')
  })

  it('solid primary reads on-brand-primary as a CSS variable', () => {
    renderButton('solid', 'primary')
    expect(screen.getByRole('button').style.color).toBe('var(--color-on-brand-primary)')
  })

  it.each(['outline', 'ghost', 'link'] as const)('%s error reads text-error', (variant) => {
    renderButton(variant, 'error')
    expect(screen.getByRole('button').style.color).toBe('var(--color-text-error)')
  })

  describe('on native', () => {
    const originalOS = Platform.OS
    beforeEach(() => {
      Platform.OS = 'ios'
    })
    afterEach(() => {
      Platform.OS = originalOS
    })

    const renderIn = (mode: ThemeMode, variant: ButtonVariant, color: ButtonColor) => {
      const button = (
        <Button variant={variant} color={color}>
          <ButtonText>Go</ButtonText>
        </Button>
      )
      const { container } = render(
        mode === 'light' ? <Surface theme="light">{button}</Surface> : button
      )
      return within(container).getByRole('button')
    }

    it.each(['dark', 'light'] as const)(
      '%s solid warning label is that mode’s on-status-warning',
      (mode) => {
        expect(renderIn(mode, 'solid', 'warning')).toHaveStyle({
          color: getSemanticColors(mode)['on-status-warning'],
        })
      }
    )

    it('renders a light solid label that differs from the dark one', () => {
      const dark = renderIn('dark', 'solid', 'warning').style.color
      const light = renderIn('light', 'solid', 'warning').style.color
      expect(light).not.toBe(dark)
    })

    it('resolves the light outline label and border for the light palette', () => {
      expect(renderIn('light', 'outline', 'primary')).toHaveStyle({
        color: semanticColorsLight['text-brand'],
        borderTopColor: semanticColorsLight['brand-primary'],
      })
    })
  })
})

// Gate 2 batch 10 r3: the light warning solid reads white on amber 500, with no
// per-tone exception. It misses 4.5:1 and is declared in contrast-baseline.json; the
// ratio is computed here so a token move surfaces as a number, not a stale literal.
describe('Button light warning label (TD-773)', () => {
  it('is the light on-status-warning, white, not the dark label', () => {
    expect(semanticColorsLight['on-status-warning']).toBe(semanticColorsLight['text-inverse'])
    expect(semanticColorsLight['on-status-warning']).not.toBe(
      semanticColorsDark['on-status-warning']
    )
  })

  it('reads on the light warning solid at large-text AA, below 4.5', () => {
    const ratio = contrast(
      semanticColorsLight['on-status-warning'],
      semanticColorsLight['status-warning-solid']
    )
    expect(ratio).toBeGreaterThanOrEqual(3)
    expect(ratio).toBeLessThan(4.5)
  })
})
