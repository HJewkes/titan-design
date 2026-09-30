import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Button, ButtonText } from '../../ui/button'
import { Surface } from '../../ui/surface'
import { EmptyState } from '../../ui/empty-state'
import { MessageList, type MessageListProps } from './MessageList'
import { renderCoachPart } from './coach-cards'
import {
  ATHLETE,
  BREAKS_THREAD,
  COACH,
  COACH_THREAD,
  ENDORSEMENT_THREAD,
  GROUP_PARTICIPANTS,
  GROUP_THREAD,
  NOW,
  PARTICIPANTS,
  chatMessage,
} from './coach-thread-fixture'

const meta: Meta<typeof MessageList> = {
  title: 'Custom/Chat/MessageList',
  component: MessageList,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** A non-inverted, windowed thread that follows new messages while the ' +
          'reader is at the end and offers a jump back once they scroll up. Composes ' +
          '[MessageBubble](?path=/docs/custom-chat-messagelist-messagebubble--docs) + ' +
          '[DateSeparator](?path=/docs/custom-chat-messagelist-dateseparator--docs) + ' +
          '[TypingIndicator](?path=/docs/custom-chat-messagelist-typingindicator--docs) + ' +
          '[ConversationIdentity](?path=/docs/custom-chat-conversationidentity--docs) + ' +
          '[UnreadBadge](?path=/docs/custom-chat-messagelist-unreadbadge--docs).',
      },
    },
  },
  args: {
    messages: COACH_THREAD,
    participants: PARTICIPANTS,
    viewerId: ATHLETE.id,
    now: NOW,
    typing: [],
    pageSize: 50,
    renderDataPart: renderCoachPart,
    ownFill: 'solid',
    endorsement: 'none',
    groupAvatarAt: 'last',
    revealTimes: false,
  },
  argTypes: {
    viewerId: { control: 'select', options: [ATHLETE.id, COACH.id] },
    pageSize: { control: { type: 'number', min: 1 } },
    layout: { control: 'select', options: ['direct', 'group'] },
    ownFill: { control: 'select', options: ['solid', 'tint'] },
    endorsement: { control: 'select', options: ['none', 'outline', 'fill', 'emphasis'] },
    groupAvatarAt: { control: 'select', options: ['first', 'last'] },
    revealTimes: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 390, height: 520 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof MessageList>

/** A direct thread: who it is with sits once at the top, and bubbles carry no name or avatar. */
export const Default: Story = {}

/** Own bubble, option 1: a solid brand fill with on-brand text. */
export const OwnSolid: Story = { args: { messages: COACH_THREAD.slice(0, 3), ownFill: 'solid' } }

/** Own bubble, option 2: the stronger brand tint with primary text. */
export const OwnTint: Story = { args: { messages: COACH_THREAD.slice(0, 3), ownFill: 'tint' } }

/** A group thread, option 1: author name over the first message, a small avatar beside the last. */
export const Group: Story = {
  args: {
    messages: GROUP_THREAD,
    participants: GROUP_PARTICIPANTS,
    groupAvatarAt: 'last',
  },
}

/** A group thread, option 2: the small avatar beside the first message of a run, next to the name. */
export const GroupAvatarFirst: Story = {
  args: {
    messages: GROUP_THREAD,
    participants: GROUP_PARTICIPANTS,
    groupAvatarAt: 'first',
  },
}

/** Times appear only after a pause of more than an hour, and the day when it changes. */
export const TimeBreaks: Story = { args: { messages: BREAKS_THREAD } }

/** The same thread as if dragged left: every message's own time, as in Messages. */
export const RevealedTimes: Story = { args: { messages: BREAKS_THREAD, revealTimes: true } }

/** Endorsed agent message, control: drawn like any other. */
export const EndorsedNone: Story = { args: { messages: ENDORSEMENT_THREAD, endorsement: 'none' } }

/** Endorsed agent message, option 1: a brand outline on the bubble. */
export const EndorsedOutline: Story = {
  args: { messages: ENDORSEMENT_THREAD, endorsement: 'outline' },
}

/** Endorsed agent message, option 2: a brand-tinted bubble fill. */
export const EndorsedFill: Story = { args: { messages: ENDORSEMENT_THREAD, endorsement: 'fill' } }

/** Endorsed agent message, option 3: an accent edge on the bubble. */
export const EndorsedEmphasis: Story = {
  args: { messages: ENDORSEMENT_THREAD, endorsement: 'emphasis' },
}

export const Typing: Story = { args: { typing: [COACH] } }

export const Windowed: Story = { args: { pageSize: 2 } }

export const Empty: Story = {
  args: {
    messages: [],
    emptyState: <EmptyState title="No messages yet" description="Your coach will write here." />,
  },
}

function LiveThread(args: MessageListProps) {
  const [messages, setMessages] = useState(args.messages)
  const addReply = () => {
    const id = `reply-${messages.length}`
    const reply = chatMessage(id, COACH, new Date().toISOString(), [
      { type: 'text', text: `Reply ${messages.length - COACH_THREAD.length + 1}` },
    ])
    setMessages([...messages, reply])
  }
  return (
    <View className="flex-1">
      <Button size="sm" variant="outline" onPress={addReply} className="m-inset-sm self-start">
        <ButtonText>Simulate coach reply</ButtonText>
      </Button>
      <MessageList {...args} messages={messages} />
    </View>
  )
}

/** Scroll up, then simulate replies: the list holds position and counts them instead. */
export const NewMessagesWhileScrolledUp: Story = {
  render: (args) => <LiveThread {...args} />,
}
