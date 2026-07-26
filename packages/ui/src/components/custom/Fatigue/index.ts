// Live-fatigue component family — the aligned "Live panel v2" hardened into titan
// components. See ./README.md for the composition tree + reuse audit.
export { LiveFatiguePanel } from './LiveFatiguePanel'
export type {
  LiveFatiguePanelProps,
  LiveFatiguePanelHeader,
  LiveFatiguePanelVelocity,
} from './LiveFatiguePanel'
export { LiveFatigueCard, type LiveFatigueCardProps } from './LiveFatigueCard'
export { VerdictHero, type VerdictHeroProps } from './VerdictHero'
export { FatigueLights, type FatigueLightsProps } from './FatigueLights'
export { RomProgressionChart, type RomProgressionChartProps } from './RomProgressionChart'
export { GhostSpark, type GhostSparkProps } from './GhostSpark'
export { GhostBand, type GhostBandProps, BAND_H, BAND_GAP } from './GhostBand'
export {
  GhostBloom,
  type GhostBloomProps,
  type Pt,
  type BloomTreatment,
  smoothPath,
} from './GhostBloom'
export { VelocityHero, type VelocityHeroProps } from './VelocityHero'
export {
  ghostLineColor,
  auraForVerdict,
  TONE_COLOR,
  STATE_LABEL,
  GRIND_THRESHOLD,
  SILVER,
  DRIFT_GREY,
  RED_LIGHT,
  RED_MID,
  RED_DEEP,
  PHASE_AXIS_COLOR,
} from './fatigue-tokens'
export type {
  LiveFatigueModel,
  FatigueVerdict,
  FatigueVerdictState,
  DimensionTone,
  SamplePhase,
  VelocitySample,
  PhaseSegment,
  RepVelocityCurve,
  RepRomPoint,
} from './fatigue-model'
