import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { View } from 'react-native'
import { NavItem } from './NavItem'
import { ActivityIcon } from '../icons'
import { siblingSource, spacingClassesAt } from '../../test/spacing-resolver'
import { capturedByNode } from '../../test/classname-capture'

const icon = <ActivityIcon size={20} color="currentColor" />

describe('NavItem', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <View role="navigation" accessibilityLabel="Primary">
        <NavItem icon={icon} label="Live" active onPress={vi.fn()} />
      </View>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
  it('renders the label and is exposed as a button', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(screen.getByRole('button', { name: 'Live' })).toBeInTheDocument()
  })

  it('exposes aria-current=page when active and no tab semantics', () => {
    render(<NavItem icon={icon} label="Live" active />)
    const item = screen.getByRole('button', { name: 'Live' })
    expect(item).toHaveAttribute('aria-current', 'page')
    expect(item).not.toHaveAttribute('aria-selected')
    expect(screen.queryByRole('tab')).toBeNull()
  })

  // jsdom renders react-native-web, which drops accessibilityState, so read the element NavItem returns.
  it('hands native screen readers the selected state', () => {
    expect(NavItem({ icon, label: 'Live', active: true }).props.accessibilityState).toEqual({
      selected: true,
    })
    expect(NavItem({ icon, label: 'Live' }).props.accessibilityState).toEqual({ selected: false })
  })

  it('carries no aria-current attribute when inactive', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(screen.getByRole('button', { name: 'Live' })).not.toHaveAttribute('aria-current')
  })

  it('shows the accent bar when active', () => {
    render(<NavItem icon={icon} label="Live" active />)
    expect(screen.getByTestId('nav-item-accent')).toBeInTheDocument()
  })

  it('hides the accent bar when inactive', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(screen.queryByTestId('nav-item-accent')).toBeNull()
  })

  it('fires onPress when tapped', () => {
    const onPress = vi.fn()
    render(<NavItem icon={icon} label="Live" onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the live-elsewhere state', () => {
    const { container } = render(<NavItem icon={icon} label="Live" live />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('names a live inactive item with the live words', () => {
    render(<NavItem icon={icon} label="Train" live />)
    expect(screen.getByRole('button', { name: 'Train, live' })).toBeInTheDocument()
  })

  it('uses a custom liveLabel in the accessible name', () => {
    render(<NavItem icon={icon} label="Train" live liveLabel="set running" />)
    expect(screen.getByRole('button', { name: 'Train, set running' })).toBeInTheDocument()
  })

  it("keeps the active item's name free of the live words", () => {
    render(<NavItem icon={icon} label="Train" live active />)
    expect(screen.getByRole('button', { name: 'Train' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /live/ })).toBeNull()
  })

  it("keeps the idle item's name free of the live words", () => {
    render(<NavItem icon={icon} label="Train" />)
    expect(screen.getByRole('button', { name: 'Train' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /live/ })).toBeNull()
  })

  // nativewind compiles className to style, so jsdom cannot see the accent colour.
  // Assert an app-supplied accent leaves the rest of the active state intact; the
  // colour itself is guarded by the paired-token test in BrandLockup.test.
  it('keeps the active state when an app supplies its own accent', () => {
    render(
      <NavItem
        icon={icon}
        label="Graph"
        active
        accentClassName="text-dataviz-categorical-6"
        accentBarClassName="bg-dataviz-categorical-6"
      />
    )
    expect(screen.getByTestId('nav-item-accent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Graph' })).toBeInTheDocument()
  })
})

/**
 * The nav button's spacing, pinned (AW-142 wave three).
 *
 * The 3px icon-to-label gap is the one shell value kept below the 4px grain,
 * with its `// optical:` reason in the source. The test asserts both halves:
 * the value AND the comment, so a later pass cannot drop the justification and
 * leave an unexplained nudge behind.
 */
describe('NavItem keeps its optical 3px gap', () => {
  const source = siblingSource(import.meta.url, 'NavItem.tsx')

  const renderedClasses = (node: Element | null) =>
    capturedByNode.get(node as Element)?.split(/\s+/) ?? []

  it('renders gap-[3px] on the glyph-and-label stack', () => {
    render(<NavItem icon={icon} label="Live" />)
    const stack = screen.getByText('Live').parentElement
    expect(renderedClasses(stack)).toContain('gap-[3px]')
    expect(spacingClassesAt(stack)).toEqual([])
  })

  it('ships the reason beside it', () => {
    expect(source).toMatch(/\/\/ optical: 3px icon-to-micro-label/)
  })

  it('keeps the 46px target the specimen locks', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(renderedClasses(screen.getByText('Live').parentElement)).toEqual(
      expect.arrayContaining(['h-[46px]', 'w-[46px]'])
    )
  })
})
