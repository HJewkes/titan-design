import type { Meta, StoryObj } from '@storybook/react-vite'

import { Surface } from '../../ui/surface'
import { DateSeparator } from './DateSeparator'
import { NOW, localIso } from './coach-thread-fixture'

const meta: Meta<typeof DateSeparator> = {
  title: 'Custom/Chat/MessageList/DateSeparator',
  component: DateSeparator,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** Opens each calendar day of a thread: Today, Yesterday, then a date. ' +
          'Composes [Divider](?path=/docs/components-divider--docs) + ' +
          '[DateTime](?path=/docs/custom-datetime--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs).',
      },
    },
  },
  args: { date: localIso(0, 8, 0), now: NOW },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-sm" style={{ width: 390 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof DateSeparator>

export const Today: Story = {}

export const Yesterday: Story = { args: { date: localIso(1, 18, 0) } }

export const Older: Story = { args: { date: localIso(9, 18, 0) } }
