/**
 * The band scale a velocity chart draws when the effort resolver has already decided every colour
 * (VW-448). titan classifies nothing here: each bar arrives with its band, each marker with its
 * axis, its own colour band and a label the caller wrote.
 *
 * Structural on purpose. titan never imports workout-analytics; these shapes mirror its
 * `SetEffort` (`bandMeaning`, `reps[].band`, `markers: { goal, guards }`, `cue`) closely enough that
 * the caller's mapper is a field copy plus the label strings. No lifter-facing wording lives in
 * titan: every `label` is supplied by the caller.
 */

/** A bar's band. In `effort` 0 is productive work and 3 is failure; in `velocity_loss` 0 is fastest. */
export type VelocityBandIndex = 0 | 1 | 2 | 3

/**
 * What the colours mean, which also picks the palette. `effort` (tier b): absolute effort from a
 * trusted profile, the green-to-red scale. `velocity_loss` (tier a): slowing, in thirds of the set's
 * reference loss; it claims nothing about effort, so no marker in it carries an effort colour.
 */
export type VelocityBandMeaning = 'effort' | 'velocity_loss'

export type VelocityBandConfidence = 'high' | 'low'

/** Which cue condition a marker stands for. The resolver's `CueReason`. */
export type VelocityBandCondition = 'reps' | 'effort' | 'velocity_loss'

interface VelocityBandMarkerCommon {
  role: 'goal' | 'guard'
  /** Caller-supplied wording, drawn verbatim. */
  label: string
  /** The condition has become true in this set. */
  reached: boolean
  /** This marker's condition is the one that fired the set's single cue (`cue.reason`). */
  firedCue?: boolean
}

/**
 * A rep-range goal: a target zone over rep slots. Always neutral ink, because a rep count targets
 * no effort; the type has no colour to set.
 */
export interface VelocityBandRepMarker extends VelocityBandMarkerCommon {
  axis: 'rep'
  condition: 'reps'
  /** 1-based rep numbers, inclusive. */
  repsLow: number
  repsHigh: number
}

/**
 * A horizontal line at a velocity: an effort cap, an effort goal, or a loss line. `band` is the
 * effort the line targets; `null` draws neutral ink. A loss GUARD is always drawn neutral.
 */
export interface VelocityBandLineMarker extends VelocityBandMarkerCommon {
  axis: 'velocity'
  condition: 'effort' | 'velocity_loss'
  /** Null before a best rep exists for a loss line; the line is then not drawn. */
  velocityMps: number | null
  band: VelocityBandIndex | null
}

export type VelocityBandMarker = VelocityBandRepMarker | VelocityBandLineMarker

/** The set's one ending cue, as far as the chart needs it. */
export interface VelocityBandCue {
  /** 1-based rep the cue latched on; null while it has not fired. */
  atRep: number | null
  /** Reps performed after the cue rep. */
  repsPast: number
  /** Wording for the past-cue count. Defaults to `+n`. */
  pastLabel?: string
}

export interface VelocityBandScale {
  meaning: VelocityBandMeaning
  /** One band per performed rep, in rep order; null draws the bar neutral. */
  repBands: readonly (VelocityBandIndex | null)[]
  /** Per-rep confidence, parallel to `repBands`; `low` means the reading extrapolates past the fit. */
  repConfidence?: readonly (VelocityBandConfidence | null)[]
  /** Velocities (m/s) where bands 1, 2 and 3 start; null skips that edge. */
  edgesMps?: readonly [number | null, number | null, number | null]
  /** `guards` holds 0 to 2 lines in the resolver's tie order; extras are ignored. */
  markers: { goal: VelocityBandMarker | null; guards: readonly VelocityBandMarker[] }
  cue?: VelocityBandCue | null
  /** 1-based rep from which a mid-set setting change suspended the bands. Sticky to the set end. */
  settingChangedAtRep?: number | null
  /** Wording beside the suspension mark. */
  settingChangedLabel?: string
}
