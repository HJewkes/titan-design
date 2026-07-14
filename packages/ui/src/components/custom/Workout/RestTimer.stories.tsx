import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { RestTimer } from './RestTimer'

const meta: Meta<typeof RestTimer> = {
  title: 'Workout/RestTimer',
  component: RestTimer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled rest countdown (presentational off `useTimer`; pass `totalSeconds` + ' +
          '`elapsedMs`). Two variants: `bar` (default) — the compact linear card (REST label + ' +
          'mm:ss + progress bar + controls), the mobile bottom-bar treatment; and `ring` — the ' +
          'across-the-room wall treatment: a draining countdown ring (composes `CircularProgress`) ' +
          'with the mm:ss countdown in its center, flipping to a full `success` ring reading "GO" ' +
          'when rest is up. `displayOnly` hides the +30s/Skip controls in either variant; `size` ' +
          'sets the ring diameter.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['bar', 'ring'],
      description: 'bar (compact linear card) or ring (wall countdown)',
    },
    totalSeconds: {
      control: 'number',
      description: 'Total rest duration in seconds',
    },
    elapsedMs: {
      control: 'number',
      description: 'Elapsed time in milliseconds',
    },
    size: {
      control: { type: 'number', min: 96, max: 280, step: 4 },
      description: 'ring diameter in px (default 180)',
    },
    visible: {
      control: 'boolean',
      description: 'Whether the timer is visible',
    },
    nextSetInfo: {
      control: 'text',
      description: 'Context about the next set',
    },
  },
}

export default meta
type Story = StoryObj<typeof RestTimer>

export const Default: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 30000,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
}

export const NearlyComplete: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 145000,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
}

export const WithNextSetInfo: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 30000,
    onSkip: () => {},
    onAddTime: () => {},
    nextSetInfo: 'Bench Press — Set 3 of 4',
    visible: true,
  },
}

export const JustStarted: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 0,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
}

// --- Ring variant ------------------------------------------------------------
// The across-the-room wall rest treatment. Rendered on the north-star wall
// background so the draining ring reads the way it will live.

/** Wall-background frame for the ring stories (mirrors the north-star rest page). */
const ringDecorator: Decorator = (Story) => (
  <View style={{ width: 420, padding: 32, alignItems: 'center', backgroundColor: '#0E0E0E' }}>
    <Text
      style={{
        color: '#5A5A5A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 20,
      }}
    >
      REST · UNTIL NEXT SET · (organism chrome — not the component)
    </Text>
    <Story />
  </View>
)

/** Controls-driven ring: flip `totalSeconds` / `elapsedMs` / `size` / `displayOnly`. */
export const RingPlayground: Story = {
  args: {
    variant: 'ring',
    totalSeconds: 120,
    elapsedMs: 47000,
    nextSetInfo: 'Next · Bench Press · set 3 of 4',
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
  decorators: [ringDecorator],
}

/** Just started: the ring is nearly full and draining. */
export const RingJustStarted: Story = {
  args: {
    variant: 'ring',
    totalSeconds: 120,
    elapsedMs: 8000,
    nextSetInfo: 'Next · Bench Press · set 3 of 4',
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
  decorators: [ringDecorator],
}

/** Midway: half the rest has drained. */
export const RingMidway: Story = {
  args: {
    variant: 'ring',
    totalSeconds: 120,
    elapsedMs: 60000,
    nextSetInfo: 'Next · Bench Press · set 3 of 4',
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
  decorators: [ringDecorator],
}

/** Almost done: a sliver of ring left. */
export const RingAlmostDone: Story = {
  args: {
    variant: 'ring',
    totalSeconds: 120,
    elapsedMs: 112000,
    nextSetInfo: 'Next · Bench Press · set 3 of 4',
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
  decorators: [ringDecorator],
}

/** Rest is up: the ring empties and flips to success (go time). */
export const RingDone: Story = {
  args: {
    variant: 'ring',
    totalSeconds: 120,
    elapsedMs: 120000,
    nextSetInfo: 'Next · Bench Press · set 3 of 4',
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
  decorators: [ringDecorator],
}

/** Display-only ring (poll mode): the ring + next-set line, no controls. */
export const RingDisplayOnly: Story = {
  args: {
    variant: 'ring',
    totalSeconds: 120,
    elapsedMs: 47000,
    nextSetInfo: 'Next · Bench Press · set 3 of 4',
    displayOnly: true,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
  decorators: [ringDecorator],
}
