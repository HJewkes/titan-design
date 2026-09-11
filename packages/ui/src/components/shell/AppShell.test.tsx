import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { AppShell } from './AppShell'
import { type SideNavItem } from './SideNav'

const navItems: SideNavItem[] = [
  { key: 'notes', label: 'Notes', icon: null },
  { key: 'graph', label: 'Graph', icon: null },
]

describe('AppShell', () => {
  it('composes the SideNav rail from the supplied categories', () => {
    render(<AppShell navItems={navItems} activeKey="notes" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    ;['Notes', 'Graph'].forEach((name) => {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    })
  })

  it('renders the content-slot placeholder when no children are given', () => {
    render(<AppShell navItems={navItems} activeKey="notes" />)
    expect(screen.getByText('main content region')).toBeInTheDocument()
  })

  it('mounts children in the content slot and drops the placeholder', () => {
    render(
      <AppShell navItems={navItems} activeKey="graph">
        <Text>my page body</Text>
      </AppShell>
    )
    expect(screen.getByText('my page body')).toBeInTheDocument()
    expect(screen.queryByText('main content region')).not.toBeInTheDocument()
  })

  it('forwards nav taps through onNavigate', () => {
    const onNavigate = vi.fn()
    render(<AppShell navItems={navItems} activeKey="notes" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Graph' }))
    expect(onNavigate).toHaveBeenCalledWith('graph')
  })

  it('renders app chrome in the top bar without knowing what it is', () => {
    render(<AppShell navItems={navItems} activeKey="notes" topBarTrailing={<Text>3 jobs</Text>} />)
    expect(screen.getByText('3 jobs')).toBeInTheDocument()
  })

  it('takes a whole replacement top bar and nav', () => {
    render(
      <AppShell topBar={<Text>my own bar</Text>} nav={<Text>my own rail</Text>}>
        <Text>body</Text>
      </AppShell>
    )
    expect(screen.getByText('my own bar')).toBeInTheDocument()
    expect(screen.getByText('my own rail')).toBeInTheDocument()
    expect(screen.queryByText('VOLTRAS')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('carries the brand through to the top bar', () => {
    render(<AppShell brand="agents" navItems={navItems} activeKey="notes" />)
    expect(screen.getByText('AGENTS')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<AppShell navItems={navItems} activeKey="notes" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
