// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { GoalPriorityIndex } from './GoalPriorityIndex'
import { NINE_PRIORITIES, THREE_PRIORITIES } from './goalPriorityIndex-fixture'

const meta: Meta<typeof GoalPriorityIndex> = {
  title: 'Custom/Workout/Goals/GoalPriorityIndex',
  component: GoalPriorityIndex,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Molecule.** Every declared priority on one wrapping line, grouped by level: the ' +
          "page's index of what the lifter asked this block for (VW-455, the priorities index " +
          'from shape C, explored beside the whole-body card). A priority nothing tracks says ' +
          '"(no target)", the one fact no card on the page carries. Composes ' +
          '[GoalPriorityIcon](?path=/docs/custom-workout-goalpriorityicon--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs). Renders nothing with no ' +
          'priorities; no loading, error or disabled state.',
      },
    },
  },
  args: { priorities: NINE_PRIORITIES },
  argTypes: { priorities: { control: 'object' } },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: '100%' }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalPriorityIndex>

/** F15: nine priorities. Wraps to more lines on a phone. */
export const Default: Story = {}

/** Three priorities, one with no target. */
export const Small: Story = { args: { priorities: THREE_PRIORITIES } }
