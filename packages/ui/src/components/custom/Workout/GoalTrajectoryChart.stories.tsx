import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import type { GoalActualPoint, GoalExpectedPoint, GoalTrajectoryWeek } from './GoalTrajectoryChart'

/** Six-week bench block: +5 lb/wk committed edge, the RP ramp as the stretch edge. */
const benchExpected: GoalExpectedPoint[] = [
  { weekIndex: 1, low: 175, high: 175 },
  { weekIndex: 2, low: 177, high: 179 },
  { weekIndex: 3, low: 179, high: 183 },
  { weekIndex: 4, low: 181, high: 187 },
  { weekIndex: 5, low: 183, high: 191 },
  { weekIndex: 6, low: 185, high: 195 },
]

const benchWeeks: GoalTrajectoryWeek[] = [
  { index: 1 },
  { index: 2 },
  { index: 3 },
  { index: 4 },
  { index: 5, isDeload: true },
  { index: 6 },
]

const onTrackActuals: GoalActualPoint[] = [
  { weekIndex: 1, value: 175 },
  { weekIndex: 2, value: 178 },
  { weekIndex: 3, value: 181, isPR: true },
  { weekIndex: 4, value: 184 },
]

const bench = {
  expected: benchExpected,
  weeks: benchWeeks,
  committed: 185,
  stretch: 195,
  mesoBoundaries: [6],
  metricLabel: 'Bench top load at 8 reps',
  unit: 'lbs',
}

/** Wall dashboard: 1200 px wide, read across a room. */
const WALL = { width: 1200, height: 340 }
/** Phone: 360 px wide, the VW-353 phone layout target. */
const PHONE = { width: 360, height: 220 }

const meta: Meta<typeof GoalTrajectoryChart> = {
  title: 'Custom/Workout/DataViz/GoalTrajectoryChart',
  component: GoalTrajectoryChart,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'range', min: 320, max: 1400, step: 20 },
      description: 'Chart width in px (360 phone, 1200 wall)',
    },
    height: {
      control: { type: 'range', min: 160, max: 420, step: 10 },
      description: 'Chart height in px',
    },
    status: {
      control: { type: 'select' },
      options: [
        'on_track',
        'ahead',
        'behind',
        'tolerated',
        'deload_week',
        'calibrating',
        'stalled',
      ],
      description: 'Read-model status; drives the actual line tone and the pill',
    },
    direction: {
      control: { type: 'inline-radio' },
      options: ['up', 'down'],
      description: 'Which way "better" points; `down` is a loss goal',
    },
    expected: { description: 'Expected band per week (`low` committed edge, `high` stretch edge)' },
    committed: { description: 'Committed target — the low edge of the honest band' },
    stretch: { description: 'Stretch target — the high edge' },
    actuals: { description: 'Measured values; `isPR` adds a star' },
    weeks: { description: 'Planned weeks; `isDeload` flattens the band and shades the column' },
    mesoBoundaries: { description: 'Week indices where a mesocycle boundary falls' },
    animate: {
      control: 'boolean',
      description: 'Play the entrance (line draw, then shadow and points). Remount to replay.',
    },
    leftShadowSpread: {
      control: { type: 'range', min: 0, max: 0.08, step: 0.005 },
      description: 'Fraction of the plot width the left inner shadow fades over',
    },
  },
  // The plot plane sits one step below the card it is drawn on, as on the page.
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-md">
        <Surface raise={1} className="p-inset-md self-start">
          <Story />
        </Surface>
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof GoalTrajectoryChart>

export const OnTrack: Story = {
  args: { ...bench, ...WALL, actuals: onTrackActuals, status: 'on_track' },
}

/**
 * Ahead of the band. The line takes the BRAND tone, never warning-amber — amber
 * is the PR/pacing hue and "better than asked" must not read as a warning
 * (REJECTED.md, "amber holds").
 */
export const Ahead: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'ahead',
    actuals: [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 181 },
      { weekIndex: 3, value: 186, isPR: true },
      { weekIndex: 4, value: 191, isPR: true },
    ],
  },
}

export const Behind: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'behind',
    actuals: [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 175 },
      { weekIndex: 3, value: 176 },
      { weekIndex: 4, value: 175 },
    ],
  },
}

/** Off the line, but expected for the declared diet phase — no verdict is drawn. */
export const Tolerated: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'tolerated',
    actuals: [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 176 },
      { weekIndex: 3, value: 176 },
      { weekIndex: 4, value: 177, matched: false },
    ],
  },
}

/** Week 5 is a deload: the band runs flat through it and the column is shaded. */
export const DeloadWeek: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'deload_week',
    actuals: [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 178 },
      { weekIndex: 3, value: 181, isPR: true },
      { weekIndex: 4, value: 184 },
      { weekIndex: 5, value: 165 },
    ],
  },
}

/** Two matched sessions is not a trend: the band is shown, no gain claim is made. */
export const Calibrating: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'calibrating',
    actuals: [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 176 },
    ],
  },
}

export const Stalled: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'stalled',
    actuals: [
      { weekIndex: 1, value: 178 },
      { weekIndex: 2, value: 178 },
      { weekIndex: 3, value: 177 },
      { weekIndex: 4, value: 178 },
      { weekIndex: 5, value: 177 },
    ],
  },
}

/**
 * A bodyweight loss goal. `low` (193) is numerically GREATER than `high` (188):
 * the band polygon orders in pixel space, so it draws the same as a gain goal.
 * Actuals arrive dated, placed against each week's `startDate`.
 */
export const LossGoalBodyweight: Story = {
  args: {
    ...WALL,
    status: 'on_track',
    direction: 'down',
    unit: 'lbs',
    metricLabel: 'Bodyweight',
    committed: 193,
    stretch: 188,
    mesoBoundaries: [4],
    expected: [
      { weekIndex: 1, low: 198, high: 198 },
      { weekIndex: 2, low: 197, high: 195.5 },
      { weekIndex: 3, low: 196, high: 193 },
      { weekIndex: 4, low: 195, high: 190.5 },
      { weekIndex: 5, low: 194, high: 189 },
      { weekIndex: 6, low: 193, high: 188 },
    ],
    weeks: [
      { index: 1, startDate: '2026-09-07' },
      { index: 2, startDate: '2026-09-14' },
      { index: 3, startDate: '2026-09-21' },
      { index: 4, startDate: '2026-09-28', isDeload: true },
      { index: 5, startDate: '2026-10-05' },
      { index: 6, startDate: '2026-10-12' },
    ],
    actuals: [
      { ts: '2026-09-08', value: 198 },
      { ts: '2026-09-15', value: 196.5 },
      { ts: '2026-09-23', value: 195 },
      { ts: '2026-09-30', value: 194.5 },
    ],
  },
}

/** Nothing measured and no band yet — the page says "calibrating", not zero. */
export const EmptyCalibrating: Story = {
  args: {
    ...WALL,
    status: 'calibrating',
    metricLabel: 'Bench top load at 8 reps',
    committed: 185,
    stretch: 195,
    expected: [],
    actuals: [],
    weeks: [],
  },
}

/** The same on-track block at phone width: 2px line and three gridlines. */
export const PhoneOnTrack: Story = {
  args: { ...bench, ...PHONE, actuals: onTrackActuals, status: 'on_track' },
}

/** The loss goal at phone width. */
export const PhoneLossGoal: Story = {
  args: { ...LossGoalBodyweight.args, ...PHONE } as Story['args'],
}

/**
 * The final frame with the entrance switched off: the deterministic render to
 * baseline against.
 */
export const NoMotion: Story = {
  args: { ...bench, ...WALL, actuals: onTrackActuals, status: 'on_track', animate: false },
}

/** A noisy block (a bad week 3, a PR at 4, a dip at 5) at wall width, with the entrance. */
export const WallMotion: Story = {
  args: {
    ...bench,
    ...WALL,
    status: 'on_track',
    animate: true,
    actuals: [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 179 },
      { weekIndex: 3, value: 177 },
      { weekIndex: 4, value: 184, isPR: true },
      { weekIndex: 5, value: 182 },
    ],
  },
}

/** The same noisy block at phone width: 2px line, three gridlines. */
export const PhoneMotion: Story = {
  args: { ...WallMotion.args, ...PHONE } as Story['args'],
}
