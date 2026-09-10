import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { WorkoutShell, DashboardShell } from './WorkoutShell'

describe('WorkoutShell', () => {
  it('composes the SideNav rail and its categories', () => {
    render(<WorkoutShell activeKey="live" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    ;['Live', 'Review', 'Plan', 'Body'].forEach((name) => {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    })
  })

  it('renders the content-slot placeholder when no children are given', () => {
    render(<WorkoutShell activeKey="live" />)
    expect(screen.getByText('main content region')).toBeInTheDocument()
  })

  it('mounts children in the content slot and drops the placeholder', () => {
    render(
      <WorkoutShell activeKey="review">
        <Text>my page body</Text>
      </WorkoutShell>
    )
    expect(screen.getByText('my page body')).toBeInTheDocument()
    expect(screen.queryByText('main content region')).not.toBeInTheDocument()
  })

  it('forwards nav taps through onNavigate', () => {
    const onNavigate = vi.fn()
    render(<WorkoutShell activeKey="live" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Body' }))
    expect(onNavigate).toHaveBeenCalledWith('body')
  })

  it('fills the generic top-bar slot with the workout chrome', () => {
    render(<WorkoutShell activeKey="live" state="rest" />)
    expect(screen.getByText('VOLTRAS')).toBeInTheDocument()
    expect(screen.getByText('REST')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Devices' })).toBeInTheDocument()
  })

  it('still exports the pre-AW-132 DashboardShell name', () => {
    expect(DashboardShell).toBe(WorkoutShell)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<WorkoutShell activeKey="live" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
