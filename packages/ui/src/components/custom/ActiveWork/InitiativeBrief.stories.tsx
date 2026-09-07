import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Card } from '../../ui/card'
import { InitiativeBrief } from './InitiativeBrief'
import { sessionLinkers } from './session-linkers'
import { INITIATIVE_BRIEF_FIXTURE } from './initiative-fixture'

/**
 * **InitiativeBrief** — a brief's prose, each `##` section a collapsible block
 * with the first open, references auto-linked.
 *
 * Composes `Collapse` · `Eyebrow` · `MarkdownProse` · `Typography`.
 */
const meta: Meta<typeof InitiativeBrief> = {
  title: 'Custom/ActiveWork/InitiativeBrief',
  component: InitiativeBrief,
  args: {
    brief: INITIATIVE_BRIEF_FIXTURE,
    linkers: sessionLinkers(),
  },
  argTypes: {
    brief: { table: { disable: true } },
    linkers: { table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[560px] p-4">
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
          'Composes **Collapse** · **Eyebrow** · **MarkdownProse** · **Typography**. Used-by ↑ the Initiative Reader composition.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof InitiativeBrief>

/** The active-work brief, its sections collapsible. */
export const Default: Story = {}
