import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Table, TableBody } from '../Table'
import { TaskRow } from './TaskRow'
import type { TaskListItem } from './TaskRow'

const task: TaskListItem = {
  slug: 'active-work',
  id: 'AW-22',
  title: 'Read-only dashboard prototypes',
  severity: 'high',
  priority: 20,
  estimate: 8,
  tags: ['dashboard', 'titan', 'specimen', 'extra'],
  updated: '2026-08-29T10:00:00Z',
}

/** TaskRow composes TableRow/TableCell, so it needs a Table for row semantics. */
function renderRow(overrides: Partial<TaskListItem> = {}, ageLabel = '1d ago') {
  return render(
    <Table density="dense">
      <TableBody>
        <TaskRow task={{ ...task, ...overrides }} ageLabel={ageLabel} />
      </TableBody>
    </Table>
  )
}

describe('TaskRow', () => {
  it('reveals the elided tags when the overflow count is hovered', () => {
    renderRow()
    expect(screen.queryByText('specimen')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByText('+2').parentElement!)
    expect(screen.getByText('specimen')).toBeInTheDocument()
    expect(screen.getByText('extra')).toBeInTheDocument()
  })

  it('shows the exact date behind the age label on hover', () => {
    renderRow()
    fireEvent.mouseEnter(screen.getByText('1d ago').parentElement!)
    expect(screen.getByText('Aug 29, 2026')).toBeInTheDocument()
  })

  it('renders every column of a fully-populated task', () => {
    renderRow()
    expect(screen.getByText('active-work')).toBeInTheDocument()
    expect(screen.getByText('AW-22')).toBeInTheDocument()
    expect(screen.getByText('Read-only dashboard prototypes')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('1d ago')).toBeInTheDocument()
  })

  it('shows the first two tags and collapses the rest into a count', () => {
    renderRow()
    expect(screen.getByText('dashboard')).toBeInTheDocument()
    expect(screen.getByText('titan')).toBeInTheDocument()
    expect(screen.queryByText('specimen')).not.toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('omits the overflow count when the tags all fit', () => {
    renderRow({ tags: ['one'] })
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('handles a task with no tags at all', () => {
    renderRow({ tags: undefined })
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
    expect(screen.getByText('AW-22')).toBeInTheDocument()
  })

  it('renders an em-dash for an absent estimate rather than a zero', () => {
    renderRow({ estimate: undefined })
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders an em-dash in the severity column when severity is unset', () => {
    renderRow({ severity: undefined, estimate: 8 })
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByTestId(/^severity-dot-/)).not.toBeInTheDocument()
  })

  it('exposes one row with eight cells to assistive tech', () => {
    renderRow()
    expect(screen.getByRole('row')).toBeInTheDocument()
    expect(screen.getAllByRole('cell')).toHaveLength(8)
  })

  it('has no a11y violations', async () => {
    const { container } = renderRow()
    expect(await axe(container)).toHaveNoViolations()
  })
})
