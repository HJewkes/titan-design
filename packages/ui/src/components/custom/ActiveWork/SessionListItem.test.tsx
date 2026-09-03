import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionListItem, sessionRowMeta } from './SessionListItem'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

const session = SESSION_FIXTURE[0]!

describe('SessionListItem', () => {
  it('renders the date, track, title and the age · duration · tasks footer', () => {
    render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.getByText('Jul 12')).toBeInTheDocument()
    expect(screen.getByText('canonical')).toBeInTheDocument()
    expect(screen.getByText(session.title)).toBeInTheDocument()
    expect(screen.getByText('1d ago · 1h 4m · 6 tasks')).toBeInTheDocument()
  })

  it('exposes selection to assistive tech and shows the accent bar only when selected', () => {
    const { rerender } = render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByTestId('session-list-item-accent')).not.toBeInTheDocument()
    rerender(<SessionListItem session={session} now={SESSION_NOW} selected />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('session-list-item-accent')).toBeInTheDocument()
  })

  it('calls onSelect when pressed', () => {
    const onSelect = vi.fn()
    render(<SessionListItem session={session} now={SESSION_NOW} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('option'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('singularises one task and drops the count when no task is mentioned', () => {
    expect(sessionRowMeta(session, SESSION_NOW, 1)).toMatch(/· 1 task$/)
    expect(sessionRowMeta(session, SESSION_NOW, 0)).toBe('1d ago · 1h 4m')
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
