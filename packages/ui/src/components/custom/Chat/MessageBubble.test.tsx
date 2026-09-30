import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'

import { MessageBubble } from './MessageBubble'
import {
  ATHLETE,
  COACH,
  COACH_THREAD,
  ENDORSEMENT_THREAD,
  chatMessage,
  localIso,
} from './coach-thread-fixture'

const [coachMessage, ownMessage] = COACH_THREAD
const checkinMessage = COACH_THREAD[3]

describe('MessageBubble', () => {
  it('renders the text parts as markdown prose', () => {
    render(<MessageBubble message={coachMessage} author={COACH} />)
    expect(screen.getByTestId('chat-message-body')).toHaveTextContent(
      'Your top bench set moved at 0.52 m/s'
    )
    expect(screen.queryByText(/\*\*/)).toBeNull()
  })

  it('carries no name or avatar in a direct thread', () => {
    render(<MessageBubble message={coachMessage} author={COACH} />)
    expect(screen.queryByTestId('chat-message-author')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it("names the other party's first message in a group thread", () => {
    render(<MessageBubble message={coachMessage} author={COACH} layout="group" />)
    expect(screen.getByTestId('chat-message-author')).toHaveTextContent('Coach')
  })

  it('puts the group avatar on the last message of a run by default', () => {
    const { rerender } = render(
      <MessageBubble message={coachMessage} author={COACH} layout="group" endsGroup={false} />
    )
    expect(screen.queryByRole('img')).toBeNull()
    rerender(<MessageBubble message={coachMessage} author={COACH} layout="group" />)
    expect(screen.getByRole('img', { name: 'Coach' })).toBeInTheDocument()
  })

  it('moves the group avatar to the first message when asked', () => {
    render(
      <MessageBubble
        message={coachMessage}
        author={COACH}
        layout="group"
        groupAvatarAt="first"
        startsGroup={false}
      />
    )
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('drops the group name for a follow-on message', () => {
    render(
      <MessageBubble message={coachMessage} author={COACH} layout="group" startsGroup={false} />
    )
    expect(screen.queryByTestId('chat-message-author')).toBeNull()
  })

  it('falls back to the author id when a group participant is unknown', () => {
    render(<MessageBubble message={coachMessage} layout="group" />)
    expect(screen.getByTestId('chat-message-author')).toHaveTextContent('coach')
  })

  it('shows delivery state on the newest own message only when told to', () => {
    const { rerender } = render(<MessageBubble message={ownMessage} author={ATHLETE} isOwn />)
    expect(screen.queryByTestId('chat-message-delivery')).toBeNull()
    rerender(<MessageBubble message={ownMessage} author={ATHLETE} isOwn showDelivery />)
    expect(screen.getByTestId('chat-message-delivery')).toHaveTextContent('Read')
  })

  it("never shows delivery state on the other party's message", () => {
    render(<MessageBubble message={ownMessage} author={ATHLETE} showDelivery />)
    expect(screen.queryByTestId('chat-message-delivery')).toBeNull()
  })

  it('draws the own bubble solid by default and as a tint on request', () => {
    const { rerender } = render(<MessageBubble message={ownMessage} author={ATHLETE} isOwn />)
    expect(screen.getByTestId('chat-own-bubble-solid')).toBeInTheDocument()
    rerender(<MessageBubble message={ownMessage} author={ATHLETE} isOwn ownFill="tint" />)
    expect(screen.getByTestId('chat-own-bubble-tint')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-own-bubble-solid')).toBeNull()
  })

  describe('endorsement', () => {
    const [plain, endorsed] = ENDORSEMENT_THREAD

    it.each(['outline', 'fill', 'emphasis'] as const)(
      'marks an endorsed message with the %s treatment',
      (endorsement) => {
        render(<MessageBubble message={endorsed} author={COACH} endorsement={endorsement} />)
        expect(screen.getByTestId(`chat-endorsed-bubble-${endorsement}`)).toBeInTheDocument()
      }
    )

    it('draws an endorsed message plainly when no treatment is chosen', () => {
      render(<MessageBubble message={endorsed} author={COACH} />)
      expect(screen.queryByTestId(/chat-endorsed-bubble/)).toBeNull()
    })

    it('leaves an unendorsed message alone whatever the treatment', () => {
      render(<MessageBubble message={plain} author={COACH} endorsement="outline" />)
      expect(screen.queryByTestId(/chat-endorsed-bubble/)).toBeNull()
    })
  })

  it('flags an undeliverable message', () => {
    const failed = chatMessage(
      'f',
      ATHLETE,
      localIso(0, 8, 0),
      [{ type: 'text', text: 'hi' }],
      [{ participantId: COACH.id, status: 'undeliverable', at: localIso(0, 8, 0) }]
    )
    render(<MessageBubble message={failed} author={ATHLETE} isOwn />)
    expect(screen.getByTestId('chat-message-delivery')).toHaveTextContent('Not delivered')
  })

  it('hands data parts to the caller’s renderer with their message', () => {
    const renderDataPart = vi.fn(() => <Text>Check-in card</Text>)
    render(
      <MessageBubble message={checkinMessage} author={COACH} renderDataPart={renderDataPart} />
    )
    expect(screen.getByText('Check-in card')).toBeInTheDocument()
    expect(renderDataPart).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'data-checkin' }),
      checkinMessage
    )
  })

  it('drops data parts silently when no renderer is given', () => {
    render(<MessageBubble message={checkinMessage} author={COACH} />)
    expect(screen.getByTestId(`chat-message-${checkinMessage.id}`)).not.toHaveTextContent(
      'Sunday check-in'
    )
  })

  it('renders a data-only message without an empty bubble', () => {
    const cardOnly = chatMessage('c', COACH, localIso(0, 8, 0), [
      { type: 'data-checkin', data: {} },
    ])
    render(
      <MessageBubble message={cardOnly} author={COACH} renderDataPart={() => <Text>card</Text>} />
    )
    expect(screen.queryByTestId('chat-message-body')).toBeNull()
    expect(screen.getByText('card')).toBeInTheDocument()
  })

  it('says the message is still being written while a text part streams', () => {
    const streaming = chatMessage('s', COACH, localIso(0, 8, 0), [
      { type: 'text', text: 'Thinking about', state: 'streaming' },
    ])
    render(<MessageBubble message={streaming} author={COACH} />)
    expect(screen.getByTestId('chat-message-meta')).toHaveTextContent('Writing…')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <MessageBubble message={coachMessage} author={COACH} />
        <MessageBubble message={ownMessage} author={ATHLETE} isOwn />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
