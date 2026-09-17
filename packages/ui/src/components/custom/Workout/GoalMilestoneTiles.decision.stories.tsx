// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Card } from '../../ui/card'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import {
  GoalMilestoneTile,
  type GoalMilestoneTileProps,
  type GoalMilestoneTileVariant,
} from './GoalMilestoneTile'

type Frame = 'wall' | 'phone'

interface Scenario {
  name: string
  props: Omit<GoalMilestoneTileProps, 'variant' | 'density'>
}

const TARGET = { reps: 8, load: 105, unit: 'lb' as const, goalWeek: 8 }
const START = { reps: 8, load: 95 }

/** One goal at four points in its life; only the best set and the calendar move. */
const SCENARIOS: Scenario[] = [
  {
    name: 'Upcoming, on track',
    props: { current: { reps: 8, load: 100 }, currentWeek: 5, status: 'on_track' },
  },
  {
    name: 'Due this week, behind',
    props: { current: { reps: 6, load: 105 }, currentWeek: 8, status: 'behind' },
  },
  { name: 'Hit early', props: { current: { reps: 8, load: 105 }, currentWeek: 7 } },
  { name: 'Missed', props: { current: { reps: 8, load: 102.5 }, currentWeek: 9 } },
]

const VARIANTS: Record<GoalMilestoneTileVariant, { letter: string; title: string; note: string }> =
  {
    numeric: {
      letter: 'A',
      title: 'Numeric',
      note: 'Big load, reps as the unit line, the week as a muted caption.',
    },
    progress: {
      letter: 'B',
      title: 'Progress',
      note: 'A plus a thin bar from the starting set to the target, filled in the state colour.',
    },
    timeline: {
      letter: 'C',
      title: 'Timeline',
      note: 'A plus a week strip in the chart axis language: the goal cell coloured, now ringed.',
    },
    gap: {
      letter: 'D',
      title: 'Gap',
      note: 'The distance is the hero; target and best set sit under it. Falls back to A once hit.',
    },
  }

function tileProps(scenario: Scenario): GoalMilestoneTileProps {
  return { milestone: TARGET, start: START, totalWeeks: 10, ...scenario.props }
}

function Caption({ children }: { children: string }) {
  return (
    <Typography variant="caption" color="tertiary">
      {children}
    </Typography>
  )
}

function WallRow({ variant }: { variant: GoalMilestoneTileVariant }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-inline-lg">
      {SCENARIOS.map((scenario) => (
        <View key={scenario.name} style={{ flex: 1, minWidth: 0 }} className="gap-stack-sm">
          <Caption>{scenario.name}</Caption>
          <GoalMilestoneTile {...tileProps(scenario)} variant={variant} density="comfortable" />
        </View>
      ))}
    </View>
  )
}

/** The compact tile nested, unframed, in a per-lift card, as it would sit on the phone. */
function InCard({ variant, scenario }: { variant: GoalMilestoneTileVariant; scenario: Scenario }) {
  return (
    <Card elevation={1}>
      <View className="p-inset-md gap-stack-sm">
        <Typography variant="overline" color="tertiary">
          CABLE CHEST PRESS
        </Typography>
        <GoalMilestoneTile
          {...tileProps(scenario)}
          variant={variant}
          density="compact"
          framed={false}
        />
      </View>
    </Card>
  )
}

function PhoneColumn({ variant }: { variant: GoalMilestoneTileVariant }) {
  return (
    <View style={{ width: 360 }} className="gap-stack-lg">
      {SCENARIOS.map((scenario) => (
        <View key={scenario.name} className="gap-stack-sm">
          <Caption>{scenario.name}</Caption>
          <GoalMilestoneTile {...tileProps(scenario)} variant={variant} density="compact" />
        </View>
      ))}
      <Caption>Nested in a per-lift card (unframed)</Caption>
      <InCard variant={variant} scenario={SCENARIOS[0]} />
    </View>
  )
}

function VariantHeading({ variant }: { variant: GoalMilestoneTileVariant }) {
  const v = VARIANTS[variant]
  return (
    <View className="gap-stack-sm">
      <Typography variant="h6">{`${v.letter} · ${v.title}`}</Typography>
      <Typography variant="body2" color="secondary">
        {v.note}
      </Typography>
    </View>
  )
}

function VariantBoard({ variant, frame }: { variant: GoalMilestoneTileVariant; frame: Frame }) {
  return (
    <View className="gap-stack-lg">
      <VariantHeading variant={variant} />
      {frame === 'wall' ? <WallRow variant={variant} /> : <PhoneColumn variant={variant} />}
    </View>
  )
}

function Backdrop({ children, frame }: { children: ReactNode; frame: Frame }) {
  return (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: frame === 'wall' ? 1200 : 392 }}
      className="p-gutter-sm gap-section-md"
    >
      {children}
    </Surface>
  )
}

interface DecisionArgs {
  frame: Frame
}

/**
 * VW-385 unit 3: which milestone tile the `#/goals` wall and the phone use.
 * Every variant renders one goal at four points in its life, at wall size
 * (1200 wide, comfortable) and in a 360 phone column (compact). Dark only:
 * light mode in Storybook is VW-397.
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Goal Milestone Tiles',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: { frame: { control: 'inline-radio', options: ['wall', 'phone'] } },
  args: { frame: 'wall' },
}
export default meta

type Story = StoryObj<DecisionArgs>

function variantStory(variant: GoalMilestoneTileVariant, frame: Frame): Story {
  return {
    args: { frame },
    render: (args) => (
      <Backdrop frame={args.frame}>
        <VariantBoard variant={variant} frame={args.frame} />
      </Backdrop>
    ),
  }
}

/** Every variant stacked, each across the same four states. */
export const Compare: Story = {
  render: (args) => (
    <Backdrop frame={args.frame}>
      {(Object.keys(VARIANTS) as GoalMilestoneTileVariant[]).map((variant) => (
        <VariantBoard key={variant} variant={variant} frame={args.frame} />
      ))}
    </Backdrop>
  ),
}

export const ANumericWall = variantStory('numeric', 'wall')
export const ANumericPhone = variantStory('numeric', 'phone')
export const BProgressWall = variantStory('progress', 'wall')
export const BProgressPhone = variantStory('progress', 'phone')
export const CTimelineWall = variantStory('timeline', 'wall')
export const CTimelinePhone = variantStory('timeline', 'phone')
export const DGapWall = variantStory('gap', 'wall')
export const DGapPhone = variantStory('gap', 'phone')
