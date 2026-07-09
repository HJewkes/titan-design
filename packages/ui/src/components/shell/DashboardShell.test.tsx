import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { DashboardShell } from './DashboardShell'

describe('DashboardShell', () => {
  it('composes the SideNav rail and its categories', () => {
    render(<DashboardShell activeKey="live" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    ;['Live', 'Review', 'Plan', 'Body'].forEach((name) => {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    })
  })

  it('renders the content-slot placeholder when no children are given', () => {
    render(<DashboardShell activeKey="live" />)
    expect(screen.getByText('main content region')).toBeInTheDocument()
  })

  it('mounts children in the content slot and drops the placeholder', () => {
    render(
      <DashboardShell activeKey="review">
        <Text>my page body</Text>
      </DashboardShell>
    )
    expect(screen.getByText('my page body')).toBeInTheDocument()
    expect(screen.queryByText('main content region')).not.toBeInTheDocument()
  })

  it('forwards nav taps through onNavigate', () => {
    const onNavigate = vi.fn()
    render(<DashboardShell activeKey="live" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Body' }))
    expect(onNavigate).toHaveBeenCalledWith('body')
  })

  it('has no a11y violations', async () => {
    const { container } = render(<DashboardShell activeKey="live" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
