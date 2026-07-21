// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Surface } from '../../ui/surface'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { SessionHeader } from './SessionHeader'
import type { MetricTileData } from './MetricTiles'
import type { SetStripSet } from './SetStrip'
import type { ExerciseIndicatorKind } from './ExerciseIndicator'

// The rail is workout CONTENT, not shell chrome: it sits FLAT on the content plane it's
// dropped into (no distinct surface fill, no neumorphic depth). Separation is carried by
// hairlines, not surface steps — a FULL vertical hairline on the right edge parts the rail
// from the stage beside it, and a PARTIAL (inset) horizontal hairline parts the heading
// from the exercise list. Both use the self-normalizing alpha-white hairline token, which
// reads constant on any plane. Per-row dividers use the same token.
const HAIRLINE = getSemanticColors('dark')['border-subtle']

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
  onExercisePress?: (exercise: SessionRailExercise, index: number) => void
  className?: string
}

/**
 * The live-workout session rail: a {@link SessionHeader} glance (title, stat tiles,
 * chunked pace bar) over a list of {@link ExerciseCardHeading} exercise headings, all
 * flat on the content plane and parted by hairlines (content, not chrome). The header's
 * plan (chunk widths ∝ sets) is derived from `exercises`. Presentational — driven
 * entirely by props.
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
  onExercisePress,
  className,
  style,
  ...props
}: SessionRailProps) {
  return (
    <Surface
      level="elevated"
      className={className}
      // Flat on the content plane (transparent), with the FULL vertical hairline on the
      // right edge parting the rail from the stage beside it.
      style={[
        {
          width,
          flexDirection: 'column',
          backgroundColor: 'transparent',
          borderRightWidth: 1,
          borderRightColor: HAIRLINE,
        },
        style,
      ]}
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

      {/* PARTIAL horizontal hairline — inset from the edges so it parts heading from list
          without running into the rail's outer vertical hairline. */}
      <View style={{ height: 1, marginHorizontal: 12, backgroundColor: HAIRLINE }} />

      <Surface
        level="elevated"
        // Flat, no neumorphic depth — the list is content on the same plane as the heading.
        style={[{ flex: 1, backgroundColor: 'transparent' }]}
        testID="session-rail-list"
      >
        {exercises.map((ex, i) => (
          <View
            key={ex.id ?? i}
            style={{
              borderBottomWidth: i < exercises.length - 1 ? 1 : 0,
              borderBottomColor: HAIRLINE,
            }}
          >
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
          </View>
        ))}
      </Surface>
    </Surface>
  )
}
