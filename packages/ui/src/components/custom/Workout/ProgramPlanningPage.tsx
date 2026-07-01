// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, useState } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { MesoProgressBar, type Meso, type MesoStatus } from './MesoProgressBar'
import { MesoCard, type MesoVolumeHeatmapEntry } from './MesoCard'
import { type WeekRowProps, type WeekRowWorkout } from './WeekRow'
import { WorkoutCard, type WorkoutStatus, type WorkoutMuscleGroup } from './WorkoutCard'
import { type WorkoutPillStatus } from './WorkoutPill'
import { type ExerciseCardProps } from './ExerciseCard'

const SURFACE_ELEVATED = WORKOUT_TOKENS.surface.elevated
const BORDER_DEFAULT = WORKOUT_TOKENS.border.default
const BRAND_PRIMARY = '#FF7900'
const TEXT_PRIMARY = '#F3F4F6'
const TEXT_TERTIARY = '#6B7280'
const PAGE_BG = '#0E0E0E'

/** A single workout within a planned week, plus its exercise breakdown. */
export interface PlanWorkout {
  /** Stable identifier used for drill-down selection. */
  id: string
  name: string
  date: string
  duration?: string
  status: WorkoutStatus
  muscleGroups: WorkoutMuscleGroup[]
  totalSets: number
  totalVolume?: number
  unit: 'lbs' | 'kg'
  /** Exercises revealed when the workout is opened. */
  exercises: ExerciseCardProps[]
}

/** A training week inside a mesocycle. */
export interface PlanWeek {
  /** 1-based week index within the mesocycle. */
  weekNumber: number
  /** Planned intensity for the week, 0-1. */
  intensityLevel: number
  /** Optional MRV/overexertion threshold, 0-1. */
  intensityThreshold?: number
  isDeload?: boolean
  isCurrent?: boolean
  workouts: PlanWorkout[]
}

/** A mesocycle: the top level of the drill-down. */
export interface PlanMeso {
  id: string
  name: string
  goal: string
  split: string
  weekRange: string
  weekCount: number
  currentWeek?: number
  status: MesoStatus
  volumeHeatmap?: MesoVolumeHeatmapEntry[]
  weeks: PlanWeek[]
}

/** Current depth of the meso -> week -> workout drill-down. */
export type ProgramNavLevel = 'meso' | 'week' | 'workout'

/** The navigation cursor within the active mesocycle. */
export interface ProgramSelection {
  weekNumber: number | null
  workoutId: string | null
}

/** One tappable step in the breadcrumb trail. */
export interface ProgramBreadcrumb {
  key: string
  label: string
  level: ProgramNavLevel
}

export interface ProgramPlanningPageProps extends ViewProps {
  /** Page heading. */
  title?: string
  /** Mesocycles that make up the program. */
  mesos: PlanMeso[]
  className?: string
}

/** Map a workout's lifecycle status onto a WorkoutPill status. */
const WORKOUT_PILL_STATUS: Record<WorkoutStatus, WorkoutPillStatus> = {
  completed: 'completed',
  today: 'current',
  upcoming: 'upcoming',
}

/** Derive the current drill-down level from the selection cursor (pure). */
export function deriveNavLevel(selection: ProgramSelection): ProgramNavLevel {
  if (selection.workoutId != null) return 'workout'
  if (selection.weekNumber != null) return 'week'
  return 'meso'
}

/** Project the mesocycles onto MesoProgressBar segment data (pure). */
export function toProgressBarMesos(mesos: PlanMeso[]): Meso[] {
  return mesos.map(({ id, name, weekCount, status, currentWeek }) => ({
    id,
    name,
    weekCount,
    status,
    currentWeek,
  }))
}

/** Look up a meso by id, or null. */
export function findMeso(mesos: PlanMeso[], id: string | null): PlanMeso | null {
  if (id == null) return null
  return mesos.find((meso) => meso.id === id) ?? null
}

/** Look up a week within a meso, or null. */
export function findWeek(meso: PlanMeso | null, weekNumber: number | null): PlanWeek | null {
  if (meso == null || weekNumber == null) return null
  return meso.weeks.find((week) => week.weekNumber === weekNumber) ?? null
}

/** Look up a workout within a week, or null. */
export function findWorkout(week: PlanWeek | null, workoutId: string | null): PlanWorkout | null {
  if (week == null || workoutId == null) return null
  return week.workouts.find((workout) => workout.id === workoutId) ?? null
}

/** Build the breadcrumb trail for the active drill path (pure). */
export function buildBreadcrumbs(
  meso: PlanMeso,
  weekNumber: number | null,
  workout: PlanWorkout | null
): ProgramBreadcrumb[] {
  const crumbs: ProgramBreadcrumb[] = [{ key: 'meso', label: meso.name, level: 'meso' }]
  if (weekNumber != null) {
    crumbs.push({ key: 'week', label: `Week ${weekNumber}`, level: 'week' })
  }
  if (workout != null) {
    crumbs.push({ key: 'workout', label: workout.name, level: 'workout' })
  }
  return crumbs
}

interface BreadcrumbsProps {
  crumbs: ProgramBreadcrumb[]
  onNavigate: (level: ProgramNavLevel) => void
}

function Breadcrumbs({ crumbs, onNavigate }: BreadcrumbsProps) {
  return (
    <View
      className="flex-row items-center flex-wrap"
      style={{ gap: 4 }}
      testID="program-planning-page-breadcrumbs"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <View key={crumb.key} className="flex-row items-center" style={{ gap: 4 }}>
            {index > 0 && <Text style={{ fontSize: 12, color: TEXT_TERTIARY }}>{'›'}</Text>}
            <Pressable
              onPress={() => onNavigate(crumb.level)}
              disabled={isLast}
              accessibilityRole="button"
              testID={`program-planning-page-crumb-${crumb.key}`}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: isLast ? '700' : '500',
                  color: isLast ? TEXT_PRIMARY : BRAND_PRIMARY,
                }}
              >
                {crumb.label}
              </Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

/** Project a plan week onto WeekRow props, wiring pill taps to week selection. */
function toWeekRow(
  week: PlanWeek,
  meso: PlanMeso,
  onSelectWeek: (weekNumber: number) => void
): WeekRowProps {
  const workouts: WeekRowWorkout[] = week.workouts.map((workout) => ({
    name: workout.name,
    status: WORKOUT_PILL_STATUS[workout.status],
    onPress: () => onSelectWeek(week.weekNumber),
  }))
  return {
    weekNumber: week.weekNumber,
    totalWeeks: meso.weekCount,
    workouts,
    intensityLevel: week.intensityLevel,
    intensityThreshold: week.intensityThreshold,
    isCurrent: week.isCurrent ?? week.weekNumber === meso.currentWeek,
    isDeload: week.isDeload,
  }
}

interface MesoLevelProps {
  mesos: PlanMeso[]
  activeMesoId: string | null
  onSelectMeso: (id: string) => void
  onSelectWeek: (weekNumber: number) => void
}

function MesoLevel({ mesos, activeMesoId, onSelectMeso, onSelectWeek }: MesoLevelProps) {
  return (
    <View style={{ gap: 12 }} testID="program-planning-page-meso-level">
      {mesos.map((meso) => {
        const expanded = meso.id === activeMesoId
        return (
          <MesoCard
            key={meso.id}
            name={meso.name}
            goal={meso.goal}
            split={meso.split}
            weekRange={meso.weekRange}
            currentWeek={meso.currentWeek}
            totalWeeks={meso.weekCount}
            weeks={expanded ? meso.weeks.map((week) => toWeekRow(week, meso, onSelectWeek)) : []}
            volumeHeatmap={meso.volumeHeatmap}
            expanded={expanded}
            onToggle={() => onSelectMeso(meso.id)}
            highlighted={expanded}
          />
        )
      })}
    </View>
  )
}

interface WeekLevelProps {
  week: PlanWeek
  onSelectWorkout: (id: string) => void
}

function WeekLevel({ week, onSelectWorkout }: WeekLevelProps) {
  return (
    <View style={{ gap: 10 }} testID="program-planning-page-week-level">
      {week.workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          name={workout.name}
          date={workout.date}
          duration={workout.duration}
          status={workout.status}
          muscleGroups={workout.muscleGroups}
          totalSets={workout.totalSets}
          totalVolume={workout.totalVolume}
          unit={workout.unit}
          exercises={workout.exercises}
          expanded={false}
          onToggle={() => onSelectWorkout(workout.id)}
        />
      ))}
    </View>
  )
}

interface WorkoutLevelProps {
  workout: PlanWorkout
  expandedExercise: number | null
  onToggleExercise: (index: number) => void
}

function WorkoutLevel({ workout, expandedExercise, onToggleExercise }: WorkoutLevelProps) {
  const exercises = workout.exercises.map((exercise, index) => ({
    ...exercise,
    state:
      exercise.state === 'upcoming'
        ? exercise.state
        : ((index === expandedExercise ? 'expanded' : 'collapsed') as ExerciseCardProps['state']),
    onToggle: () => onToggleExercise(index),
  }))
  return (
    <View testID="program-planning-page-workout-level">
      <WorkoutCard
        name={workout.name}
        date={workout.date}
        duration={workout.duration}
        status={workout.status}
        muscleGroups={workout.muscleGroups}
        totalSets={workout.totalSets}
        totalVolume={workout.totalVolume}
        unit={workout.unit}
        exercises={exercises}
        expanded
        onToggle={() => undefined}
      />
    </View>
  )
}

/**
 * ProgramPlanningPage — a meso -> week -> workout drill-down over an entire
 * training program. A `MesoProgressBar` pins the mesocycle timeline to the top;
 * the body swaps between three levels: expandable `MesoCard`s (with inline
 * `WeekRow`s), a week's `WorkoutCard` list, and a single opened `WorkoutCard`
 * with inline `ExerciseCard` expansion. A breadcrumb trail tracks and rewinds
 * the drill path. Selection is page-level state; children keep their own styles.
 *
 * @example
 * <ProgramPlanningPage mesos={mesos} />
 */
export function ProgramPlanningPage({
  title = 'Program Plan',
  mesos,
  className,
  ...props
}: ProgramPlanningPageProps) {
  const [activeMesoId, setActiveMesoId] = useState<string | null>(mesos[0]?.id ?? null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)

  const progressMesos = useMemo(() => toProgressBarMesos(mesos), [mesos])
  const activeMeso = findMeso(mesos, activeMesoId)
  const level = deriveNavLevel({ weekNumber: selectedWeek, workoutId: selectedWorkoutId })
  const activeWeek = findWeek(activeMeso, selectedWeek)
  const activeWorkout = findWorkout(activeWeek, selectedWorkoutId)

  const selectMeso = (id: string) => {
    setActiveMesoId(id)
    setSelectedWeek(null)
    setSelectedWorkoutId(null)
  }
  const selectWeek = (weekNumber: number) => {
    setSelectedWeek(weekNumber)
    setSelectedWorkoutId(null)
    setExpandedExercise(null)
  }
  const selectWorkout = (id: string) => {
    setSelectedWorkoutId(id)
    setExpandedExercise(null)
  }
  const toggleExercise = (index: number) =>
    setExpandedExercise((current) => (current === index ? null : index))

  const navigateTo = (target: ProgramNavLevel) => {
    if (target === 'meso') selectMeso(activeMesoId ?? mesos[0]?.id)
    else if (target === 'week' && selectedWeek != null) selectWeek(selectedWeek)
  }

  return (
    <View
      className={className}
      style={{ width: 390, backgroundColor: PAGE_BG }}
      accessibilityRole={'main' as ViewProps['accessibilityRole']}
      aria-label={title}
      testID="program-planning-page"
      {...props}
    >
      <View style={{ padding: 16, gap: 14 }} testID="program-planning-page-content">
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 20,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
            color: TEXT_PRIMARY,
          }}
          testID="program-planning-page-title"
        >
          {title}
        </Text>

        <View style={{ marginHorizontal: -16 }}>
          <MesoProgressBar
            mesos={progressMesos}
            activeMesoId={activeMesoId}
            onMesoPress={selectMeso}
          />
        </View>

        {activeMeso != null && (
          <Breadcrumbs
            crumbs={buildBreadcrumbs(activeMeso, selectedWeek, activeWorkout)}
            onNavigate={navigateTo}
          />
        )}

        <View
          style={{
            backgroundColor: SURFACE_ELEVATED,
            borderWidth: 1,
            borderColor: BORDER_DEFAULT,
            borderRadius: 12,
            padding: 12,
          }}
          testID="program-planning-page-body"
        >
          {level === 'meso' && (
            <MesoLevel
              mesos={mesos}
              activeMesoId={activeMesoId}
              onSelectMeso={selectMeso}
              onSelectWeek={selectWeek}
            />
          )}
          {level === 'week' && activeWeek != null && (
            <WeekLevel week={activeWeek} onSelectWorkout={selectWorkout} />
          )}
          {level === 'workout' && activeWorkout != null && (
            <WorkoutLevel
              workout={activeWorkout}
              expandedExercise={expandedExercise}
              onToggleExercise={toggleExercise}
            />
          )}
        </View>
      </View>
    </View>
  )
}
