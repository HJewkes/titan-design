/**
 * Lab/Goals/GoalCardGrid/Round 4 — VW-386 round four.
 *
 * Lift card: round three plus the two fixes the human asked for.
 *  - the status mark collapses on measured WIDTH, not density alone, so the
 *    narrow cell keeps its light instead of rendering a full pill;
 *  - the PR star is stacked over the unit, its top on the hero's cap line.
 *
 * Rollup: R4 rearranged — count and figure in one band with the figure pushed
 * right, rows below at a tighter gap. R4a is that; R4b adds the muscle-level
 * spark between the count and the figure.
 *
 * Earlier rounds stay live until the human locks a render.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/custom/Typography'
import {
  GOAL_STATUSES,
  GoalLiftCardR4,
  GroupHeading,
  LIFT_FIXTURES,
  MUSCLE_FIXTURES,
  MuscleRollupR4Arranged,
  type CardDensity,
  type GoalStatus,
  type LiftCardData,
  type MuscleCardData,
} from './goal-cards-kit'

interface WidthCase {
  label: string
  note: string
  width: number
  density: CardDensity
}

const WIDTH_CASES: WidthCase[] = [
  {
    label: '4-up at 1920',
    note: '459px — (1872 - 3x12) / 4. The wall default.',
    width: 459,
    density: 'comfortable',
  },
  { label: '3-up at 1920', note: '616px — (1872 - 2x12) / 3.', width: 616, density: 'comfortable' },
  {
    label: '4-up, compact',
    note: '459px at the shrunk density.',
    width: 459,
    density: 'compact',
  },
  {
    label: 'narrow cell',
    note: '200px. Title wraps, and the status KEEPS its light — round three rendered a full pill here.',
    width: 200,
    density: 'comfortable',
  },
]

interface SheetArgs {
  prLiftIndex: number
  longLiftIndex: number
  /** BACK has a lift due in a different week, so the conditional "wk N" shows. */
  muscleIndex: number
  statusOverride: 'per-card' | GoalStatus
  lifts: LiftCardData[]
  muscles: MuscleCardData[]
}

const meta: Meta<SheetArgs> = {
  title: 'Lab/Goals/GoalCardGrid/Round 4',
  tags: ['status:lab', '!status:review'],
  render: (args) => <Sheet {...args} />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Round-four specimen (status:lab).** The lift card with the ' +
          'width-driven status collapse and the stacked PR star, then R4a and ' +
          'R4b at the 4-up width and compact.',
      },
    },
  },
  args: {
    prLiftIndex: 0,
    longLiftIndex: 5,
    muscleIndex: 1,
    statusOverride: 'per-card',
    lifts: LIFT_FIXTURES,
    muscles: MUSCLE_FIXTURES,
  },
  argTypes: {
    prLiftIndex: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 7] },
    longLiftIndex: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 7] },
    muscleIndex: { control: 'select', options: [0, 1, 2, 3, 4] },
    statusOverride: { control: 'select', options: ['per-card', ...GOAL_STATUSES] },
    lifts: { control: 'object' },
    muscles: { control: 'object' },
  },
}
export default meta

type Story = StoryObj<SheetArgs>

function applyStatus<T extends { status: GoalStatus }>(
  rows: T[],
  override: SheetArgs['statusOverride']
): T[] {
  return override === 'per-card' ? rows : rows.map((row) => ({ ...row, status: override }))
}

function WidthColumn({
  spec,
  prLift,
  longLift,
}: {
  spec: WidthCase
  prLift: LiftCardData
  longLift: LiftCardData
}) {
  return (
    <View style={{ width: spec.width }} className="gap-stack-lg">
      <View className="gap-stack-sm">
        <Typography variant="overline" color="tertiary">
          {spec.label}
        </Typography>
        <Typography variant="caption" color="tertiary">
          {spec.note}
        </Typography>
      </View>
      <GoalLiftCardR4 lift={prLift} density={spec.density} />
      <GoalLiftCardR4 lift={longLift} density={spec.density} />
    </View>
  )
}

/** R4a and R4b at one width, labelled. */
function RollupPair({
  muscle,
  density,
  width,
  heading,
}: {
  muscle: MuscleCardData
  density: CardDensity
  width: number
  heading: string
}) {
  return (
    <View className="gap-stack-lg">
      <Typography variant="overline" color="tertiary">
        {heading}
      </Typography>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-section-sm">
        <View style={{ width }} className="gap-stack-md">
          <Typography variant="caption" color="tertiary">
            R4a — count and figure in one band, rows below. No spark.
          </Typography>
          <MuscleRollupR4Arranged muscle={muscle} density={density} withSpark={false} />
        </View>
        <View style={{ width }} className="gap-stack-md">
          <Typography variant="caption" color="tertiary">
            R4b — a muscle-level band spark between the count and the figure.
          </Typography>
          <MuscleRollupR4Arranged muscle={muscle} density={density} withSpark />
        </View>
      </View>
    </View>
  )
}

function Sheet(args: SheetArgs) {
  const lifts = applyStatus(args.lifts, args.statusOverride)
  const muscles = applyStatus(args.muscles, args.statusOverride)
  const prLift = lifts[args.prLiftIndex] ?? lifts[0]
  const longLift = lifts[args.longLiftIndex] ?? lifts[0]
  const muscle = muscles[args.muscleIndex] ?? muscles[0]
  if (prLift === undefined || longLift === undefined || muscle === undefined) return <View />

  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-section-md">
      <GroupHeading
        title="Lift card — round four"
        note="Top card carries a PR (star stacked over the kg); bottom card has the longest name. The narrow cell keeps its status light."
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-section-sm">
        {WIDTH_CASES.map((spec) => (
          <WidthColumn
            key={`${spec.label}-${spec.density}`}
            spec={spec}
            prLift={prLift}
            longLift={longLift}
          />
        ))}
      </View>

      <GroupHeading
        title="Muscle rollup — R4 rearranged"
        note={
          `The week is shown on a row ONLY when that lift's goal week differs from the muscle's ` +
          `(here week ${muscle.commonGoalWeek}). It is a per-target due week, so on most muscles every row ` +
          `matches and the week disappears entirely — which is why repeating it read as if it meant something.`
        }
      />
      <RollupPair muscle={muscle} density="comfortable" width={459} heading="At the 4-up width" />
      <RollupPair muscle={muscle} density="compact" width={459} heading="Compact" />
    </Surface>
  )
}

/** The full round-four sheet. */
export const Default: Story = {}

/**
 * A muscle whose lifts are all due in the same week — the common case, where
 * the conditional week vanishes from every row.
 */
export const RollupWithNoWeekVariance: Story = {
  args: { muscleIndex: 0 },
}
