import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { GoalLiftCard } from './GoalLiftCard'
import { GoalMilestoneTile } from './GoalMilestoneTile'
import { GOAL_MILESTONE_SCENARIOS as S } from './goalMilestone-fixture'
import { Surface } from '../../ui/surface'

const meta: Meta<typeof GoalLiftCard> = {
  title: 'Custom/Workout/GoalLiftCard',
  component: GoalLiftCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**Organism.** One lift's goal state at card scale — the milestone as the hero, " +
          'its status in the upper right, and the trajectory against the committed/stretch band. ' +
          'Maps 1:1 onto a row of the `#/goals` per-lift table (VW-386). Composes ' +
          '[Card](?path=/docs/components-card--docs) + ' +
          '[Pill](?path=/docs/components-pill--docs) / ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + ' +
          '[Sparkline](?path=/docs/custom-workout-sparkline--docs) + `StarIcon`.\n\n' +
          'The status affordance collapses from a pill to its light below ' +
          '`STATUS_COLLAPSE_WIDTH` (320px) — it never disappears. Drag the canvas ' +
          'edge to watch it, or use the `statusForm` control to force it.',
      },
    },
  },
  args: {
    name: 'BENCH PRESS',
    status: 'on_track',
    milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
    committed: 102.5,
    stretch: 110,
    isPR: true,
    density: 'comfortable',
    actuals: [
      { weekIndex: 1, value: 92.5 },
      { weekIndex: 2, value: 95 },
      { weekIndex: 3, value: 95 },
      { weekIndex: 4, value: 97.5 },
      { weekIndex: 5, value: 100 },
    ],
  },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'on_track',
        'ahead',
        'behind',
        'tolerated',
        'deload_week',
        'calibrating',
        'stalled',
      ],
    },
    density: { control: 'select', options: ['comfortable', 'compact'] },
    statusForm: { control: 'select', options: [undefined, 'pill', 'dot'] },
    isPR: { control: 'boolean' },
    milestone: { control: 'object' },
    actuals: { control: 'object' },
    committed: { control: 'number' },
    stretch: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-md">
        <View style={{ width: 459 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalLiftCard>

/** The 4-up cell at 1920: (1872 - 3x12) / 4. */
export const Default: Story = {}

/**
 * A name long enough to actually wrap in the narrow cell.
 *
 * "ROMANIAN DEADLIFT" was here first and did NOT wrap: it measures ~147.6px
 * against a ~152px content width, so it rendered on one line while the caption
 * claimed otherwise. Measured in the browser, not estimated — this one renders
 * 156px wide and 39px tall against a 19.5px line-height, i.e. exactly two
 * lines. If you swap it, measure the replacement the same way.
 */
const WRAPPING_NAME = 'SINGLE-ARM DUMBBELL ROW'

/**
 * The widths that decide it. 459px is a 4-up cell at 1920, 200px is where the
 * title wraps and the status keeps its light.
 *
 * The wrap is verified HERE, in the browser, not in a unit test: jsdom has no
 * layout engine, so every `getBoundingClientRect` is zero and a rendered line
 * count cannot be asserted. `GoalLiftCard.test.tsx` pins the *mechanism* — that
 * the name carries no line clamp — and this story is what shows the result.
 */
export const Widths: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md">
        <Story />
      </Surface>
    ),
  ],
  render: (args) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-section-sm">
      {[459, 616, 200].map((width) => (
        <View key={width} style={{ width }}>
          <GoalLiftCard {...args} name={width === 200 ? WRAPPING_NAME : args.name} />
        </View>
      ))}
    </View>
  ),
}

/** Four lifts at the wall's 4-up cell width, each carrying the compact meso block. */
const GRID_LIFTS = [
  { name: 'BENCH PRESS', scenario: 'onTrack' },
  { name: 'BACK SQUAT', scenario: 'ahead' },
  { name: 'DEADLIFT', scenario: 'behind' },
  { name: 'OVERHEAD PRESS', scenario: 'hitExact' },
] as const

/**
 * The per-lift grid with the compact milestone block under each card: hero, the
 * week/best/goal facts line, and the block's week cells with their tip cards, at
 * the tile's phone scale.
 *
 * A composition preview, not a `GoalLiftCard` prop — whether the block belongs
 * INSIDE the lift card or beside it is the open question (VW-385 round 3).
 */
export const WithCompactMilestone: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md">
        <Story />
      </Surface>
    ),
  ],
  render: (args) => (
    // `width: max-content` because the meta decorator cages every story in a
    // 459px cell (the 4-up width) and a wrapping row would stack inside it.
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-start', width: 'max-content' }}
      className="gap-section-sm"
    >
      {GRID_LIFTS.map((lift) => (
        <View key={lift.name} style={{ width: 440 }} className="gap-stack-sm">
          <GoalLiftCard {...args} name={lift.name} />
          <GoalMilestoneTile {...S[lift.scenario]} layout="compact" />
        </View>
      ))}
    </View>
  ),
}
