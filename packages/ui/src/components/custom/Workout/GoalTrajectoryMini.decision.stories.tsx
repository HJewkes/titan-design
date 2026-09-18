// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Card } from '../../ui/card'
import { Surface } from '../../ui/surface'
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../Typography'
import { space } from '../../../theme/tokens/semantic'
import { GoalLiftCard, milestoneBlock, type GoalLiftCardProps } from './GoalLiftCard'
import { GoalMilestoneSummary } from './GoalMilestoneSummary'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { GoalTrajectoryMini, type GoalTrajectoryMiniData } from './GoalTrajectoryMini'
import { GoalWeekColumnsChart, type WeekColumnsVariant } from './GoalWeekColumnsChart'
import { PRIMARY_GOAL_SCENARIOS } from './primaryGoal-fixture'

type Lift = Omit<GoalLiftCardProps, 'density' | 'statusForm'> & { prWeek?: number }

/** The four lifts the round-4 per-lift grid shows, so the captures compare like for like. */
const LIFTS: Lift[] = [
  {
    name: 'BENCH PRESS',
    status: 'on_track',
    milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
    committed: 102.5,
    stretch: 110,
    isPR: true,
    prWeek: 5,
    actuals: [92.5, 95, 95, 97.5, 100].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 8, load: 92.5 } },
      { outcome: 'ahead', reading: { reps: 8, load: 95 } },
      { outcome: 'none' },
      { outcome: 'missed', reading: { reps: 8, load: 97.5 } },
    ],
  },
  {
    name: 'BACK SQUAT',
    status: 'ahead',
    milestone: { reps: 5, load: 245, unit: 'lb', goalWeek: 8 },
    committed: 242.5,
    stretch: 250,
    actuals: [225, 230, 235, 240, 242.5].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 5, load: 225 } },
      { outcome: 'ahead', reading: { reps: 5, load: 230 } },
      { outcome: 'ahead', reading: { reps: 5, load: 235 } },
      { outcome: 'ahead', reading: { reps: 5, load: 240 } },
    ],
  },
  {
    name: 'DEADLIFT',
    status: 'behind',
    milestone: { reps: 5, load: 315, unit: 'lb', goalWeek: 8 },
    committed: 312.5,
    stretch: 320,
    actuals: [285, 285, 287.5, 287.5, 290].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 5, load: 285 } },
      { outcome: 'missed', reading: { reps: 5, load: 285 } },
      { outcome: 'missed', reading: { reps: 5, load: 287.5 } },
      { outcome: 'missed', reading: { reps: 5, load: 287.5 } },
    ],
  },
  {
    name: 'OVERHEAD PRESS',
    status: 'calibrating',
    milestone: { reps: 8, load: 95, unit: 'lb', goalWeek: 8 },
    committed: 92.5,
    stretch: 100,
    isPR: true,
    prWeek: 5,
    actuals: [85, 87.5, 90, 92.5, 95].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 8, load: 85 } },
      { outcome: 'on_track', reading: { reps: 8, load: 87.5 } },
      { outcome: 'on_track', reading: { reps: 8, load: 90 } },
      { outcome: 'ahead', reading: { reps: 8, load: 92.5 } },
    ],
  },
]

const MINI_HEIGHT = 64
/** `cells-inset` holds the cells inside the plane, so it is taller by the cells band. */
const INSET_HEIGHT = 74
const CURRENT_WEEK = 5
const CARD_PAD = space.inset.lg

function miniData(lift: Lift): GoalTrajectoryMiniData {
  const last = lift.actuals[lift.actuals.length - 1]
  return {
    actuals: lift.actuals.map((a) => ({ ...a, isPR: a.weekIndex === lift.prWeek })),
    committed: lift.committed,
    goalWeek: lift.milestone.goalWeek,
    nextTarget: {
      weekIndex: last.weekIndex + 1,
      value: lift.milestone.load,
      label: `next week: ${String(lift.milestone.load)} x ${String(lift.milestone.reps)}`,
    },
  }
}

type Variant = 'plane' | WeekColumnsVariant

function MiniChart({ lift, variant, width }: { lift: Lift; variant: Variant; width: number }) {
  const common = {
    ...miniData(lift),
    status: lift.status,
    width,
    currentWeek: CURRENT_WEEK,
    metricLabel: lift.name,
  }
  if (variant === 'plane') {
    return <GoalTrajectoryMini {...common} variant="plane" height={MINI_HEIGHT} />
  }
  return (
    <GoalWeekColumnsChart
      {...common}
      variant={variant}
      height={variant === 'cells-inset' ? INSET_HEIGHT : MINI_HEIGHT}
      {...(lift.weeks ? { weeks: lift.weeks } : {})}
    />
  )
}

/** A stand-in for GoalLiftCard with the chart slot swapped; the card itself is untouched. */
function MiniLiftCard({ lift, variant }: { lift: Lift; variant: Variant }) {
  const { width, onLayout } = useMeasuredWidth()
  return (
    <Card elevation={1} role="article" aria-label={`${lift.name} goal`}>
      <View className="p-inset-lg gap-stack-lg" onLayout={onLayout}>
        <View className="gap-stack-sm">
          <Typography variant="overline" color="tertiary">
            {lift.name}
          </Typography>
          <GoalMilestoneSummary
            {...milestoneBlock({ ...lift, currentWeek: CURRENT_WEEK })}
            showWeeks={variant === 'plane'}
            scale="phone"
          />
        </View>
        {width ? <MiniChart lift={lift} variant={variant} width={width - 2 * CARD_PAD} /> : null}
      </View>
    </Card>
  )
}

const VARIANTS: { key: Variant; letter: string; name: string }[] = [
  { key: 'plane', letter: 'A', name: 'Mini trajectory: plane, line, points, faint committed rule' },
  { key: 'cells', letter: 'D1', name: 'Cells on the plane top edge, current-week column lit' },
  { key: 'cells-ticks', letter: 'D2', name: 'D1 plus a hairline from each cell down to its point' },
  {
    key: 'cells-inset',
    letter: 'D3',
    name: 'Cells inside the plane: the lit column runs from the cell to the floor',
  },
]

function Row({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <View testID={`row-${id}`} className="gap-stack-sm">
      <Typography variant="caption" color="tertiary">
        {title}
      </Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-gutter-sm">
        {children}
      </View>
    </View>
  )
}

function Cards({ cardWidth, render }: { cardWidth: number; render: (lift: Lift) => ReactNode }) {
  return (
    <>
      {LIFTS.map((lift) => (
        <View key={lift.name} style={{ width: cardWidth }}>
          {render(lift)}
        </View>
      ))}
    </>
  )
}

function CompactRows({ cardWidth }: { cardWidth: number }) {
  return (
    <>
      <Row id="today" title="Today: the Sparkline, for comparison">
        <Cards cardWidth={cardWidth} render={(lift) => <GoalLiftCard {...lift} />} />
      </Row>
      {VARIANTS.map((v) => (
        <Row key={v.key} id={v.key} title={`${v.letter}. ${v.name}`}>
          <Cards
            cardWidth={cardWidth}
            render={(lift) => <MiniLiftCard lift={lift} variant={v.key} />}
          />
        </Row>
      ))}
    </>
  )
}

function BigChart({ side, width }: { side: 'left' | 'right'; width: number }) {
  const { goal } = PRIMARY_GOAL_SCENARIOS.onTrack
  return (
    <GoalTrajectoryChart
      {...goal}
      status="on_track"
      width={width}
      height={width >= 720 ? 340 : 220}
      referenceLabelSide={side}
      metricLabel="Bench press"
    />
  )
}

function LabelSideRow({ width }: { width: number }) {
  return (
    <Row
      id="label-side"
      title="E. The big chart: committed and stretch labels right (today) and left"
    >
      {(['right', 'left'] as const).map((side) => (
        <Card key={side} elevation={1}>
          <View className="p-inset-lg gap-stack-sm">
            <Typography variant="caption" color="tertiary">
              {`referenceLabelSide="${side}"`}
            </Typography>
            <BigChart side={side} width={width} />
          </View>
        </Card>
      ))}
    </Row>
  )
}

interface DecisionArgs {
  cardWidth: 440 | 328
  bigChartWidth: number
  showLabelSide: boolean
}

/**
 * VW-385 ideation: a compact goal chart for the per-lift card that reads as a
 * sibling of the big GoalTrajectoryChart. Every variant runs through the big
 * chart's own `deriveTrajectoryGeometry` with compact insets, so the curve, the
 * value floor, the week columns and the marks come from one place.
 *
 * Kept from the big chart: the monotone line, the inset plane with its lip, a
 * point per reading, the PR star, the hollow next-target marker, the status tones
 * (hit green, beyond-goal blue) and the 1 s draw. Dropped: axes, band, gridlines.
 *
 * Round 2 pursues D, the week cells as the chart's x axis, sharing the header's
 * half-column week scale: D1 stands the cells on the plane, D2 ticks each cell
 * down to its point, D3 sits the cells inside the plane. B (stretch rule plus
 * left values) and C (no plane) were dropped. Row E is the big chart with its
 * committed/stretch labels on the left, now decided. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Compact Goal Chart',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    cardWidth: { control: 'inline-radio', options: [440, 328] },
    bigChartWidth: { control: { type: 'number' } },
    showLabelSide: { control: 'boolean' },
  },
  render: (args) => (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm gap-section-sm">
      <CompactRows cardWidth={args.cardWidth} />
      {args.showLabelSide && <LabelSideRow width={args.bigChartWidth} />}
    </Surface>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** The four-up grid at 1920: each card 440 wide, beside the big chart's label-side option. */
export const LiftCardWidth: Story = {
  args: { cardWidth: 440, bigChartWidth: 880, showLabelSide: true },
}

/** The phone: one card per row at 328, and the big chart at phone density. */
export const Phone: Story = {
  args: { cardWidth: 328, bigChartWidth: 296, showLabelSide: true },
}

/** Row E alone, at wall width. */
export const LabelSide: Story = {
  args: { cardWidth: 440, bigChartWidth: 1200, showLabelSide: true },
  render: (args) => (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm gap-section-sm">
      <LabelSideRow width={args.bigChartWidth} />
    </Surface>
  ),
}
