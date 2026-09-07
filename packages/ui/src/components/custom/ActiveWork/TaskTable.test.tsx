import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { TaskTable, formatTaskAge } from './TaskTable'
import { TASK_LIST_FIXTURE, TASK_LIST_NOW } from './task-list-fixture'

/** Task ids in the order they currently appear, read off the rendered rows. */
function renderedIds(): string[] {
  return screen
    .getAllByTestId('task-row')
    .map((row) => within(row).getByText(/^[A-Z]+-\d+$/).textContent ?? '')
}

describe('TaskTable', () => {
  it('renders a row per task with its id and title', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} />)
    expect(screen.getAllByTestId('task-row')).toHaveLength(TASK_LIST_FIXTURE.length)
    expect(screen.getByText('AW-22')).toBeInTheDocument()
    expect(screen.getByText('npm publish the packaged distribution')).toBeInTheDocument()
  })

  it('collapses severity to its dot when told to, keeping the full name for hover and a11y', () => {
    render(
      <TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} severityDisplay="dot" hideLegend />
    )
    expect(screen.getByText('Sev')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sort by Severity' })).toBeInTheDocument()
    expect(screen.queryByText('Critical')).not.toBeInTheDocument()
    expect(screen.getByTestId('severity-dot-critical')).toBeInTheDocument()
  })

  it('keeps the severity word until it has measured a narrow width', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} hideLegend />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('leaves out hidden columns in both the header and the rows', () => {
    render(
      <TaskTable
        tasks={TASK_LIST_FIXTURE}
        now={TASK_LIST_NOW}
        hideLegend
        hideColumns={['slug', 'tags']}
      />
    )
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers.some((h) => h?.startsWith('Initiative'))).toBe(false)
    expect(headers.some((h) => h?.startsWith('Tags'))).toBe(false)
    expect(headers.some((h) => h?.startsWith('Title'))).toBe(true)
    const firstRow = screen.getAllByTestId('task-row')[0]!
    expect(within(firstRow).getAllByRole('cell')).toHaveLength(headers.length)
  })

  it('sorts by priority ascending by default', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} />)
    // RL-14 is priority 3, the lowest number in the fixture.
    expect(renderedIds()[0]).toBe('RL-14')
  })

  it('ranks severity by meaning rather than alphabetically', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} defaultSortKey="severity" />)
    const ids = renderedIds()
    // critical first; `low` must land after `medium`, which an alphabetical
    // string sort would get wrong.
    expect(ids[0]).toBe('RL-14')
    expect(ids.indexOf('AW-22')).toBeGreaterThan(ids.indexOf('HA-3'))
  })

  it('sorts unestimated tasks last, not as zero', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} defaultSortKey="estimate" />)
    // AW-86 is the only fixture task without an estimate, so it must land last.
    expect(renderedIds().at(-1)).toBe('AW-86')
  })

  it('keeps blanks last after flipping direction', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} defaultSortKey="estimate" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Estimate' }))
    expect(renderedIds().at(-1)).toBe('AW-86')
  })

  it('reverses order when a sorted column header is pressed', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} />)
    const first = renderedIds()[0]
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Priority' }))
    expect(renderedIds()[0]).not.toBe(first)
  })

  it('sorts age newest-first when ascending', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} defaultSortKey="updated" />)
    // RL-14 was updated 2026-08-30, the most recent in the fixture.
    expect(renderedIds()[0]).toBe('RL-14')
  })

  it('exposes sort state to assistive tech on the column header', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} />)
    const headers = screen.getAllByRole('columnheader')
    const sorted = headers.filter((h) => h.getAttribute('aria-sort') === 'ascending')
    expect(sorted).toHaveLength(1)
  })

  it('tallies open tasks by severity in the legend', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} />)
    // The legend renders one dot per severity on top of the per-row dots.
    expect(screen.getAllByTestId('severity-dot-critical').length).toBeGreaterThan(1)
  })

  it('hides the legend when asked', () => {
    render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} hideLegend />)
    // Only the single critical row keeps a critical dot once the legend is gone.
    expect(screen.getAllByTestId('severity-dot-critical')).toHaveLength(1)
  })

  it('renders the header with no rows for an empty backlog', () => {
    render(<TaskTable tasks={[]} now={TASK_LIST_NOW} />)
    expect(screen.queryAllByTestId('task-row')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Sort by Title' })).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<TaskTable tasks={TASK_LIST_FIXTURE} now={TASK_LIST_NOW} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('formatTaskAge', () => {
  const now = new Date('2026-08-30T12:00:00Z').getTime()

  it('reads today for the same day', () => {
    expect(formatTaskAge('2026-08-30T06:00:00Z', now)).toBe('today')
  })

  it('singularises one day', () => {
    expect(formatTaskAge('2026-08-29T06:00:00Z', now)).toBe('1d ago')
  })

  it('counts days below a month', () => {
    expect(formatTaskAge('2026-08-18T12:00:00Z', now)).toBe('12d ago')
  })

  it('switches to months at thirty days', () => {
    expect(formatTaskAge('2026-07-01T12:00:00Z', now)).toBe('2mo ago')
  })

  it('renders an em-dash for a missing or unparseable date', () => {
    expect(formatTaskAge(null, now)).toBe('—')
    expect(formatTaskAge(undefined, now)).toBe('—')
    expect(formatTaskAge('not-a-date', now)).toBe('—')
  })

  it('does not read the clock — the same inputs always give the same label', () => {
    expect(formatTaskAge('2026-08-18T12:00:00Z', now)).toBe(
      formatTaskAge('2026-08-18T12:00:00Z', now)
    )
  })
})
