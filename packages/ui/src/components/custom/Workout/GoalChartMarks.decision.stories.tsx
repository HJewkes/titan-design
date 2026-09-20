// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { StarIcon } from '../../icons'
import { resolveColor } from '../../../theme/resolve-color'
import { Surface } from '../../ui/surface'
import { PinnedTipContext } from '../../ui/tooltip/TipTrigger'
import { Typography } from '../Typography'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { PrBadge } from './PrBadge'
import { weekTips } from './weekTipModel'
import { deriveTrajectoryGeometry, trajectoryInsets } from './GoalTrajectoryChartGeometry'
import { HIT_TARGET_POINTER } from './goalTrajectoryTargets'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!

interface MarksArgs {
  /** Which week's tip is held open, by state. */
  openWeek?: number
  currentWeek: number
}

/** The label of a week's target, so the story can pin that tip open. */
function weekLabel(week: number, currentWeek: number): string {
  const size = { width: 296, height: 220 }
  const input = { ...GOAL, ...size, insets: trajectoryInsets(false), currentWeek }
  const tips = weekTips({
    geometry: deriveTrajectoryGeometry(input),
    weeks: GOAL.weeks,
    expected: GOAL.expected,
    ...(GOAL.nextTarget ? { nextTarget: GOAL.nextTarget } : {}),
    currentWeek,
    unit: 'lb',
    width: size.width,
    height: size.height,
    size: HIT_TARGET_POINTER,
  })
  return tips.find((t) => t.week === week)?.label ?? ''
}

function card(currentWeek: number): GoalCardProps {
  return {
    ...S.onTrack,
    title: 'Cable Chest Press',
    milestone: { ...S.onTrack.milestone, currentWeek },
  }
}

function MarksFrame({ openWeek, currentWeek }: MarksArgs) {
  return (
    <PinnedTipContext.Provider value={openWeek ? weekLabel(openWeek, currentWeek) : null}>
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <GoalCard {...card(currentWeek)} />
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
  },
  args: { currentWeek: 4 },
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

/** A past week's tip, held open by state: its reading, the plan, and the record. */
export const TipPastWeek: Story = { args: { openWeek: 3 } }
/** The current week's tip: it says "Current week", and its column is outlined. */
export const TipCurrentWeek: Story = { args: { openWeek: 4 } }
/** A future week's tip: no reading yet, and the deload week says so. */
export const TipFutureWeek: Story = { args: { openWeek: 5 } }
/** The band and the cells agreeing on week 2. */
export const CurrentWeekTwo: Story = { args: { currentWeek: 2 } }
/** The band and the cells agreeing on week 5, which is also the deload week. */
export const CurrentWeekFiveDeload: Story = { args: { currentWeek: 5 } }
