// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { greyRamp } from '../../../theme/tokens/primitives'
import { neumorphicShadows } from '../../../theme/shadows'
import { Surface } from '../../ui/surface'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { ExerciseCard } from './ExerciseCard'
import type { SetRowProps } from './SetRow'
import { SessionHeader } from './SessionHeader'
import type { MetricTileData } from './MetricTiles'
import type { SetStripSet } from './SetStrip'
import type { ExerciseIndicatorKind } from './ExerciseIndicator'

// Warm-tapered ramp surfaces (the locked S3 shell shades): the nav + the heading plane read as
// ONE dark plane (background shell, #1C1916, owned by SessionHeader's `<Surface level="background">`).
// The exercise list is a LIGHTER inset panel — `<Surface level="elevated">` (#2A2827) —
// recessed via its inner shadow yet paler than the header, so the transparent
// exercise headings on it never blend into the header plane. Surface owns both backgrounds,
// so the rail no longer hand-sets them.
const DIVIDER = greyRamp[900] // #2C2C2C — row divider (raised to read on surface-elevated #2A2827)

const DEFAULT_WIDTH = 246

export interface SessionRailExercise {
  /** Stable key + press payload. Falls back to list index when absent. */
  id?: string
  name: string
  /** `weight` accepts a string (e.g. "—") for an unset/discovery load — never a faked 0. */
  summary: { sets: number; reps: number | string; weight: number | string; unit: 'lbs' | 'kg' }
  /**
   * Prescribed set count for the header total + pace-bar segment width. Distinct from
   * `summary.sets`, which is the row's live DONE count (0 for the active exercise before
   * its first set) — using that for the total under-counts by the active exercise's
   * remaining sets. Falls back to `summary.sets` when absent.
   */
  plannedSets?: number
  tempo?: [number, number, number, number]
  indicator?: ExerciseIndicatorKind
  /** Per-set performance data driving the heading strip. */
  setStates: SetStripSet[]
  /** Dim the row as a not-yet-reached exercise. */
  upcoming?: boolean
  /**
   * Per-set rows for the expanded body. Only read when this row is the one named
   * by `expandedIndex` — a rail row without them can never expand, which is the
   * correct behaviour for an exercise whose sets aren't loaded.
   */
  sets?: SetRowProps[]
}

export interface SessionRailProps extends ViewProps {
  /** Session title — the live session's name, or the next session's name when `next` is set. */
  title: string
  exercises: SessionRailExercise[]
  /** Fractional sets completed (live) — drives the header's pace bar + sets label. */
  setsDone?: number
  /** Live elapsed time in ms — drives the header's ⏱ readout and pace marker. */
  elapsedMs?: number
  /** Optional time budget in ms → header pace marker + ` / budget`. */
  budgetMs?: number
  /** Header elapsed readout goes live-green while true. Default true (live). */
  running?: boolean
  /** Live stat tiles (Volume / Load / Fatigue). Ignored when `next` is set. */
  metrics?: MetricTileData[]
  /** When set → the header renders the UPCOMING glance (Date/Time/Until + empty bar). */
  next?: number | Date
  /** Heading strip height in px, forwarded to each row. Default 8. */
  stripHeight?: number
  /** Rail width in px. Default 246. */
  width?: number
  /**
   * Index of the exercise to render EXPANDED in place — its set table opens
   * inside the rail rather than in a separate pane. The row still draws the same
   * `ExerciseCardHeading` (an `ExerciseCard` composes one), so an expanded row
   * differs from a collapsed one only by the revealed body.
   *
   * Ignored when the named exercise has no `sets`. Omit for an all-collapsed
   * rail, which is the prior behaviour.
   */
  expandedIndex?: number
  onExercisePress?: (exercise: SessionRailExercise, index: number) => void
  className?: string
}

/**
 * The live-workout session rail: a flat raised {@link SessionHeader} glance (title,
 * stat tiles, chunked pace bar) over a sunk, inset list of {@link ExerciseCardHeading}
 * exercise headings. The header's plan (chunk widths ∝ sets) is derived from `exercises`.
 * Presentational — driven entirely by props.
 */
export function SessionRail({
  title,
  exercises,
  setsDone,
  elapsedMs,
  budgetMs,
  running,
  metrics,
  next,
  stripHeight = 8,
  width = DEFAULT_WIDTH,
  expandedIndex,
  onExercisePress,
  className,
  style,
  ...props
}: SessionRailProps) {
  return (
    <Surface
      level="elevated"
      className={className}
      style={[{ width, flexDirection: 'column' }, style]}
      testID="session-rail"
      {...props}
    >
      <SessionHeader
        title={title}
        plan={exercises.map((ex) => ({ name: ex.name, sets: ex.plannedSets ?? ex.summary.sets }))}
        setsDone={setsDone}
        elapsedMs={elapsedMs}
        budgetMs={budgetMs}
        running={running}
        metrics={metrics}
        next={next}
      />

      <Surface
        level="elevated"
        style={[{ flex: 1 }, neumorphicShadows.grey.pressed.subtle]}
        testID="session-rail-list"
      >
        {exercises.map((ex, i) => (
          <View
            key={ex.id ?? i}
            style={{
              borderBottomWidth: i < exercises.length - 1 ? 1 : 0,
              borderBottomColor: DIVIDER,
            }}
          >
            {i === expandedIndex && ex.sets ? (
              <ExerciseCard
                name={ex.name}
                expanded
                summary={{
                  sets: ex.summary.sets,
                  reps: ex.summary.reps,
                  // ExerciseCard's summary takes a numeric load; a string load is
                  // an unset/discovery weight, which has no expanded form yet.
                  weight: typeof ex.summary.weight === 'number' ? ex.summary.weight : 0,
                  unit: ex.summary.unit,
                }}
                tempo={ex.tempo}
                sets={ex.sets}
                onExpandedChange={() => onExercisePress?.(ex, i)}
              />
            ) : (
              <ExerciseCardHeading
                name={ex.name}
                sets={ex.summary.sets}
                reps={ex.summary.reps}
                load={ex.summary.weight}
                unit={ex.summary.unit}
                tempo={ex.tempo}
                indicator={ex.indicator}
                setStates={ex.setStates}
                stripHeight={stripHeight}
                dimmed={ex.upcoming}
                onPress={() => onExercisePress?.(ex, i)}
              />
            )}
          </View>
        ))}
      </Surface>
    </Surface>
  )
}
