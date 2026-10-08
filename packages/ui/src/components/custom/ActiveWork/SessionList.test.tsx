import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionList, groupByPeriod, sessionPeriod } from './SessionList'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

const endedIn = (month: number, day: number) =>
  new Date(Date.UTC(2026, month - 1, day)).toISOString()
const interleaved = [7, 5, 7].map((month, i) => ({
  ...SESSION_FIXTURE[i]!,
  ended: endedIn(month, 10),
}))

const july = SESSION_FIXTURE.filter((s) => s.ended.startsWith('2026-07'))

function ControlledList({ initialId, onSelect }: { initialId?: string; onSelect: () => void }) {
  const [selectedId, setSelectedId] = useState(initialId)
  return (
    <SessionList
      sessions={SESSION_FIXTURE}
      now={SESSION_NOW}
      selectedId={selectedId}
      onSelect={(session) => {
        setSelectedId(session.id)
        onSelect()
      }}
    />
  )
}

const options = () => screen.getAllByRole('option')
const tabStops = () => options().filter((option) => option.getAttribute('tabindex') === '0')
const last = SESSION_FIXTURE.length - 1

function pressOnFocused(key: string) {
  fireEvent.keyDown(document.activeElement!, { key })
}

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

  it('keys period groups uniquely when months interleave, keeping input order', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<SessionList sessions={interleaved} now={SESSION_NOW} />)
    const messages = error.mock.calls.map((call) => call.join(' '))
    error.mockRestore()
    expect(messages.filter((m) => /same key|unique/i.test(m))).toEqual([])
    expect(screen.getAllByTestId('session-period').map((p) => p.textContent)).toEqual([
      'July 2026',
      'May 2026',
      'July 2026',
    ])
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
    fireEvent.click(options[3]!)
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

describe('SessionList keyboard', () => {
  it('makes the selected option the only tab stop', () => {
    render(
      <SessionList
        sessions={SESSION_FIXTURE}
        now={SESSION_NOW}
        selectedId={SESSION_FIXTURE[2]!.id}
      />
    )
    expect(tabStops()).toEqual([options()[2]])
  })

  it('makes the first option the only tab stop when nothing is selected', () => {
    render(<SessionList sessions={SESSION_FIXTURE} now={SESSION_NOW} />)
    expect(tabStops()).toEqual([options()[0]])
  })

  it('selects and focuses the next and previous session, across period groups', () => {
    const onSelect = vi.fn()
    render(<ControlledList initialId={SESSION_FIXTURE[last - 1]!.id} onSelect={onSelect} />)
    act(() => options()[last - 1]!.focus())

    pressOnFocused('ArrowDown')
    expect(options()[last]).toHaveFocus()
    expect(options()[last]).toHaveAttribute('aria-selected', 'true')

    pressOnFocused('ArrowUp')
    expect(options()[last - 1]).toHaveFocus()
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it('reports the session a key lands on to the host', () => {
    const onSelect = vi.fn()
    render(
      <SessionList
        sessions={SESSION_FIXTURE}
        now={SESSION_NOW}
        selectedId={SESSION_FIXTURE[0]!.id}
        onSelect={onSelect}
      />
    )
    fireEvent.keyDown(options()[0]!, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith(SESSION_FIXTURE[1])
  })

  it('reaches the ends with Home and End', () => {
    render(<ControlledList initialId={SESSION_FIXTURE[2]!.id} onSelect={() => {}} />)
    act(() => options()[2]!.focus())

    pressOnFocused('End')
    expect(options()[last]).toHaveFocus()

    pressOnFocused('Home')
    expect(options()[0]).toHaveFocus()
    expect(tabStops()).toEqual([options()[0]])
  })

  it('stops at the ends instead of wrapping', () => {
    const onSelect = vi.fn()
    render(<ControlledList initialId={SESSION_FIXTURE[last]!.id} onSelect={onSelect} />)
    act(() => options()[last]!.focus())

    pressOnFocused('ArrowDown')
    expect(onSelect).not.toHaveBeenCalled()
    expect(options()[last]).toHaveFocus()

    pressOnFocused('Home')
    onSelect.mockClear()
    pressOnFocused('ArrowUp')
    expect(onSelect).not.toHaveBeenCalled()
    expect(options()[0]).toHaveFocus()
  })

  it('has no a11y violations after keyboard selection', async () => {
    const { container } = render(<ControlledList onSelect={() => {}} />)
    act(() => options()[0]!.focus())
    pressOnFocused('ArrowDown')
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

  it('keeps non-adjacent months as separate periods in input order', () => {
    expect(groupByPeriod(interleaved).map((g) => [g.label, g.sessions.length])).toEqual([
      ['July 2026', 1],
      ['May 2026', 1],
      ['July 2026', 1],
    ])
  })
})
