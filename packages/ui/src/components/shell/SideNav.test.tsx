import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SideNav } from './SideNav'

describe('SideNav', () => {
  it('renders the four default categories as tabs in a tablist', () => {
    render(<SideNav activeKey="live" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    ;['Live', 'Review', 'Program', 'Body'].forEach((name) => {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    })
  })

  it('shows the accent bar only on the active category', () => {
    render(<SideNav activeKey="program" />)
    expect(screen.getAllByTestId('nav-item-accent')).toHaveLength(1)
    expect(
      within(screen.getByRole('tab', { name: 'Program' })).getByTestId('nav-item-accent')
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('tab', { name: 'Live' })).queryByTestId('nav-item-accent')
    ).toBeNull()
  })

  it('reports the tapped key via onNavigate', () => {
    const onNavigate = vi.fn()
    render(<SideNav activeKey="live" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Body' }))
    expect(onNavigate).toHaveBeenCalledWith('body')
  })

  it('keeps the active item as active even when it is also the liveKey (no double-state)', () => {
    render(<SideNav activeKey="live" liveKey="live" />)
    // active wins: exactly one accent bar, on Live (the live cue never applies to the active view)
    expect(screen.getAllByTestId('nav-item-accent')).toHaveLength(1)
    expect(
      within(screen.getByRole('tab', { name: 'Live' })).getByTestId('nav-item-accent')
    ).toBeInTheDocument()
  })

  it('accepts custom items', () => {
    render(<SideNav activeKey="a" items={[{ key: 'a', label: 'Alpha', icon: null }]} />)
    expect(screen.getByRole('tab', { name: 'Alpha' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SideNav activeKey="live" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
