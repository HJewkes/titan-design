import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AccessibilityInfo, Platform, Text } from 'react-native'
import type { ChatMessage } from '@titan-design/chat-protocol'

import { DELIVERY_LABEL } from './chatThread'
import { MessageList } from './MessageList'
import {
  ATHLETE,
  COACH,
  BREAKS_THREAD,
  COACH_THREAD,
  GROUP_PARTICIPANTS,
  GROUP_THREAD,
  NOW,
  PARTICIPANTS,
  ENDORSEMENT_THREAD,
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

function streamed(id: string, text: string, isDone = false): ChatMessage {
  const state = isDone ? 'done' : 'streaming'
  return chatMessage(id, COACH, localIso(0, 8, 30), [{ type: 'text', text, state }])
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

  it('heads a direct thread with who it is with and names no author per message', () => {
    renderList(COACH_THREAD)
    expect(screen.getByTestId('chat-conversation-identity')).toHaveTextContent('Coach')
    expect(screen.queryAllByTestId('chat-message-author')).toHaveLength(0)
  })

  it('uses the header slot in place of the default identity', () => {
    renderList(COACH_THREAD, { header: <Text>Custom header</Text> })
    expect(screen.getByText('Custom header')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-conversation-identity')).toBeNull()
  })

  it('names authors and shows one avatar per run in a group thread', () => {
    renderList(GROUP_THREAD, { participants: GROUP_PARTICIPANTS })
    expect(screen.queryByTestId('chat-conversation-identity')).toBeNull()
    expect(screen.getAllByTestId('chat-message-author').map((el) => el.textContent)).toEqual([
      'Coach',
      'Sam Okafor',
    ])
    expect(screen.getAllByRole('img').map((el) => el.getAttribute('aria-label'))).toEqual([
      'Coach',
      'Sam Okafor',
    ])
  })

  it('exposes a named log region for the thread', () => {
    renderList(COACH_THREAD)
    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument()
  })

  it('takes the log name from the consumer', () => {
    renderList(COACH_THREAD, { accessibilityLabel: 'Chat with Coach' })
    expect(screen.getByRole('log', { name: 'Chat with Coach' })).toBeInTheDocument()
  })

  it('starts every direct message with its speaker', () => {
    renderList(COACH_THREAD)
    const messages = COACH_THREAD.map(({ id }) => screen.getByTestId(`chat-message-${id}`))
    expect(messages.length).toBeGreaterThan(0)
    for (const message of messages) {
      expect(message.textContent).toMatch(/^(You|Coach): /)
    }
  })

  it('gives each group message exactly one author string', () => {
    renderList(GROUP_THREAD, { participants: GROUP_PARTICIPANTS })
    for (const id of ['g1', 'g2', 'g3', 'g4', 'g5']) {
      const message = screen.getByTestId(`chat-message-${id}`)
      const names = message.querySelectorAll(
        '[data-testid="chat-message-author"], [data-testid="chat-message-speaker"]'
      )
      expect(names).toHaveLength(1)
    }
  })

  it('has no accessibility violations in a group thread', async () => {
    const { container } = renderList(GROUP_THREAD, { participants: GROUP_PARTICIPANTS })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows delivery state on the newest own message only', () => {
    renderList(COACH_THREAD)
    expect(screen.getAllByTestId('chat-message-delivery').map((el) => el.textContent)).toEqual([
      'Sent',
    ])
  })

  it('opens a day row with the day and its time', () => {
    renderList(COACH_THREAD)
    const separators = screen.getAllByTestId('chat-date-separator')
    expect(separators[0]).toHaveTextContent(/Yesterday.*6:02/)
    expect(separators[1]).toHaveTextContent(/Today.*8:00/)
  })

  it('opens a time-only row after a pause of more than an hour within a day', () => {
    renderList(BREAKS_THREAD)
    const separators = screen.getAllByTestId('chat-date-separator')
    expect(separators).toHaveLength(3)
    expect(separators[1]).toHaveTextContent(/12:40/)
    expect(separators[1]).not.toHaveTextContent('Today')
  })

  it('keeps every message time in the tree for the drag reveal', () => {
    renderList(BREAKS_THREAD)
    expect(screen.getAllByTestId('chat-line-time')).toHaveLength(BREAKS_THREAD.length)
  })

  it('holds the thread open on the times when told to', () => {
    renderList(BREAKS_THREAD, { revealTimes: true })
    const row = screen.getAllByTestId('chat-reveal-row')[0].firstElementChild as HTMLElement
    expect(row.style.transform).toContain('translateX(-64px)')
  })

  it('rests with the thread in place', () => {
    renderList(BREAKS_THREAD)
    const row = screen.getAllByTestId('chat-reveal-row')[0].firstElementChild as HTMLElement
    expect(row.style.transform).toMatch(/translateX\(-?0(px)?\)/)
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

  it('takes every built-in string from labels', () => {
    const labels = {
      showEarlier: 'Load older',
      unknownAuthor: 'Someone',
      endorsed: 'Approved by staff',
      writing: 'Thinking…',
      delivery: { ...DELIVERY_LABEL, accepted: 'Out' },
      today: 'Hoy',
      yesterday: 'Ayer',
      typing: (names: readonly string[]) => `${names.join(', ')} escribe`,
      newMessages: (shown: string) => `${shown} nuevos`,
    }
    const older = chatMessage('m0', COACH, localIso(1, 17, 0), [{ type: 'text', text: 'older' }])
    const thread = [older, ...COACH_THREAD, ENDORSEMENT_THREAD[1], streamed('w', 'Thinking about')]
    const stranger = { ...COACH, id: 'stranger' }
    const { rerender } = renderList(thread, {
      labels,
      pageSize: thread.length - 1,
      typing: [COACH],
    })
    scrollAwayFromEnd()
    rerender([...thread, reply('x', stranger)])

    expect(screen.getByRole('button', { name: 'Load older' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-message-announcer')).toHaveTextContent('Someone: reply x')
    expect(screen.getByTestId('chat-endorsed-bubble')).toHaveTextContent('Approved by staff')
    expect(screen.getByText('Thinking…')).toBeInTheDocument()
    expect(screen.getByTestId('chat-message-delivery')).toHaveTextContent('Out')
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByText('Ayer')).toBeInTheDocument()
    expect(screen.getByText('Coach escribe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1 nuevos' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderList(COACH_THREAD, { typing: [COACH] })
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('live announcements', () => {
    const announcer = () => screen.getByTestId('chat-message-announcer')

    it('exposes a polite live region', () => {
      renderList(COACH_THREAD)
      expect(announcer()).toHaveAttribute('aria-live', 'polite')
    })

    it('does not announce the history present on mount', () => {
      renderList(COACH_THREAD)
      expect(announcer()).toHaveTextContent('')
    })

    it('announces a new incoming message once', () => {
      const { rerender } = renderList(COACH_THREAD)
      const next = [...COACH_THREAD, reply('new-1')]
      rerender(next)
      expect(announcer()).toHaveTextContent('Coach: reply new-1')
      expect(screen.getAllByText('Coach: reply new-1')).toHaveLength(1)

      rerender([...next])
      expect(screen.getAllByText('Coach: reply new-1')).toHaveLength(1)
    })

    it('does not announce the viewer’s own message', () => {
      const { rerender } = renderList(COACH_THREAD)
      rerender([...COACH_THREAD, reply('mine-1', ATHLETE)])
      expect(announcer()).toHaveTextContent('')
    })

    it('announces only the newest incoming message of a batch', () => {
      const { rerender } = renderList(COACH_THREAD)
      rerender([...COACH_THREAD, reply('a'), reply('b')])
      expect(announcer()).toHaveTextContent('Coach: reply b')
    })

    it('announces markdown as plain text', () => {
      const { rerender } = renderList(COACH_THREAD)
      const body = '## Today\n\n- Bench at **0.52 m/s**\n- Run `rest` after'
      rerender([
        ...COACH_THREAD,
        chatMessage('md', COACH, localIso(0, 8, 30), [{ type: 'text', text: body }]),
      ])
      expect(announcer()).toHaveTextContent('Coach: Today Bench at 0.52 m/s Run rest after')
    })

    it('stays silent while a reply streams and announces its final text once', () => {
      const { rerender } = renderList(COACH_THREAD)
      rerender([...COACH_THREAD, streamed('s', 'Rest')])
      rerender([...COACH_THREAD, streamed('s', 'Rest two')])
      expect(announcer()).toHaveTextContent('')

      rerender([...COACH_THREAD, streamed('s', 'Rest two days.', true)])
      expect(announcer()).toHaveTextContent('Coach: Rest two days.')
      rerender([...COACH_THREAD, streamed('s', 'Rest two days.', true)])
      expect(screen.getAllByText('Coach: Rest two days.')).toHaveLength(1)
    })

    it('does not announce a stream that a newer message replaced before it ended', () => {
      const { rerender } = renderList(COACH_THREAD)
      rerender([...COACH_THREAD, streamed('s', 'Rest')])
      expect(announcer()).toHaveTextContent('')
      rerender([...COACH_THREAD, streamed('s', 'Rest two'), reply('n')])
      expect(announcer()).toHaveTextContent('Coach: reply n')

      rerender([...COACH_THREAD, streamed('s', 'Rest two days.', true), reply('n')])
      expect(announcer()).toHaveTextContent('Coach: reply n')
      expect(screen.queryByText(/Coach: Rest/)).not.toBeInTheDocument()
    })

    it('does not re-announce the tail when older history is prepended', () => {
      const { rerender } = renderList(COACH_THREAD.slice(3))
      rerender(COACH_THREAD)
      expect(announcer()).toHaveTextContent('')
    })

    it('announces the first incoming message after the empty state', () => {
      const { rerender } = renderList([], { emptyState: <Text>No messages yet</Text> })
      rerender([reply('first')])
      expect(announcer()).toHaveTextContent('Coach: reply first')
    })

    describe('on iOS', () => {
      const originalOS = Platform.OS
      beforeEach(() => {
        Platform.OS = 'ios'
      })
      afterEach(() => {
        Platform.OS = originalOS
        vi.restoreAllMocks()
      })

      it('announces each qualifying message once through AccessibilityInfo', () => {
        const announce = vi
          .spyOn(AccessibilityInfo, 'announceForAccessibility')
          .mockImplementation(() => undefined)
        const { rerender } = renderList(COACH_THREAD)
        const first = [...COACH_THREAD, reply('a'), reply('b')]
        rerender(first)
        rerender([...first])
        rerender([...first, reply('mine', ATHLETE)])
        rerender([...first, reply('mine', ATHLETE), reply('c')])
        expect(announce.mock.calls).toEqual([['Coach: reply b'], ['Coach: reply c']])
      })

      it('announces a streamed reply once, when it ends', () => {
        const announce = vi
          .spyOn(AccessibilityInfo, 'announceForAccessibility')
          .mockImplementation(() => undefined)
        const { rerender } = renderList(COACH_THREAD)
        rerender([...COACH_THREAD, streamed('s', 'Rest')])
        rerender([...COACH_THREAD, streamed('s', 'Rest two')])
        rerender([...COACH_THREAD, streamed('s', 'Rest two days.', true)])
        rerender([...COACH_THREAD, streamed('s', 'Rest two days.', true)])
        expect(announce.mock.calls).toEqual([['Coach: Rest two days.']])
      })
    })
  })

  it('reveals message times when a date separator is pressed, and hides them on a second press', () => {
    renderList(COACH_THREAD)

    fireEvent.click(screen.getAllByRole('button', { name: 'Show message times' })[0])

    expect(screen.getAllByRole('button', { name: 'Hide message times' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Show message times' })).not.toBeInTheDocument()
  })
})
