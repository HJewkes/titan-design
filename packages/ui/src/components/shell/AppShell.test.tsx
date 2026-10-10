import type React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { AppShell } from './AppShell'
import { type SideNavItem } from './SideNav'
import { Page } from '../ui/page'

// jsdom has no NativeWind transform, so surface className as data-cls for class-name assertions.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const Base = actual.View as React.ComponentType<Record<string, unknown>>
  return {
    ...actual,
    View: function ViewWithCls(props: { className?: string }) {
      return <Base {...props} dataSet={{ cls: props.className ?? '' }} />
    },
  }
})

const frameClasses = () =>
  screen.getByText('body').parentElement?.getAttribute('data-cls')?.split(' ') ?? []

const navItems: SideNavItem[] = [
  { key: 'notes', label: 'Notes', icon: null },
  { key: 'graph', label: 'Graph', icon: null },
]

describe('AppShell', () => {
  it('composes the SideNav rail from the supplied categories', () => {
    render(<AppShell brand="voltras" navItems={navItems} activeKey="notes" />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    ;['Notes', 'Graph'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    })
  })

  it('exposes navigation, banner and exactly one main landmark around a Page', () => {
    render(
      <AppShell brand="voltras" navItems={navItems} activeKey="notes">
        <Page>
          <Text>page body</Text>
        </Page>
      </AppShell>
    )
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders no main landmark unless the shell is told to', () => {
    render(<AppShell brand="voltras" navItems={navItems} activeKey="notes" />)
    expect(screen.queryByRole('main')).toBeNull()
  })

  it('renders the content region as main when isMainLandmark is set', () => {
    render(
      <AppShell brand="voltras" navItems={navItems} activeKey="notes" isMainLandmark>
        <Text>plain body</Text>
      </AppShell>
    )
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders the content-slot placeholder when no children are given', () => {
    render(<AppShell brand="voltras" navItems={navItems} activeKey="notes" />)
    expect(screen.getByText('main content region')).toBeInTheDocument()
  })

  it('mounts children in the content slot and drops the placeholder', () => {
    render(
      <AppShell brand="voltras" navItems={navItems} activeKey="graph">
        <Text>my page body</Text>
      </AppShell>
    )
    expect(screen.getByText('my page body')).toBeInTheDocument()
    expect(screen.queryByText('main content region')).not.toBeInTheDocument()
  })

  it('forwards nav taps through onNavigate', () => {
    const onNavigate = vi.fn()
    render(
      <AppShell brand="voltras" navItems={navItems} activeKey="notes" onNavigate={onNavigate} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }))
    expect(onNavigate).toHaveBeenCalledWith('graph')
  })

  it('renders app chrome in the top bar without knowing what it is', () => {
    render(
      <AppShell
        brand="voltras"
        navItems={navItems}
        activeKey="notes"
        topBarTrailing={<Text>3 jobs</Text>}
      />
    )
    expect(screen.getByText('3 jobs')).toBeInTheDocument()
  })

  it('takes a whole replacement top bar and nav', () => {
    render(
      <AppShell brand="voltras" topBar={<Text>my own bar</Text>} nav={<Text>my own rail</Text>}>
        <Text>body</Text>
      </AppShell>
    )
    expect(screen.getByText('my own bar')).toBeInTheDocument()
    expect(screen.getByText('my own rail')).toBeInTheDocument()
    expect(screen.queryByText('VOLTRAS')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('carries the brand through to the top bar', () => {
    render(<AppShell brand="agents" navItems={navItems} activeKey="notes" />)
    expect(screen.getByText('AGENTS')).toBeInTheDocument()
  })

  it('pads the content region with the responsive gutter by default', () => {
    render(
      <AppShell brand="voltras" navItems={navItems} activeKey="notes">
        <Text>body</Text>
      </AppShell>
    )
    expect(frameClasses()).toEqual(expect.arrayContaining(['p-gutter-sm', 'md:p-gutter-md']))
  })

  it('drops the content padding when contentPadding is none', () => {
    render(
      <AppShell brand="voltras" navItems={navItems} activeKey="notes" contentPadding="none">
        <Text>body</Text>
      </AppShell>
    )
    expect(frameClasses().filter((c) => c.includes('gutter'))).toEqual([])
  })

  it('has no a11y violations', async () => {
    const { container } = render(<AppShell brand="voltras" navItems={navItems} activeKey="notes" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
