// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Card } from '../../ui/card'
import { Surface, useSurfaceMode } from '../../ui/surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Typography } from '../Typography'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { GoalMilestoneTile, type GoalMilestoneSummaryStyle } from './GoalMilestoneTile'
import type { GoalWeekTipStyle } from './GoalMilestoneWeekStrip'
import { GOAL_MILESTONE_SCENARIOS as S, type GoalMilestoneScenario } from './goalMilestone-fixture'

type Frame = 'wall' | 'phone'

const STATES: { key: GoalMilestoneScenario; name: string }[] = [
  { key: 'onTrack', name: 'Upcoming, on track' },
  { key: 'behind', name: 'Upcoming, behind' },
  { key: 'ahead', name: 'Upcoming, ahead' },
  { key: 'hit', name: 'Hit' },
  { key: 'missed', name: 'Missed' },
]

const SUMMARY_NOTE: Record<GoalMilestoneSummaryStyle, string> = {
  sentence: 'One caption sentence: best, goal, week count.',
  metrics: 'Best and goal as Metric cells, the week count as the row caption.',
  stacked: 'Best on its own line; goal and week count under it.',
}

function Cell({ id, name, children }: { id: string; name: string; children: ReactNode }) {
  return (
    <View testID={`state-${id}`} className="gap-stack-sm">
      <Typography variant="caption" color="tertiary">
        {name}
      </Typography>
      {children}
    </View>
  )
}

function Heading({ title, note }: { title: string; note: string }) {
  return (
    <View className="gap-stack-sm">
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="secondary">
        {note}
      </Typography>
    </View>
  )
}

function Backdrop({ children, frame }: { children: ReactNode; frame: Frame }) {
  return (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: frame === 'wall' ? 1200 : 360 }}
      className="p-gutter-sm gap-section-sm"
    >
      {children}
    </Surface>
  )
}

interface StyleArgs {
  summaryStyle: GoalMilestoneSummaryStyle
  tipStyle: GoalWeekTipStyle
}

function CompactInCard(props: StyleArgs) {
  return (
    <Card elevation={1}>
      <View className="p-inset-md gap-stack-sm">
        <Typography variant="overline" color="tertiary">
          BENCH PRESS
        </Typography>
        <GoalMilestoneTile {...S.onTrack} {...props} layout="compact" />
      </View>
    </Card>
  )
}

function Board({ frame, summaryStyle, tipStyle }: StyleArgs & { frame: Frame }) {
  const width = frame === 'wall' ? '48%' : '100%'
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-section-sm">
      {STATES.map(({ key, name }) => (
        <View key={key} style={{ width }}>
          <Cell id={key} name={name}>
            <GoalMilestoneTile {...S[key]} summaryStyle={summaryStyle} tipStyle={tipStyle} />
          </Cell>
        </View>
      ))}
      <View style={{ width }}>
        <Cell id="compact" name="Compact, in a per-lift card">
          <CompactInCard summaryStyle={summaryStyle} tipStyle={tipStyle} />
        </Cell>
      </View>
    </View>
  )
}

interface DecisionArgs extends StyleArgs {
  frame: Frame
}

/**
 * VW-385 unit 3, round 3. The tile is gap-led, with no progress bar, no goal
 * colour on the last week and no per-cell week labels; the week count lives
 * once, on the summary line. Two questions are open: which summary draft, and
 * which `ahead` hue (see the Ahead Hue story). Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Goal Milestone Tiles',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    frame: { control: 'inline-radio', options: ['wall', 'phone'] },
    summaryStyle: { control: 'inline-radio', options: ['sentence', 'metrics', 'stacked'] },
    tipStyle: { control: 'inline-radio', options: ['one-line', 'stacked'] },
  },
  render: (args) => (
    <Backdrop frame={args.frame}>
      <Heading
        title={`Summary line: ${args.summaryStyle}`}
        note={`${SUMMARY_NOTE[args.summaryStyle]} Hover or focus a week cell for its tip card (${args.tipStyle}).`}
      />
      <Board frame={args.frame} summaryStyle={args.summaryStyle} tipStyle={args.tipStyle} />
    </Backdrop>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

export const WallSentence: Story = {
  args: { frame: 'wall', summaryStyle: 'sentence', tipStyle: 'one-line' },
}
export const WallMetrics: Story = {
  args: { frame: 'wall', summaryStyle: 'metrics', tipStyle: 'one-line' },
}
export const WallStacked: Story = {
  args: { frame: 'wall', summaryStyle: 'stacked', tipStyle: 'one-line' },
}
export const WallTipStacked: Story = {
  args: { frame: 'wall', summaryStyle: 'sentence', tipStyle: 'stacked' },
}
export const PhoneSentence: Story = {
  args: { frame: 'phone', summaryStyle: 'sentence', tipStyle: 'one-line' },
}
export const PhoneMetrics: Story = {
  args: { frame: 'phone', summaryStyle: 'metrics', tipStyle: 'one-line' },
}

/** The chart data behind the hue comparison: one block, read as `ahead`. */
const CHART = {
  expected: Array.from({ length: 6 }, (_, i) => ({
    weekIndex: i + 1,
    low: 95 + i * 2,
    high: 99 + i * 2.5,
  })),
  actuals: [
    { weekIndex: 1, value: 95, matched: true },
    { weekIndex: 2, value: 100, matched: true },
    { weekIndex: 3, value: 105, matched: true },
  ],
  weeks: Array.from({ length: 6 }, (_, i) => ({ index: i + 1 })),
  committed: 105,
  stretch: 112,
}

/**
 * `ahead` can never be amber (REJECTED.md, "amber holds"), and beside `behind`'s
 * amber the old brand orange read as the same warm family. Both candidates are
 * cool; the shipped default is blue.
 */
const AHEAD_CANDIDATES = [
  {
    id: 'A',
    title: 'A · status-info blue (shipped default)',
    token: 'status-info' as const,
    note: 'No warm hue at any value. Shares its token with `tolerated`, which never describes the same target at the same time.',
  },
  {
    id: 'B',
    title: 'B · brand-secondary cyan',
    token: 'brand-secondary' as const,
    note: "Cooler still, but the chart's expected band is this hue at 0.28 alpha, so the line sits on a wash of itself.",
  },
]

function HueCandidate({
  id,
  title,
  note,
  color,
}: {
  id: string
  title: string
  note: string
  color: string
}) {
  return (
    <View className="gap-stack-md" testID={`hue-${id}`} style={{ width: 560 }}>
      <Heading title={title} note={note} />
      <GoalTrajectoryChart
        {...CHART}
        status="ahead"
        statusColor={color}
        width={560}
        height={200}
        unit="lb"
        metricLabel="Bench press"
        animate={false}
      />
      <GoalMilestoneTile {...S.ahead} toneColor={color} summaryStyle="sentence" />
    </View>
  )
}

/** Chart and tile in each candidate hue, so the pair is judged together. */
function AheadHueBoard() {
  const t = getSemanticColors(useSurfaceMode())
  return (
    <Backdrop frame="wall">
      <Heading
        title="Ahead hue: chart and tile together"
        note="Both candidates are cool, so neither can collide with the amber pacing tone. Pick one; it changes STATUS_TOKEN for both surfaces."
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-section-sm">
        {AHEAD_CANDIDATES.map((candidate) => (
          <HueCandidate
            key={candidate.id}
            id={candidate.id}
            title={candidate.title}
            note={candidate.note}
            color={t[candidate.token]}
          />
        ))}
      </View>
    </Backdrop>
  )
}

export const AheadHue: Story = { render: () => <AheadHueBoard /> }
