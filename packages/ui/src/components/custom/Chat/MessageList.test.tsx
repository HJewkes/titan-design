import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import type { ChatMessage } from '@titan-design/chat-protocol'

import { MessageList } from './MessageList'
import {
  ATHLETE,
  COACH,
  COACH_THREAD,
  NOW,
  PARTICIPANTS,
  chatMessage,
  localIso,
} from './coach-thread-fixture'

function renderList(
  messages: ChatMessage[],
  extra: Partial<Parameters<typeof MessageList>[0]> = {}
) {
  const props = { participants: PARTICIPANTS, viewerId: ATHLETE.id, now: NOW, ...extra }
  const view = render(<MessageList messages={messages} {...props} />)
  const rerender = (next: ChatMessage[]) =>
    view.rerender(<MessageList messages={next} {...props} />)
  return { ...view, rerender }
}

function reply(id: string, author = COACH): ChatMessage {
  return chatMessage(id, author, localIso(0, 8, 30), [{ type: 'text', text: `reply ${id}` }])
}

// jsdom has no layout, so the scroll geometry the list reads is stubbed onto the node.
function scrollAwayFromEnd() {
  const node = screen.getByTestId('chat-message-scroll')
  Object.defineProperties(node, {
    scrollHeight: { configurable: true, value: 2000 },
    clientHeight: { configurable: true, value: 400 },
  })
  node.scrollTop = 200
  act(() => {
    fireEvent.scroll(node)
  })
}

describe('MessageList', () => {
  it('interleaves day separators with the thread', () => {
    renderList(COACH_THREAD)
    expect(screen.getAllByTestId('chat-date-separator')).toHaveLength(2)
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it("resolves authors and marks the viewer's messages as their own", () => {
    renderList(COACH_THREAD)
    expect(screen.getAllByTestId('chat-message-author')[0]).toHaveTextContent('Coach')
    expect(screen.getAllByTestId('chat-message-delivery').map((el) => el.textContent)).toEqual([
      'Read',
      'Sent',
    ])
  })

  it('passes data parts through to the renderer', () => {
    renderList(COACH_THREAD, { renderDataPart: () => <Text>check-in card</Text> })
    expect(screen.getByText('check-in card')).toBeInTheDocument()
  })

  it('shows who is typing under the newest message', () => {
    renderList(COACH_THREAD, { typing: [COACH] })
    expect(screen.getByText('Coach is typing')).toBeInTheDocument()
  })

  it('renders the composer slot beneath the thread', () => {
    renderList(COACH_THREAD, { composer: <Text>composer slot</Text> })
    expect(screen.getByText('composer slot')).toBeInTheDocument()
  })

  it('shows the empty state for a thread with no messages', () => {
    renderList([], { emptyState: <Text>No messages yet</Text> })
    expect(screen.getByText('No messages yet')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-message-scroll')).toBeNull()
  })

  it('mounts only the newest page and reveals earlier ones on request', () => {
    renderList(COACH_THREAD, { pageSize: 2 })
    expect(screen.queryByTestId('chat-message-m4')).toBeNull()
    expect(screen.getByTestId('chat-message-m5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show earlier' }))
    expect(screen.getByTestId('chat-message-m3')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-message-m2')).toBeNull()
  })

  it('shows no jump affordance while the reader is at the newest message', () => {
    const { rerender } = renderList(COACH_THREAD)
    rerender([...COACH_THREAD, reply('r1')])
    expect(screen.queryByTestId('chat-unread-badge')).toBeNull()
  })

  it('counts replies that arrive after the reader scrolled up', () => {
    const { rerender } = renderList(COACH_THREAD)
    scrollAwayFromEnd()
    rerender([...COACH_THREAD, reply('r1'), reply('r2')])
    expect(screen.getByRole('button', { name: '2 new messages' })).toBeInTheDocument()
  })

  it('clears the count when the reader jumps back to the newest message', () => {
    const { rerender } = renderList(COACH_THREAD)
    const scroll = vi.fn()
    screen.getByTestId('chat-message-scroll').scroll = scroll
    scrollAwayFromEnd()
    rerender([...COACH_THREAD, reply('r1')])
    fireEvent.click(screen.getByRole('button', { name: '1 new message' }))
    expect(screen.queryByTestId('chat-unread-badge')).toBeNull()
    expect(scroll).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2000 }))
  })

  it("does not count the viewer's own message as unseen", () => {
    const { rerender } = renderList(COACH_THREAD)
    scrollAwayFromEnd()
    rerender([...COACH_THREAD, reply('mine', ATHLETE)])
    expect(screen.queryByTestId('chat-unread-badge')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderList(COACH_THREAD, { typing: [COACH] })
    expect(await axe(container)).toHaveNoViolations()
  })
})
