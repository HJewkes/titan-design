/**
 * Lab/Goals/GoalCardGrid — the VW-386 specimen sheet.
 *
 * The `#/goals` page renders one full-width row per lift today: label pinned
 * left, status Pill and next milestone pinned to fixed 140/220px boxes at the
 * far right of a wall-width panel. This sheet is the alternative the human
 * asked for — a grid of paper cards, on the proper Surface ladder, with the
 * label and its data grouped tightly.
 *
 * Gate 1's overlap survey is `SURVEY.md`, next to this file. The invest
 * decision is still open: direction C renders the honest "this is just a
 * MesoStatusCard size variant" answer so the choice is made on a render.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/custom/Typography'
import {
  CardGrid,
  GOAL_STATUSES,
  GoalLiftCardA,
  GoalLiftCardB,
  GoalLiftCardC,
  GroupHeading,
  LIFT_FIXTURES,
  MUSCLE_FIXTURES,
  MuscleRollupCard,
  type CardDensity,
  type GoalStatus,
  type LiftCardData,
  type MuscleCardData,
} from './goal-cards-kit'

type Direction = 'A' | 'B' | 'C'

interface SheetArgs {
  columns: number
  density: CardDensity
  /** `per-card` keeps each fixture's own status; anything else paints them all. */
  statusOverride: 'per-card' | GoalStatus
  showTrend: boolean
  showMuscles: boolean
  lifts: LiftCardData[]
  muscles: MuscleCardData[]
}

const meta: Meta<SheetArgs> = {
  title: 'Lab/Goals/GoalCardGrid',
  tags: ['status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Specimen (status:lab).** Composes ' +
          '[Surface](?path=/docs/components-surface--docs) (page plane) + ' +
          '[Card](?path=/docs/components-card--docs) (`elevation={1}`) + ' +
          '[Pill](?path=/docs/components-pill--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + ' +
          '[Metric](?path=/docs/custom-metric--docs) + ' +
          '[Sparkline](?path=/docs/custom-workout-sparkline--docs) + ' +
          '[PrBadge](?path=/docs/custom-workout-prbadge--docs). ' +
          'Compare the three directions, then say which one to harden.',
      },
    },
  },
  args: {
    columns: 4,
    density: 'comfortable',
    statusOverride: 'per-card',
    showTrend: true,
    showMuscles: true,
    lifts: LIFT_FIXTURES,
    muscles: MUSCLE_FIXTURES,
  },
  argTypes: {
    columns: { control: 'select', options: [2, 3, 4] },
    density: { control: 'select', options: ['comfortable', 'compact'] },
    statusOverride: { control: 'select', options: ['per-card', ...GOAL_STATUSES] },
    showTrend: { control: 'boolean' },
    showMuscles: { control: 'boolean' },
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

function LiftCard({
  direction,
  lift,
  density,
  showTrend,
}: {
  direction: Direction
  lift: LiftCardData
  density: CardDensity
  showTrend: boolean
}) {
  if (direction === 'B')
    return <GoalLiftCardB lift={lift} density={density} showTrend={showTrend} />
  if (direction === 'C') return <GoalLiftCardC lift={lift} />
  return <GoalLiftCardA lift={lift} density={density} showTrend={showTrend} />
}

/**
 * The page. `Surface level="base"` is the page plane (`level` is for shell
 * roots); every card sits one plane above it via `Card elevation={1}`, which is
 * what wears the rim-light and the ambient shadow.
 */
function Sheet({ direction, args }: { direction: Direction; args: SheetArgs }) {
  const lifts = applyStatus(args.lifts, args.statusOverride)
  const muscles = applyStatus(args.muscles, args.statusOverride)

  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-section-md">
      <GroupHeading
        title="Per-lift"
        note={`Direction ${direction} · ${args.columns} columns · ${args.density}`}
      />
      <CardGrid columns={args.columns}>
        {lifts.map((lift) => (
          <LiftCard
            key={lift.name}
            direction={direction}
            lift={lift}
            density={args.density}
            showTrend={args.showTrend}
          />
        ))}
      </CardGrid>

      {args.showMuscles && (
        <>
          <GroupHeading title="Muscle priorities" note="Same card, rollup content preset." />
          <CardGrid columns={args.columns}>
            {muscles.map((muscle) => (
              <MuscleRollupCard key={muscle.name} muscle={muscle} density={args.density} />
            ))}
          </CardGrid>
        </>
      )}
    </Surface>
  )
}

/** The proposal: direction A, lift grid then the muscle-rollup row. */
export const Default: Story = {
  render: (args) => <Sheet direction="A" args={args} />,
}

/** A — name, status and milestone in one tight block; committed/stretch as a metric pair under it. */
export const DirectionAMetricPairUnderTitle: Story = {
  render: (args) => <Sheet direction="A" args={args} />,
}

/** B — the milestone leads at `h5`; the name drops to an overline and the band to one muted line. */
export const DirectionBMilestoneAsHero: Story = {
  render: (args) => <Sheet direction="B" args={args} />,
}

/** C — the real `MesoStatusCard`, one per lift. The "size variant" answer, rendered. */
export const DirectionCMesoStatusCardVariant: Story = {
  args: { showMuscles: false },
  render: (args) => <Sheet direction="C" args={args} />,
}

/** All three directions on the same lift at the same width, for a like-for-like read. */
export const SideBySide: Story = {
  args: { columns: 3, showMuscles: false },
  render: (args) => {
    const lift = applyStatus(args.lifts, args.statusOverride)[0]
    if (lift === undefined) return <View />
    return (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-section-md">
        <GroupHeading title="Same lift, three directions" note="A · B · C, left to right." />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-inline-lg">
          {(['A', 'B', 'C'] as Direction[]).map((direction) => (
            <View key={direction} style={{ flex: 1, minWidth: 0 }} className="gap-stack-md">
              <Typography variant="overline" color="tertiary">
                {`Direction ${direction}`}
              </Typography>
              <LiftCard
                direction={direction}
                lift={lift}
                density={args.density}
                showTrend={args.showTrend}
              />
            </View>
          ))}
        </View>
      </Surface>
    )
  },
}
