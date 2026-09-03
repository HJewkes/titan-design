import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SessionListItem } from './SessionListItem'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'

/**
 * **SessionListItem** — one session in the reader's list: date, track,
 * title, then age · duration · tasks touched.
 *
 * Composes `DateTime` · `Pill` · `Typography`.
 */
const meta: Meta<typeof SessionListItem> = {
  title: 'Custom/ActiveWork/SessionListItem',
  component: SessionListItem,
  args: {
    session: SESSION_FIXTURE[0],
    now: SESSION_NOW,
    selected: false,
  },
  argTypes: {
    session: { table: { disable: true } },
    now: { table: { disable: true } },
    onSelect: { action: 'onSelect' },
  },
  decorators: [
    (Story) => (
      <View className="w-72 p-4">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **DateTime** · **Pill** · **Typography**. Used-by ↑ SessionList. Selection is a prop; the row renders the raised fill and accent bar.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof SessionListItem>

/** A canonical session touching six tasks. */
export const Default: Story = {}

/** The selected treatment: raised fill and a leading accent bar. */
export const Selected: Story = {
  args: { selected: true },
}

/** An ad-hoc session, so the track pill takes its default colour. */
export const AdHoc: Story = {
  args: { session: SESSION_FIXTURE[5] },
}

/** A six-minute session mentioning one task. */
export const Short: Story = {
  args: { session: SESSION_FIXTURE[4] },
}
