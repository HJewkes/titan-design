// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { StarIcon } from '../../icons'
import { resolveColor } from '../../../theme/resolve-color'
import { Surface } from '../../ui/surface'
import { PinnedTipContext } from '../../ui/tooltip/TipTrigger'
import { Typography } from '../../ui/typography'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { PrBadge } from './PrBadge'
import { weekTips } from './weekTipModel'
import type { WeekTipLayout } from './GoalTrajectoryWeekTips'
import { deriveTrajectoryGeometry, trajectoryInsets } from './GoalTrajectoryChartGeometry'
import { HIT_TARGET_POINTER } from './goalTrajectoryTargets'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!

interface MarksArgs {
  /** Which week's tip is held open, by state. */
  openWeek?: number
  currentWeek: number
  /** How the open tip lays its facts out. */
  tipLayout: WeekTipLayout
  /** Put a reading and a PR on the deload week, so the marks sit over the purple. */
  readingOnDeload?: boolean
}

/** The label of a week's target, so the story can pin that tip open. */
function weekLabel(week: number, goal: typeof GOAL): string {
  const size = { width: 296, height: 220 }
  const input = { ...goal, ...size, insets: trajectoryInsets(false) }
  const tips = weekTips({
    geometry: deriveTrajectoryGeometry(input),
    weeks: goal.weeks,
    expected: goal.expected,
    ...(goal.nextTarget ? { nextTarget: goal.nextTarget } : {}),
    unit: 'lb',
    width: size.width,
    height: size.height,
    size: HIT_TARGET_POINTER,
  })
  return tips.find((t) => t.week === week)?.label ?? ''
}

const DELOAD_WEEK = GOAL.weeks.find((w) => w.isDeload)!.index

/** The same block, with the deload week lifted and a record set on it. */
function withReadingOnDeload(): typeof GOAL {
  const plan = GOAL.expected.find((p) => p.weekIndex === DELOAD_WEEK)
  return {
    ...GOAL,
    actuals: [
      ...GOAL.actuals,
      { weekIndex: DELOAD_WEEK, value: plan?.high ?? 186, isPR: true, matched: true },
    ],
  }
}

function card(currentWeek: number, readingOnDeload = false): GoalCardProps {
  return {
    ...S.onTrack,
    title: 'Cable Chest Press',
    goal: readingOnDeload ? withReadingOnDeload() : GOAL,
    milestone: { ...S.onTrack.milestone, currentWeek },
  }
}

function MarksFrame({ openWeek, currentWeek, tipLayout, readingOnDeload }: MarksArgs) {
  const props = card(currentWeek, readingOnDeload)
  return (
    <PinnedTipContext.Provider value={openWeek ? weekLabel(openWeek, props.goal!) : null}>
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <GoalCard {...props} goal={{ ...props.goal!, weekTipLayout: tipLayout }} />
      </Surface>
    </PinnedTipContext.Provider>
  )
}

/**
 * titan-0201 round 5. Three marks on the goal chart: the PR star is now the PR icon's own
 * glyph, every week opens a tip (not only the next target), and the current week is an
 * outlined column that comes from the same value as the card's week cells. The deload week
 * keeps its fill, which is what the owner saw highlighted in round 4.
 */
const meta: Meta<MarksArgs> = {
  title: 'Lab/Decisions/Goal Chart Marks',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    openWeek: { control: { type: 'number', min: 1, max: 6 } },
    currentWeek: { control: { type: 'number', min: 1, max: 6 } },
    tipLayout: { control: 'inline-radio', options: ['figure', 'rows'] },
    readingOnDeload: { control: 'boolean' },
  },
  args: { currentWeek: 4, tipLayout: 'figure' },
  render: (args) => <MarksFrame {...args} />,
}
export default meta

type Story = StoryObj<MarksArgs>

/** The chart's star beside the PR badge's icon, both at 22px: one glyph, two places. */
export const StarBesideIcon: Story = {
  render: () => (
    <Surface level="base" style={{ minHeight: '100%' }} className="gap-section-sm p-gutter-sm">
      <View className="flex-row items-center gap-inline-lg">
        <StarIcon
          size={22}
          color={resolveColor('brand-primary')}
          fill={resolveColor('brand-primary')}
        />
        <PrBadge type="weight" compact animate={false} iconSize={22} />
        <Typography variant="caption" color="tertiary">
          Icon, badge
        </Typography>
      </View>
      <GoalCard {...card(4)} />
    </Surface>
  ),
}

/** The star in place on a chart, so it is judged where it lives. */
export const StarInPlace: Story = {}
/** Tip layout A, figure-led: the reading as the lead figure, then labelled rows. */
export const TipFigureLayout: Story = { args: { openWeek: 3 } }
/** Tip layout B, rows: every fact labelled, the reading among them. */
export const TipRowsLayout: Story = { args: { openWeek: 3, tipLayout: 'rows' } }
/** The deload week in the product's deload magenta, with no reading on it. */
export const DeloadColumn: Story = { args: { openWeek: 5 } }
/** The deload column carrying a reading and a PR star, so the marks sit over the purple. */
export const DeloadWithReading: Story = { args: { readingOnDeload: true } }
