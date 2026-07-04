// Subpath entry: @titan-design/react-ui/bodymap
//
// Isolates the runtime surface that depends on `react-native-body-highlighter`
// (imported at module top-level by BodyMap.tsx and muscleTaxonomy.ts) so the
// main barrel can stay body-highlighter-free and tree-shakeable. Everything
// re-exported here transitively pulls that native SVG dependency; consumers who
// render the muscle map import from this subpath instead of the root barrel.
export { BodyMap, type BodyMapProps, type BodyMapData } from './components/custom/Workout/BodyMap'
export {
  BodyMapDetailPanel,
  type BodyMapDetailPanelProps,
  type ContributingExercise,
  type UpcomingExercise,
} from './components/custom/Workout/BodyMapDetailPanel'
export {
  TrainingStatusPage,
  deriveTrainingSummary,
  toBodyMapData,
  type TrainingStatusPageProps,
  type TrainingStatusMuscle,
  type TrainingStatusSummary,
} from './components/custom/Workout/TrainingStatusPage'
export {
  MuscleGroup,
  SimpleMuscleGroup,
  SIMPLE_TO_DETAILED,
  DETAILED_TO_SIMPLE,
  MUSCLE_TO_SVG_SLUGS,
  MUSCLE_TO_CATEGORY,
  MUSCLE_DISPLAY_NAMES,
  SIMPLE_DISPLAY_NAMES,
  DEFAULT_VOLUME_LANDMARKS,
  VOLUME_STATUS_LABELS,
  getHeatmapColor,
  type MovementCategory,
  type VolumeLandmarks,
} from './components/custom/Workout/muscleTaxonomy'
