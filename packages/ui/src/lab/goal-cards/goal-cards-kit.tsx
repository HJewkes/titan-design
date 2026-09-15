/**
 * Lab/Goals — the shared kit behind the VW-386 muscle-rollup specimen.
 *
 * Not a `.stories.tsx`, so the stories glob leaves it alone.
 *
 * SCOPE, after the 2026-09-15 lock: the LIFT card is done and lives in the
 * library as `custom/Workout/GoalLiftCard`. Rounds one to three, and the lab
 * copies of the lift card, were quarantined — see `REJECTED.md`, "The VW-386
 * goal-card directions". What remains here is the muscle rollup, which is
 * still open.
 *
 * LAYOUT via `style`, never `className` — react-native-web drops Tailwind
 * layout utilities on a View. SPACING via `className` semantic keys, which do
 * survive. Colour comes from `<Surface>` / `<Card>` / semantic tokens only.
 */
import React from 'react'
import { View } from 'react-native'

import { Card } from '../../components/ui/card/Card'
import { Indicator, type IndicatorColor } from '../../components/ui/indicator'
import { Pill, type PillTone } from '../../components/ui/pill'
import { useSurfaceMode } from '../../components/ui/surface'
import { Typography } from '../../components/custom/Typography'
import { MuscleGroup } from '../../components/custom/Workout/muscleTaxonomy'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { MuscleGlyph } from './MuscleGlyph'

export { MuscleGroup }

/** The `#/goals` read model's status vocabulary (`GoalProgressStatus`). */
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

/**
 * One contributing lift inside a muscle rollup.
 *
 * `goalWeek` is this TARGET's own due week, not the meso's current week — two
 * lifts under one muscle can be due in different weeks, which is the only
 * reason a row could carry one at all. See `liftRowText`.
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
 * The row's text. The week shows ONLY when this lift's goal week differs from
 * the muscle's common one: it is per-target and usually identical, so repeating
 * it on every row was noise that read as if it meant something.
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
const STATUS_TONE: Record<GoalStatus, PillTone & IndicatorColor> = {
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
      { name: 'Bench press', status: 'on_track', reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
      { name: 'Incline press', status: 'tolerated', reps: 8, load: 85, unit: 'lb', goalWeek: 6 },
    ],
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
      { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
      {
        name: 'Weighted pull up',
        status: 'deload_week',
        reps: 6,
        load: 30,
        unit: 'lb',
        goalWeek: 5,
      },
      { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'lb', goalWeek: 7 },
    ],
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
      { name: 'Back squat', status: 'behind', reps: 5, load: 150, unit: 'lb', goalWeek: 8 },
      { name: 'Leg press', status: 'on_track', reps: 10, load: 220, unit: 'lb', goalWeek: 8 },
    ],
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
      { name: 'Romanian deadlift', status: 'stalled', reps: 8, load: 140, unit: 'lb', goalWeek: 7 },
      { name: 'Leg curl', status: 'behind', reps: 12, load: 55, unit: 'lb', goalWeek: 7 },
    ],
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
      { name: 'Overhead press', status: 'calibrating', reps: 8, load: 65, unit: 'lb', goalWeek: 8 },
    ],
  },
]

/** Matches `GoalLiftCard`'s own density ramp so the two cards sit together. */
const DENSITY = {
  comfortable: { pad: 'p-inset-lg', gap: 'gap-stack-lg' },
  compact: { pad: 'p-inset-md', gap: 'gap-stack-md' },
} as const

/** A resolved goal-status colour, for the places a token class cannot reach. */
function useStatusColor(status: GoalStatus): string {
  const t = getSemanticColors(useSurfaceMode())
  const tone = STATUS_TONE[status]
  if (tone === 'success') return t['status-success']
  if (tone === 'warning') return t['status-warning']
  return t['status-info']
}

/** The status affordance, collapsing to its light at the shrunk density. */
function StatusMark({ status, density }: { status: GoalStatus; density: CardDensity }) {
  if (density === 'compact') {
    return (
      <Indicator
        color={STATUS_TONE[status]}
        size="md"
        // RNW drops `aria-label` on a role-less View and axe flags it (gotcha #3).
        accessibilityRole="image"
        accessibilityLabel={statusLabel(status)}
        testID="rollup-status-dot"
      />
    )
  }
  return (
    <Pill tone={STATUS_TONE[status]} variant="subtle" size="sm" leading="dot">
      {statusLabel(status)}
    </Pill>
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
        color={STATUS_TONE[row.status]}
        size="sm"
        accessibilityRole="image"
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

/** How the rows sit against the figure column. The one open axis in round five. */
export type RollupRowAlignment = 'top' | 'centre'

/**
 * The muscle rollup, round five.
 *
 * The figure moves to the LEFT with the lifts-on-track count beneath it as a
 * label rather than a hero number, and the per-lift rows fill the space to the
 * right of that column. The spark is gone — it needed a muscle-level series
 * that `/api/goal-progress` does not return.
 */
export function MuscleRollupR5({
  muscle,
  density,
  rowAlignment,
}: {
  muscle: MuscleCardData
  density: CardDensity
  rowAlignment: RollupRowAlignment
}) {
  const d = DENSITY[density]
  const litColor = useStatusColor(muscle.status)

  return (
    <Card elevation={1} testID="muscle-rollup-card-r5">
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
          style={{
            flexDirection: 'row',
            alignItems: rowAlignment === 'top' ? 'flex-start' : 'center',
          }}
          className="gap-inline-lg"
        >
          <View style={{ alignItems: 'center' }} className="gap-stack-sm" testID="rollup-figure">
            <MuscleGlyph muscle={muscle.muscle} side={muscle.side} litColor={litColor} />
            {/* A label, not a top-line value — the round-five note. */}
            <Typography variant="caption" color="tertiary">
              {`${muscle.liftsOnTrack}/${muscle.liftsTotal} on track`}
            </Typography>
          </View>

          <View style={{ flex: 1, minWidth: 0 }} className="gap-stack-md">
            {muscle.lifts.map((row) => (
              <RollupLiftRow key={row.name} row={row} commonGoalWeek={muscle.commonGoalWeek} />
            ))}
          </View>
        </View>
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

/** A group heading above a grid. */
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
