import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Button, ButtonText } from '../../ui/button'
import { Surface } from '../../ui/surface'
import { EmptyState } from '../EmptyState'
import { MessageList, type MessageListProps } from './MessageList'
import { ATHLETE, COACH, COACH_THREAD, NOW, PARTICIPANTS, chatMessage } from './coach-thread-fixture'

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
  },
  argTypes: {
    viewerId: { control: 'select', options: [ATHLETE.id, COACH.id] },
    pageSize: { control: { type: 'number', min: 1 } },
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

export const Default: Story = {}

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
