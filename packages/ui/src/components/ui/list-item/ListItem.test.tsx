import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { View, Text } from 'react-native'
import {
  ListItem,
  ListItemIcon,
  ListItemContent,
  ListItemTrailing,
  ListItemDivider,
} from './ListItem'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

function MockIcon({ size = 20 }: { size?: number; className?: string }) {
  return <View testID="mock-icon" style={{ width: size, height: size }} />
}

describe('ListItem', () => {
  it('renders compound children', () => {
    render(
      <ListItem>
        <ListItemIcon icon={MockIcon} />
        <ListItemContent title="Profile" subtitle="Edit your profile" />
        <ListItemTrailing>
          <Text>{'>'}</Text>
        </ListItemTrailing>
      </ListItem>
    )

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Edit your profile')).toBeInTheDocument()
    expect(screen.getByText('>')).toBeInTheDocument()
  })

  it('handles press events when onPress is provided', () => {
    const onPress = vi.fn()
    render(
      <ListItem onPress={onPress} testID="list-item">
        <ListItemContent title="Pressable item" />
      </ListItem>
    )

    fireEvent.click(screen.getByTestId('list-item'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('exposes the pressable row as a button', () => {
    render(
      <ListItem onPress={() => {}}>
        <ListItemContent title="Pressable item" />
      </ListItem>
    )

    expect(screen.getByRole('button')).toHaveTextContent('Pressable item')
  })

  it('uses View when onPress is not provided', () => {
    render(
      <ListItem testID="list-item">
        <ListItemContent title="Static item" />
      </ListItem>
    )

    // Without onPress, should not have button role
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Static item')).toBeInTheDocument()
  })

  it('forwards extra props to the root View when onPress is not provided', () => {
    render(
      <ListItem testID="list-item" accessibilityLabel="Static row">
        <ListItemContent title="Static item" />
      </ListItem>
    )

    const root = screen.getByTestId('list-item')
    expect(root).toHaveAttribute('aria-label', 'Static row')
    expect(root).toContainElement(screen.getByText('Static item'))
  })
})

describe('ListItemContent', () => {
  it('renders title', () => {
    render(<ListItemContent title="Settings" />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders title and subtitle', () => {
    render(<ListItemContent title="Wi-Fi" subtitle="Connected" />)
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('omits subtitle when not provided', () => {
    render(<ListItemContent title="Bluetooth" />)
    expect(screen.getByText('Bluetooth')).toBeInTheDocument()
    expect(screen.queryByText('Connected')).not.toBeInTheDocument()
  })
})

describe('ListItemTrailing', () => {
  it('renders trailing content', () => {
    render(
      <ListItemTrailing>
        <Text>Badge</Text>
      </ListItemTrailing>
    )
    expect(screen.getByText('Badge')).toBeInTheDocument()
  })
})

describe('ListItemDivider', () => {
  it('renders with inset by default', () => {
    render(<ListItemDivider testID="divider" />)
    expect(screen.getByTestId('divider')).toBeInTheDocument()
  })

  it('renders full-width when inset is false', () => {
    render(<ListItemDivider inset={false} testID="divider-full" />)
    expect(screen.getByTestId('divider-full')).toBeInTheDocument()
  })
})

describe('ListItem accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <ListItem>
        <ListItemContent title="Accessible item" subtitle="With subtitle" />
      </ListItem>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no accessibility violations when pressable', async () => {
    const { container } = render(
      <ListItem onPress={() => {}}>
        <ListItemContent title="Pressable item" />
      </ListItem>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

/**
 * ListItem's row inset, pinned (AW-142 wave two).
 *
 * 12 down, 16 across — the loose rung of the row ladder DataRow now sits one
 * step below. Unchanged in pixels.
 */
describe('ListItem geometry resolves to the spacing tokens', () => {
  const renderRow = (onPress?: () => void) =>
    render(
      <ListItem onPress={onPress}>
        <ListItemContent title="Row title" />
      </ListItem>
    )

  it.each([
    ['ListItem', undefined, ['py-inset-md', 'px-inset-lg'], ['12px', '16px']],
    ['a pressable ListItem', vi.fn(), ['py-inset-md', 'px-inset-lg'], ['12px', '16px']],
  ] as const)('%s ships its row inset', (_name, onPress, classes, pixels) => {
    renderRow(onPress)
    const row = screen.getByText('Row title').parentElement?.parentElement ?? null
    expect(spacingClassesAt(row)).toEqual([...classes])
    expect(resolveAll([...classes])).toEqual([...pixels])
  })

  it('ListItemContent ships its stack gap', () => {
    renderRow()
    expect(spacingClassesAt(screen.getByText('Row title').parentElement)).toEqual(['gap-stack-sm'])
    expect(resolveAll(['gap-stack-sm'])).toEqual(['4px'])
  })
})
