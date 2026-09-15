/**
 * Lab/Goals — the shared kit behind the VW-386 goal-card specimen sheets.
 *
 * Not a `.stories.tsx`, so the stories glob leaves it alone and both sheets
 * import one copy of the fixtures, the status vocabulary and the card
 * directions (reference 02, "when a specimen sheet grows >1 concern").
 *
 * Nothing here is a component yet. The directions are deliberately *renderable
 * options* for the human to compare, not a hardened API — Gate 1 is the survey
 * next to this file, and B is the base as of round two but is NOT locked.
 *
 * LAYOUT via `style`, never `className` — react-native-web drops Tailwind
 * layout utilities on a View. SPACING via `className` semantic keys, which do
 * survive. Colour comes from `<Surface>` / `<Card>` / semantic tokens only.
 */
import React, { useCallback, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'

import { Card } from '../../components/ui/card/Card'
import { Divider } from '../../components/ui/divider'
import { Indicator, type IndicatorColor } from '../../components/ui/indicator'
import { Pill, type PillTone } from '../../components/ui/pill'
import { Typography } from '../../components/custom/Typography'
import { Metric, MetricGroup } from '../../components/custom/Metric'
import { Sparkline } from '../../components/custom/Workout/Sparkline'
import { PrBadge } from '../../components/custom/Workout/PrBadge'
import { MesoStatusCard } from '../../components/custom/Workout/MesoStatusCard'
import { MuscleGroup } from '../../components/custom/Workout/muscleTaxonomy'
import { StarIcon } from '../../components/icons'
import { useSurfaceMode } from '../../components/ui/surface'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { resolveColor } from '../../theme/resolve-color'
import { GoalBandSpark, type BandLabelPlacement, type GoalActual } from './GoalBandSpark'
import { MuscleGlyph } from './MuscleGlyph'

export { MuscleGroup }

export type { GoalActual, BandLabelPlacement }

/** The `#/goals` read model's status vocabulary, unchanged (`goals-model.ts`). */
export type GoalStatus =
  | 'on_track'
  | 'ahead'
  | 'behind'
  | 'tolerated'
  | 'deload_week'
  | 'calibrating'
  | 'stalled'

export const GOAL_STATUSES: GoalStatus[] = [
  'on_track',
  'ahead',
  'behind',
  'tolerated',
  'deload_week',
  'calibrating',
  'stalled',
]

export type CardDensity = 'comfortable' | 'compact'

export interface LiftCardData {
  /** Exercise label, already upper-cased by the consumer's `targetLabel`. */
  name: string
  status: GoalStatus
  /** Reps first — the human's round-two note, "reps x load rather than load x reps". */
  milestoneReps: number
  milestoneLoad: number
  /** The week the milestone is due; also the right edge of the chart's x domain. */
  goalWeek: number
  committed: number
  stretch: number
  unit: string
  isPR: boolean
  /** The actuals series with its week index, oldest first. */
  actuals: GoalActual[]
}

/**
 * One contributing lift inside a muscle rollup.
 *
 * `goalWeek` is this TARGET's own due week, not the meso's current week — two
 * lifts under one muscle can be due in different weeks, which is the whole
 * reason the row can carry one at all. See `liftRowText`.
 */
export interface MuscleLiftRow {
  name: string
  status: GoalStatus
  reps: number
  load: number
  unit: string
  goalWeek: number
}

/**
 * The row's text. The week is shown ONLY when this lift's goal week differs
 * from the muscle's common one — the human's round-four question was "what does
 * the week number refer to", and the honest answer is that it is per-target and
 * usually identical, so repeating it on every row is noise that reads as if it
 * meant something.
 */
export function liftRowText(row: MuscleLiftRow, commonGoalWeek: number): string {
  const base = `${row.reps} x ${row.load} ${row.unit}`
  return row.goalWeek === commonGoalWeek ? base : `${base} · wk ${row.goalWeek}`
}

export interface MuscleCardData {
  name: string
  /** Drives the mini figure's highlighted slugs via `MUSCLE_TO_SVG_SLUGS`. */
  muscle: MuscleGroup
  /**
   * Which face of the figure shows this muscle. A real implementation derives
   * it from the slug set rather than carrying it on the row.
   */
  side: 'front' | 'back'
  status: GoalStatus
  summary: string
  liftsOnTrack: number
  liftsTotal: number
  /** The week most of this muscle's lifts are due; the row text elides it. */
  commonGoalWeek: number
  lifts: MuscleLiftRow[]
  /**
   * A muscle-level progress series, for the R4b spark.
   *
   * NOT ON THE READ MODEL. `/api/goal-progress` returns actuals per TARGET; a
   * muscle rollup carries only status, a summary and a count. Rendering this
   * needs either a new aggregate field or the page fetching every contributing
   * target and combining them client-side. Fixture-only until then.
   */
  series?: { actuals: GoalActual[]; committed: number; stretch: number; goalWeek: number }
}

/** "8 x 105" — reps first. */
export function milestoneHero(lift: LiftCardData): string {
  return `${lift.milestoneReps} x ${lift.milestoneLoad}`
}

export function milestoneTail(lift: LiftCardData): string {
  return `in week ${lift.goalWeek}`
}

/** A regressing trend paints `result-degrade` rather than `result-improve`. */
export function isRegressing(status: GoalStatus): boolean {
  return status === 'behind' || status === 'stalled'
}

const STATUS_LABEL: Record<GoalStatus, string> = {
  on_track: 'On track',
  ahead: 'Ahead',
  behind: 'Behind',
  tolerated: 'Tolerated',
  deload_week: 'Deload week',
  calibrating: 'Calibrating',
  stalled: 'Stalled',
}

/** `ahead` is info, never warning-amber — REJECTED.md, "Amber holds". */
const STATUS_TONE: Record<GoalStatus, PillTone> = {
  on_track: 'success',
  ahead: 'info',
  tolerated: 'info',
  calibrating: 'info',
  deload_week: 'info',
  behind: 'warning',
  stalled: 'warning',
}

/** `Indicator` is the standardised generic dot (gotcha #9) — never a hand-rolled View. */
const STATUS_INDICATOR: Record<GoalStatus, IndicatorColor> = {
  on_track: 'success',
  ahead: 'info',
  tolerated: 'info',
  calibrating: 'info',
  deload_week: 'info',
  behind: 'warning',
  stalled: 'warning',
}

export function statusLabel(status: GoalStatus): string {
  return STATUS_LABEL[status]
}

export function statusTone(status: GoalStatus): PillTone {
  return STATUS_TONE[status]
}

export const LIFT_FIXTURES: LiftCardData[] = [
  {
    name: 'BENCH PRESS',
    status: 'on_track',
    milestoneReps: 8,
    milestoneLoad: 105,
    goalWeek: 8,
    committed: 102.5,
    stretch: 110,
    unit: 'kg',
    isPR: true,
    actuals: [
      { week: 1, value: 92.5 },
      { week: 2, value: 95 },
      { week: 3, value: 95 },
      { week: 4, value: 97.5 },
      { week: 5, value: 100 },
    ],
  },
  {
    name: 'BACK SQUAT',
    status: 'ahead',
    milestoneReps: 5,
    milestoneLoad: 150,
    goalWeek: 8,
    committed: 145,
    stretch: 155,
    unit: 'kg',
    isPR: false,
    actuals: [
      { week: 1, value: 130 },
      { week: 2, value: 135 },
      { week: 3, value: 137.5 },
      { week: 4, value: 142.5 },
      { week: 5, value: 147.5 },
    ],
  },
  {
    name: 'DEADLIFT',
    status: 'behind',
    milestoneReps: 3,
    milestoneLoad: 180,
    goalWeek: 8,
    committed: 175,
    stretch: 190,
    unit: 'kg',
    isPR: false,
    actuals: [
      { week: 1, value: 165 },
      { week: 2, value: 167.5 },
      { week: 3, value: 167.5 },
      { week: 4, value: 165 },
      { week: 5, value: 167.5 },
    ],
  },
  {
    name: 'OVERHEAD PRESS',
    status: 'calibrating',
    milestoneReps: 8,
    milestoneLoad: 65,
    goalWeek: 8,
    committed: 62.5,
    stretch: 70,
    unit: 'kg',
    isPR: false,
    actuals: [
      { week: 1, value: 57.5 },
      { week: 2, value: 60 },
      { week: 3, value: 60 },
    ],
  },
  {
    name: 'BARBELL ROW',
    status: 'on_track',
    milestoneReps: 10,
    milestoneLoad: 100,
    goalWeek: 8,
    committed: 97.5,
    stretch: 105,
    unit: 'kg',
    isPR: false,
    actuals: [
      { week: 1, value: 85 },
      { week: 2, value: 87.5 },
      { week: 3, value: 90 },
      { week: 4, value: 92.5 },
      { week: 5, value: 95 },
    ],
  },
  {
    name: 'ROMANIAN DEADLIFT',
    status: 'stalled',
    milestoneReps: 8,
    milestoneLoad: 140,
    goalWeek: 8,
    committed: 135,
    stretch: 145,
    unit: 'kg',
    isPR: false,
    actuals: [
      { week: 1, value: 125 },
      { week: 2, value: 127.5 },
      { week: 3, value: 127.5 },
      { week: 4, value: 127.5 },
      { week: 5, value: 127.5 },
    ],
  },
  {
    name: 'INCLINE PRESS',
    status: 'tolerated',
    milestoneReps: 8,
    milestoneLoad: 85,
    goalWeek: 8,
    committed: 82.5,
    stretch: 90,
    unit: 'kg',
    isPR: false,
    actuals: [
      { week: 1, value: 72.5 },
      { week: 2, value: 75 },
      { week: 3, value: 75 },
      { week: 4, value: 77.5 },
      { week: 5, value: 80 },
    ],
  },
  {
    name: 'WEIGHTED PULL UP',
    status: 'deload_week',
    milestoneReps: 6,
    milestoneLoad: 30,
    goalWeek: 8,
    committed: 27.5,
    stretch: 35,
    unit: 'kg',
    isPR: true,
    actuals: [
      { week: 1, value: 17.5 },
      { week: 2, value: 20 },
      { week: 3, value: 22.5 },
      { week: 4, value: 25 },
      { week: 5, value: 25 },
    ],
  },
]

export const MUSCLE_FIXTURES: MuscleCardData[] = [
  {
    name: 'CHEST',
    muscle: MuscleGroup.CHEST,
    side: 'front',
    status: 'on_track',
    summary: 'Both lifts tracking their committed band.',
    liftsOnTrack: 2,
    liftsTotal: 2,
    commonGoalWeek: 8,
    lifts: [
      { name: 'Bench press', status: 'on_track', reps: 8, load: 105, unit: 'kg', goalWeek: 8 },
      { name: 'Incline press', status: 'tolerated', reps: 8, load: 85, unit: 'kg', goalWeek: 6 },
    ],
    series: {
      committed: 102.5,
      stretch: 110,
      goalWeek: 8,
      actuals: [
        { week: 1, value: 92.5 },
        { week: 2, value: 95 },
        { week: 3, value: 95 },
        { week: 4, value: 97.5 },
        { week: 5, value: 100 },
      ],
    },
  },
  {
    name: 'BACK',
    muscle: MuscleGroup.UPPER_BACK,
    side: 'back',
    status: 'ahead',
    summary: 'Row is ahead of band; pull up cleared a PR.',
    liftsOnTrack: 3,
    liftsTotal: 3,
    commonGoalWeek: 5,
    lifts: [
      { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'kg', goalWeek: 5 },
      {
        name: 'Weighted pull up',
        status: 'deload_week',
        reps: 6,
        load: 30,
        unit: 'kg',
        goalWeek: 5,
      },
      { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'kg', goalWeek: 7 },
    ],
    series: {
      committed: 97.5,
      stretch: 105,
      goalWeek: 8,
      actuals: [
        { week: 1, value: 85 },
        { week: 2, value: 87.5 },
        { week: 3, value: 90 },
        { week: 4, value: 92.5 },
        { week: 5, value: 95 },
      ],
    },
  },
  {
    name: 'QUADS',
    muscle: MuscleGroup.QUADS,
    side: 'front',
    status: 'behind',
    summary: 'Squat slipped under the band in week 3.',
    liftsOnTrack: 1,
    liftsTotal: 2,
    commonGoalWeek: 8,
    lifts: [
      { name: 'Back squat', status: 'behind', reps: 5, load: 150, unit: 'kg', goalWeek: 8 },
      { name: 'Leg press', status: 'on_track', reps: 10, load: 220, unit: 'kg', goalWeek: 8 },
    ],
    series: {
      committed: 145,
      stretch: 155,
      goalWeek: 8,
      actuals: [
        { week: 1, value: 130 },
        { week: 2, value: 135 },
        { week: 3, value: 132.5 },
        { week: 4, value: 137.5 },
        { week: 5, value: 140 },
      ],
    },
  },
  {
    name: 'HAMSTRINGS',
    muscle: MuscleGroup.HAMSTRINGS,
    side: 'back',
    status: 'stalled',
    summary: 'RDL has not moved for five sessions.',
    liftsOnTrack: 0,
    liftsTotal: 2,
    commonGoalWeek: 7,
    lifts: [
      { name: 'Romanian deadlift', status: 'stalled', reps: 8, load: 140, unit: 'kg', goalWeek: 7 },
      { name: 'Leg curl', status: 'behind', reps: 12, load: 55, unit: 'kg', goalWeek: 7 },
    ],
    series: {
      committed: 135,
      stretch: 145,
      goalWeek: 8,
      actuals: [
        { week: 1, value: 125 },
        { week: 2, value: 127.5 },
        { week: 3, value: 127.5 },
        { week: 4, value: 127.5 },
        { week: 5, value: 127.5 },
      ],
    },
  },
  {
    name: 'SHOULDERS',
    muscle: MuscleGroup.SIDE_DELTS,
    side: 'front',
    status: 'calibrating',
    summary: 'Three readings in; band not yet fitted.',
    liftsOnTrack: 0,
    liftsTotal: 1,
    commonGoalWeek: 8,
    lifts: [
      { name: 'Overhead press', status: 'calibrating', reps: 8, load: 65, unit: 'kg', goalWeek: 8 },
    ],
    series: {
      committed: 62.5,
      stretch: 70,
      goalWeek: 8,
      actuals: [
        { week: 1, value: 57.5 },
        { week: 2, value: 60 },
        { week: 3, value: 60 },
      ],
    },
  },
]

/**
 * Per-density spacing and scale. Every spacing value is a semantic key, never a
 * number; `heroClass` is a type ramp step, and the chart heights are chart
 * geometry.
 */
const DENSITY = {
  comfortable: {
    pad: 'p-inset-lg',
    gap: 'gap-stack-lg',
    sparkHeight: 34,
    bandHeight: 56,
    heroClass: 'font-heading text-2xl font-bold leading-tight',
  },
  compact: {
    pad: 'p-inset-md',
    gap: 'gap-stack-md',
    sparkHeight: 24,
    bandHeight: 42,
    heroClass: 'font-heading text-xl font-bold leading-tight',
  },
} as const

/**
 * `Sparkline` normalises over `data`'s own min/max, so a reference line above
 * max(actuals) is drawn outside its box. Directions A and the original B keep
 * only the lines that land inside the series; `GoalBandSpark` is the round-two
 * answer that does not need this at all.
 */
function inRangeReferences(
  values: number[],
  refs: { value: number; color: string; dashed?: boolean; label?: string }[]
) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  return refs.filter((ref) => ref.value >= min && ref.value <= max)
}

/**
 * Measures its OWN box rather than the card's — measuring the padded container
 * overshoots by both insets and the line bleeds through the card's right edge.
 * `onLayout` does not fire under jsdom (gotcha #6); nothing in a unit test
 * depends on it.
 */
function useMeasuredWidth(): [number, (event: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0)
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width))
  }, [])
  return [width, onLayout]
}

function GoalSparkline({ lift, height }: { lift: LiftCardData; height: number }) {
  const [width, onLayout] = useMeasuredWidth()
  const values = lift.actuals.map((actual) => actual.value)

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <Sparkline
          data={values}
          width={width}
          height={height}
          highlightLast
          color={resolveColor(isRegressing(lift.status) ? 'result-degrade' : 'result-improve')}
          referenceLines={inRangeReferences(values, [
            { value: lift.committed, color: resolveColor('text-tertiary'), dashed: true },
            { value: lift.stretch, color: resolveColor('text-tertiary'), dashed: true },
          ])}
        />
      )}
    </View>
  )
}

function StatusCapsule({ status }: { status: GoalStatus }) {
  return (
    <Pill tone={statusTone(status)} variant="subtle" size="sm" leading="dot">
      {statusLabel(status)}
    </Pill>
  )
}

/** A resolved goal-status colour, for the places a token class cannot reach. */
function useStatusColor(status: GoalStatus): string {
  const t = getSemanticColors(useSurfaceMode())
  const tone = statusTone(status)
  if (tone === 'success') return t['status-success']
  if (tone === 'warning') return t['status-warning']
  return t['status-info']
}

/**
 * The PR mark as an asterisk on the load, not a badge on the title — the
 * human's round-three note. `PrBadge compact` is the same `StarIcon` but pins
 * it at 14px, which is hero-sized here, so this composes the icon directly.
 *
 * HARDEN-STEP: give `PrBadge` a `size`, and this becomes `<PrBadge compact
 * size={10} />`. Two consumers: this card and any other inline PR mark.
 */
function PrAsterisk() {
  const brand = getSemanticColors(useSurfaceMode())['brand-primary']
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Personal record"
      // optical: lifts the mark onto the hero's cap line, superscript-style.
      style={{ marginTop: -6 }}
      testID="goal-card-pr-asterisk"
    >
      <StarIcon size={10} color={brand} fill={brand} strokeWidth={2} />
    </View>
  )
}

/**
 * The status affordance, collapsed to its light when the card shrinks — the
 * human's round-two note, "it should collapse to just the status light
 * (whether in the pill or alone) when the card shrinks".
 */
function StatusMark({ status, density }: { status: GoalStatus; density: CardDensity }) {
  if (density === 'compact') {
    return (
      <Indicator
        color={STATUS_INDICATOR[status]}
        size="md"
        accessibilityLabel={statusLabel(status)}
        testID="goal-card-status-dot"
      />
    )
  }
  return <StatusCapsule status={status} />
}

/**
 * Direction A — the metric pair under the title.
 *
 * Kept from round one so the human can still see what B was chosen against.
 * Quarantine per the skill once a render is locked.
 */
export function GoalLiftCardA({
  lift,
  density,
  showTrend,
}: {
  lift: LiftCardData
  density: CardDensity
  showTrend: boolean
}) {
  const d = DENSITY[density]
  return (
    <Card elevation={1} testID="goal-lift-card-a">
      <View className={`${d.pad} ${d.gap}`}>
        <View className="gap-stack-sm">
          <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" maxLines={1}>
                {lift.name}
              </Typography>
            </View>
            {lift.isPR && <PrBadge type="weight" compact />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
            <StatusCapsule status={lift.status} />
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="caption" color="tertiary" maxLines={1}>
                {`${milestoneHero(lift)} ${milestoneTail(lift)}`}
              </Typography>
            </View>
          </View>
        </View>

        <Divider />

        <MetricGroup>
          <Metric size="sm" value={`${lift.committed}`} unit={lift.unit} label="Committed" />
          <Metric size="sm" value={`${lift.stretch}`} unit={lift.unit} label="Stretch" />
        </MetricGroup>

        {showTrend && <GoalSparkline lift={lift} height={d.sparkHeight} />}
      </View>
    </Card>
  )
}

/**
 * Direction B, round one — the milestone as the hero line.
 *
 * Kept unchanged as the thing the human actually chose, so the round-two
 * variants have a fixed reference to be compared against.
 */
export function GoalLiftCardB({
  lift,
  density,
  showTrend,
}: {
  lift: LiftCardData
  density: CardDensity
  showTrend: boolean
}) {
  const d = DENSITY[density]
  return (
    <Card elevation={1} testID="goal-lift-card-b">
      <View className={`${d.pad} ${d.gap}`}>
        <View className="gap-stack-sm">
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            className="gap-inline-sm"
          >
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="overline" color="tertiary" maxLines={1}>
                {lift.name}
              </Typography>
            </View>
            {lift.isPR && <PrBadge type="weight" compact />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }} className="gap-inline-sm">
            <Typography variant="h5" maxLines={1}>
              {milestoneHero(lift)}
            </Typography>
            <Typography variant="caption" color="tertiary">
              {milestoneTail(lift)}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <StatusCapsule status={lift.status} />
          </View>
        </View>

        {showTrend && <GoalSparkline lift={lift} height={d.sparkHeight} />}

        <Typography variant="microLabel" color="tertiary">
          {`Committed ${lift.committed}${lift.unit} · Stretch ${lift.stretch}${lift.unit}`}
        </Typography>
      </View>
    </Card>
  )
}

/** Where the `kg` lives. The one axis B3 varies. */
export type UnitPlacement = 'caption' | 'inline'

export interface GoalLiftCardBRefinedProps {
  lift: LiftCardData
  density: CardDensity
  /** Committed/stretch labels in a right gutter, or inline over the plot. */
  labelPlacement: BandLabelPlacement
  unitPlacement: UnitPlacement
}

/**
 * Direction B, round two — every piece of the human's 2026-09-14 feedback.
 *
 * - status moved to the upper right (direction C's placement) and collapsed to
 *   a bare `Indicator` at compact density;
 * - hero is reps x load, a ramp step larger, with "in week X" beneath it;
 * - the chart is `GoalBandSpark`: committed and stretch as lines with a shaded
 *   band between them, running the full meso rather than stopping at the last
 *   session, each edge labelled with its target load.
 *
 * ONE READING TO CHALLENGE: the separate "Committed … · Stretch …" line that
 * round-one B carried is GONE, because the chart's edge labels now carry those
 * two numbers and the note asked for them "consolidated". If the muted line is
 * still wanted under the chart, say so — it is a two-line change.
 *
 * The hero uses `body1` plus the heading face rather than an `h4`: `h1`-`h6`
 * emit `accessibilityRole="header"` (gotcha #11b), and a milestone number is
 * not a heading — eight cards would put eight bogus headings on the page.
 */
export function GoalLiftCardBRefined({
  lift,
  density,
  labelPlacement,
  unitPlacement,
}: GoalLiftCardBRefinedProps) {
  const d = DENSITY[density]
  const [width, onLayout] = useMeasuredWidth()

  return (
    <Card elevation={1} testID="goal-lift-card-b-refined">
      <View className={`${d.pad} ${d.gap}`}>
        <View className="gap-stack-sm">
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            className="gap-inline-sm"
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}
              className="gap-inline-sm"
            >
              <Typography variant="overline" color="tertiary" maxLines={1}>
                {lift.name}
              </Typography>
              {lift.isPR && <PrBadge type="weight" compact />}
            </View>
            <StatusMark status={lift.status} density={density} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }} className="gap-inline-sm">
            <Typography variant="body1" className={d.heroClass} maxLines={1}>
              {milestoneHero(lift)}
            </Typography>
            {unitPlacement === 'inline' && (
              <Typography variant="caption" color="tertiary">
                {lift.unit}
              </Typography>
            )}
          </View>
          <Typography variant="caption" color="tertiary">
            {unitPlacement === 'caption'
              ? `${lift.unit} · ${milestoneTail(lift)}`
              : milestoneTail(lift)}
          </Typography>
        </View>

        <View style={{ height: d.bandHeight }} onLayout={onLayout}>
          {width > 0 && (
            <GoalBandSpark
              actuals={lift.actuals}
              committed={lift.committed}
              stretch={lift.stretch}
              goalWeek={lift.goalWeek}
              unit={lift.unit}
              width={width}
              height={d.bandHeight}
              isRegressing={isRegressing(lift.status)}
              placement={labelPlacement}
            />
          )}
        </View>
      </View>
    </Card>
  )
}

/**
 * Direction C — the honest "this is just a MesoStatusCard size variant" option.
 *
 * Kept so the round-one comparison still renders. Quarantine per the skill once
 * a render is locked.
 */
export function GoalLiftCardC({ lift }: { lift: LiftCardData }) {
  return (
    <MesoStatusCard
      mesoName={lift.name}
      mesoSubtitle={`${milestoneHero(lift)} ${milestoneTail(lift)}`}
      statusBadge={{ label: statusLabel(lift.status), variant: mesoVariant(lift.status) }}
      metrics={[
        { label: 'Committed', value: `${lift.committed} ${lift.unit}` },
        { label: 'Stretch', value: `${lift.stretch} ${lift.unit}` },
      ]}
      gauges={[]}
      testID="goal-lift-card-c"
    />
  )
}

/** `MesoStatusCard` carries its own four-way badge vocabulary. */
function mesoVariant(status: GoalStatus): 'success' | 'warning' | 'error' | 'info' {
  const tone = statusTone(status)
  return tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'info'
}

/** The round-one muscle rollup card. */
export function MuscleRollupCard({
  muscle,
  density,
}: {
  muscle: MuscleCardData
  density: CardDensity
}) {
  const d = DENSITY[density]
  return (
    <Card elevation={1} testID="muscle-rollup-card">
      <View className={`${d.pad} ${d.gap}`}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" maxLines={1}>
              {muscle.name}
            </Typography>
          </View>
          <StatusCapsule status={muscle.status} />
        </View>
        <Typography variant="caption" color="secondary" maxLines={2}>
          {muscle.summary}
        </Typography>
        {/* Metric centres by default; twMerge lets `items-start` win so the
            count lines up with the name and the summary above it. */}
        <Metric
          className="items-start"
          size="sm"
          value={`${muscle.liftsOnTrack}/${muscle.liftsTotal}`}
          label="Lifts on track"
        />
      </View>
    </Card>
  )
}

/**
 * The muscle rollup restyled onto refined B's shape: overline name, status
 * upper right collapsing to a light, the count as the hero with its label
 * beneath, and the rollup sentence as the quiet line. No chart — a muscle
 * rollup has no series, which is exactly why one card with two content presets
 * beats two components.
 */
export function MuscleRollupCardRefined({
  muscle,
  density,
}: {
  muscle: MuscleCardData
  density: CardDensity
}) {
  const d = DENSITY[density]
  return (
    <Card elevation={1} testID="muscle-rollup-card-refined">
      <View className={`${d.pad} ${d.gap}`}>
        <View className="gap-stack-sm">
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            className="gap-inline-sm"
          >
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="overline" color="tertiary" maxLines={1}>
                {muscle.name}
              </Typography>
            </View>
            <StatusMark status={muscle.status} density={density} />
          </View>

          <Typography variant="body1" className={d.heroClass} maxLines={1}>
            {`${muscle.liftsOnTrack}/${muscle.liftsTotal}`}
          </Typography>
          <Typography variant="caption" color="tertiary">
            lifts on track
          </Typography>
        </View>

        {/* `caption`, not `microLabel` — microLabel uppercases, and a sentence
            set in all caps is unreadable at this size. */}
        <Typography variant="caption" color="tertiary" maxLines={2}>
          {muscle.summary}
        </Typography>
      </View>
    </Card>
  )
}

/**
 * An equal-column grid built by chunking into rows of `columns` and letting
 * each cell take `flex: 1`. Yoga has no `calc()`, so a percentage width minus a
 * gap is not expressible; chunking gets exact equal columns at any count, and
 * the trailing spacers keep the last row's cells the same width as the rest.
 */
export function CardGrid({ columns, children }: { columns: number; children: React.ReactNode }) {
  const cells = React.Children.toArray(children)
  const rows: React.ReactNode[][] = []
  for (let i = 0; i < cells.length; i += columns) rows.push(cells.slice(i, i + columns))

  return (
    <View className="gap-stack-lg">
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={{ flexDirection: 'row', alignItems: 'stretch' }}
          className="gap-inline-lg"
        >
          {row.map((cell, cellIndex) => (
            <View key={`cell-${cellIndex}`} style={{ flex: 1, minWidth: 0 }}>
              {cell}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`spacer-${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  )
}

/** A group heading above a grid, matching the consumer's "Per-lift" / "Muscle priorities". */
export function GroupHeading({ title, note }: { title: string; note?: string }) {
  return (
    <View className="gap-stack-sm">
      <Typography variant="h6">{title}</Typography>
      {note !== undefined && (
        <Typography variant="caption" color="tertiary">
          {note}
        </Typography>
      )}
    </View>
  )
}

/**
 * The lift card, round three — the human's 2026-09-15 notes on top of B3.
 *
 * - the unit sits on the hero line ("8 x 105 kg"), caption is just "in week 8";
 * - band labels sit over the plot at its LEFT end, one type step smaller;
 * - the title WRAPS to a second line instead of truncating when the cell is
 *   too narrow to hold it;
 * - the PR mark is a small asterisk on the load, not a badge on the title.
 */
export function GoalLiftCardR3({ lift, density }: { lift: LiftCardData; density: CardDensity }) {
  const d = DENSITY[density]
  const [width, onLayout] = useMeasuredWidth()

  return (
    <Card elevation={1} testID="goal-lift-card-r3">
      <View className={`${d.pad} ${d.gap}`}>
        <View className="gap-stack-sm">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
            className="gap-inline-sm"
          >
            {/* No maxLines: a long exercise name breaks to a second line rather
                than truncating, which is what the narrow-cell note asked for. */}
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="overline" color="tertiary">
                {lift.name}
              </Typography>
            </View>
            <StatusMark status={lift.status} density={density} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }} className="gap-inline-sm">
            <Typography variant="body1" className={d.heroClass} maxLines={1}>
              {milestoneHero(lift)}
            </Typography>
            <Typography variant="caption" color="tertiary">
              {lift.unit}
            </Typography>
            {lift.isPR && <PrAsterisk />}
          </View>
          <Typography variant="caption" color="tertiary">
            {milestoneTail(lift)}
          </Typography>
        </View>

        <View style={{ height: d.bandHeight }} onLayout={onLayout}>
          {width > 0 && (
            <GoalBandSpark
              actuals={lift.actuals}
              committed={lift.committed}
              stretch={lift.stretch}
              goalWeek={lift.goalWeek}
              unit={lift.unit}
              width={width}
              height={d.bandHeight}
              isRegressing={isRegressing(lift.status)}
              placement="inline-left"
            />
          )}
        </View>
      </View>
    </Card>
  )
}

/** The rollup card's shared chrome, so all four variants differ only in body. */
function RollupShell({
  muscle,
  density,
  children,
}: {
  muscle: MuscleCardData
  density: CardDensity
  children: React.ReactNode
}) {
  const d = DENSITY[density]
  return (
    <Card elevation={1} testID="muscle-rollup-card-r3">
      <View className={`${d.pad} ${d.gap}`}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
          className="gap-inline-sm"
        >
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Typography variant="overline" color="tertiary">
              {muscle.name}
            </Typography>
          </View>
          <StatusMark status={muscle.status} density={density} />
        </View>
        {children}
      </View>
    </Card>
  )
}

/** The count as the hero, matching the lift card's hero slot. */
function RollupCount({ muscle, density }: { muscle: MuscleCardData; density: CardDensity }) {
  return (
    <View>
      <Typography variant="body1" className={DENSITY[density].heroClass} maxLines={1}>
        {`${muscle.liftsOnTrack}/${muscle.liftsTotal}`}
      </Typography>
      <Typography variant="caption" color="tertiary">
        lifts on track
      </Typography>
    </View>
  )
}

/** One contributing lift: status light, name, next milestone. */
function LiftMiniRow({ row }: { row: MuscleLiftRow }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      className="gap-inline-sm"
      testID="rollup-lift-row"
    >
      <Indicator
        color={STATUS_INDICATOR[row.status]}
        size="sm"
        accessibilityLabel={statusLabel(row.status)}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" maxLines={1}>
          {row.name}
        </Typography>
      </View>
      <Typography variant="caption" color="tertiary" className="text-3xs leading-[normal]">
        {/* Round three showed "wk N" on EVERY row. Kept verbatim (a goal week
            can never be -1, so the week always renders) so the round-3 sheet
            still shows the human what they actually reviewed. Round four is
            where the week became conditional. */}
        {liftRowText(row, -1)}
      </Typography>
    </View>
  )
}

/**
 * A segment per contributing lift, coloured by that lift's goal status.
 *
 * NOT a volume-landmark bar, deliberately. The landmark position (sets against
 * MAV/MRV) lives on a different read model that `#/goals` never fetches — the
 * rollup carries status, a summary and a count, and nothing else. Drawing a
 * landmark here would be inventing data.
 */
function LiftStatusStrip({ muscle }: { muscle: MuscleCardData }) {
  return (
    <View
      style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}
      className="gap-inline-sm"
      accessibilityRole="image"
      accessibilityLabel={`${muscle.liftsOnTrack} of ${muscle.liftsTotal} lifts on track`}
      testID="rollup-status-strip"
    >
      {muscle.lifts.map((row) => (
        <StripSegment key={row.name} status={row.status} />
      ))}
    </View>
  )
}

function StripSegment({ status }: { status: GoalStatus }) {
  return <View style={{ flex: 1, backgroundColor: useStatusColor(status), borderRadius: 3 }} />
}

/** R1 — count hero beside the mini figure. */
export function MuscleRollupR1({
  muscle,
  density,
}: {
  muscle: MuscleCardData
  density: CardDensity
}) {
  const litColor = useStatusColor(muscle.status)
  return (
    <RollupShell muscle={muscle} density={density}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        className="gap-inline-md"
      >
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <RollupCount muscle={muscle} density={density} />
        </View>
        <MuscleGlyph muscle={muscle.muscle} side={muscle.side} litColor={litColor} />
      </View>
      <Typography variant="caption" color="tertiary" maxLines={2}>
        {muscle.summary}
      </Typography>
    </RollupShell>
  )
}

/** R2 — every contributing lift as its own mini row. */
export function MuscleRollupR2({
  muscle,
  density,
}: {
  muscle: MuscleCardData
  density: CardDensity
}) {
  return (
    <RollupShell muscle={muscle} density={density}>
      <RollupCount muscle={muscle} density={density} />
      <Divider />
      <View className="gap-stack-md">
        {muscle.lifts.map((row) => (
          <LiftMiniRow key={row.name} row={row} />
        ))}
      </View>
    </RollupShell>
  )
}

/** R3 — the status strip plus the count; no per-lift detail. */
export function MuscleRollupR3({
  muscle,
  density,
}: {
  muscle: MuscleCardData
  density: CardDensity
}) {
  return (
    <RollupShell muscle={muscle} density={density}>
      <RollupCount muscle={muscle} density={density} />
      <LiftStatusStrip muscle={muscle} />
      <Typography variant="caption" color="tertiary" maxLines={2}>
        {muscle.summary}
      </Typography>
    </RollupShell>
  )
}

/** R4 — the figure and the lift list together. */
export function MuscleRollupR4({
  muscle,
  density,
}: {
  muscle: MuscleCardData
  density: CardDensity
}) {
  const litColor = useStatusColor(muscle.status)
  return (
    <RollupShell muscle={muscle} density={density}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-inline-md">
        <MuscleGlyph muscle={muscle.muscle} side={muscle.side} litColor={litColor} />
        <View style={{ flex: 1, minWidth: 0 }} className="gap-stack-md">
          <RollupCount muscle={muscle} density={density} />
          {muscle.lifts.map((row) => (
            <LiftMiniRow key={row.name} row={row} />
          ))}
        </View>
      </View>
    </RollupShell>
  )
}

/**
 * Below this content width the status pill collapses to its light, whatever
 * the density. Round three drove the collapse off density ALONE, so a narrow
 * comfortable cell still rendered the full pill and pushed the title into a
 * wrap — "narrow cell should keep the small status icon". The mark is never
 * absent; only its form changes.
 */
const STATUS_COLLAPSE_WIDTH = 320

/**
 * The PR mark stacked over the unit, its top on the hero's cap line — the
 * round-four note, "above the kg, not next to it".
 *
 * The column sits in a `baseline` row, so the unit keeps the hero's baseline
 * and the star rides above it.
 */
function PrStack({ unit, isPR }: { unit: string; isPR: boolean }) {
  const brand = getSemanticColors(useSurfaceMode())['brand-primary']
  return (
    <View style={{ position: 'relative' }}>
      <Typography variant="caption" color="tertiary">
        {unit}
      </Typography>
      {isPR && (
        <View
          accessibilityRole="image"
          accessibilityLabel="Personal record"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            // optical: puts the 10px star's top on the hero's cap line. Absolute
            // so the unit does NOT move — stacking the star in normal flow
            // pushed `kg` down, and a PR card then sat a line off every non-PR
            // card beside it in the same grid row.
            top: -9,
          }}
          testID="goal-card-pr-star"
        >
          <StarIcon size={10} color={brand} fill={brand} strokeWidth={2} />
        </View>
      )}
    </View>
  )
}

/**
 * The lift card, round four. Round three plus the two fixes: the status mark
 * collapses on measured WIDTH rather than density alone, and the PR star is
 * stacked over the unit instead of sitting beside it.
 */
export function GoalLiftCardR4({ lift, density }: { lift: LiftCardData; density: CardDensity }) {
  const d = DENSITY[density]
  const [chartWidth, onChartLayout] = useMeasuredWidth()
  const [cardWidth, onCardLayout] = useMeasuredWidth()
  const collapsed = density === 'compact' || (cardWidth > 0 && cardWidth < STATUS_COLLAPSE_WIDTH)

  return (
    <Card elevation={1} testID="goal-lift-card-r4">
      <View className={`${d.pad} ${d.gap}`} onLayout={onCardLayout}>
        <View className="gap-stack-sm">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
            className="gap-inline-sm"
          >
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="overline" color="tertiary">
                {lift.name}
              </Typography>
            </View>
            {collapsed ? (
              <Indicator
                color={STATUS_INDICATOR[lift.status]}
                size="md"
                accessibilityLabel={statusLabel(lift.status)}
                testID="goal-card-status-dot"
              />
            ) : (
              <StatusCapsule status={lift.status} />
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }} className="gap-inline-sm">
            <Typography variant="body1" className={d.heroClass} maxLines={1}>
              {milestoneHero(lift)}
            </Typography>
            <PrStack unit={lift.unit} isPR={lift.isPR} />
          </View>
          <Typography variant="caption" color="tertiary">
            {milestoneTail(lift)}
          </Typography>
        </View>

        <View style={{ height: d.bandHeight }} onLayout={onChartLayout}>
          {chartWidth > 0 && (
            <GoalBandSpark
              actuals={lift.actuals}
              committed={lift.committed}
              stretch={lift.stretch}
              goalWeek={lift.goalWeek}
              unit={lift.unit}
              width={chartWidth}
              height={d.bandHeight}
              isRegressing={isRegressing(lift.status)}
              placement="inline-left"
            />
          )}
        </View>
      </View>
    </Card>
  )
}

/** The count, sized to sit beside the figure rather than above the rows. */
function RollupCountBlock({ muscle, density }: { muscle: MuscleCardData; density: CardDensity }) {
  return (
    <View>
      <Typography variant="body1" className={DENSITY[density].heroClass} maxLines={1}>
        {`${muscle.liftsOnTrack}/${muscle.liftsTotal}`}
      </Typography>
      <Typography variant="caption" color="tertiary">
        lifts on track
      </Typography>
    </View>
  )
}

/** A rollup lift row. The week is elided unless this lift's differs. */
function RollupLiftRow({ row, commonGoalWeek }: { row: MuscleLiftRow; commonGoalWeek: number }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      className="gap-inline-sm"
      testID="rollup-lift-row"
    >
      <Indicator
        color={STATUS_INDICATOR[row.status]}
        size="sm"
        accessibilityLabel={statusLabel(row.status)}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" maxLines={1}>
          {row.name}
        </Typography>
      </View>
      <Typography variant="caption" color="tertiary" className="text-3xs leading-[normal]">
        {liftRowText(row, commonGoalWeek)}
      </Typography>
    </View>
  )
}

/** Chart geometry for the R4b inline spark, not a spacing token. */
const ROLLUP_SPARK_HEIGHT = 40

/**
 * R4 rearranged — the round-four rollup.
 *
 * Top band: the count on the left, the figure pushed right and the count
 * centred against it (R1's arrangement). `withSpark` adds the muscle-level
 * band spark between them, which is R4b.
 *
 * The rows sit below at `gap-stack-md` rather than `lg` — "potentially
 * slightly tighter spaced".
 */
export function MuscleRollupR4Arranged({
  muscle,
  density,
  withSpark,
}: {
  muscle: MuscleCardData
  density: CardDensity
  withSpark: boolean
}) {
  const d = DENSITY[density]
  const litColor = useStatusColor(muscle.status)
  const [sparkWidth, onSparkLayout] = useMeasuredWidth()
  const series = muscle.series

  return (
    <Card elevation={1} testID="muscle-rollup-card-r4">
      <View className={`${d.pad} ${d.gap}`}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
          className="gap-inline-sm"
        >
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Typography variant="overline" color="tertiary">
              {muscle.name}
            </Typography>
          </View>
          <StatusMark status={muscle.status} density={density} />
        </View>

        <View
          style={{ flexDirection: 'row', alignItems: 'center' }}
          className="gap-inline-md"
          testID="rollup-top-band"
        >
          <RollupCountBlock muscle={muscle} density={density} />
          {withSpark && series !== undefined && (
            <View
              style={{ flex: 1, minWidth: 0, height: ROLLUP_SPARK_HEIGHT }}
              onLayout={onSparkLayout}
            >
              {sparkWidth > 0 && (
                <GoalBandSpark
                  actuals={series.actuals}
                  committed={series.committed}
                  stretch={series.stretch}
                  goalWeek={series.goalWeek}
                  unit={muscle.lifts[0]?.unit ?? ''}
                  width={sparkWidth}
                  height={ROLLUP_SPARK_HEIGHT}
                  isRegressing={isRegressing(muscle.status)}
                  placement="inline-left"
                />
              )}
            </View>
          )}
          {!withSpark && <View style={{ flex: 1 }} />}
          <MuscleGlyph muscle={muscle.muscle} side={muscle.side} litColor={litColor} />
        </View>

        <Divider />

        <View className="gap-stack-md">
          {muscle.lifts.map((row) => (
            <RollupLiftRow key={row.name} row={row} commonGoalWeek={muscle.commonGoalWeek} />
          ))}
        </View>
      </View>
    </Card>
  )
}
