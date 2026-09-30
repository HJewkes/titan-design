import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import type { ChatMessage, Participant } from '@titan-design/chat-protocol'

import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { renderCoachPart } from './coach-cards'
import { ConversationIdentity } from './ConversationIdentity'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import {
  ATHLETE,
  COACH,
  COACH_THREAD,
  NOW,
  PARTICIPANTS,
  chatMessage,
} from './coach-thread-fixture'

function useCoachReplies(replyDelayMs: number) {
  const [messages, setMessages] = useState<ChatMessage[]>(COACH_THREAD)
  const [typing, setTyping] = useState<Participant[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const send = (text: string) => {
    const at = new Date().toISOString()
    const id = `local-${Date.now()}`
    const delivery = [{ participantId: COACH.id, status: 'accepted' as const, at }]
    setMessages((current) => [
      ...current,
      chatMessage(id, ATHLETE, at, [{ type: 'text', text }], delivery),
    ])
    setTyping([COACH])
    timers.current.push(
      setTimeout(() => {
        setTyping([])
        const reply = chatMessage(`${id}-reply`, COACH, new Date().toISOString(), [
          { type: 'text', text: 'Noted. I will fold that into **Sunday**.' },
        ])
        setMessages((current) => [...current, reply])
      }, replyDelayMs)
    )
  }
  return { messages, typing, send }
}

interface CoachPresetArgs {
  layout: 'phone' | 'drawer' | 'wide'
  replyDelayMs: number
}

const FRAME_CLASS: Record<CoachPresetArgs['layout'], string> = {
  phone: 'w-[390px] max-w-full h-[760px]',
  drawer: 'w-full max-w-[480px] h-[800px]',
  wide: 'w-full max-w-[760px] h-[800px] self-center',
}

function CoachThread({ replyDelayMs, className }: { replyDelayMs: number; className: string }) {
  const { messages, typing, send } = useCoachReplies(replyDelayMs)
  return (
    <Surface level="base" rounded className={`overflow-hidden ${className}`}>
      <MessageList
        messages={messages}
        participants={PARTICIPANTS}
        viewerId={ATHLETE.id}
        now={NOW}
        typing={typing}
        header={
          <ConversationIdentity
            participant={COACH}
            description="Weekly check-ins and session notes"
          />
        }
        renderDataPart={renderCoachPart}
        composer={<Composer onSend={send} placeholder="Message Coach" />}
      />
    </Surface>
  )
}

/** The wall dashboard's content area beside a drawer, so the drawer's width reads against it. */
function WallBackdrop() {
  return (
    <View className="hidden flex-1 items-center justify-center sm:flex">
      <Typography variant="caption" color="tertiary">
        Wall dashboard content area
      </Typography>
    </View>
  )
}

function CoachPreset({ layout, replyDelayMs }: CoachPresetArgs) {
  const thread = <CoachThread replyDelayMs={replyDelayMs} className={FRAME_CLASS[layout]} />
  if (layout === 'drawer') {
    return (
      <Surface level="background" className="w-full flex-row p-gutter-sm">
        <WallBackdrop />
        {thread}
      </Surface>
    )
  }
  if (layout === 'wide') {
    return (
      <Surface level="background" className="w-full p-gutter-sm">
        {thread}
      </Surface>
    )
  }
  return thread
}

const meta: Meta<CoachPresetArgs> = {
  title: 'Custom/Chat/CoachPreset',
  component: CoachPreset,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Preset.** A two-party coach thread: the athlete and an agent coach, across two ' +
          'days, with a scheduled check-in riding a `data-checkin` part. The thread is headed ' +
          'by who it is with instead of repeating the coach on every message. Send a message to ' +
          'watch the typing indicator and a canned reply. Composes ' +
          '[MessageList](?path=/docs/custom-chat-messagelist--docs) + ' +
          '[Composer](?path=/docs/custom-chat-composer--docs) + ' +
          '[ChatCard](?path=/docs/custom-chat-chatcard--docs). The check-in lockup is story-local.',
      },
    },
  },
  argTypes: {
    layout: { control: 'select', options: ['phone', 'drawer', 'wide'] },
    replyDelayMs: { control: { type: 'number' } },
  },
  args: { layout: 'phone', replyDelayMs: 1500 },
}
export default meta

type Story = StoryObj<CoachPresetArgs>

/** Phone-width PWA. */
export const Phone: Story = {}

/** Wall size, option 1: the thread stays a phone-shaped drawer, capped at 480 px beside the dashboard. */
export const WallDrawer: Story = { args: { layout: 'drawer' } }

/** Wall size, option 2: the thread takes a real wide layout, a reading column capped at 760 px. */
export const WallWide: Story = { args: { layout: 'wide' } }
