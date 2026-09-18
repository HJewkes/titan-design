import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { GoalLiftCard } from './GoalLiftCard'
import { Surface } from '../../ui/surface'

/** Weeks 1-4 of the block, so a card can take the prefix it has lived through. */
const WEEKS = [
  { outcome: 'on_track', reading: { reps: 8, load: 95 } },
  { outcome: 'ahead', reading: { reps: 8, load: 100 } },
  { outcome: 'none' },
  { outcome: 'missed', reading: { reps: 6, load: 97.5 } },
] as const

const meta: Meta<typeof GoalLiftCard> = {
  title: 'Custom/Workout/GoalLiftCard',
  component: GoalLiftCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**Organism.** One lift's goal state at card scale — the meso target block " +
          '(gap hero, week/best/goal facts, week cells), its status and PR mark in the top ' +
          'row, and the trajectory against the committed/stretch band. ' +
          'Maps 1:1 onto a row of the `#/goals` per-lift table (VW-386). Composes ' +
          '[Card](?path=/docs/components-card--docs) + ' +
          '[Pill](?path=/docs/components-pill--docs) / ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + ' +
          '[Sparkline](?path=/docs/custom-workout-sparkline--docs) + ' +
          '`GoalMilestoneSummary` + `StarIcon`.\n\n' +
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

/** Four lifts at the wall's 4-up cell width, each with its own history and gap. */
const GRID_LIFTS = [
  {
    name: 'BENCH PRESS',
    status: 'on_track',
    weeks: WEEKS.slice(0, 3),
    isPR: true,
    milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
    actuals: [
      { weekIndex: 1, value: 92.5 },
      { weekIndex: 3, value: 95 },
      { weekIndex: 5, value: 100 },
    ],
  },
  {
    name: 'BACK SQUAT',
    status: 'ahead',
    weeks: WEEKS.slice(0, 4),
    isPR: false,
    milestone: { reps: 5, load: 245, unit: 'lb', goalWeek: 8 },
    actuals: [
      { weekIndex: 1, value: 225 },
      { weekIndex: 3, value: 235 },
      { weekIndex: 5, value: 242.5 },
    ],
  },
  {
    name: 'DEADLIFT',
    status: 'behind',
    weeks: WEEKS.slice(0, 2),
    isPR: false,
    milestone: { reps: 5, load: 315, unit: 'lb', goalWeek: 8 },
    actuals: [
      { weekIndex: 1, value: 285 },
      { weekIndex: 3, value: 287.5 },
      { weekIndex: 5, value: 290 },
    ],
  },
  {
    name: 'OVERHEAD PRESS',
    status: 'calibrating',
    weeks: [],
    isPR: true,
    milestone: { reps: 8, load: 95, unit: 'lb', goalWeek: 8 },
    actuals: [{ weekIndex: 5, value: 95 }],
  },
] as const

/**
 * The per-lift grid as the wall lays it out: four cards, each leading with its
 * meso target block — what is left to the goal, the week/best/goal facts line,
 * and the block's week cells with their tip cards.
 */
export const PerLiftGrid: Story = {
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
        <View key={lift.name} style={{ width: 440 }}>
          <GoalLiftCard
            {...args}
            name={lift.name}
            status={lift.status}
            weeks={lift.weeks}
            isPR={lift.isPR}
            milestone={lift.milestone}
            actuals={[...lift.actuals]}
            committed={lift.milestone.load - 2.5}
            stretch={lift.milestone.load + 5}
          />
        </View>
      ))}
    </View>
  ),
}
