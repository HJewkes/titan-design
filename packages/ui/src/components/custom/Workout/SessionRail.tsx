// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { neumorphicShadows } from '../../../theme/shadows'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { SessionHeader } from './SessionHeader'
import type { SetStripSet } from './SetStrip'
import type { ExerciseIndicatorKind } from './ExerciseIndicator'

// Charcoal-ramp surfaces (the locked S3 shell shades): the nav + the heading plane
// read as ONE flat raised surface; the exercise list is sunk. Depth comes only from
// the list's subtle inset shadow (top cast by the heading, faint left edge by the nav).
const INSET = primitiveColors.charcoal[800] // #131313 — sunk exercise list
const DIVIDER = primitiveColors.charcoal[500] // #1C1C1C — row divider

const DEFAULT_WIDTH = 246

export interface SessionRailExercise {
  /** Stable key + press payload. Falls back to list index when absent. */
  id?: string
  name: string
  summary: { sets: number; reps: number | string; weight: number; unit: 'lbs' | 'kg' }
  tempo?: [number, number, number, number]
  indicator?: ExerciseIndicatorKind
  /** Per-set performance data driving the heading strip. */
  setStates: SetStripSet[]
  /** Dim the row as a not-yet-reached exercise. */
  upcoming?: boolean
}

export interface SessionRailProps extends ViewProps {
  /** Session title, e.g. "Pull A · Intensification". */
  title: string
  /** Mono progress sub-line, e.g. "ex 3/5 · set 2 live". */
  status?: string
  /** Small uppercase eyebrow above the title. Default "Live session". */
  eyebrow?: string
  /** Show the live status dot beside the eyebrow. Default true. */
  live?: boolean
  exercises: SessionRailExercise[]
  /** Heading strip height in px, forwarded to each row. Default 8. */
  stripHeight?: number
  /** Rail width in px. Default 246. */
  width?: number
  /** Footer slot — the SessionPace tile mounts here (built separately). */
  footer?: ReactNode
  onExercisePress?: (exercise: SessionRailExercise, index: number) => void
  className?: string
}

/**
 * The live-workout session rail: a flat raised heading plane over a sunk, inset
 * list of {@link ExerciseCardHeading} exercise headings, with a footer slot for
 * the session-pace tile. Presentational — driven entirely by props.
 */
export function SessionRail({
  title,
  status,
  eyebrow = 'Live session',
  live = true,
  exercises,
  stripHeight = 8,
  width = DEFAULT_WIDTH,
  footer,
  onExercisePress,
  className,
  style,
  ...props
}: SessionRailProps) {
  return (
    <View
      className={className}
      style={[{ width, flexDirection: 'column', backgroundColor: INSET }, style]}
      testID="session-rail"
      {...props}
    >
      <SessionHeader title={title} status={status} eyebrow={eyebrow} live={live} />

      <View
        style={[{ flex: 1, backgroundColor: INSET }, neumorphicShadows.charcoal.pressed.subtle]}
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
      </View>

      {footer && <View testID="session-rail-footer">{footer}</View>}
    </View>
  )
}
