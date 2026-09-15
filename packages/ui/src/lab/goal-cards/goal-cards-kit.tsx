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
import { resolveColor } from '../../theme/resolve-color'
import { GoalBandSpark, type BandLabelPlacement, type GoalActual } from './GoalBandSpark'

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

export interface MuscleCardData {
  name: string
  status: GoalStatus
  summary: string
  liftsOnTrack: number
  liftsTotal: number
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
    status: 'on_track',
    summary: 'Both lifts tracking their committed band.',
    liftsOnTrack: 2,
    liftsTotal: 2,
  },
  {
    name: 'BACK',
    status: 'ahead',
    summary: 'Row is ahead of band; pull up cleared a PR.',
    liftsOnTrack: 3,
    liftsTotal: 3,
  },
  {
    name: 'QUADS',
    status: 'behind',
    summary: 'Squat slipped under the band in week 3.',
    liftsOnTrack: 1,
    liftsTotal: 2,
  },
  {
    name: 'HAMSTRINGS',
    status: 'stalled',
    summary: 'RDL has not moved for five sessions.',
    liftsOnTrack: 0,
    liftsTotal: 2,
  },
  {
    name: 'SHOULDERS',
    status: 'calibrating',
    summary: 'Three readings in; band not yet fitted.',
    liftsOnTrack: 0,
    liftsTotal: 1,
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
