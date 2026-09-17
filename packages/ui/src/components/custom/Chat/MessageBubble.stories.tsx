import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from 'react-native'

import { Surface } from '../../ui/surface'
import { MessageBubble } from './MessageBubble'
import { ATHLETE, COACH, COACH_THREAD, chatMessage, localIso } from './coach-thread-fixture'

const meta: Meta<typeof MessageBubble> = {
  title: 'Custom/Chat/MessageList/MessageBubble',
  component: MessageBubble,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One message: markdown prose in a bubble, caller-rendered `data-*` ' +
          'parts beneath it, and a time and delivery line. Composes ' +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Avatar](?path=/docs/components-avatar--docs) + ' +
          '[MarkdownProse](?path=/docs/custom-prose-markdownprose--docs) + ' +
          '[DateTime](?path=/docs/custom-datetime--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs).',
      },
    },
  },
  args: { message: COACH_THREAD[0], author: COACH, isOwn: false, startsGroup: true },
  argTypes: {
    isOwn: { control: 'boolean' },
    startsGroup: { control: 'boolean' },
    message: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-sm" style={{ width: 390 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof MessageBubble>

export const Default: Story = {}

export const Own: Story = { args: { message: COACH_THREAD[1], author: ATHLETE, isOwn: true } }

export const Undeliverable: Story = {
  args: {
    isOwn: true,
    author: ATHLETE,
    message: chatMessage(
      'f',
      ATHLETE,
      localIso(0, 8, 0),
      [{ type: 'text', text: 'Can we move it?' }],
      [{ participantId: COACH.id, status: 'undeliverable', at: localIso(0, 8, 0) }]
    ),
  },
}

export const Streaming: Story = {
  args: {
    message: chatMessage('s', COACH, localIso(0, 8, 0), [
      { type: 'text', text: 'Looking at your last three sessions', state: 'streaming' },
    ]),
  },
}

export const WithDataPart: Story = {
  args: {
    message: COACH_THREAD[3],
    renderDataPart: (part) => <Text className="text-text-secondary">{`<${part.type} card>`}</Text>,
  },
}
