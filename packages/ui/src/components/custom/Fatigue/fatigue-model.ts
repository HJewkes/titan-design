// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The live-fatigue data contract — a titan-local mirror of voltras-mcp's
 * `LiveFatigueModel` (`src/dashboard/spa/live-page/fatigue-model.ts`). The card
 * family consumes ONE typed `LiveFatigueModel` prop; the diverging/velocity hero
 * beside it takes its own per-rep velocity array (that data is NOT on this model —
 * it comes from the live-view velocity path).
 *
 * Units: every velocity is m/s and every distance is metres (converted from WA's
 * native mm/s & mm at the mapper boundary). Tone/state vocabularies mirror WA's
 * `DimensionTone` / `FatigueVerdictState` one-for-one so the real WA verdict drops
 * straight in.
 */

/** Per-dimension status light. Mirrors WA's `DimensionTone`. */
export type DimensionTone = 'ok' | 'warn' | 'alarm'

/** Aggregated verdict state (drives the hero word). Mirrors WA's `FatigueVerdictState`. */
export type FatigueVerdictState = 'good' | 'slowing' | 'grinding' | 'form-breakdown'

/** Movement phase of one per-sample point — colours the ghost-spark zero-axis. */
export type SamplePhase = 'concentric' | 'eccentric' | 'idle'

/** One per-sample point of a rep's velocity-time curve. */
export interface VelocitySample {
  /** Milliseconds since this rep's first sample. */
  tMs: number
  /** Instantaneous velocity MAGNITUDE, m/s (the ghost-spark signs it by `phase`). */
  velocityMps: number
  /** Movement phase at this sample — drives the phase-coloured zero-axis segment. */
  phase: SamplePhase
}

/** A contiguous same-phase run within a rep's sample stream — one zero-axis segment. */
export interface PhaseSegment {
  phase: SamplePhase
  /** Start offset, ms since the rep's first sample. */
  startMs: number
  /** End offset, ms since the rep's first sample. */
  endMs: number
}

/**
 * One rep's velocity-time curve for the ghost-spark (current rep solid, priors faded).
 *
 * The line tint is driven by TWO normalized per-rep signals (the "green-intensity
 * control-aware" rule; the mapping lives in {@link ghostLineColor}):
 * `grindSignature < 0.35` → stay green, intensity by `tempoDeviation` (brightest at
 * 0 → deepest green at 1, hue held); otherwise → warm hue amber (at 0.35) → red (at
 * 1.0) by `grindSignature`. A slow-but-smooth rep stays green (just deeper); only a
 * stalling/collapsing rep warms.
 */
export interface RepVelocityCurve {
  /** 1-based rep number. */
  repNumber: number
  /** Per-sample velocity-time points, in stream order. */
  samples: VelocitySample[]
  /** Contiguous phase runs, for the phase-coloured zero-axis. */
  phaseSegments: PhaseSegment[]
  /**
   * Normalized concentric-duration deviation from the prescribed tempo, 0..1 (0 =
   * on-tempo, 1 = well off). Drives GREEN INTENSITY when the rep is controlled.
   * `null` when there is no prescribed tempo to compare against.
   */
  tempoDeviation: number | null
  /**
   * Normalized velocity COLLAPSE within the concentric, 0..1 (0 = smooth, 1 = full
   * collapse). Warms the line hue amber→red past the control threshold. Always
   * computed per rep; a rep with too few concentric samples reads `0`.
   */
  grindSignature: number
}

/** One per-rep point of the ROM-progression mini-chart. */
export interface RepRomPoint {
  /** 1-based rep number. */
  repNumber: number
  /** Concentric range of motion, metres. */
  romM: number
}

/** The aggregated verdict + the three per-dimension lights (WA `getSetFatigueVerdict`). */
export interface FatigueVerdict {
  state: FatigueVerdictState
  tone: DimensionTone
  dimensions: {
    velocityLoss: DimensionTone
    rom: DimensionTone
    tempo: DimensionTone
  }
}

/**
 * The always-on live fatigue card model for the current set. A `null` `verdict`
 * means the set is warming up (cold start, < 2 reps) — the card renders neutral.
 */
export interface LiveFatigueModel {
  /** Estimated RPE (exact, unrounded — the card rounds to 0.5). `null` under 2 reps. */
  rpe: number | null
  /** Reps in reserve = 10 − RPE. `null` when `rpe` is `null`. Carried for the contract; the card is RPE-led and does not render a reps-in-reserve line. */
  repsInReserve: number | null
  /** The verdict + three dimension lights. `null` = warming up. */
  verdict: FatigueVerdict | null
  /** ROM progression: per-rep ROM points (metres), ordered by rep. */
  romProgression: RepRomPoint[]
  /**
   * Planned rep count from the prescription — the ROM chart draws the remainder as dashed
   * to-do placeholders (the "N of M done" read). Absent/`undefined` when no plan is attached:
   * there is genuinely no target then, and the gap must read as a gap — never defaulted.
   */
  plannedReps?: number
  /** Working-range standard the ROM chart draws its reference line at (metres). `null` until ≥ 3 reps. */
  romWorkingStandardM: number | null
  /** Short-threshold line (metres) = 0.75 × working standard. `null` until the standard exists. */
  romShortThresholdM: number | null
  /** Ghost-spark: per-rep velocity-time curves, oldest first (last = current rep). */
  velocityCurves: RepVelocityCurve[]
  /** Current-rep tempo tuple `[ecc, pauseBottom, con, pauseTop]` seconds. `null` when no rep carries timing. */
  tempoSeconds: [number, number, number, number] | null
  /** Target tempo tuple, same ordering, from the prescription. `null` when none prescribed. */
  targetTempoSeconds: [number, number, number, number] | null
}
