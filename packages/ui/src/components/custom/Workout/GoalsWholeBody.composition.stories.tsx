// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { BodyweightGoalCard } from './BodyweightGoalCard'
import { SessionsGoalCard } from './SessionsGoalCard'
import { PRIMARY_GOAL_SCENARIOS as P } from './primaryGoal-fixture'
import { WHOLE_BODY_SESSIONS as S, WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'
import type { WholeBodySessionsRow, WholeBodyWeightRow } from './wholeBody'

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

/** One grid cell: no narrower than 420px on the wall, the full width on a phone. */
function GridCell({ children }: { children: ReactNode }) {
  return <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0 }}>{children}</View>
}

interface GoalsPageProps {
  bodyweight: WholeBodyWeightRow | null
  sessions: WholeBodySessionsRow | null
}

function GoalsPage({ bodyweight, sessions }: GoalsPageProps) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-stack-xl">
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
      {(bodyweight || sessions) && (
        <PageSection title="Whole body">
          <CardGrid>
            {bodyweight && (
              <GridCell>
                <BodyweightGoalCard goal={bodyweight} />
              </GridCell>
            )}
            {sessions && (
              <GridCell>
                <SessionsGoalCard goal={sessions} />
              </GridCell>
            )}
          </CardGrid>
        </PageSection>
      )}
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
          'The whole-body cards in their page (VW-455): the lead goal card, the per-lift grid, ' +
          'then Whole body as two cards under one title on the page background, the way ' +
          'voltras-mcp PR 454 titles Per-lift. Side by side on the wall, stacked on a phone; ' +
          'with neither goal the section is not drawn. Composition is approved here, not on ' +
          'the isolated stories. The muscle grid is left out: it ships from the `/bodymap` ' +
          'subpath. The priorities index waits for the mesocycle header (its own Round 0).',
      },
    },
  },
  args: { bodyweight: W.cut, sessions: S.underPace },
  argTypes: {
    bodyweight: { control: 'object' },
    sessions: { control: 'object' },
  },
}
export default meta

type Story = StoryObj<typeof GoalsPage>

/** A cut and sessions under pace. */
export const Default: Story = {}

/** A hold goal and a window started today, the two cards most likely to misread. */
export const HoldAndNewWindow: Story = {
  args: { bodyweight: W.hold, sessions: S.windowStarted },
}

/** Only a sessions goal: one card, no empty half. */
export const SessionsOnly: Story = { args: { bodyweight: null } }
