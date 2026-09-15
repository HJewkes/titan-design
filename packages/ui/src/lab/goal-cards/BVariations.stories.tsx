/**
 * Lab/Goals/GoalCardGrid/B Variations — VW-386 round two.
 *
 * The human picked direction B off the round-one side-by-side and gave five
 * notes. Every note is applied to ALL four variants here; the variants differ
 * on exactly one open axis each, so the comparison reads.
 *
 * Applied everywhere (not on the table):
 *  - status upper right, collapsing to a bare status light at compact density;
 *  - hero is reps x load ("8 x 105"), a ramp step larger, "in week X" beneath;
 *  - the chart runs the full meso (week 1 to the goal week) rather than
 *    stopping at the last session, with committed and stretch as lines, a
 *    shaded band between them, and each edge labelled with its target load.
 *
 * Still open, one per variant: where the band labels sit (B1 gutter / B2
 * inline), where the unit sits (B1 caption / B3 inline), and whether the muscle
 * rollup restyles onto the same shape (B4).
 *
 * Not locked. Round one's `Lab/Goals/GoalCardGrid` stays live until the human
 * locks a render here; then it is quarantined per the skill.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/custom/Typography'
import {
  CardGrid,
  GOAL_STATUSES,
  GoalLiftCardBRefined,
  GroupHeading,
  LIFT_FIXTURES,
  MUSCLE_FIXTURES,
  MuscleRollupCardRefined,
  type BandLabelPlacement,
  type CardDensity,
  type GoalStatus,
  type LiftCardData,
  type MuscleCardData,
  type UnitPlacement,
} from './goal-cards-kit'

interface VariantSpec {
  key: string
  title: string
  note: string
  labelPlacement: BandLabelPlacement
  unitPlacement: UnitPlacement
  /** B4 swaps the lift card for the restyled rollup. */
  isRollup?: boolean
}

const VARIANTS: VariantSpec[] = [
  {
    key: 'B1',
    title: 'B1 — labels in a right gutter',
    note: 'The base. Committed and stretch sit in reserved space beside the plot, so neither label ever crosses the line.',
    labelPlacement: 'gutter',
    unitPlacement: 'caption',
  },
  {
    key: 'B2',
    title: 'B2 — labels inline over the plot',
    note: 'Same card, labels tucked at the right end of each line instead of in a gutter. Buys ~46px of plot width; the labels can sit over the trend.',
    labelPlacement: 'inline',
    unitPlacement: 'caption',
  },
  {
    key: 'B3',
    title: 'B3 — unit inline in the hero',
    note: 'B1 with the kg on the hero line ("8 x 105 kg") instead of leading the caption. The caption drops to just "in week 8".',
    labelPlacement: 'gutter',
    unitPlacement: 'inline',
  },
  {
    key: 'B4',
    title: 'B4 — muscle rollup, restyled',
    note: "The rollup on refined B's shape: count as the hero, rollup sentence as the quiet line, no chart. Tests whether one card carries both content presets.",
    labelPlacement: 'gutter',
    unitPlacement: 'caption',
    isRollup: true,
  },
]

interface SheetArgs {
  /** Which fixture the variant row renders. */
  liftIndex: number
  statusOverride: 'per-card' | GoalStatus
  showCompactRow: boolean
  showFullGrid: boolean
  gridColumns: number
  gridVariant: string
  lifts: LiftCardData[]
  muscles: MuscleCardData[]
}

const meta: Meta<SheetArgs> = {
  title: 'Lab/Goals/GoalCardGrid/B Variations',
  tags: ['status:lab', '!status:review'],
  render: (args) => <Sheet {...args} />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Round-two specimen (status:lab).** Four B variants with the ' +
          '2026-09-14 feedback applied, each varying one open axis. Composes ' +
          '[Card](?path=/docs/components-card--docs) (`elevation={1}`) + ' +
          '[Pill](?path=/docs/components-pill--docs) / ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + ' +
          '[PrBadge](?path=/docs/custom-workout-prbadge--docs), over a lab ' +
          '`GoalBandSpark` that `Sparkline` cannot yet express.',
      },
    },
  },
  args: {
    liftIndex: 0,
    statusOverride: 'per-card',
    showCompactRow: true,
    showFullGrid: true,
    gridColumns: 4,
    gridVariant: 'B1',
    lifts: LIFT_FIXTURES,
    muscles: MUSCLE_FIXTURES,
  },
  argTypes: {
    liftIndex: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 7] },
    statusOverride: { control: 'select', options: ['per-card', ...GOAL_STATUSES] },
    showCompactRow: { control: 'boolean' },
    showFullGrid: { control: 'boolean' },
    gridColumns: { control: 'select', options: [2, 3, 4] },
    gridVariant: { control: 'select', options: VARIANTS.map((v) => v.key) },
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

function VariantCard({
  spec,
  lift,
  muscle,
  density,
}: {
  spec: VariantSpec
  lift: LiftCardData
  muscle: MuscleCardData
  density: CardDensity
}) {
  if (spec.isRollup === true) {
    return <MuscleRollupCardRefined muscle={muscle} density={density} />
  }
  return (
    <GoalLiftCardBRefined
      lift={lift}
      density={density}
      labelPlacement={spec.labelPlacement}
      unitPlacement={spec.unitPlacement}
    />
  )
}

/** One labelled column per variant, all at the same width. */
function VariantRow({
  lift,
  muscle,
  density,
  withNotes,
}: {
  lift: LiftCardData
  muscle: MuscleCardData
  density: CardDensity
  withNotes: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-inline-lg">
      {VARIANTS.map((spec) => (
        <View key={spec.key} style={{ flex: 1, minWidth: 0 }} className="gap-stack-md">
          <Typography variant="overline" color="tertiary">
            {spec.title}
          </Typography>
          <VariantCard spec={spec} lift={lift} muscle={muscle} density={density} />
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

/**
 * The comparison sheet: the four variants at comfortable density, the same four
 * at compact (which is where the status pill collapses to its light), then the
 * chosen variant at full grid scale.
 */
function Sheet(args: SheetArgs) {
  const lifts = applyStatus(args.lifts, args.statusOverride)
  const muscles = applyStatus(args.muscles, args.statusOverride)
  const lift = lifts[args.liftIndex] ?? lifts[0]
  const muscle = muscles[args.liftIndex] ?? muscles[0]
  if (lift === undefined || muscle === undefined) return <View />

  const gridSpec = VARIANTS.find((v) => v.key === args.gridVariant) ?? VARIANTS[0]

  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-section-md">
      <GroupHeading
        title="B variations — comfortable"
        note="Feedback applied to all four. Each varies exactly one open axis; the note under each card says which."
      />
      <VariantRow lift={lift} muscle={muscle} density="comfortable" withNotes />

      {args.showCompactRow && (
        <>
          <GroupHeading
            title="B variations — compact"
            note="Same four cards at the shrunk density. The status pill collapses to its light here."
          />
          <VariantRow lift={lift} muscle={muscle} density="compact" withNotes={false} />
        </>
      )}

      {args.showFullGrid && gridSpec !== undefined && (
        <>
          <GroupHeading
            title={`Full grid — ${gridSpec.key}`}
            note={`${args.gridColumns} columns, comfortable, then the muscle rollups.`}
          />
          <CardGrid columns={args.gridColumns}>
            {lifts.map((row) => (
              <GoalLiftCardBRefined
                key={row.name}
                lift={row}
                density="comfortable"
                labelPlacement={gridSpec.labelPlacement}
                unitPlacement={gridSpec.unitPlacement}
              />
            ))}
          </CardGrid>
          <CardGrid columns={args.gridColumns}>
            {muscles.map((row) => (
              <MuscleRollupCardRefined key={row.name} muscle={row} density="comfortable" />
            ))}
          </CardGrid>
        </>
      )}
    </Surface>
  )
}

/** The full sheet: variant rows at both densities, then the chosen variant as a grid. */
export const Default: Story = {}

/** Just the four variants, both densities, no full grid — for a tight read. */
export const VariantsOnly: Story = {
  args: { showFullGrid: false },
}
