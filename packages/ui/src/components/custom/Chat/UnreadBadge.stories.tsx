import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Surface } from '../../ui/surface'
import { UnreadBadge } from './UnreadBadge'

const meta: Meta<typeof UnreadBadge> = {
  title: 'Custom/Chat/MessageList/UnreadBadge',
  component: UnreadBadge,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** An unread count as a brand capsule; with `onPress` it becomes the ' +
          '"N new messages" jump. A preset over [Pill](?path=/docs/components-pill--docs).',
      },
    },
  },
  args: { count: 3, max: 99 },
  argTypes: { size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] } },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-sm">
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof UnreadBadge>

export const Count: Story = {}

export const Capped: Story = { args: { count: 240 } }

export const JumpToNewest: Story = { args: { onPress: fn(), size: 'md' } }
