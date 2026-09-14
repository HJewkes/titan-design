import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SideNav, type SideNavItem } from './SideNav'
import { resolveAll, siblingSource, spacingClassesIn } from '../../test/spacing-resolver'

// A generic four-category set — the rail has no built-in categories any more.
const items: SideNavItem[] = [
  { key: 'live', label: 'Live', icon: null },
  { key: 'review', label: 'Review', icon: null },
  { key: 'program', label: 'Plan', icon: null },
  { key: 'body', label: 'Body', icon: null },
]

describe('SideNav', () => {
  it('renders the supplied categories as tabs in a tablist', () => {
    render(<SideNav items={items} activeKey="live" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    ;['Live', 'Review', 'Plan', 'Body'].forEach((name) => {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    })
  })

  it('shows the accent bar only on the active category', () => {
    render(<SideNav items={items} activeKey="program" />)
    expect(screen.getAllByTestId('nav-item-accent')).toHaveLength(1)
    expect(
      within(screen.getByRole('tab', { name: 'Plan' })).getByTestId('nav-item-accent')
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('tab', { name: 'Live' })).queryByTestId('nav-item-accent')
    ).toBeNull()
  })

  it('reports the tapped key via onNavigate', () => {
    const onNavigate = vi.fn()
    render(<SideNav items={items} activeKey="live" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Body' }))
    expect(onNavigate).toHaveBeenCalledWith('body')
  })

  it('keeps the active item as active even when it is also the liveKey (no double-state)', () => {
    render(<SideNav items={items} activeKey="live" liveKey="live" />)
    // active wins: exactly one accent bar, on Live (the live cue never applies to the active view)
    expect(screen.getAllByTestId('nav-item-accent')).toHaveLength(1)
    expect(
      within(screen.getByRole('tab', { name: 'Live' })).getByTestId('nav-item-accent')
    ).toBeInTheDocument()
  })

  it('accepts an app-specific item set', () => {
    render(<SideNav activeKey="a" items={[{ key: 'a', label: 'Alpha', icon: null }]} />)
    expect(screen.getByRole('tab', { name: 'Alpha' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SideNav items={items} activeKey="live" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

/**
 * The rail's spacing, pinned (AW-142 wave three).
 *
 * `py-3` is named `py-inset-md`; the 6px item gap is the numeric rung `gap-1.5`
 * (the stack ramp runs 4 → 8, so 6 has no semantic key and stays a number
 * rather than moving a pixel). The 60px width is specimen geometry, not
 * spacing, and is asserted here so a spacing edit cannot quietly widen the rail.
 */
describe('SideNav geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'SideNav.tsx')

  it('ships gap-1.5 and py-inset-md', () => {
    expect(spacingClassesIn(source, 'SideNav')).toEqual(['gap-1.5', 'py-inset-md'])
    expect(resolveAll(['gap-1.5', 'py-inset-md'])).toEqual(['6px', '12px'])
  })

  it('keeps the 60px rail the specimen locks', () => {
    expect(source).toContain('w-[60px]')
  })
})
