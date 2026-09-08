import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { InitiativeHeader } from './InitiativeHeader'

/**
 * **InitiativeHeader** — an initiative's identity line: title, slug, state,
 * rank, ship target and last-touched date.
 *
 * Composes `StatusDot` · `Pill` · `DateTime` · `Typography`. Shares the state
 * vocabulary with `InitiativeCard`.
 */
const meta: Meta<typeof InitiativeHeader> = {
  title: 'Custom/ActiveWork/InitiativeHeader',
  component: InitiativeHeader,
  args: {
    title: 'active-work — durable workspace state',
    slug: 'active-work',
    state: 'focused',
    rank: 1,
    shipTarget: '2026-Q3',
    updated: '2026-07-12',
  },
  argTypes: {
    state: { control: 'inline-radio', options: ['focused', 'backburner', 'paused', 'done'] },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[760px] p-4">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **StatusDot** · **Pill** · **DateTime** · **Typography**. Used-by ↑ the Initiative Reader composition.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof InitiativeHeader>

/** A ranked, focused initiative. */
export const Default: Story = {}

/** A backburner initiative: no rank, no ship target. */
export const Backburner: Story = {
  args: { state: 'backburner', rank: undefined, shipTarget: undefined },
}

/** A finished initiative. */
export const Done: Story = {
  args: { state: 'done', rank: undefined },
}
