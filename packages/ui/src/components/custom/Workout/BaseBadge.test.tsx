import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text, View } from 'react-native'
import { BaseBadge } from './BaseBadge'

describe('BaseBadge', () => {
  it('renders children', () => {
    render(<BaseBadge testID="bb"><Text>Hello</Text></BaseBadge>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('defaults to the plain variant border color', () => {
    render(<BaseBadge testID="bb"><Text>x</Text></BaseBadge>)
    expect(screen.getByTestId('bb')).toHaveStyle({ borderTopColor: '#1F1F1F' })
  })

  it('applies the pr variant border color', () => {
    render(
      <BaseBadge variant="pr" testID="bb">
        <Text>x</Text>
      </BaseBadge>,
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
        </BaseBadge>,
      )
      expect(screen.getByTestId('base-badge-icon')).toBeInTheDocument()
      expect(screen.getByTestId('my-icon')).toBeInTheDocument()
    })

    it('does not render an icon wrapper when no icon is provided', () => {
      render(<BaseBadge><Text>x</Text></BaseBadge>)
      expect(screen.queryByTestId('base-badge-icon')).not.toBeInTheDocument()
    })
  })

  describe('onPress', () => {
    it('wraps in a Pressable when onPress is provided', () => {
      const onPress = vi.fn()
      render(
        <BaseBadge onPress={onPress} accessibilityLabel="Press me">
          <Text>x</Text>
        </BaseBadge>,
      )
      const pressable = screen.getByTestId('base-badge-pressable')
      fireEvent.click(pressable)
      expect(onPress).toHaveBeenCalledOnce()
    })

    it('does not render a Pressable when onPress is omitted', () => {
      render(<BaseBadge><Text>x</Text></BaseBadge>)
      expect(screen.queryByTestId('base-badge-pressable')).not.toBeInTheDocument()
    })

    it('exposes a button role only when pressable', () => {
      render(
        <BaseBadge onPress={() => {}} accessibilityLabel="Press me">
          <Text>x</Text>
        </BaseBadge>,
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('size', () => {
    it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
      render(<BaseBadge size={size} testID="bb"><Text>x</Text></BaseBadge>)
      expect(screen.getByTestId('bb')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations as a static badge', async () => {
      const { container } = render(
        <BaseBadge accessibilityLabel="Static badge">
          <Text>x</Text>
        </BaseBadge>,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as a pressable badge', async () => {
      const { container } = render(
        <BaseBadge onPress={() => {}} accessibilityLabel="Pressable badge">
          <Text>x</Text>
        </BaseBadge>,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
