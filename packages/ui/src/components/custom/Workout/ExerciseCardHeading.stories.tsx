import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import type { SetStripSet } from './SetStrip'
import { Surface } from '../../ui/surface'

/**
 * `ExerciseCardHeading` — THE exercise row. One component for the three densities the
 * workout surfaces list an exercise in: the session-rail heading (`rail`), the collapsed
 * card row (`compact`) and the not-yet-reached row (`upcoming`). An `ExerciseHeading` info
 * block over its per-set `SetStrip`; an empty `setStates` renders no strip.
 */
const meta: Meta<typeof ExerciseCardHeading> = {
  title: 'Custom/Workout/ExerciseCardHeading',
  component: ExerciseCardHeading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The exercise row, in three densities driven by props rather than by ' +
          'three call sites (TD-03.56). Composes ' +
          '[ExerciseHeading](?path=/docs/custom-workout-exerciseheading--docs) + ' +
          '[SetStrip](?path=/docs/custom-workout-setstrip--docs). ' +
          'Interaction states (TD-03.55) are `interactive-*` token washes — press > selection > ' +
          'hover — plus an `isLive` name tone. All static: this row renders on the wall during a ' +
          'set, so nothing here animates. Hover is web-only; on a touch surface the row simply ' +
          'has no hover state and selection carries the same meaning. ' +
          'Used-by ↑ [SessionRail](?path=/docs/shell-sessionrail--docs); ' +
          '[ExerciseCard](?path=/docs/custom-workout-exercisecard--docs) delegates all three of its ' +
          'representations here.',
      },
    },
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['rail', 'compact', 'upcoming'] },
    unit: { control: 'select', options: ['lbs', 'kg'] },
    indicator: {
      control: 'select',
      options: [undefined, 'imbalance', 'overshoot', 'velocity-loss', 'missed-reps', 'pr', 'info'],
    },
    stripHeight: { control: { type: 'range', min: 2, max: 16, step: 1 } },
    dimmed: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    isLive: { control: 'boolean' },
    onPress: { action: 'press' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 246 }}>
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExerciseCardHeading>

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

const inProgress: SetStripSet[] = [
  { status: 'done', velocities: decay(10, 0.72) },
  { status: 'active', velocities: decay(5, 0.62), planned: 10 },
  { status: 'todo', planned: 10 },
]

export const Default: Story = {
  args: {
    name: 'Cable Chest Press',
    sets: 3,
    reps: 10,
    load: 90,
    unit: 'lbs',
    tempo: [2, 1, 2, 0],
    indicator: 'info',
    setStates: inProgress,
    stripHeight: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'The `rail` density: two lines (name, then prescription beside the tempo).',
      },
    },
  },
}

export const Compact: Story = {
  args: {
    ...Default.args,
    density: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The collapsed card row: name and prescription on ONE line, strip below. The tempo is ' +
          'dropped — a single line has no room for a second metric lockup.',
      },
    },
  },
}

export const Upcoming: Story = {
  args: {
    name: 'Overhead Press',
    density: 'upcoming',
    prescription: '3×8-12 @ RPE 8',
    previousBest: '135 lbs × 10',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A not-yet-reached exercise: `compact`, dimmed by its own density, with the previous ' +
          'best pinned right. `prescription` is the free-text alternative to the structured ' +
          '`sets` / `reps` / `load` triple, for an exercise whose numbers are not loaded yet.',
      },
    },
  },
}

export const Live: Story = {
  args: {
    ...Default.args,
    isLive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The exercise being performed right now — the name takes `status-live`. A tone change, ' +
          'never motion: this row is on a wall display during a set.',
      },
    },
  },
}

export const Selected: Story = {
  args: {
    ...Default.args,
    isSelected: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The row the user has chosen: a persistent `interactive-selected` wash. Hover the row ' +
          'to see the lighter `interactive-hover` wash it outranks.',
      },
    },
  },
}

export const Dimmed: Story = {
  args: {
    ...Default.args,
    dimmed: true,
    setStates: [1, 2, 3].map((): SetStripSet => ({ status: 'todo', planned: 18 })),
  },
  parameters: {
    docs: { description: { story: 'A not-yet-reached exercise — the whole heading dims.' } },
  },
}

export const WithoutStrip: Story = {
  args: {
    name: 'Standing Calf Raise',
    sets: 5,
    reps: 20,
    load: 25,
    unit: 'lbs',
    tempo: [2, 1, 2, 0],
    setStates: [],
  },
  parameters: {
    docs: {
      description: { story: 'An empty `setStates` list renders the heading with no strip.' },
    },
  },
}
