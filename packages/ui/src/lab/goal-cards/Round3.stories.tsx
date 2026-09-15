/**
 * Lab/Goals/GoalCardGrid/Round 3 — VW-386 round three.
 *
 * The lift card is converging, so it appears ONCE, at the widths that decide
 * it. The muscle rollup was called boring, so it appears as four variants.
 *
 * Lift card, all notes applied:
 *  - unit on the hero line, caption is just "in week 8";
 *  - band labels over the plot at its LEFT end, one type step smaller, and on a
 *    non-uppercasing role;
 *  - the title wraps to a second line rather than truncating;
 *  - the PR mark is a small asterisk on the load, not a badge on the title.
 *
 * Rounds 1 and 2 stay live until the human locks a render.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/custom/Typography'
import {
  GOAL_STATUSES,
  GoalLiftCardR3,
  GroupHeading,
  LIFT_FIXTURES,
  MUSCLE_FIXTURES,
  MuscleRollupR1,
  MuscleRollupR2,
  MuscleRollupR3,
  MuscleRollupR4,
  type CardDensity,
  type GoalStatus,
  type LiftCardData,
  type MuscleCardData,
} from './goal-cards-kit'

/**
 * Cell widths are computed from the real page, not guessed: 1920 less
 * `p-gutter-md` on both edges (24) is 1872, less `gap-inline-lg` (12) between
 * columns. Fixed widths rather than a live grid so the comparison holds however
 * wide the Storybook canvas happens to be.
 */
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
  {
    label: '3-up at 1920',
    note: '616px — (1872 - 2x12) / 3.',
    width: 616,
    density: 'comfortable',
  },
  {
    label: '4-up, compact',
    note: '459px at the shrunk density. Status collapses to its light.',
    width: 459,
    density: 'compact',
  },
  {
    // 260px still fits "ROMANIAN DEADLIFT" on one line, so it proved nothing.
    label: 'narrow cell',
    note: '200px. Here the long title breaks to a second line instead of truncating.',
    width: 200,
    density: 'comfortable',
  },
]

interface RollupVariant {
  key: string
  title: string
  note: string
  Card: (props: { muscle: MuscleCardData; density: CardDensity }) => React.JSX.Element
}

const ROLLUPS: RollupVariant[] = [
  {
    key: 'R1',
    title: 'R1 — count + mini figure',
    note: "The count keeps the lift card's hero slot; the figure lights this muscle on the same body svg BodyMap uses, at 0.22 scale. Fill is GOAL status, not volume status.",
    Card: MuscleRollupR1,
  },
  {
    key: 'R2',
    title: 'R2 — per-lift mini rows',
    note: 'Every contributing lift as a row: status light, name, next milestone. Most information per card, and the only variant that answers "which lift is dragging".',
    Card: MuscleRollupR2,
  },
  {
    key: 'R3',
    title: 'R3 — lift-status strip',
    note: "One segment per lift, coloured by that lift's goal status. NO volume-landmark position — that data is not on the goals read model, so drawing it would be inventing it.",
    Card: MuscleRollupR3,
  },
  {
    key: 'R4',
    title: 'R4 — figure + lift list',
    note: 'R1 and R2 combined. Richest, and the tallest; check whether it still sits in a grid row beside the lift cards.',
    Card: MuscleRollupR4,
  },
]

interface SheetArgs {
  /** The PR fixture, to show the asterisk. */
  prLiftIndex: number
  /** The long-named fixture, to show the title wrap. */
  longLiftIndex: number
  muscleIndex: number
  statusOverride: 'per-card' | GoalStatus
  showCompactRollups: boolean
  lifts: LiftCardData[]
  muscles: MuscleCardData[]
}

const meta: Meta<SheetArgs> = {
  title: 'Lab/Goals/GoalCardGrid/Round 3',
  tags: ['status:lab', '!status:review'],
  render: (args) => <Sheet {...args} />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Round-three specimen (status:lab).** The lift card at the widths ' +
          'that decide it, then four muscle-rollup variants. Composes ' +
          '[Card](?path=/docs/components-card--docs) + ' +
          '[Pill](?path=/docs/components-pill--docs) / ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + ' +
          '`StarIcon`, over the lab `GoalBandSpark` and `MuscleGlyph`.',
      },
    },
  },
  args: {
    prLiftIndex: 0,
    longLiftIndex: 5,
    muscleIndex: 1,
    statusOverride: 'per-card',
    showCompactRollups: true,
    lifts: LIFT_FIXTURES,
    muscles: MUSCLE_FIXTURES,
  },
  argTypes: {
    prLiftIndex: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 7] },
    longLiftIndex: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 7] },
    muscleIndex: { control: 'select', options: [0, 1, 2, 3, 4] },
    statusOverride: { control: 'select', options: ['per-card', ...GOAL_STATUSES] },
    showCompactRollups: { control: 'boolean' },
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

/** One fixed-width column: the PR lift over the long-named lift. */
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
      <GoalLiftCardR3 lift={prLift} density={spec.density} />
      <GoalLiftCardR3 lift={longLift} density={spec.density} />
    </View>
  )
}

function RollupRow({
  muscle,
  density,
  withNotes,
}: {
  muscle: MuscleCardData
  density: CardDensity
  withNotes: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-inline-lg">
      {ROLLUPS.map((spec) => (
        <View key={spec.key} style={{ flex: 1, minWidth: 0 }} className="gap-stack-md">
          <Typography variant="overline" color="tertiary">
            {spec.title}
          </Typography>
          <spec.Card muscle={muscle} density={density} />
          {withNotes && (
            <Typography variant="caption" color="tertiary">
              {spec.note}
            </Typography>
          )}
        </View>
      ))}
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
        title="Lift card — the widths that decide it"
        note="Top card carries a PR (the asterisk on the load); bottom card has the longest name, for the wrap."
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
        title="Muscle rollup — four directions"
        note="Same card shell as the lift card in every one; only the body differs."
      />
      <RollupRow muscle={muscle} density="comfortable" withNotes />

      {args.showCompactRollups && (
        <>
          <GroupHeading
            title="Muscle rollup — compact"
            note="The same four at the shrunk density."
          />
          <RollupRow muscle={muscle} density="compact" withNotes={false} />
        </>
      )}
    </Surface>
  )
}

/** The full round-three sheet. */
export const Default: Story = {}

/** Rollup variants only, for a tight read of the four. */
export const RollupsOnly: Story = {
  args: { showCompactRollups: true },
  render: (args) => {
    const muscles = applyStatus(args.muscles, args.statusOverride)
    const muscle = muscles[args.muscleIndex] ?? muscles[0]
    if (muscle === undefined) return <View />
    return (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-section-md">
        <GroupHeading
          title="Muscle rollup — four directions"
          note="Same card shell as the lift card in every one; only the body differs."
        />
        <RollupRow muscle={muscle} density="comfortable" withNotes />
        <GroupHeading title="Compact" note="The same four at the shrunk density." />
        <RollupRow muscle={muscle} density="compact" withNotes={false} />
      </Surface>
    )
  },
}
