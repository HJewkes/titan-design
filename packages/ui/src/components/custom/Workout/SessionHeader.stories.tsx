import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { SessionHeader, type SessionHeaderPlanEntry } from './SessionHeader'

/**
 * `SessionHeader` — the session-rail heading: the session title over a stat row and a
 * chunked pace bar. Live, it carries Volume/Load/Fatigue tiles, a per-exercise progress
 * bar (fill ∝ sets done, coloured against the elapsed-vs-budget pace with a live marker),
 * a mono `n/total sets` label and a ⏱ elapsed readout. Upcoming, the tiles become
 * Date/Time/Until, the bar is the empty plan shape, and the readout shows the planned
 * duration. Rendered on the raised grey plane.
 */
const meta: Meta<typeof SessionHeader> = {
  title: 'Shell/SessionRail/SessionHeader',
  component: SessionHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** (shell S3). The session-rail heading — title, stat tiles, chunked ' +
          'pace bar, sets label + ⏱ readout, on the raised grey plane. Composes ' +
          '[MetricTiles](?path=/docs/workout-metrictiles--docs) / ' +
          '[ScheduleTiles](?path=/docs/workout-scheduletiles--docs) + ' +
          '[SegmentedProgressBar](?path=/docs/workout-segmentedprogressbar--docs) + ' +
          '[TimerReadout](?path=/docs/components-atoms-timerreadout--docs). ' +
          'Used-by ↑ [SessionRail](?path=/docs/shell-sessionrail--docs).',
      },
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SessionHeader>

const AMBER = primitiveRamps.amber[300]

const PLAN: SessionHeaderPlanEntry[] = [
  { name: 'Seated Row', sets: 3 },
  { name: 'Incline DB', sets: 3 },
  { name: 'Chest Press', sets: 2 },
  { name: 'Calf Raise', sets: 2 },
  { name: 'Face Pull', sets: 2 },
]

const LIVE_METRICS = [
  { label: 'Volume', value: '76%' },
  { label: 'Load', value: '7.3k' },
  { label: 'Fatigue', value: 'MOD', valueColor: AMBER },
]

// 42:18 elapsed against a 60:00 budget → ~70% of the way through the time budget while
// only 7.2/12 sets are done, so the fill trails the marker (amber, behind pace).
const ELAPSED_MS = (42 * 60 + 18) * 1000
const BUDGET_MS = 60 * 60 * 1000

export const LiveBehind: Story = {
  args: {
    title: 'Pull A · Intensification',
    plan: PLAN,
    setsDone: 7.2,
    elapsedMs: ELAPSED_MS,
    budgetMs: BUDGET_MS,
    metrics: LIVE_METRICS,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live, behind pace — sets fill (7.2/12) trails the elapsed-time marker, so the ' +
          'bar and sets label read amber. ⏱ elapsed goes live-green with the ` / 60:00` budget.',
      },
    },
  },
}

export const LiveNoTime: Story = {
  args: {
    title: 'Pull A · Intensification',
    plan: PLAN,
    setsDone: 7.2,
    elapsedMs: ELAPSED_MS,
    metrics: LIVE_METRICS,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live, no time target — no marker and no ` / budget`, just the ⏱ elapsed. The bar ' +
          'is plain chunked progress (steel), and the sets label follows.',
      },
    },
  },
}

export const Upcoming: Story = {
  args: {
    title: 'Lower B · Volume',
    plan: PLAN,
    budgetMs: 52 * 60 * 1000,
    next: Date.now() + 2 * 24 * 60 * 60 * 1000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Upcoming session — the tiles become Date / Time / Until (Until accents only when ' +
          '< 1 day away), the bar is the empty plan shape, and the ⏱ readout shows the planned ' +
          'duration. `title` is the next session’s name.',
      },
    },
  },
}
