import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SetBar, type SetStripSet } from './SetBar'

/**
 * `SetBar` — ONE set's multi-coloured bar: the butted per-rep colour segments for a
 * single set. `done` = velocity-coloured reps · `active` = performed reps pulse with
 * a grey remainder · `todo` = a solid grey bar. Colours are the real titan ramp pins
 * (red-600 · orange-400 · amber-300 · green-300). {@link SetStrip} lays several side by side.
 */
const meta: Meta<typeof SetBar> = {
  title: 'Shell/SessionRail/ExerciseCardHeading/SetStrip/SetBar',
  component: SetBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** ONE set’s multi-coloured bar — the per-rep colour segments for a ' +
          'single set (done / active-with-pulse / todo). Colours are the real titan ramp pins. ' +
          'Used-by ↑ [SetStrip](?path=/docs/shell-sessionrail-exercisecardheading-setstrip--docs).',
      },
    },
  },
  argTypes: {
    height: { control: { type: 'range', min: 2, max: 16, step: 1 } },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 180, flexDirection: 'row', padding: 16, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SetBar>

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

export const Done: Story = {
  args: { height: 8, set: { status: 'done', velocities: decay(8, 0.9) } as SetStripSet },
}

export const Active: Story = {
  args: {
    height: 8,
    set: { status: 'active', velocities: decay(5, 0.62), planned: 10 } as SetStripSet,
  },
  parameters: {
    docs: { description: { story: 'Performed reps pulse; the planned remainder is greyed.' } },
  },
}

export const Todo: Story = {
  args: { height: 8, set: { status: 'todo', planned: 10 } as SetStripSet },
}
