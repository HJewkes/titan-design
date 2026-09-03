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
    expect(screen.getByText('1d ago · 1h 4m · 6 tasks · canonical')).toBeInTheDocument()
    expect(screen.queryByText('Jul 12')).not.toBeInTheDocument()
  })

  it('shows the exact end time and the task ids on hover', () => {
    render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.queryByTestId('session-list-item-hover')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByRole('option').firstElementChild!)
    const hover = screen.getByTestId('session-list-item-hover')
    expect(hover).toHaveTextContent('07/12/2026, 02:52 PM')
    expect(hover).toHaveTextContent('AW-17 AW-18')
  })

  it('exposes selection to assistive tech and shows the accent bar only when selected', () => {
    const { rerender } = render(<SessionListItem session={session} now={SESSION_NOW} />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByTestId('session-list-item-accent')).not.toBeInTheDocument()
    rerender(<SessionListItem session={session} now={SESSION_NOW} selected />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('session-list-item-accent')).toBeInTheDocument()
  })

  it('still selects on press with the hover surface wrapped around it', () => {
    const onSelect = vi.fn()
    render(<SessionListItem session={session} now={SESSION_NOW} onSelect={onSelect} />)
    fireEvent.click(screen.getByText(session.title))
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
