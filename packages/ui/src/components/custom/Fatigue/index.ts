// Live-fatigue component family — the aligned "Live panel v2" hardened into titan
// components. See ./README.md for the composition tree + reuse audit.
export { LiveFatiguePanel } from './LiveFatiguePanel'
export type { LiveFatiguePanelProps, LiveFatiguePanelVelocity } from './LiveFatiguePanel'
// The panel's responsive geometry, exported so a consumer that prefigures the panel (the
// wall SPA's idle stage) reads the same numbers instead of copying them.
export {
  panelLayout,
  panelBodySplit,
  panelTier,
  PANEL_BREAKPOINTS,
  CARD_WIDTH_BASE,
  CARD_WIDTH_MAX,
  CARD_WIDTH_XL_RATIO,
  CARD_HEIGHT_SHARE_STACKED,
  HERO_EYEBROW_ALLOWANCE,
  type PanelLayout,
  type PanelBodySplit,
  type PanelTier,
} from './panel-layout'
export { LiveFatigueCard, type LiveFatigueCardProps } from './LiveFatigueCard'
export { VerdictHero, type VerdictHeroProps } from './VerdictHero'
export { FatigueLights, type FatigueLightsProps } from './FatigueLights'
export { RomProgressionChart, type RomProgressionChartProps } from './RomProgressionChart'
export { GhostSpark, type GhostSparkProps } from './GhostSpark'
export { DualGhostSpark, type DualGhostSparkProps, mergePhaseSegments } from './DualGhostSpark'
export { GhostBand, type GhostBandProps, BAND_H, BAND_GAP } from './GhostBand'
export { GhostBloom, type GhostBloomProps, type Pt, smoothPath } from './GhostBloom'
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
