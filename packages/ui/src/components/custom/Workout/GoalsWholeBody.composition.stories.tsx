// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { GoalPriorityIndex } from './GoalPriorityIndex'
import { WholeBodyCard, type WholeBodyCardProps } from './WholeBodyCard'
import { NINE_PRIORITIES } from './goalPriorityIndex-fixture'
import { PRIMARY_GOAL_SCENARIOS as P } from './primaryGoal-fixture'
import { WHOLE_BODY_SESSIONS as S, WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

/** The compact grid cell's chart data, shared by the three per-lift cards. */
const TREND: GoalCardProps['trend'] = {
  committed: 185,
  stretch: 195,
  goalWeek: 6,
  unit: 'lb',
  actuals: [
    { weekIndex: 1, value: 175 },
    { weekIndex: 2, value: 178 },
    { weekIndex: 3, value: 181 },
    { weekIndex: 4, value: 184 },
  ],
}

const PER_LIFT: GoalCardProps[] = [
  { ...P.onTrack, title: 'BARBELL ROW', priority: 'specialize' },
  { ...P.behind, title: 'SQUAT', priority: 'maintain' },
  { ...P.ahead, title: 'OVERHEAD PRESS', priority: 'specialize' },
].map((card) => ({ ...card, size: 'compact', goal: undefined, trend: TREND }))

/** A titled group on the page background, as voltras-mcp PR 454 draws it: h6, all caps by style. */
function PageSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-stack-md">
      <Typography variant="h6" style={{ textTransform: 'uppercase' }}>
        {title}
      </Typography>
      {children}
    </View>
  )
}

/** Cards no narrower than 420px, one column on a phone. Each cell shrinks below 420 so a phone never clips it (VW-454). */
function CardGrid({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-stack-md">
      {children}
    </View>
  )
}

interface GoalsPageProps {
  withPriorityIndex: boolean
  wholeBody: WholeBodyCardProps
}

function GoalsPage({ withPriorityIndex, wholeBody }: GoalsPageProps) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-stack-xl">
      {withPriorityIndex && <GoalPriorityIndex priorities={NINE_PRIORITIES} />}
      <GoalCard {...P.onTrack} title="BENCH PRESS" priority="specialize" />
      <PageSection title="Per-lift">
        <CardGrid>
          {PER_LIFT.map((card) => (
            <View
              key={card.title}
              style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0 }}
            >
              <GoalCard {...card} />
            </View>
          ))}
        </CardGrid>
      </PageSection>
      <PageSection title="Whole body">
        <WholeBodyCard {...wholeBody} />
      </PageSection>
    </Surface>
  )
}

const meta: Meta<typeof GoalsPage> = {
  title: 'Pages/Goals/Whole Body',
  component: GoalsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The whole-body card in its page (VW-455): the lead goal card, the per-lift grid ' +
          'titled on the page background (voltras-mcp PR 454), then Whole body. With and ' +
          'without the priorities index at the top. Composition is approved here, not on ' +
          'the isolated stories. The muscle grid is left out: it ships from the `/bodymap` ' +
          'subpath.',
      },
    },
  },
  args: {
    withPriorityIndex: false,
    wholeBody: { bodyweight: W.cut, sessions: S.underPace, sessionsVisual: 'segments' },
  },
  argTypes: {
    withPriorityIndex: { control: 'boolean' },
    wholeBody: { control: 'object' },
  },
}
export default meta

type Story = StoryObj<typeof GoalsPage>

/** The page as the owner will see it: no index, whole body last. */
export const Default: Story = {}

/** The same page with the priorities index above the lead card. */
export const WithPriorityIndex: Story = { args: { withPriorityIndex: true } }

/** A hold goal and a window started today, the two rows most likely to misread. */
export const HoldAndNewWindow: Story = {
  args: { wholeBody: { bodyweight: W.hold, sessions: S.windowStarted } },
}
