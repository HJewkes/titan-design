import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionList, groupByPeriod, sessionPeriod } from './SessionList'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

const july = SESSION_FIXTURE.filter((s) => s.ended.startsWith('2026-07'))

describe('SessionList', () => {
  it('renders a row per session under a count heading, inside a listbox', () => {
    render(<SessionList sessions={SESSION_FIXTURE} now={SESSION_NOW} />)
    expect(screen.getByText('6 sessions')).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: '6 sessions' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(SESSION_FIXTURE.length)
  })

  it('divides the list by month once it spans more than one, and not before', () => {
    const { rerender } = render(<SessionList sessions={SESSION_FIXTURE} now={SESSION_NOW} />)
    expect(screen.getAllByTestId('session-period').map((p) => p.textContent)).toEqual([
      'July 2026',
      'May 2026',
    ])
    rerender(<SessionList sessions={july} now={SESSION_NOW} />)
    expect(screen.queryByTestId('session-period')).not.toBeInTheDocument()
  })

  it('marks only the selected id and reports the pressed session to the host', () => {
    const onSelect = vi.fn()
    render(
      <SessionList
        sessions={SESSION_FIXTURE}
        now={SESSION_NOW}
        selectedId={SESSION_FIXTURE[1]!.id}
        onSelect={onSelect}
      />
    )
    const options = screen.getAllByRole('option')
    expect(options.filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByText(SESSION_FIXTURE[3]!.title))
    expect(onSelect).toHaveBeenCalledWith(SESSION_FIXTURE[3])
  })

  it('singularises the heading and accepts a custom label', () => {
    const { rerender } = render(
      <SessionList sessions={SESSION_FIXTURE.slice(0, 1)} now={SESSION_NOW} />
    )
    expect(screen.getByText('1 session')).toBeInTheDocument()
    rerender(<SessionList sessions={SESSION_FIXTURE} now={SESSION_NOW} label="Recent" />)
    expect(screen.getByRole('listbox', { name: 'Recent' })).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <SessionList
        sessions={SESSION_FIXTURE}
        now={SESSION_NOW}
        selectedId={SESSION_FIXTURE[0]!.id}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('period grouping', () => {
  it('labels a session by the calendar month it ended in, in UTC', () => {
    expect(sessionPeriod('2026-07-01T00:30:00Z')).toBe('July 2026')
    expect(sessionPeriod('nope')).toBe('Undated')
  })

  it('groups consecutive sessions and keeps the given order', () => {
    const groups = groupByPeriod(SESSION_FIXTURE)
    expect(groups.map((g) => [g.label, g.sessions.length])).toEqual([
      ['July 2026', 5],
      ['May 2026', 1],
    ])
  })
})
