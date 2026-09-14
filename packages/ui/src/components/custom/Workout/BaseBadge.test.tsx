import { describe, it, expect, vi } from 'vitest'
import {
  siblingSource,
  sizeClasses,
  spacingClassesIn,
  resolveAll,
} from '../../../test/spacing-resolver'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text, View } from 'react-native'
import { BaseBadge } from './BaseBadge'
import { getSemanticColors } from '../../../theme/tokens/semantic'

// Read from the token, not pinned: these used to be hand-copied hexes and
// silently desynced when borders became alpha hairlines (TD-07.16).
const T = getSemanticColors('dark')

describe('BaseBadge', () => {
  it('renders children', () => {
    render(
      <BaseBadge testID="bb">
        <Text>Hello</Text>
      </BaseBadge>
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('defaults to the plain variant border color', () => {
    render(
      <BaseBadge testID="bb">
        <Text>x</Text>
      </BaseBadge>
    )
    expect(screen.getByTestId('bb')).toHaveStyle({ borderTopColor: T['hairline-default'] })
  })

  it('applies the pr variant border color', () => {
    render(
      <BaseBadge variant="pr" testID="bb">
        <Text>x</Text>
      </BaseBadge>
    )
    expect(screen.getByTestId('bb')).toHaveStyle({
      borderTopColor: 'rgba(255, 121, 0, 0.3)',
    })
  })

  describe('icon', () => {
    it('renders the icon when provided and hides it from the a11y tree', () => {
      render(
        <BaseBadge icon={<View testID="my-icon" />}>
          <Text>x</Text>
        </BaseBadge>
      )
      expect(screen.getByTestId('base-badge-icon')).toBeInTheDocument()
      expect(screen.getByTestId('my-icon')).toBeInTheDocument()
    })

    it('does not render an icon wrapper when no icon is provided', () => {
      render(
        <BaseBadge>
          <Text>x</Text>
        </BaseBadge>
      )
      expect(screen.queryByTestId('base-badge-icon')).not.toBeInTheDocument()
    })
  })

  describe('onPress', () => {
    it('wraps in a Pressable when onPress is provided', () => {
      const onPress = vi.fn()
      render(
        <BaseBadge onPress={onPress} accessibilityLabel="Press me">
          <Text>x</Text>
        </BaseBadge>
      )
      const pressable = screen.getByTestId('base-badge-pressable')
      fireEvent.click(pressable)
      expect(onPress).toHaveBeenCalledOnce()
    })

    it('does not render a Pressable when onPress is omitted', () => {
      render(
        <BaseBadge>
          <Text>x</Text>
        </BaseBadge>
      )
      expect(screen.queryByTestId('base-badge-pressable')).not.toBeInTheDocument()
    })

    it('exposes a button role only when pressable', () => {
      render(
        <BaseBadge onPress={() => {}} accessibilityLabel="Press me">
          <Text>x</Text>
        </BaseBadge>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('size', () => {
    it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
      render(
        <BaseBadge size={size} testID="bb">
          <Text>x</Text>
        </BaseBadge>
      )
      expect(screen.getByTestId('bb')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations as a static badge', async () => {
      const { container } = render(
        <BaseBadge accessibilityLabel="Static badge">
          <Text>x</Text>
        </BaseBadge>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as a pressable badge', async () => {
      const { container } = render(
        <BaseBadge onPress={() => {}} accessibilityLabel="Pressable badge">
          <Text>x</Text>
        </BaseBadge>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

/**
 * BaseBadge's geometry, pinned (AW-142).
 *
 * The pixels below are the ones it shipped as `paddingH`/`paddingV` numbers on
 * `baseBadgeSizeConfig`, except the icon gap: 3px became `inline-sm` (4) so the
 * deprecated badge matches Pill, the primitive replacing it (`Pill.tsx` `gap-1`).
 * `spacing-resolver` explains why the classes come from the source.
 */
describe('BaseBadge geometry resolves to the squish ramp', () => {
  const source = siblingSource(import.meta.url, 'BaseBadge.tsx')

  const shipped = [
    ['sm', ['px-1.5', 'py-squish-y-sm'], ['6px', '2px']],
    ['md', ['px-squish-x-sm', 'py-squish-y-sm'], ['8px', '2px']],
    ['lg', ['px-2.5', 'py-squish-y-md'], ['10px', '4px']],
  ] as const

  it.each(shipped)('%s keeps its inset', (level, classes, pixels) => {
    expect(sizeClasses(source, 'sizePadding', level)).toEqual([...classes])
    expect(resolveAll([...classes])).toEqual([...pixels])
  })

  it('takes the icon gap off the inline ramp, at Pill 4px', () => {
    expect(spacingClassesIn(source, 'BaseBadge')).toEqual(['gap-inline-sm'])
    expect(resolveAll(['gap-inline-sm'])).toEqual(['4px'])
  })
})
