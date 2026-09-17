export {
  BaseBadge,
  type BaseBadgeProps,
  type BaseBadgeVariant,
  type BaseBadgeSize,
} from './BaseBadge'
export { WeightBadge, type WeightBadgeProps, type WeightBadgeSize } from './WeightBadge'
export { PrBadge, type PrBadgeProps, type PRType } from './PrBadge'
/**
 * @deprecated Use `Indicator` (roadmap decision 10) — removed after AW-127
 * consumer migration. Marked on the barrel, not the module: `StatusDot.tsx` is
 * being edited under E1 this hour.
 */
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
  DualVelocityStrip,
  type DualVelocityStripProps,
  type DualVelocityStream,
} from './VelocityStrip'
export { MuscleGroupChip, type MuscleGroupChipProps, type VolumeStatus } from './MuscleGroupChip'
export { MuscleStrip, type MuscleStripProps, type MuscleStripMuscleData } from './MuscleStrip'
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
  type ExpectedRepsRange,
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
export {
  ExerciseHeading,
  exerciseHeadingLabel,
  type ExerciseHeadingProps,
  type ExerciseHeadingLayout,
} from './ExerciseHeading'
export {
  ExerciseCardHeading,
  type ExerciseCardHeadingProps,
  type ExerciseRowDensity,
} from './ExerciseCardHeading'
export { exerciseLiveColor, exerciseRowStateColor, type ExerciseRowState } from './exerciseRowState'
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
export {
  GoalTrajectoryChart,
  type GoalTrajectoryChartProps,
  type GoalActualPoint,
  type GoalDirection,
  type GoalExpectedPoint,
  type GoalTrajectoryStatus,
  type GoalTrajectoryWeek,
} from './GoalTrajectoryChart'
export {
  deriveTrajectoryGeometry,
  flattenDeloadWeeks,
  resolveActualWeek,
  type GoalTrajectoryGeometry,
  type GoalTrajectoryGeometryInput,
} from './GoalTrajectoryChartGeometry'
export {
  GoalLiftCard,
  goalLiftStatusLabel,
  STATUS_COLLAPSE_WIDTH as GOAL_LIFT_CARD_STATUS_COLLAPSE_WIDTH,
  type GoalLiftCardProps,
  type GoalLiftCardDensity,
  type GoalLiftActual,
  type GoalLiftMilestone,
  type GoalLiftStatus,
} from './GoalLiftCard'
export {
  GoalMilestoneTile,
  milestoneToneToken,
  WALL_MIN_WIDTH as GOAL_MILESTONE_WALL_MIN_WIDTH,
  type GoalMilestoneTileProps,
  type GoalMilestoneTileScale,
  type GoalMilestoneTileLayout,
} from './GoalMilestoneTile'
export {
  GoalMilestoneWeekStrip,
  type GoalMilestoneWeekStripProps,
  type GoalWeekOutcomeStyle,
} from './GoalMilestoneWeekStrip'
export {
  deriveMilestoneState,
  estimatedOneRepMax,
  isLoadTarget,
  isMilestoneMet,
  milestoneGap,
  milestoneProgress,
  weekStripCells,
  UNMET_PROGRESS_CAP,
  type GoalLoadMetric,
  type GoalLoadTarget,
  type GoalMilestoneGap,
  type GoalMilestoneReading,
  type GoalMilestoneSet,
  type GoalMilestoneState,
  type GoalMilestoneTarget,
  type GoalMilestoneValue,
  type GoalValueMetric,
  type GoalValueTarget,
  type GoalWeekCell,
  type GoalWeekOutcome,
  type GoalWeekPhase,
} from './goalMilestone'
// GoalMuscleCard and MuscleGlyph depend on `react-native-body-highlighter` at
// runtime, so their VALUE exports live behind `@titan-design/react-ui/bodymap`.
// Type-only re-exports stay here (erased at build, so no runtime pull).
export type { GoalMuscleCardProps, GoalMuscleLift } from './GoalMuscleCard'
export type { MuscleGlyphProps } from './MuscleGlyph'
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
// The mirrored voltras-mcp read-model shapes pull nothing native, so they stay
// on this barrel even though the panel that consumes them does not.
export {
  AGREEMENT_LABELS,
  bandLabel,
  prRows,
  slopeLabel,
  strengthRowTitle,
  type E1RMBand,
  type E1RMMethod,
  type MusclePlanExerciseRow,
  type MusclePlanRemainingExercise,
  type MusclePlanSection,
  type MuscleStrengthAgreement,
  type MuscleStrengthBestE1rm,
  type MuscleStrengthExerciseRow,
  type MuscleStrengthSection,
  type MuscleStrengthSide,
  type StrengthExerciseRow,
} from './muscleReadModels'
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
// muscleTaxonomy.ts itself has no react-native-body-highlighter dependency —
// only BodyMap.tsx and MuscleGlyph.tsx (the figure renderers) do, which is why
// those stay behind the `@titan-design/react-ui/bodymap` subpath below.
// MuscleGroup already ships as a runtime value in this bundle (MuscleStrip
// above imports it as a value), so re-exporting it as `export type` declared a
// value in dist/index.d.ts that dist/index.mjs never actually exported
// (VW-388) — export the value here to match. SimpleMuscleGroup has no
// root-side value user and would need to be evaluated for a symbol nobody
// here needs, so it stays type-only; import its value from `/bodymap`.
export { MuscleGroup } from './muscleTaxonomy'
export type { SimpleMuscleGroup, MovementCategory, VolumeLandmarks } from './muscleTaxonomy'
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
