import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { expectBoundedMount } from '../../../test/scale'
import { searchTurns } from './conversation-model'
import { SessionConversation } from './SessionConversation'
import {
  SESSION_DEFAULT,
  SESSION_EMPTY,
  SESSION_HOSTILE,
  SESSION_LARGE,
  SESSION_MIDNIGHT,
} from './session-fixture'
import { SEARCH_WORDS } from './session-fixture-words'

const turns = SESSION_DEFAULT.turns
const articles = () => screen.getAllByRole('article')
const dimmed = () => screen.queryAllByTestId('conversation-turn-dimmed')
const groupOf = (turnIndex: number) =>
  within(articles()[turnIndex]!).getByRole('button', { name: /^Tool calls: / })
const firstWithCalls = turns.find((t) => t.toolCalls.length > 0)!
const secondWithCalls = turns.filter((t) => t.toolCalls.length > 0)[1]!

describe('SessionConversation', () => {
  it('renders every turn as an article in a named list, with the marked gaps', () => {
    render(<SessionConversation turns={turns} isUTC />)

    expect(screen.getByRole('list', { name: 'Session conversation' })).toBeInTheDocument()
    expect(articles()).toHaveLength(turns.length)
    expect(screen.getAllByRole('separator', { name: /idle$/ })).toHaveLength(2)
  })

  it.each([
    [SEARCH_WORDS.inOnePrompt, 1],
    ['QUINCE', 1],
    [SEARCH_WORDS.onlyInErrors, searchTurns(turns, SEARCH_WORDS.onlyInErrors).matched.size],
  ])('search "%s" dims the rest, keeps them mounted and announces the count', (query, count) => {
    render(<SessionConversation turns={turns} searchQuery={query} isUTC />)

    expect(articles()).toHaveLength(turns.length)
    expect(dimmed()).toHaveLength(turns.length - count)
    expect(screen.getByRole('status')).toHaveTextContent(`${count} of ${turns.length} turns`)
  })

  it('dims nothing and announces nothing for a blank query', () => {
    render(<SessionConversation turns={turns} searchQuery="   " />)

    expect(dimmed()).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('keys expansion by turn index, uncontrolled', () => {
    const onExpandedTurnsChange = vi.fn()
    render(
      <SessionConversation
        turns={turns}
        defaultExpandedTurns={[firstWithCalls.index]}
        onExpandedTurnsChange={onExpandedTurnsChange}
      />
    )
    expect(screen.getAllByTestId('tool-call-row')).toHaveLength(firstWithCalls.toolCalls.length)

    fireEvent.click(groupOf(secondWithCalls.index))

    expect(onExpandedTurnsChange).toHaveBeenLastCalledWith([
      firstWithCalls.index,
      secondWithCalls.index,
    ])
    const open = firstWithCalls.toolCalls.length + secondWithCalls.toolCalls.length
    expect(screen.getAllByTestId('tool-call-row')).toHaveLength(open)
  })

  it('opens only what the controlled prop names, and reports toggles', () => {
    const onExpandedTurnsChange = vi.fn()
    const { rerender } = render(
      <SessionConversation
        turns={turns}
        expandedTurns={[]}
        onExpandedTurnsChange={onExpandedTurnsChange}
      />
    )

    fireEvent.click(groupOf(firstWithCalls.index))

    expect(onExpandedTurnsChange).toHaveBeenCalledWith([firstWithCalls.index])
    expect(screen.queryAllByTestId('tool-call-row')).toHaveLength(0)
    rerender(<SessionConversation turns={turns} expandedTurns={[firstWithCalls.index]} />)
    expect(screen.getAllByTestId('tool-call-row')).toHaveLength(firstWithCalls.toolCalls.length)
  })

  it('shows skeleton turns while loading, not the empty state', () => {
    render(<SessionConversation turns={[]} isLoading />)

    expect(screen.getByTestId('session-conversation-loading')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Session conversation' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    expect(screen.queryByText('No turns')).not.toBeInTheDocument()
  })

  it('shows the default empty state, or the one the host passes', () => {
    const { rerender } = render(<SessionConversation turns={SESSION_EMPTY.turns} />)
    expect(screen.getByText('No turns')).toBeInTheDocument()

    rerender(<SessionConversation turns={[]} emptyState={<Text>Nothing yet</Text>} />)

    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.queryByText('No turns')).not.toBeInTheDocument()
  })

  it('dates the first turn after midnight', () => {
    render(<SessionConversation turns={SESSION_MIDNIGHT.turns} isUTC />)

    expect(screen.getAllByText(/\d\d\/\d\d\/\d{4}/)).toHaveLength(1)
  })

  it('renders SESSION_HOSTILE with unique keys and no NaN', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<SessionConversation turns={SESSION_HOSTILE.turns} />)
    SESSION_HOSTILE.turns.forEach((t) => fireEvent.click(groupOf(t.index)))

    expect(container).not.toHaveTextContent('NaN')
    expect(container.querySelector('script, b')).toBeNull()
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('mounts no tool row for SESSION_LARGE and stays under the node bound', () => {
    // Measured at about 47 nodes a turn with every tool group closed.
    expectBoundedMount({
      render: () => <SessionConversation turns={SESSION_LARGE.turns} isUTC />,
      selector: '*',
      max: 50 * SESSION_LARGE.turns.length,
    })
    const { container } = render(<SessionConversation turns={SESSION_LARGE.turns} isUTC />)
    expect(container.querySelectorAll('[role="article"]')).toHaveLength(SESSION_LARGE.turns.length)
    expect(container.querySelectorAll('[data-testid="tool-call-row"]')).toHaveLength(0)
    // Two 500-turn mounts take about 3 s alone and more under the full parallel suite.
  }, 30_000)

  it.each([
    ['default', {}],
    ['searching', { searchQuery: SEARCH_WORDS.inOnePrompt }],
    ['loading', { isLoading: true }],
  ])('has no accessibility violations (%s)', async (_name, props) => {
    const { container } = render(
      <SessionConversation turns={turns.slice(0, 12)} isUTC {...props} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations when empty', async () => {
    const { container } = render(<SessionConversation turns={[]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
