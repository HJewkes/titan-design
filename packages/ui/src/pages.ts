// Subpath entry: @titan-design/react-ui/pages
//
// Page-level organisms — phone-shaped reference screens (ActiveWorkoutPage,
// ExerciseDetailPage, ProgramPlanningPage). Demoted out of the root barrel for
// titan 0.5.0: they are full app screens, orphaned by both consumers, and their
// successors are the form-factor-responsive level views (plan B2). Their VALUE
// exports (components + derivation helpers) live HERE; type-only re-exports
// stay on the root barrel so consumers can still type props without importing
// the screens. Mirrors the `/bodymap` isolation pattern.
//
// TrainingStatusPage is NOT here — it depends on react-native-body-highlighter
// and lives under `@titan-design/react-ui/bodymap`.
export {
  ActiveWorkoutPage,
  countCompletedSets,
  deriveWorkoutProgress,
  findActiveExercise,
  isUpcomingExercise,
  toActiveCardProps,
  groupExercises,
  type ActiveWorkoutPageProps,
  type ActiveWorkoutExercise,
  type ActiveWorkoutSuperset,
  type ActiveWorkoutInput,
  type ActiveWorkoutRest,
  type ActiveExerciseStatus,
  type WorkoutProgress,
  type WorkoutGroup,
} from './components/custom/Workout/ActiveWorkoutPage'
export {
  ExerciseDetailPage,
  deriveExerciseStats,
  toExerciseCardProps,
  summarizeVbt,
  EXERCISE_DETAIL_TABS,
  type ExerciseDetailPageProps,
  type ExerciseDetailTab,
  type ExerciseDetailHeader,
  type ExerciseDetailEntry,
  type ExerciseTrend,
  type ExerciseVbtSet,
  type ExerciseVbt,
  type ExerciseDetailStats,
  type VbtSummary,
} from './components/custom/Workout/ExerciseDetailPage'
export {
  ProgramPlanningPage,
  deriveNavLevel,
  toProgressBarMesos,
  findMeso,
  findWeek,
  findWorkout,
  buildBreadcrumbs,
  type ProgramPlanningPageProps,
  type PlanMeso,
  type PlanWeek,
  type PlanWorkout,
  type ProgramNavLevel,
  type ProgramSelection,
  type ProgramBreadcrumb,
} from './components/custom/Workout/ProgramPlanningPage'
