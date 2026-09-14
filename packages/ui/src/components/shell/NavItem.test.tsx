import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavItem } from './NavItem'
import { ActivityIcon } from '../icons'
import { siblingSource } from '../../test/spacing-resolver'

const icon = <ActivityIcon size={20} color="currentColor" />

describe('NavItem', () => {
  it('renders the label and is exposed as a tab', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(screen.getByRole('tab', { name: 'Live' })).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('tab', { name: 'Live' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the live-elsewhere state', () => {
    const { container } = render(<NavItem icon={icon} label="Live" live />)
    expect(container.firstChild).toBeInTheDocument()
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
        accentClassName="text-data-3"
        accentBarClassName="bg-data-3"
      />
    )
    expect(screen.getByTestId('nav-item-accent')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Graph' })).toBeInTheDocument()
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

  it('ships gap-[3px] with the reason beside it', () => {
    expect(source).toContain('gap-[3px]')
    expect(source).toMatch(/\/\/ optical: 3px icon-to-micro-label/)
  })

  it('keeps the 46px target the specimen locks', () => {
    expect(source).toContain('h-[46px] w-[46px]')
  })
})
