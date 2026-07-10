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
  title: 'Workout/SetBar',
  component: SetBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** ONE set’s multi-coloured bar — the per-rep colour segments for a ' +
          'single set (done / active-with-pulse / todo). Colours are the real titan ramp pins. ' +
          'Used-by ↑ [SetStrip](?path=/docs/workout-setstrip--docs).',
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

export const Range: Story = {
  args: {
    height: 8,
    set: { status: 'range', floor: 15, max: 20, doneVels: decay(17, 0.85) } as SetStripSet,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variable rep-range (e.g. 15–20): range-max segments. Done reps are velocity-' +
          'coloured (even past the floor), the committed-todo zone is grey, and the variable-' +
          'todo zone (floor→max) is the cyan variable/opportunity pin.',
      },
    },
  },
}

export const Drop: Story = {
  args: {
    height: 8,
    set: { status: 'drop', subloads: [decay(10, 0.85), decay(8, 0.7), decay(6, 0.6)] } as SetStripSet,
  },
  parameters: {
    docs: {
      description: {
        story: 'One set, no rest: sub-loads butted internally and split by 2px notches.',
      },
    },
  },
}

export const Myo: Story = {
  args: {
    height: 8,
    set: {
      status: 'myo',
      activation: decay(15, 0.75),
      clusters: [decay(5, 0.6), decay(5, 0.55), decay(5, 0.5)],
    } as SetStripSet,
  },
  parameters: {
    docs: {
      description: {
        story: 'Myo-rep / rest-pause (done): activation chunk + mini-clusters split by 3px gaps.',
      },
    },
  },
}

export const MyoUpcoming: Story = {
  args: {
    height: 8,
    set: { status: 'myo-upcoming', activationLen: 15 } as SetStripSet,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Planned myo, length unknown: grey activation + a fading cyan "clusters-to-failure" ' +
          'trail whose right edge is left open — "more coming, count unknown".',
      },
    },
  },
}
