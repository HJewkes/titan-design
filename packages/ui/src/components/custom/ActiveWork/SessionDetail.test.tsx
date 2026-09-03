import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionDetail, stripLeadingHeading } from './SessionDetail'
import { SESSION_FIXTURE, SESSION_NOW, SESSION_TASK_FIXTURE } from './session-fixture'
import { extractTaskRefs } from './session-linkers'

const session = SESSION_FIXTURE[0]!
const adhoc = SESSION_FIXTURE[1]!

describe('SessionDetail', () => {
  it('renders the header: title, date, age, duration and session id', () => {
    render(<SessionDetail session={session} now={SESSION_NOW} />)
    expect(screen.getByText(session.title)).toBeInTheDocument()
    expect(screen.getByText('Jul 12, 2026')).toBeInTheDocument()
    expect(screen.getByText('1d ago')).toBeInTheDocument()
    expect(screen.getByText('· 1h 4m')).toBeInTheDocument()
    expect(screen.getByText(session.id)).toBeInTheDocument()
  })

  it('lists every distinct task the log touches, once each, in first-seen order', () => {
    render(<SessionDetail session={session} now={SESSION_NOW} />)
    const strip = within(screen.getByTestId('session-tasks-touched'))
    const refs = extractTaskRefs(session.body)
    expect(refs.length).toBeGreaterThan(1)
    for (const id of refs) expect(strip.getByText(id)).toBeInTheDocument()
  })

  it('routes presses on task pills and on in-body references to the host', () => {
    const onPressTask = vi.fn()
    const onPressLink = vi.fn()
    const onPressPr = vi.fn()
    render(
      <SessionDetail
        session={adhoc}
        now={SESSION_NOW}
        onPressTask={onPressTask}
        onPressLink={onPressLink}
        onPressPr={onPressPr}
      />
    )
    fireEvent.click(within(screen.getByTestId('session-tasks-touched')).getByText('AW-17'))
    expect(onPressTask).toHaveBeenCalledWith('AW-17')
    fireEvent.click(screen.getByTestId('prose-ref-wiki'))
    expect(onPressLink).toHaveBeenCalledWith('setup-walkthrough')
    fireEvent.click(screen.getByTestId('prose-ref-pr'))
    expect(onPressPr).toHaveBeenCalledWith(42)
  })

  it('leaves the leading h1 to the header and renders the rest as prose', () => {
    render(<SessionDetail session={adhoc} now={SESSION_NOW} />)
    const body = within(screen.getByTestId('session-body'))
    expect(body.queryByText(adhoc.title)).not.toBeInTheDocument()
    expect(body.getByText(/Tightened the install section/)).toBeInTheDocument()
  })

  it('expands the tasks-touched strip into a table only when task rows are supplied', () => {
    const { rerender } = render(<SessionDetail session={adhoc} now={SESSION_NOW} />)
    expect(screen.queryByRole('button', { name: /table/ })).not.toBeInTheDocument()
    rerender(<SessionDetail session={adhoc} now={SESSION_NOW} tasks={SESSION_TASK_FIXTURE} />)
    expect(screen.queryByTestId('task-row')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /table/ }))
    const rows = screen.getAllByTestId('task-row')
    expect(rows).toHaveLength(1)
    expect(within(rows[0]!).getByText('AW-17')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <SessionDetail session={adhoc} now={SESSION_NOW} onPressTask={() => {}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('stripLeadingHeading', () => {
  it('drops a first-line h1 and nothing else', () => {
    expect(stripLeadingHeading('# Title\n\nBody')).toBe('\nBody')
    expect(stripLeadingHeading('\n# Title\nBody')).toBe('Body')
    expect(stripLeadingHeading('## Section\nBody')).toBe('## Section\nBody')
    expect(stripLeadingHeading('Body only')).toBe('Body only')
  })
})
