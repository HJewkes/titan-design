/**
 * Lab/Goals/Round 5 — the VW-386 muscle rollup.
 *
 * The lift card is LOCKED and has left the lab: it is
 * `custom/Workout/GoalLiftCard`, and it is rendered here beside the rollup so
 * the two can be judged as a pair rather than in isolation.
 *
 * Round five's rearrangement: the figure moves to the LEFT with the
 * lifts-on-track count beneath it as a label rather than a hero number, and the
 * per-lift rows fill the space to its right. The spark is gone.
 *
 * ONE open axis, so there are exactly two variants: whether the rows sit
 * top-aligned against the figure column or centred against it.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/custom/Typography'
import { GoalLiftCard } from '../../components/custom/Workout/GoalLiftCard'
import {
  CardGrid,
  GOAL_STATUSES,
  GroupHeading,
  MUSCLE_FIXTURES,
  MuscleRollupR5,
  type CardDensity,
  type GoalStatus,
  type MuscleCardData,
  type RollupRowAlignment,
} from './goal-cards-kit'

interface WidthCase {
  label: string
  width: number
  density: CardDensity
}

const WIDTH_CASES: WidthCase[] = [
  { label: '4-up at 1920 — 459px', width: 459, density: 'comfortable' },
  { label: '3-up at 1920 — 616px', width: 616, density: 'comfortable' },
  { label: '4-up, compact — 459px', width: 459, density: 'compact' },
]

const ALIGNMENTS: { key: RollupRowAlignment; label: string; note: string }[] = [
  {
    key: 'top',
    label: 'rows top-aligned',
    note: "Rows start at the figure's top edge. Reads as a list beside a marker; with one lift the card is short and the figure hangs below the row.",
  },
  {
    key: 'centre',
    label: 'rows centred',
    note: 'Rows centre against the figure. Balanced at two or three lifts; with one lift it floats in the middle of the card.',
  },
]

interface SheetArgs {
  muscleIndex: number
  statusOverride: 'per-card' | GoalStatus
  showGrid: boolean
  gridAlignment: RollupRowAlignment
  muscles: MuscleCardData[]
}

const meta: Meta<SheetArgs> = {
  title: 'Lab/Goals/Round 5',
  tags: ['status:lab', '!status:review'],
  render: (args) => <Sheet {...args} />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Round-five specimen (status:lab).** The muscle rollup only — the lift ' +
          'card is locked and now lives at ' +
          '[GoalLiftCard](?path=/docs/custom-workout-goalliftcard--docs).',
      },
    },
  },
  args: {
    muscleIndex: 1,
    statusOverride: 'per-card',
    showGrid: true,
    gridAlignment: 'top',
    muscles: MUSCLE_FIXTURES,
  },
  argTypes: {
    muscleIndex: { control: 'select', options: [0, 1, 2, 3, 4] },
    statusOverride: { control: 'select', options: ['per-card', ...GOAL_STATUSES] },
    showGrid: { control: 'boolean' },
    gridAlignment: { control: 'select', options: ['top', 'centre'] },
    muscles: { control: 'object' },
  },
}
export default meta

type Story = StoryObj<SheetArgs>

function applyStatus(rows: MuscleCardData[], override: SheetArgs['statusOverride']) {
  return override === 'per-card' ? rows : rows.map((row) => ({ ...row, status: override }))
}

/** Both alignments at one width, side by side. */
function AlignmentPair({ muscle, spec }: { muscle: MuscleCardData; spec: WidthCase }) {
  return (
    <View className="gap-stack-lg">
      <Typography variant="overline" color="tertiary">
        {spec.label}
      </Typography>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-section-sm">
        {ALIGNMENTS.map((alignment) => (
          <View key={alignment.key} style={{ width: spec.width }} className="gap-stack-md">
            <Typography variant="caption" color="tertiary">
              {alignment.note}
            </Typography>
            <MuscleRollupR5 muscle={muscle} density={spec.density} rowAlignment={alignment.key} />
          </View>
        ))}
      </View>
    </View>
  )
}

function Sheet(args: SheetArgs) {
  const muscles = applyStatus(args.muscles, args.statusOverride)
  const muscle = muscles[args.muscleIndex] ?? muscles[0]
  if (muscle === undefined) return <View />

  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-section-md">
      <GroupHeading
        title="Muscle rollup — round five"
        note={
          `Figure left, "${muscle.liftsOnTrack}/${muscle.liftsTotal} on track" beneath it as a label, rows to the right. ` +
          `The week shows on a row only when that lift's goal week differs from the muscle's (here week ${muscle.commonGoalWeek}).`
        }
      />
      {WIDTH_CASES.map((spec) => (
        <AlignmentPair key={`${spec.label}`} muscle={muscle} spec={spec} />
      ))}

      {args.showGrid && (
        <>
          <GroupHeading
            title="Beside the locked lift card"
            note="A 4-up row of the real GoalLiftCard, then the rollups underneath, so the two read as one page."
          />
          <CardGrid columns={4}>
            <GoalLiftCard
              name="BENCH PRESS"
              status="on_track"
              milestone={{ reps: 8, load: 105, unit: 'lb', goalWeek: 8 }}
              committed={102.5}
              stretch={110}
              isPR
              actuals={[
                { weekIndex: 1, value: 92.5 },
                { weekIndex: 3, value: 95 },
                { weekIndex: 5, value: 100 },
              ]}
            />
            <GoalLiftCard
              name="BACK SQUAT"
              status="ahead"
              milestone={{ reps: 5, load: 150, unit: 'lb', goalWeek: 8 }}
              committed={145}
              stretch={155}
              actuals={[
                { weekIndex: 1, value: 130 },
                { weekIndex: 3, value: 137.5 },
                { weekIndex: 5, value: 147.5 },
              ]}
            />
            <GoalLiftCard
              name="ROMANIAN DEADLIFT"
              status="stalled"
              milestone={{ reps: 8, load: 140, unit: 'lb', goalWeek: 7 }}
              committed={135}
              stretch={145}
              actuals={[
                { weekIndex: 1, value: 125 },
                { weekIndex: 3, value: 127.5 },
                { weekIndex: 5, value: 127.5 },
              ]}
            />
            <GoalLiftCard
              name="OVERHEAD PRESS"
              status="calibrating"
              milestone={{ reps: 8, load: 65, unit: 'lb', goalWeek: 8 }}
              committed={62.5}
              stretch={70}
              actuals={[
                { weekIndex: 1, value: 57.5 },
                { weekIndex: 3, value: 60 },
              ]}
            />
          </CardGrid>
          <CardGrid columns={2}>
            {muscles.slice(0, 2).map((row) => (
              <MuscleRollupR5
                key={row.name}
                muscle={row}
                density="comfortable"
                rowAlignment={args.gridAlignment}
              />
            ))}
          </CardGrid>
        </>
      )}
    </Surface>
  )
}

/** Both alignments at every width, then the page context. */
export const Default: Story = {}

/** A muscle with a single contributing lift — where the two alignments diverge most. */
export const SingleLift: Story = {
  args: { muscleIndex: 4, showGrid: false },
}
