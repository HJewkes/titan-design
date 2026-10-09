import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ConversationTurn } from './ConversationTurn'
import {
  SESSION_DEFAULT,
  SESSION_LONG_TEXT,
  SESSION_ONE_HUGE_TURN,
  SESSION_ORIGINS,
  SESSION_TOOLS_ONLY,
} from './session-fixture'
import type { TimelineTurn } from './session-types'

const withCalls = SESSION_DEFAULT.turns.find((t) => t.toolCalls.length > 1 && t.assistant.length)!
const huge = SESSION_ONE_HUGE_TURN.turns[0]!
const toolGroup = () => screen.getByRole('button', { name: /^Tool calls: / })
const toolRows = () => screen.queryAllByTestId('tool-call-row')

describe('ConversationTurn', () => {
  it('names the article by turn number, time and call counts', () => {
    render(<ConversationTurn turn={withCalls} isUTC />)

    const name = `Turn ${withCalls.index + 1}, .*, ${withCalls.toolCalls.length} tool calls`
    expect(screen.getByRole('article', { name: new RegExp(`^${name}`) })).toBeInTheDocument()
  })

  it('labels a prompt User and quiet openers by their origin, never User', () => {
    render(
      <>
        {SESSION_ORIGINS.turns.map((turn) => (
          <ConversationTurn key={turn.index} turn={turn} />
        ))}
      </>
    )

    expect(screen.getAllByText('User')).toHaveLength(2)
    expect(screen.getByText('Injected')).toBeInTheDocument()
    expect(screen.getByText('Channel')).toBeInTheDocument()
    expect(screen.getByText('Compaction summary')).toBeInTheDocument()
  })

  it('renders no opener for origin none and no assistant block without text', () => {
    render(<ConversationTurn turn={SESSION_TOOLS_ONLY.turns[0]!} />)

    expect(screen.queryByText('User')).not.toBeInTheDocument()
    expect(screen.queryByText('Assistant')).not.toBeInTheDocument()
    expect(toolGroup()).toBeInTheDocument()
  })

  it('takes host wording for each speaker', () => {
    render(<ConversationTurn turn={withCalls} roleLabels={{ user: 'Owner', assistant: 'Agent' }} />)

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Agent')).toBeInTheDocument()
  })

  it('mounts no tool row while closed and at most limits.toolRows plus the more row when open', () => {
    render(<ConversationTurn turn={huge} limits={{ toolRows: 25 }} />)
    expect(toolRows()).toHaveLength(0)

    fireEvent.click(toolGroup())

    expect(toolRows()).toHaveLength(25)
    const more = screen.getByRole('button', { name: 'Show 375 more calls' })
    fireEvent.click(more)
    expect(toolRows()).toHaveLength(50)
  })

  it('stays put when controlled and reports the toggle', () => {
    const onExpandedChange = vi.fn()
    render(
      <ConversationTurn turn={withCalls} expanded={false} onExpandedChange={onExpandedChange} />
    )

    fireEvent.click(toolGroup())

    expect(onExpandedChange).toHaveBeenCalledWith(true)
    expect(toolRows()).toHaveLength(0)
  })

  it('toggles itself when uncontrolled, starting from defaultExpanded', () => {
    render(<ConversationTurn turn={withCalls} defaultExpanded />)
    expect(toolRows()).toHaveLength(withCalls.toolCalls.length)

    fireEvent.click(toolGroup())

    expect(toolRows()).toHaveLength(0)
  })

  it('shows user markdown literally and renders assistant markdown', () => {
    const markdownTurn: TimelineTurn = {
      ...SESSION_LONG_TEXT.turns[2]!,
      user: { ...SESSION_LONG_TEXT.turns[2]!.user!, text: 'keep **north** rows' },
    }
    const { container } = render(<ConversationTurn turn={markdownTurn} />)

    expect(screen.getByText('keep **north** rows')).toBeInTheDocument()
    expect(screen.getByText('north', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('src/orchard/index.ts')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('## Crate count')
  })

  it('previews a long message and shows the rest on Show more', () => {
    const turn = SESSION_LONG_TEXT.turns[0]!
    const lastLine = turn.user!.text.split('\n').pop()!
    const { container } = render(<ConversationTurn turn={turn} limits={{ previewChars: 200 }} />)
    expect(container).not.toHaveTextContent(lastLine)

    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[0]!)

    expect(container).toHaveTextContent(lastLine)
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument()
  })

  it('shows the cut notice on a truncated message, and the action only with a handler', () => {
    const turn = SESSION_LONG_TEXT.turns[0]!
    const { rerender } = render(<ConversationTurn turn={turn} />)
    expect(screen.getAllByText('Text cut at 4,000 characters')).toHaveLength(turn.assistant.length)
    expect(screen.queryByRole('button', { name: 'Load full text' })).not.toBeInTheDocument()

    const onRequestFullText = vi.fn()
    rerender(<ConversationTurn turn={turn} onRequestFullText={onRequestFullText} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Load full text' })[0]!)

    expect(onRequestFullText).toHaveBeenCalledWith(turn.assistant[0])
  })

  it('stays readable when dimmed', () => {
    render(<ConversationTurn turn={withCalls} isDimmed />)

    expect(screen.getByRole('article')).toHaveAttribute('data-testid', 'conversation-turn-dimmed')
    expect(toolGroup()).toBeInTheDocument()
  })

  it.each([
    ['closed', {}],
    ['open', { defaultExpanded: true }],
    ['dimmed', { isDimmed: true }],
  ])('has no accessibility violations (%s)', async (_name, props) => {
    const { container } = render(<ConversationTurn turn={withCalls} isUTC {...props} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
