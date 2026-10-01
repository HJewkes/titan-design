import type { Meta, StoryObj } from '@storybook/react-vite'

import { Surface } from '../../ui/surface'
import { ConversationIdentity } from './ConversationIdentity'
import { COACH } from './coach-thread-fixture'

const meta: Meta<typeof ConversationIdentity> = {
  title: 'Custom/Chat/ConversationIdentity',
  component: ConversationIdentity,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Who a direct thread is with, shown once at the top. Composes ' +
          '[Avatar](?path=/docs/components-avatar--docs) + ' +
          '[Typography](?path=/docs/foundations-typography--docs).',
      },
    },
  },
  args: { participant: COACH, description: 'Weekly check-ins and session notes' },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 390 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ConversationIdentity>

export const Default: Story = {}
