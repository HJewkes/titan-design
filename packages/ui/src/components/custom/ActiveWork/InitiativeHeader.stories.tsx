import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
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
      <Surface level="base" className="min-h-screen w-full max-w-[760px] p-6" testID="page-surface">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
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
