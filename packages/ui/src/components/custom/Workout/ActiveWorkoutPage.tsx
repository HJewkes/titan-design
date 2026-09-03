// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, useState } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { ExerciseCard, type ExerciseCardProps } from './ExerciseCard'
import { InputBar } from './InputBar'
import { RestTimer } from './RestTimer'
import { SupersetWrapper } from './SupersetWrapper'
import { type SetRowProps } from './SetRow'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']

/** Where an exercise sits in the during-workout flow. */
export type ActiveExerciseStatus = 'completed' | 'active' | 'upcoming'

/**
 * One exercise in the running workout. Projected onto an `ExerciseCard`, whose
 * visual state is driven by `status` and the page's zoom focus: completed and
 * active exercises collapse/expand, upcoming ones stay dimmed.
 */
export interface ActiveWorkoutExercise {
  /** Stable id for zoom-focus selection. */
  id: string
  /** Exercise name, e.g. "Barbell Bench Press". */
  name: string
  /** Position in the workout flow. */
  status: ActiveExerciseStatus
  /** Unit used for this exercise's loads. */
  unit: 'lbs' | 'kg'
  /** Total sets prescribed for this exercise. */
  totalPlannedSets: number
  /** Collapsed summary (sets × reps @ weight) for a completed exercise. */
  summary?: ExerciseCardProps['summary']
  /** Flags a personal-record exercise. */
  isPR?: boolean
  /** Prescribed tempo, revealed when expanded. */
  tempo?: ExerciseCardProps['tempo']
  /** Per-rep velocities for each logged set (drives collapsed strips + set count). */
  setVelocities?: number[][]
  /** Per-set breakdown revealed when expanded. */
  sets?: SetRowProps[]
  /** One-line prescription for an upcoming exercise. */
  prescription?: string
  /** Previous-best hint for an upcoming exercise. */
  previousBest?: string
  /** Groups consecutive exercises under a shared `SupersetWrapper`. */
  supersetId?: string
}

/** A superset grouping consecutive exercises that share its id. */
export interface ActiveWorkoutSuperset {
  /** Matches `ActiveWorkoutExercise.supersetId`. */
  id: string
  /** Corner badge label, e.g. "SS1". */
  label: string
  /** Accent color for the wrapper rail + label. */
  color?: string
}

/** Live-set inputs shown in the bottom `InputBar`. */
export interface ActiveWorkoutInput {
  /** Current reps field value. */
  reps: string
  /** Current weight field value. */
  weight: string
}

/** Rest-timer inputs shown in the bottom `RestTimer`. */
export interface ActiveWorkoutRest {
  /** Prescribed rest length, seconds. */
  totalSeconds: number
  /** Elapsed rest, milliseconds. */
  elapsedMs: number
  /** Next-set hint, e.g. "Set 3 · 8 × 195 lbs". */
  nextSetInfo?: string
}

/** Derived, page-level roll-up of workout progress. */
export interface WorkoutProgress {
  /** Number of exercises marked completed. */
  completedExercises: number
  /** Total exercises in the workout. */
  totalExercises: number
  /** Sets logged so far across all exercises. */
  completedSets: number
  /** Total sets prescribed across all exercises. */
  totalSets: number
  /** Fraction of prescribed sets logged, 0-1. */
  fraction: number
}

/** An ordered render group: a lone exercise or a superset of exercises. */
export type WorkoutGroup =
  | { type: 'single'; exercise: ActiveWorkoutExercise }
  | { type: 'superset'; superset: ActiveWorkoutSuperset; exercises: ActiveWorkoutExercise[] }

export interface ActiveWorkoutPageProps extends ViewProps {
  /** Workout name shown in the header. */
  title?: string
  /** Context line under the title, e.g. "Push Day A · Week 6". */
  subtitle?: string
  /** Exercises in flow order. */
  exercises: ActiveWorkoutExercise[]
  /** Superset groupings referenced by `exercise.supersetId`. */
  supersets?: ActiveWorkoutSuperset[]
  /** Seed reps/weight for the live `InputBar`. */
  input?: ActiveWorkoutInput
  /** Rest-timer state; when resting, the timer replaces the input bar. */
  rest?: ActiveWorkoutRest
  /** Start the page in the resting state (timer showing). */
  initialResting?: boolean
  className?: string
}

/** Count the sets logged for an exercise (pure). */
export function countCompletedSets(exercise: ActiveWorkoutExercise): number {
  if (exercise.setVelocities != null) return exercise.setVelocities.length
  if (exercise.status === 'completed') return exercise.totalPlannedSets
  return 0
}

/** Roll up the exercises into the header progress readout (pure, testable). */
export function deriveWorkoutProgress(exercises: ActiveWorkoutExercise[]): WorkoutProgress {
  let completedExercises = 0
  let completedSets = 0
  let totalSets = 0
  for (const exercise of exercises) {
    if (exercise.status === 'completed') completedExercises += 1
    completedSets += countCompletedSets(exercise)
    totalSets += exercise.totalPlannedSets
  }
  return {
    completedExercises,
    totalExercises: exercises.length,
    completedSets,
    totalSets,
    fraction: totalSets === 0 ? 0 : completedSets / totalSets,
  }
}

/** The active exercise anchors the bottom bar; find it, or null (pure). */
export function findActiveExercise(
  exercises: ActiveWorkoutExercise[]
): ActiveWorkoutExercise | null {
  return exercises.find((exercise) => exercise.status === 'active') ?? null
}

/** Whether an exercise renders as the dimmed, not-yet-reached representation (pure). */
export function isUpcomingExercise(status: ActiveExerciseStatus): boolean {
  return status === 'upcoming'
}

/** Project an exercise onto ExerciseCard props, wiring zoom focus (pure). */
export function toActiveCardProps(
  exercise: ActiveWorkoutExercise,
  focused: boolean,
  onToggle: () => void,
  supersetPosition: ExerciseCardProps['supersetPosition'] = null,
  supersetColor?: string
): ExerciseCardProps {
  const upcoming = isUpcomingExercise(exercise.status)
  return {
    name: exercise.name,
    upcoming,
    expanded: focused,
    onExpandedChange: onToggle,
    summary: exercise.summary,
    isPR: exercise.isPR,
    tempo: exercise.tempo,
    setVelocities: exercise.setVelocities,
    totalPlannedSets: exercise.totalPlannedSets,
    sets: focused ? exercise.sets : undefined,
    prescription: exercise.prescription,
    previousBest: exercise.previousBest,
    supersetPosition,
    supersetColor,
  }
}

/** Fold consecutive same-superset exercises into render groups (pure). */
export function groupExercises(
  exercises: ActiveWorkoutExercise[],
  supersets: ActiveWorkoutSuperset[]
): WorkoutGroup[] {
  const byId = new Map(supersets.map((superset) => [superset.id, superset]))
  const groups: WorkoutGroup[] = []
  for (const exercise of exercises) {
    const superset = exercise.supersetId != null ? byId.get(exercise.supersetId) : undefined
    const last = groups[groups.length - 1]
    if (superset != null && last?.type === 'superset' && last.superset.id === superset.id) {
      last.exercises.push(exercise)
    } else if (superset != null) {
      groups.push({ type: 'superset', superset, exercises: [exercise] })
    } else {
      groups.push({ type: 'single', exercise })
    }
  }
  return groups
}

/** Position of an exercise within its superset, for corner-radius stitching. */
function supersetPositionAt(index: number, length: number): ExerciseCardProps['supersetPosition'] {
  if (length === 1) return null
  if (index === 0) return 'first'
  if (index === length - 1) return 'last'
  return 'middle'
}

function WorkoutHeader({
  title,
  subtitle,
  progress,
}: {
  title: string
  subtitle?: string
  progress: WorkoutProgress
}) {
  return (
    <View style={{ gap: 10 }} testID="active-workout-page-header">
      <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
        <View style={{ flexShrink: 1 }}>
          <Text
            accessibilityRole="header"
            className="text-text-primary"
            style={{
              fontSize: 20,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
            }}
            testID="active-workout-page-title"
          >
            {title}
          </Text>
          {subtitle != null && (
            <Text
              className="text-text-secondary"
              style={{
                marginTop: 2,
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
              }}
              testID="active-workout-page-subtitle"
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }} testID="active-workout-page-progress-count">
          <Text
            style={{
              fontSize: 15,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
              color: BRAND_PRIMARY,
              fontVariant: ['tabular-nums'],
            }}
          >
            {`${progress.completedExercises}/${progress.totalExercises}`}
          </Text>
          <Text
            className="text-text-tertiary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            {`${progress.completedSets}/${progress.totalSets} sets`}
          </Text>
        </View>
      </View>
      <View
        className="bg-hairline"
        style={{ height: 4, borderRadius: 2 }}
        testID="active-workout-page-progress-track"
      >
        <View
          style={{
            height: '100%',
            width: `${Math.round(progress.fraction * 100)}%`,
            backgroundColor: BRAND_PRIMARY,
            borderRadius: 2,
          }}
          testID="active-workout-page-progress-fill"
        />
      </View>
    </View>
  )
}

interface ExerciseListProps {
  groups: WorkoutGroup[]
  focusedId: string | null
  onToggle: (id: string) => void
}

function ExerciseList({ groups, focusedId, onToggle }: ExerciseListProps) {
  return (
    <View style={{ gap: 10 }} testID="active-workout-page-exercises">
      {groups.map((group) => {
        if (group.type === 'single') {
          return (
            <View
              key={group.exercise.id}
              className="bg-surface-elevated border-hairline"
              style={{
                borderWidth: 1,
                borderRadius: 12,
              }}
            >
              <ExerciseCard
                {...toActiveCardProps(group.exercise, group.exercise.id === focusedId, () =>
                  onToggle(group.exercise.id)
                )}
              />
            </View>
          )
        }
        return (
          <SupersetWrapper
            key={group.superset.id}
            label={group.superset.label}
            color={group.superset.color}
          >
            {group.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                {...toActiveCardProps(
                  exercise,
                  exercise.id === focusedId,
                  () => onToggle(exercise.id),
                  supersetPositionAt(index, group.exercises.length),
                  group.superset.color
                )}
              />
            ))}
          </SupersetWrapper>
        )
      })}
    </View>
  )
}

/**
 * ActiveWorkoutPage — the during-workout screen, built as a zoom hierarchy over
 * `ExerciseCard`s. A header progress bar rolls up completed sets; the flow list
 * dims upcoming exercises, collapses finished ones to their velocity strips, and
 * expands exactly one focused exercise to its `SetRow` breakdown. Consecutive
 * superset exercises stitch together inside a `SupersetWrapper`. A pinned bottom
 * bar toggles between the live `InputBar` (log the next set) and the `RestTimer`.
 * Focus and rest are page-level state; children keep their own styles.
 *
 * @example
 * <ActiveWorkoutPage title="Push Day A" exercises={exercises} />
 */
export function ActiveWorkoutPage({
  title = 'Active Workout',
  subtitle,
  exercises,
  supersets = [],
  input,
  rest,
  initialResting = false,
  className,
  ...props
}: ActiveWorkoutPageProps) {
  const active = findActiveExercise(exercises)
  const [focusedId, setFocusedId] = useState<string | null>(active?.id ?? null)
  const [resting, setResting] = useState(initialResting)
  const [reps, setReps] = useState(input?.reps ?? '')
  const [weight, setWeight] = useState(input?.weight ?? '')

  const progress = useMemo(() => deriveWorkoutProgress(exercises), [exercises])
  const groups = useMemo(() => groupExercises(exercises, supersets), [exercises, supersets])

  const toggleFocus = (id: string) => setFocusedId((current) => (current === id ? null : id))

  const nextSetNumber = active != null ? countCompletedSets(active) + 1 : 1
  const canRecord = reps.trim() !== '' && weight.trim() !== ''
  const showRest = resting && rest != null
  const showInput = !showRest && active != null

  return (
    <View
      className={['bg-background-base', className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: 390 }}
      accessibilityRole={'main' as ViewProps['accessibilityRole']}
      aria-label={title}
      testID="active-workout-page"
      {...props}
    >
      <View style={{ padding: 16, gap: 14 }} testID="active-workout-page-content">
        <WorkoutHeader title={title} subtitle={subtitle} progress={progress} />
        <ExerciseList groups={groups} focusedId={focusedId} onToggle={toggleFocus} />
      </View>

      {(showRest || showInput) && (
        <View
          style={{ borderTopWidth: 1, borderTopColor: resolveColor('hairline-default') }}
          testID="active-workout-page-bottom-bar"
        >
          {showRest && rest != null ? (
            <RestTimer
              totalSeconds={rest.totalSeconds}
              elapsedMs={rest.elapsedMs}
              nextSetInfo={rest.nextSetInfo}
              onSkip={() => setResting(false)}
              onAddTime={() => undefined}
              visible
            />
          ) : (
            active != null && (
              <InputBar
                exerciseName={active.name}
                setNumber={nextSetNumber}
                totalSets={active.totalPlannedSets}
                reps={reps}
                weight={weight}
                unit={active.unit}
                onRepsChange={setReps}
                onWeightChange={setWeight}
                onRecord={() => {
                  if (rest != null) setResting(true)
                }}
                canRecord={canRecord}
                visible
              />
            )
          )}
        </View>
      )}
    </View>
  )
}
