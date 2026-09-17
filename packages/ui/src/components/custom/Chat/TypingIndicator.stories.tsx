import type { Meta, StoryObj } from '@storybook/react-vite'

import { Surface } from '../../ui/surface'
import { TypingIndicator } from './TypingIndicator'
import { ATHLETE, COACH } from './coach-thread-fixture'

const meta: Meta<typeof TypingIndicator> = {
  title: 'Custom/Chat/MessageList/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** Three staggered dots and who is composing. Composes ' +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs).',
      },
    },
  },
  args: { participants: [COACH], dotsOnly: false },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-sm">
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof TypingIndicator>

export const Default: Story = {}

export const TwoTypists: Story = { args: { participants: [COACH, ATHLETE] } }
