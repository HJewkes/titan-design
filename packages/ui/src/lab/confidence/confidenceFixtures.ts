/**
 * Round 0 fixtures for ConfidenceBadge (VW-786, VW-161 S1).
 *
 * The shapes MIRROR voltras-mcp's wire types, field for field, so a story or test can
 * spread a fixture exactly as a consumer spreads a `vbt.rir` result:
 *   - {@link ConfidenceIndicator}: voltras-mcp `src/store/confidence-indicator.ts`.
 *   - {@link FeatureGateVerdict}: voltras-mcp `src/store/baseline-gate.ts`.
 *   - {@link RirConfidence}: the `confidence` block of `SetRIRResult` in
 *     voltras-mcp `src/tools/metrics-tools.ts`.
 *
 * `userMessage` and `improvementPath` strings are copied verbatim from those modules
 * (user-facing copy in a public repo). `reasoning` is internal-facing and never rendered;
 * it is copied where it is a constant and rebuilt from the module's template where it is
 * computed. Counts and timestamps are synthetic.
 */

// --- Wire shapes (mirror voltras-mcp; do not reshape) -------------------------

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ConfidenceIndicator {
  axis: string
  level: ConfidenceLevel
  reasoning: string
  userMessage: string
  improvementPath: string
}

export type BaselineState = 'COLD' | 'SHAPE_ONLY' | 'PROVISIONAL' | 'CALIBRATED' | 'STALE'
export type GateActivation = 'full' | 'degraded' | 'withheld'

export interface FeatureGateVerdict {
  feature: 'relative-signal' | 'readiness-score' | 'rir-estimate'
  evaluable: boolean
  activation: GateActivation
  observedState: BaselineState | null
  confidence: number | null
  anchorCount: number | null
  lastAnchorAt?: string
  requiredState: BaselineState
  reasoning: string
  userMessage: string
  staleSince?: string
}

export interface RirConfidence {
  modelCalibration: ConfidenceIndicator
  inputDomain: ConfidenceIndicator
  baselineMaturity: FeatureGateVerdict
}

// --- Model calibration: every level the server emits --------------------------

/** No fitted curve: the placeholder profile. Low for every lifter, every set. */
export const modelCalibrationLow: ConfidenceIndicator = {
  axis: 'model-calibration',
  level: 'low',
  reasoning:
    'estimateRIRWithProfile uses DEFAULT_CABLE_COMPOUND_PROFILE / ' +
    'DEFAULT_CABLE_ISOLATION_PROFILE, whose regression coefficients are documented ' +
    'placeholders pending calibration against real-device session data',
  userMessage:
    "This RIR estimate comes from a model that hasn't been calibrated against real " +
    'Voltra data yet, so treat it as a rough directional read rather than a precise ' +
    'rep count.',
  improvementPath:
    'Improves when calibrated coefficients are fitted from real-device session data ' +
    'and shipped — not by logging more sessions yourself.',
}

/** A fitted curve whose own error is wider than the trusted bound (1.5 reps). */
export const modelCalibrationMedium: ConfidenceIndicator = {
  axis: 'model-calibration',
  level: 'medium',
  reasoning:
    "reading comes from the lifter's own fitted RIR-velocity curve (VW-298), but the curve's " +
    'residual error is over 1.5 reps in reserve, wider than the ' +
    'bound this server trusts a curve to state effort within',
  userMessage:
    'This RIR estimate comes from a curve fitted to your own sets, but that curve still ' +
    'scatters by more than 1.5 reps, so read it as a range rather than a count.',
  improvementPath:
    'Re-run `rir_velocity.fit` as you log more qualifying sets; the curve is trusted once ' +
    'its error (`rirErrorReps`) is 1.5 reps or under.',
}

/** A fitted curve inside the trusted bound. */
export const modelCalibrationHigh: ConfidenceIndicator = {
  axis: 'model-calibration',
  level: 'high',
  reasoning:
    "reading comes from the lifter's own fitted RIR-velocity curve (VW-298), which cleared its " +
    'own minimums on qualifying sets, sessions and RIR spread — not the placeholder profile ' +
    'estimateRIRWithProfile falls back to when no such curve exists',
  userMessage:
    'This RIR estimate comes from a curve fitted to your own recorded sets for this exercise, ' +
    'not a general model.',
  improvementPath:
    'Re-run `rir_velocity.fit` as you log more qualifying sets — the curve’s own residual ' +
    'error (`rirErrorReps`) narrows with more and more varied data.',
}

// --- Input domain: per rep, every level ---------------------------------------

const inputDomainImprovementPath =
  'Rises on its own for reps taken closer to failure with a clean, fast first rep ' +
  'to anchor against — it reflects THIS set, so it changes set to set.'

export const inputDomainHigh: ConfidenceIndicator = {
  axis: 'input-domain',
  level: 'high',
  reasoning:
    "workout-analytics graded the inputs 'high': this rep’s velocity ratio and velocity " +
    'loss both sit inside the range the model was fitted over',
  userMessage: 'This rep sits squarely in the range the estimate works best over.',
  improvementPath: inputDomainImprovementPath,
}

export const inputDomainMedium: ConfidenceIndicator = {
  axis: 'input-domain',
  level: 'medium',
  reasoning:
    "workout-analytics graded the inputs 'medium': this rep’s velocity ratio or velocity " +
    'loss sits near the edge of the range the model was fitted over',
  userMessage: 'This rep is near the edge of the range the estimate works best over.',
  improvementPath: inputDomainImprovementPath,
}

export const inputDomainLow: ConfidenceIndicator = {
  axis: 'input-domain',
  level: 'low',
  reasoning:
    "workout-analytics graded the inputs 'low': this rep’s velocity ratio or velocity loss " +
    'falls outside the range the model was fitted over, so the estimate is an extrapolation',
  userMessage:
    'This rep is outside the range the estimate works best over, so the number is a stretch.',
  improvementPath: inputDomainImprovementPath,
}

// --- Baseline maturity: B57 verdicts for the `rir-estimate` feature -----------

// rir-estimate needs CALIBRATED for full and PROVISIONAL for degraded, so SHAPE_ONLY and
// STALE (both rank 1) are withheld for RIR even though they are degraded for readiness.
const rirRequires = 'rir-estimate requires CALIBRATED (rank 3)'

export const baselineCalibrated: FeatureGateVerdict = {
  feature: 'rir-estimate',
  evaluable: true,
  activation: 'full',
  observedState: 'CALIBRATED',
  confidence: 0.9,
  anchorCount: 4,
  lastAnchorAt: '2026-01-15T18:20:00.000Z',
  requiredState: 'CALIBRATED',
  reasoning: `${rirRequires}; observed state is CALIBRATED (rank 3); full because the observed state meets the requirement; 4 failure anchor(s) back this row`,
  userMessage: 'baseline calibrated',
}

export const baselineProvisional: FeatureGateVerdict = {
  feature: 'rir-estimate',
  evaluable: true,
  activation: 'degraded',
  observedState: 'PROVISIONAL',
  confidence: 0.6,
  anchorCount: 2,
  lastAnchorAt: '2026-01-12T17:45:00.000Z',
  requiredState: 'CALIBRATED',
  reasoning: `${rirRequires}; observed state is PROVISIONAL (rank 2); degraded because PROVISIONAL meets the degraded threshold for this feature but not the full one; 2 failure anchor(s) back this row`,
  userMessage: 'early baseline — treat this as a rough read',
}

export const baselineShapeOnly: FeatureGateVerdict = {
  feature: 'rir-estimate',
  evaluable: true,
  activation: 'withheld',
  observedState: 'SHAPE_ONLY',
  confidence: 0.4,
  anchorCount: 0,
  requiredState: 'CALIBRATED',
  reasoning: `${rirRequires}; observed state is SHAPE_ONLY (rank 1); withheld because SHAPE_ONLY is below even the degraded threshold (PROVISIONAL) for this feature; 0 failure anchor(s) back this row`,
  userMessage: 'learning this exercise — movement shape known, no failure reference yet',
}

export const baselineStale: FeatureGateVerdict = {
  feature: 'rir-estimate',
  evaluable: true,
  activation: 'withheld',
  observedState: 'STALE',
  confidence: 0.5,
  anchorCount: 3,
  lastAnchorAt: '2025-11-02T09:10:00.000Z',
  requiredState: 'CALIBRATED',
  reasoning: `${rirRequires}; observed state is STALE (rank 1); withheld because STALE is below even the degraded threshold (PROVISIONAL) for this feature; 3 failure anchor(s) back this row`,
  userMessage: 'baseline is out of date — no qualifying set in the last 28 days',
  staleSince: '2025-12-01T00:00:00.000Z',
}

export const baselineCold: FeatureGateVerdict = {
  feature: 'rir-estimate',
  evaluable: true,
  activation: 'withheld',
  observedState: 'COLD',
  confidence: 0.1,
  anchorCount: 0,
  requiredState: 'CALIBRATED',
  reasoning: `${rirRequires}; observed state is COLD (rank 0); withheld because COLD is below even the degraded threshold (PROVISIONAL) for this feature; 0 failure anchor(s) back this row`,
  userMessage: 'still learning this exercise — not enough consistent sets yet',
}

/** "We never looked": no baseline row exists. Must never read the same as COLD. */
export const baselineNotEvaluable: FeatureGateVerdict = {
  feature: 'rir-estimate',
  evaluable: false,
  activation: 'withheld',
  observedState: null,
  confidence: null,
  anchorCount: null,
  requiredState: 'CALIBRATED',
  reasoning:
    'rir-estimate requires CALIBRATED; no baseline row has ever been computed for this key, so there is no state to grade',
  userMessage: 'still learning this exercise — no baseline yet',
}

// --- Three-axis results, as `vbt.rir` sends them ------------------------------

/** The canonical row: the three axes disagree on purpose (low, high, medium). */
export const rirConfidenceDisagreeing: RirConfidence = {
  modelCalibration: modelCalibrationLow,
  inputDomain: inputDomainHigh,
  baselineMaturity: baselineProvisional,
}

export const rirConfidenceAllHigh: RirConfidence = {
  modelCalibration: modelCalibrationHigh,
  inputDomain: inputDomainHigh,
  baselineMaturity: baselineCalibrated,
}

/** A set with no exercise attached: the baseline axis was never evaluated. */
export const rirConfidenceNotAssessed: RirConfidence = {
  modelCalibration: modelCalibrationLow,
  inputDomain: inputDomainLow,
  baselineMaturity: baselineNotEvaluable,
}

// --- Degenerate cases ---------------------------------------------------------

const longUserMessage =
  'This RIR estimate comes from a model that has not been calibrated against real data ' +
  'yet. The rep you just finished also sits outside the range the model was fitted over, ' +
  'so the number is an extrapolation on top of a placeholder. Treat it as a direction, ' +
  'not a count, until both improve. Keep logging.'

/** Exactly 300 characters of tip body, to test wrapping inside the tip. */
export const longMessageIndicator: ConfidenceIndicator = {
  ...modelCalibrationLow,
  userMessage: longUserMessage,
}

/** The wire always sends a path; an empty one must render no improvement section. */
export const emptyImprovementPathIndicator: ConfidenceIndicator = {
  ...inputDomainMedium,
  improvementPath: '',
}

/** An axis the badge has no label for: the label falls back to the humanised string. */
export const unknownAxisIndicator: ConfidenceIndicator = {
  axis: 'foo-bar',
  level: 'medium',
  reasoning: 'synthetic axis for the label fallback',
  userMessage: 'A reading on an axis this badge has no wording for.',
  improvementPath: 'Pass `axisLabel` to name it.',
}

/** The narrowest frame the three-axis row must wrap in without truncating a badge. */
export const narrowRowWidthPx = 320

// --- Owner-question defaults (Round 0, confirmed at Gate 1) -------------------

/** Q3 default: the lifter-facing axis names in the RIR row. */
export const rirAxisLabels = {
  modelCalibration: 'Model',
  inputDomain: 'This rep',
  baselineMaturity: 'Your baseline',
} as const

/** Q5 default: the overline above `improvementPath` in the tip. */
export const improvementHeading = 'How this improves'

/** The level words shown after the axis label ("Model · Low"). */
export const levelLabels: Record<ConfidenceLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** The level word for a baseline verdict with `evaluable: false`. */
export const notAssessedLabel = 'Not assessed'
