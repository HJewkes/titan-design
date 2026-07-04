export {
  BaseBadge,
  type BaseBadgeProps,
  type BaseBadgeVariant,
  type BaseBadgeSize,
} from './BaseBadge'
export { WeightBadge, type WeightBadgeProps, type WeightBadgeSize } from './WeightBadge'
export { PrBadge, type PrBadgeProps, type PRType } from './PrBadge'
export { StatusDot, type StatusDotVariant, type StatusDotProps } from './StatusDot'
export { PlaceholderStrip, type PlaceholderStripProps } from './PlaceholderStrip'
export { TempoDisplay, type TempoDisplayProps } from './TempoDisplay'
export { DeviationBar, type DeviationBarProps } from './DeviationBar'
export { IntensityBar, type IntensityBarProps } from './IntensityBar'
export { WorkoutPill, type WorkoutPillProps, type WorkoutPillStatus } from './WorkoutPill'
export {
  VelocityStrip,
  type VelocityStripProps,
  getVelocityZoneColor,
  getVelocityZoneName,
  calculateVelocityLoss,
  calculateMeanVelocity,
} from './VelocityStrip'
export { MuscleGroupChip, type MuscleGroupChipProps, type VolumeStatus } from './MuscleGroupChip'
export { Sparkline, type SparklineProps } from './Sparkline'
export { SetRow, type SetRowProps, type SetRowMode } from './SetRow'
export { InputBar, type InputBarProps } from './InputBar'
export { RestTimer, type RestTimerProps } from './RestTimer'
export { ExerciseCard, type ExerciseCardProps, type ExerciseCardState } from './ExerciseCard'
export { SupersetWrapper, type SupersetWrapperProps } from './SupersetWrapper'
export {
  MesoProgressBar,
  type MesoProgressBarProps,
  type Meso,
  type MesoStatus,
} from './MesoProgressBar'
export { WeekRow, type WeekRowProps, type WeekRowWorkout } from './WeekRow'
export {
  WorkoutCard,
  type WorkoutCardProps,
  type WorkoutStatus,
  type WorkoutMuscleGroup,
  type WorkoutMuscleVolumeStatus,
} from './WorkoutCard'
export { MesoCard, type MesoCardProps, type MesoVolumeHeatmapEntry } from './MesoCard'
export {
  PrHistoryModal,
  type PrHistoryModalProps,
  type PrRecord,
  type PrRecordType,
} from './PrHistoryModal'
export {
  ReadinessCheck,
  type ReadinessCheckProps,
  type ReadinessFactor,
  type WarmUpValidation,
  type WarmUpStatus,
} from './ReadinessCheck'
export {
  MesoStatusCard,
  type MesoStatusCardProps,
  type MesoStatusBadge,
  type MesoStatusBadgeVariant,
  type MesoStatusMetric,
  type MesoStatusGauge,
  type MesoStatusCoaching,
  type MesoStatusNextTarget,
} from './MesoStatusCard'
export {
  StrengthTrendChart,
  type StrengthTrendChartProps,
  type StrengthTrendDataPoint,
  type StrengthTrendChartMesoBoundary,
} from './StrengthTrendChart'
export {
  CapacityBandChart,
  type CapacityBandChartProps,
  type CapacityBandDataPoint,
  type CapacityBandProjection,
  type WorkoutDot,
  type WorkoutDotStatus,
} from './CapacityBandChart'
// BodyMap / BodyMapDetailPanel / TrainingStatusPage depend on
// `react-native-body-highlighter` at runtime. Their VALUE exports live behind the
// `@titan-design/react-ui/bodymap` subpath to keep this barrel body-highlighter-free.
// Type-only re-exports stay here (erased at build, so no runtime pull).
export type { BodyMapProps, BodyMapData } from './BodyMap'
export type {
  BodyMapDetailPanelProps,
  ContributingExercise,
  UpcomingExercise,
} from './BodyMapDetailPanel'
export type {
  TrainingStatusPageProps,
  TrainingStatusMuscle,
  TrainingStatusSummary,
} from './TrainingStatusPage'
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
} from './ProgramPlanningPage'
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
} from './ExerciseDetailPage'
// muscleTaxonomy imports `react-native-body-highlighter` at runtime. Its value
// exports (incl. the MuscleGroup / SimpleMuscleGroup enums) live behind the
// `@titan-design/react-ui/bodymap` subpath. Only type-only re-exports stay here.
export type {
  MuscleGroup,
  SimpleMuscleGroup,
  MovementCategory,
  VolumeLandmarks,
} from './muscleTaxonomy'
export {
  ActiveWorkoutPage,
  countCompletedSets,
  deriveWorkoutProgress,
  findActiveExercise,
  statusToCardState,
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
} from './ActiveWorkoutPage'
