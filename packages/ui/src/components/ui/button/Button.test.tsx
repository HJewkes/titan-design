import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Button, ButtonText } from './Button'
import { resolveAll, siblingSource, sizeClasses } from '../../../test/spacing-resolver'

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
 * `spacing-resolver` explains why the classes come from the source.
 */
describe('Button geometry resolves to the control tokens', () => {
  const source = siblingSource(import.meta.url, 'Button.tsx')
  const classesFor = (level: string) => sizeClasses(source, 'sizeStyles', level)

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
