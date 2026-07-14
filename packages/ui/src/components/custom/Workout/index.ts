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
export {
  TempoDisplay,
  type TempoDisplayProps,
  type TempoLivePhase,
  type TempoLiveState,
  type TempoLiveReadout,
} from './TempoDisplay'
export { DeviationBar, type DeviationBarProps } from './DeviationBar'
export { IntensityBar, type IntensityBarProps } from './IntensityBar'
export { WorkoutPill, type WorkoutPillProps, type WorkoutPillStatus } from './WorkoutPill'
export {
  VelocityStrip,
  type VelocityStripProps,
  type VelocitySet,
  type VelocityZoneBandProp,
  getVelocityZoneColor,
  getVelocityZoneName,
  calculateVelocityLoss,
  calculateMeanVelocity,
} from './VelocityStrip'
export { MuscleGroupChip, type MuscleGroupChipProps, type VolumeStatus } from './MuscleGroupChip'
export { Sparkline, type SparklineProps } from './Sparkline'
export { SetRow, type SetRowProps, type SetRowState, type SetRowUnit } from './SetRow'
export { InputBar, type InputBarProps } from './InputBar'
export { RestTimer, type RestTimerProps } from './RestTimer'
export { MetricCell, type MetricCellProps, METRIC_FONT } from './metricText'
export { SetsRepsLoad, type SetsRepsLoadProps } from './SetsRepsLoad'
export { SegmentedBar, type SegmentedBarProps, type SegmentedBarSegment } from './SegmentedBar'
export { paceTone, paceToneColor, type PaceTone } from './paceTone'
export {
  SegmentedProgressBar,
  type SegmentedProgressBarProps,
  type SegmentedProgressBarSegment,
} from './SegmentedProgressBar'
export { MetricTiles, type MetricTilesProps, type MetricTileData } from './MetricTiles'
export { ScheduleTiles, type ScheduleTilesProps } from './ScheduleTiles'
export { SetBar, type SetBarProps } from './SetBar'
export {
  SetStrip,
  type SetStripProps,
  type SetStripSet,
  SET_STRIP_ZONES,
  SET_STRIP_VARIABLE_COLOR,
  velocityZoneColor,
} from './SetStrip'
export {
  ExerciseIndicator,
  resolveIndicator,
  INDICATOR_PRECEDENCE,
  type ExerciseIndicatorProps,
  type ExerciseIndicatorKind,
} from './ExerciseIndicator'
export { ExerciseHeading, type ExerciseHeadingProps } from './ExerciseHeading'
export { ExerciseCardHeading, type ExerciseCardHeadingProps } from './ExerciseCardHeading'
export { ExerciseCard, type ExerciseCardProps } from './ExerciseCard'
export { SetTableHeader, type SetTableHeaderProps } from './SetTableHeader'
export {
  SessionHeader,
  type SessionHeaderProps,
  type SessionHeaderPlanEntry,
} from './SessionHeader'
export { SessionRail, type SessionRailProps, type SessionRailExercise } from './SessionRail'
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
// ActiveWorkoutPage / ExerciseDetailPage / ProgramPlanningPage are page-level
// organisms demoted to the `@titan-design/react-ui/pages` subpath (titan 0.5.0).
// Their VALUE exports (components + derivation helpers) live there; only
// type-only re-exports stay on this barrel (erased at build, no runtime pull).
export type {
  ProgramPlanningPageProps,
  PlanMeso,
  PlanWeek,
  PlanWorkout,
  ProgramNavLevel,
  ProgramSelection,
  ProgramBreadcrumb,
} from './ProgramPlanningPage'
export type {
  ExerciseDetailPageProps,
  ExerciseDetailTab,
  ExerciseDetailHeader,
  ExerciseDetailEntry,
  ExerciseTrend,
  ExerciseVbtSet,
  ExerciseVbt,
  ExerciseDetailStats,
  VbtSummary,
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
export type {
  ActiveWorkoutPageProps,
  ActiveWorkoutExercise,
  ActiveWorkoutSuperset,
  ActiveWorkoutInput,
  ActiveWorkoutRest,
  ActiveExerciseStatus,
  WorkoutProgress,
  WorkoutGroup,
} from './ActiveWorkoutPage'
export { ZoneTrack } from './ZoneTrack'
export type {
  ZoneTrackProps,
  ZoneTrackZone,
  ZoneTrackTick,
  ZoneTrackMarker,
  ZoneTrackBand,
} from './ZoneTrack'
export { FatigueMeter } from './FatigueMeter'
export type { FatigueMeterProps } from './FatigueMeter'
export { VolumeLandmarkBar } from './VolumeLandmarkBar'
export type { VolumeLandmarkBarProps, VolumeZone } from './VolumeLandmarkBar'
export { StatusPill, statusPillColor } from './StatusPill'
export type { StatusPillProps, StatusPillStatus } from './StatusPill'
export { LiveAuraFrame, liveAuraColor } from './LiveAuraFrame'
export type { LiveAuraFrameProps, LiveAuraCategory } from './LiveAuraFrame'
