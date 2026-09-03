import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SessionDetail } from './SessionDetail'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

/**
 * **SessionDetail** — one session log: when it ran and for how long, the
 * tasks it touched, then the body as auto-linked prose.
 *
 * Composes `Card` · `Divider` · `Pill` · `DateTime` · `MarkdownProse`.
 */
const meta: Meta<typeof SessionDetail> = {
  title: 'Custom/ActiveWork/SessionDetail',
  component: SessionDetail,
  args: {
    session: SESSION_FIXTURE[0],
    now: SESSION_NOW,
  },
  argTypes: {
    session: { table: { disable: true } },
    now: { table: { disable: true } },
    onPressTask: { action: 'onPressTask' },
    onPressLink: { action: 'onPressLink' },
    onPressPr: { action: 'onPressPr' },
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
          'Composes **Card** · **Divider** · **Pill** · **DateTime** · **MarkdownProse** (with the session linkers). Used-by ↑ the Session Reader composition.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof SessionDetail>

/** A long canonical session touching six tasks. */
export const Default: Story = {}

/** A six-minute session with a short log. */
export const Short: Story = {
  args: { session: SESSION_FIXTURE[4] },
}

/** An ad-hoc session: `[[name]]` link and a PR number, one task mentioned. */
export const AdHoc: Story = {
  args: { session: SESSION_FIXTURE[5] },
}

/** No handlers: references stay highlighted but are not pressable. */
export const Inert: Story = {
  args: { onPressTask: undefined, onPressLink: undefined, onPressPr: undefined },
}
