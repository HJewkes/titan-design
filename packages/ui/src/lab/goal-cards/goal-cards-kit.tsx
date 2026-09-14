/**
 * Lab/Goals — the shared kit behind the VW-386 goal-card specimen sheets.
 *
 * Not a `.stories.tsx`, so the stories glob leaves it alone and all four sheets
 * import one copy of the fixtures, the status vocabulary and the three card
 * directions (reference 02, "when a specimen sheet grows >1 concern").
 *
 * Nothing here is a component yet. The directions are deliberately three
 * *renderable options* for the human to compare, not a hardened API — Gate 1 is
 * the survey next to this file, and the invest decision is still open.
 *
 * LAYOUT via `style`, never `className` — react-native-web drops Tailwind
 * layout utilities on a View. SPACING via `className` semantic keys, which do
 * survive. Colour comes from `<Surface>` / `<Card>` / semantic tokens only.
 */
import React, { useCallback, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'

import { Card } from '../../components/ui/card/Card'
import { Divider } from '../../components/ui/divider'
import { Pill, type PillTone } from '../../components/ui/pill'
import { Typography } from '../../components/custom/Typography'
import { Metric, MetricGroup } from '../../components/custom/Metric'
import { Sparkline } from '../../components/custom/Workout/Sparkline'
import { PrBadge } from '../../components/custom/Workout/PrBadge'
import { MesoStatusCard } from '../../components/custom/Workout/MesoStatusCard'
import { resolveColor } from '../../theme/resolve-color'

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
  /** The milestone's numbers, e.g. "105 x 8". */
  milestoneHero: string
  /** The milestone's timing tail, e.g. "in week 5". */
  milestoneTail: string
  committed: number
  stretch: number
  unit: string
  isPR: boolean
  /** The actuals series, oldest first. */
  actuals: number[]
}

export interface MuscleCardData {
  name: string
  status: GoalStatus
  summary: string
  liftsOnTrack: number
  liftsTotal: number
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
    milestoneHero: '105 x 8',
    milestoneTail: 'in week 5',
    committed: 102.5,
    stretch: 110,
    unit: 'kg',
    isPR: true,
    actuals: [92.5, 95, 95, 97.5, 100, 100, 102.5],
  },
  {
    name: 'BACK SQUAT',
    status: 'ahead',
    milestoneHero: '150 x 5',
    milestoneTail: 'in week 4',
    committed: 145,
    stretch: 155,
    unit: 'kg',
    isPR: false,
    actuals: [130, 135, 137.5, 140, 142.5, 145, 147.5],
  },
  {
    name: 'DEADLIFT',
    status: 'behind',
    milestoneHero: '180 x 3',
    milestoneTail: 'in week 6',
    committed: 175,
    stretch: 190,
    unit: 'kg',
    isPR: false,
    actuals: [165, 167.5, 167.5, 165, 167.5, 167.5, 170],
  },
  {
    name: 'OVERHEAD PRESS',
    status: 'calibrating',
    milestoneHero: '65 x 8',
    milestoneTail: 'in week 5',
    committed: 62.5,
    stretch: 70,
    unit: 'kg',
    isPR: false,
    actuals: [57.5, 60, 60],
  },
  {
    name: 'BARBELL ROW',
    status: 'on_track',
    milestoneHero: '100 x 10',
    milestoneTail: 'in week 5',
    committed: 97.5,
    stretch: 105,
    unit: 'kg',
    isPR: false,
    actuals: [85, 87.5, 90, 90, 92.5, 95, 95],
  },
  {
    name: 'ROMANIAN DEADLIFT',
    status: 'stalled',
    milestoneHero: '140 x 8',
    milestoneTail: 'in week 7',
    committed: 135,
    stretch: 145,
    unit: 'kg',
    isPR: false,
    actuals: [125, 127.5, 127.5, 127.5, 127.5, 127.5, 127.5],
  },
  {
    name: 'INCLINE PRESS',
    status: 'tolerated',
    milestoneHero: '85 x 8',
    milestoneTail: 'in week 6',
    committed: 82.5,
    stretch: 90,
    unit: 'kg',
    isPR: false,
    actuals: [72.5, 75, 75, 77.5, 77.5, 80, 80],
  },
  {
    name: 'WEIGHTED PULL UP',
    status: 'deload_week',
    milestoneHero: '30 x 6',
    milestoneTail: 'in week 5',
    committed: 27.5,
    stretch: 35,
    unit: 'kg',
    isPR: true,
    actuals: [17.5, 20, 22.5, 22.5, 25, 25, 27.5],
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

/** Per-density spacing. Every value is a semantic key, never a number. */
const DENSITY = {
  comfortable: { pad: 'p-inset-lg', gap: 'gap-stack-lg', sparkHeight: 34 },
  compact: { pad: 'p-inset-md', gap: 'gap-stack-md', sparkHeight: 24 },
} as const

/**
 * `Sparkline` normalises over `data`'s own min/max, so a reference line above
 * max(actuals) is drawn outside its box. The specimen keeps only the lines that
 * actually land inside the series; a `domain` prop is the harden-step fix.
 */
function inRangeReferences(
  actuals: number[],
  refs: { value: number; color: string; dashed?: boolean; label?: string }[]
) {
  if (actuals.length === 0) return []
  const min = Math.min(...actuals)
  const max = Math.max(...actuals)
  return refs.filter((ref) => ref.value >= min && ref.value <= max)
}

/**
 * `Sparkline` needs a numeric width, so this measures its OWN box rather than
 * the card's — measuring the padded container overshoots by both insets and the
 * line bleeds through the card's right edge. `onLayout` does not fire under
 * jsdom (gotcha #6); nothing in a unit test depends on it.
 */
function GoalSparkline({ lift, height }: { lift: LiftCardData; height: number }) {
  const [width, setWidth] = useState(0)
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width))
  }, [])

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <Sparkline
          data={lift.actuals}
          width={width}
          height={height}
          highlightLast
          color={resolveColor(
            lift.status === 'behind' || lift.status === 'stalled'
              ? 'result-degrade'
              : 'result-improve'
          )}
          referenceLines={inRangeReferences(lift.actuals, [
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
 * Direction A — the metric pair under the title.
 *
 * Title row carries the name, the PR badge and the status capsule, so the two
 * things the eye looks for are one line apart instead of 1600px apart. The
 * milestone is a caption directly under it, then the committed/stretch pair as
 * a `MetricGroup`, then the trend.
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
                {`${lift.milestoneHero} ${lift.milestoneTail}`}
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
 * Direction B — the milestone as the hero line.
 *
 * The card leads with the number the athlete is chasing. The name drops to an
 * overline and committed/stretch fall to a single muted line, on the argument
 * that a grid is scanned for "what's next", not for the band.
 *
 * Note for the consumer: this needs the milestone split into its numbers and
 * its timing. `GoalProgressView.nextMilestone.label` is one string today
 * ("105 x 8 in week 5"), so picking B means a read-model change.
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
              {lift.milestoneHero}
            </Typography>
            <Typography variant="caption" color="tertiary">
              {lift.milestoneTail}
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

/**
 * Direction C — the honest "this is just a MesoStatusCard size variant" option.
 *
 * The real `MesoStatusCard`, one per lift, fed the same data. It is rendered so
 * the choice between "new compact card" and "give MesoStatusCard a density
 * prop" is made on a render rather than on my summary of it.
 *
 * What it costs is visible in the grid: the brand gradient and the 3px brand
 * accent are hero chrome, and eight peers all wearing it flatten the hierarchy.
 */
export function GoalLiftCardC({ lift }: { lift: LiftCardData }) {
  return (
    <MesoStatusCard
      mesoName={lift.name}
      mesoSubtitle={`${lift.milestoneHero} ${lift.milestoneTail}`}
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

/**
 * The muscle rollup as a card rather than a row. Same five slots as a lift card
 * with one field renamed, which is the survey's argument for one component with
 * two content presets rather than a second component.
 */
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
