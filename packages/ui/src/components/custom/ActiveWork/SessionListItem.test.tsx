import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionListItem, sessionRowMeta } from './SessionListItem'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

const session = SESSION_FIXTURE[0]!

describe('SessionListItem', () => {
  it('leads with the title and reads age · duration · tasks · track beneath it', () => {
    render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.getByText(session.title)).toBeInTheDocument()
    expect(screen.getByRole('option')).toHaveAccessibleName(/1d ago · 1h 4m · 6 tasks · canonical$/)
    expect(screen.getByText('6 tasks')).toBeInTheDocument()
    expect(screen.queryByText('Jul 12')).not.toBeInTheDocument()
  })

  it('shows the exact end time when the age is hovered', () => {
    render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.queryByText('07/12/2026, 02:52 PM')).not.toBeInTheDocument()
    fireEvent.pointerEnter(screen.getByTestId('session-age'))
    expect(screen.getByText('07/12/2026, 02:52 PM')).toBeInTheDocument()
    fireEvent.pointerLeave(screen.getByTestId('session-age'))
    expect(screen.queryByText('07/12/2026, 02:52 PM')).not.toBeInTheDocument()
  })

  it('lists the task ids when the count is hovered', () => {
    render(<SessionListItem session={session} now={SESSION_NOW} />)
    fireEvent.pointerEnter(screen.getByTestId('session-task-count'))
    expect(screen.getByText(/^AW-17 AW-18/)).toBeInTheDocument()
  })

  it('exposes selection to assistive tech and shows the accent bar only when selected', () => {
    const { rerender } = render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByTestId('session-list-item-accent')).not.toBeInTheDocument()
    rerender(<SessionListItem session={session} now={SESSION_NOW} selected />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('session-list-item-accent')).toBeInTheDocument()
  })

  it('selects on press, including a press on a hover field', () => {
    const onSelect = vi.fn()
    render(<SessionListItem session={session} now={SESSION_NOW} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('6 tasks'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('singularises one task and drops the count when no task is mentioned', () => {
    expect(sessionRowMeta(session, SESSION_NOW, 1)).toBe('1d ago · 1h 4m · 1 task · canonical')
    expect(sessionRowMeta(session, SESSION_NOW, 0)).toBe('1d ago · 1h 4m · canonical')
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <div role="listbox" aria-label="Sessions">
        <SessionListItem session={session} now={SESSION_NOW} selected />
      </div>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
