import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Card } from '../../ui/card'
import { OpenLoops } from './OpenLoops'
import { sessionLinkers } from './session-linkers'
import { INITIATIVE_LOOPS_FIXTURE, INITIATIVE_NOW } from './initiative-fixture'

/**
 * **OpenLoops** — the initiative's hanging threads from the session ledger,
 * each with its kind, age and auto-linked text. The durable current state a
 * session picks up.
 *
 * Composes `Eyebrow` · `Pill` · `Divider` · `MarkdownProse`.
 */
const meta: Meta<typeof OpenLoops> = {
  title: 'Custom/ActiveWork/OpenLoops',
  component: OpenLoops,
  args: {
    loops: INITIATIVE_LOOPS_FIXTURE,
    now: INITIATIVE_NOW,
    linkers: sessionLinkers(),
  },
  argTypes: {
    loops: { table: { disable: true } },
    now: { table: { disable: true } },
    linkers: { table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[620px] p-4">
        <Card variant="outline" className="gap-1 p-4">
          <Story />
        </Card>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **Eyebrow** · **Pill** · **Divider** · **MarkdownProse**. Used-by ↑ the Initiative Reader composition.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof OpenLoops>

/** Five loops of mixed kind. */
export const Default: Story = {}

/** No open loops: the empty state. */
export const Empty: Story = {
  args: { loops: [] },
}
