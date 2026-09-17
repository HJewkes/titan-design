import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import type { ChatMessage, DataPart, Participant } from '@titan-design/chat-protocol'

import { Button, ButtonText } from '../../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card'
import { Pill } from '../../ui/pill'
import { Surface } from '../../ui/surface'
import { DateTime } from '../DateTime'
import { Typography } from '../Typography'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import {
  ATHLETE,
  CHECKIN_PART_TYPE,
  COACH,
  COACH_THREAD,
  NOW,
  PARTICIPANTS,
  chatMessage,
  type CheckinData,
} from './coach-thread-fixture'

interface CoachPresetArgs {
  width: number
  height: number
  replyDelayMs: number
}

/** Story-local: the scheduled check-in a coach thread carries as a `data-checkin` part. */
function CheckinCard({ checkin }: { checkin: CheckinData }) {
  return (
    <Card elevation={2} className="w-72">
      <CardHeader className="gap-stack-sm pb-inset-sm">
        <Pill tone="brand" leading="dot">
          Scheduled
        </Pill>
        <CardTitle>{checkin.title}</CardTitle>
        <DateTime value={checkin.scheduledFor} format="full" variant="body2" color="secondary" />
      </CardHeader>
      <CardContent className="gap-stack-sm py-inset-sm">
        {checkin.agenda.map((item) => (
          <Typography key={item} variant="body2">
            {`• ${item}`}
          </Typography>
        ))}
        <Typography variant="caption" color="tertiary">
          {`${checkin.durationMinutes} min`}
        </Typography>
      </CardContent>
      <CardFooter>
        <Button size="sm">
          <ButtonText>Confirm</ButtonText>
        </Button>
        <Button size="sm" variant="ghost">
          <ButtonText>Reschedule</ButtonText>
        </Button>
      </CardFooter>
    </Card>
  )
}

function renderCoachPart(part: DataPart) {
  if (part.type !== CHECKIN_PART_TYPE) return null
  return <CheckinCard checkin={part.data as CheckinData} />
}

function useCoachReplies(replyDelayMs: number) {
  const [messages, setMessages] = useState<ChatMessage[]>(COACH_THREAD)
  const [typing, setTyping] = useState<Participant[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const send = (text: string) => {
    const at = new Date().toISOString()
    const id = `local-${Date.now()}`
    const delivery = [{ participantId: COACH.id, status: 'accepted' as const, at }]
    setMessages((current) => [...current, chatMessage(id, ATHLETE, at, [{ type: 'text', text }], delivery)])
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

function CoachPreset({ width, height, replyDelayMs }: CoachPresetArgs) {
  const { messages, typing, send } = useCoachReplies(replyDelayMs)
  return (
    <Surface level="base" rounded style={{ width, height }} className="overflow-hidden">
      <View className="border-b border-hairline-subtle px-gutter-sm py-inset-md">
        <Typography variant="subtitle1">Coach</Typography>
        <Typography variant="caption" color="tertiary">
          Weekly check-ins and session notes
        </Typography>
      </View>
      <MessageList
        messages={messages}
        participants={PARTICIPANTS}
        viewerId={ATHLETE.id}
        now={NOW}
        typing={typing}
        renderDataPart={renderCoachPart}
        composer={<Composer onSend={send} placeholder="Message Coach" />}
      />
    </Surface>
  )
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
          'days, with a scheduled check-in riding a `data-checkin` part. Send a message to ' +
          'watch the typing indicator and a canned reply. Composes ' +
          '[MessageList](?path=/docs/custom-chat-messagelist--docs) + ' +
          '[Composer](?path=/docs/custom-chat-composer--docs) + ' +
          '[Card](?path=/docs/components-card--docs). The check-in card is story-local.',
      },
    },
  },
  argTypes: {
    width: { control: { type: 'range', min: 320, max: 900, step: 10 } },
    height: { control: { type: 'range', min: 400, max: 1000, step: 10 } },
    replyDelayMs: { control: { type: 'number' } },
  },
  args: { width: 390, height: 760, replyDelayMs: 1500 },
}
export default meta

type Story = StoryObj<CoachPresetArgs>

/** Phone-width PWA. */
export const Phone: Story = {}

/** The same thread in a wall-dashboard side panel. */
export const WallPanel: Story = { args: { width: 480, height: 900 } }
