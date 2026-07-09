// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SegmentedProgressBar } from './SegmentedProgressBar'

const PLAN = [{ weight: 3 }, { weight: 3 }, { weight: 2 }, { weight: 2 }, { weight: 2 }]

const meta: Meta<typeof SegmentedProgressBar> = {
  title: 'Workout/SegmentedProgressBar',
  component: SegmentedProgressBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** Composes [SegmentedBar](?path=/docs/workout-segmentedbar--docs) + paceTone. Used-by ↑ SessionHeader.',
      },
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246, padding: 16, backgroundColor: '#242424' }}>
        <Story />
      </View>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof SegmentedProgressBar>

/** Fill (sets done) trails the time marker → amber pace. */
export const Behind: Story = {
  args: { segments: PLAN, value: 7.2, target: 0.7 },
}

/** Fill is at or past the time marker → green pace. */
export const Ahead: Story = {
  args: { segments: PLAN, value: 9.5, target: 0.7 },
}

/** No target → no marker, plain steel progress. */
export const NoTarget: Story = {
  args: { segments: PLAN, value: 7 },
}

/** Nothing performed yet — the empty plan shape. */
export const Empty: Story = {
  args: { segments: PLAN, value: 0 },
}
