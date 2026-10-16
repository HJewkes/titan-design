import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'

/**
 * Structural velocity-zone band accepted from an upstream analytics source
 * (e.g. workout-analytics' `VelocityZones.bands`).
 *
 * Deliberately a plain structural shape — titan never imports the analytics
 * package (the same presentational-only policy the Workout family follows). Any object with
 * this shape can be passed, so `zones={waVelocityZones.bands}` works directly.
 * Bands are ordered slow → fast, contiguous, and cover `[0, ∞)` with the top
 * band's `max === null`. Bands carry NO color — color is a UI concern resolved
 * here via {@link zoneIdToScaleToken}.
 */
export interface VelocityZoneBandProp {
  /** Stable zone identity (e.g. WA's `VelocityZoneId`). Drives color mapping. */
  id: string
  /** Human-readable label shown in the summary row. */
  label: string
  /** Inclusive lower bound (m/s mean concentric velocity). */
  min: number
  /** Exclusive upper bound (m/s); `null` marks the open top band. */
  max: number | null
}

// The 4-color performance scale as the dataviz-sequential tokens PinnedLiveStrip uses; dark mode equals WORKOUT_TOKENS.scale.
const VEL_SCALE_TOKEN = {
  green: 'dataviz-sequential-0',
  yellow: 'dataviz-sequential-2',
  orange: 'dataviz-sequential-3',
  red: 'dataviz-sequential-4',
} as const

type ColorToken = keyof ReturnType<typeof getSemanticColors>

type VelScaleToken = (typeof VEL_SCALE_TOKEN)[keyof typeof VEL_SCALE_TOKEN]

function velScaleColor(token: VelScaleToken, mode: ThemeMode): string {
  return getSemanticColors(mode)[token]
}

/**
 * Map a velocity-zone id (WA's 5-band taxonomy) onto the dataviz-sequential tokens
 * PinnedLiveStrip uses, so the zone hero follows the theme like the pinned strip. The
 * 4-color {@link VEL_SCALE_TOKEN} scale is a subsample of the same ramp, but the 5-band
 * taxonomy has one more level than that scale carries: the top four align with the default
 * scale (speed/power/strengthSpeed/maximalStrength = green/gold/orange/red) and `grinding`
 * takes the ramp's darker red, so `maximalStrength` and `grinding` stay DISTINCT. An
 * exercise moving from default to profile-derived zones never shifts its fast-end colors.
 *
 * Unknown ids fall back to `green` (matching the historical default-path
 * fallback), so a forward-compatible band id never renders an empty bar.
 */
const bandIdToToken: Record<string, ColorToken> = {
  speed: VEL_SCALE_TOKEN.green,
  power: VEL_SCALE_TOKEN.yellow,
  strengthSpeed: VEL_SCALE_TOKEN.orange,
  maximalStrength: VEL_SCALE_TOKEN.red,
  grinding: 'dataviz-sequential-5',
}

// --- Default (no-zones) scale ------------------------------------------------
// Retained as named exports for back-compat; they define the default path.

export function getVelocityZoneColor(velocity: number): string {
  if (velocity >= 1.0) return 'vel-green'
  if (velocity >= 0.75) return 'vel-yellow'
  if (velocity >= 0.5) return 'vel-orange'
  return 'vel-red'
}

export function getVelocityZoneName(velocity: number): string {
  if (velocity >= 1.0) return 'Speed'
  if (velocity >= 0.75) return 'Power'
  if (velocity >= 0.5) return 'Strength-Speed'
  return 'Strength'
}

const zoneTokenMap: Record<string, VelScaleToken> = {
  'vel-green': VEL_SCALE_TOKEN.green,
  'vel-yellow': VEL_SCALE_TOKEN.yellow,
  'vel-orange': VEL_SCALE_TOKEN.orange,
  'vel-red': VEL_SCALE_TOKEN.red,
}

/**
 * Velocity loss for a set, as a whole percentage. Uses the running-best rep as
 * the reference (matching WA-02.05 / brain WA-D01): `(vBest − vLast) / vBest`,
 * clamped to ≥ 0 so a set that ends on its best rep reports 0 loss.
 *
 * **Rounded to the nearest percent.** Do not band this value or show it beside a
 * loss colour: a 19.96 percent loss rounds to 20 and would read "20%" beside a bar
 * that {@link getVelocityLossColor} colours below a 20 threshold. Band the exact
 * loss from {@link velocityLossForRep} and show it through {@link shownVelocityLoss}.
 *
 * @see shownVelocityLoss
 */
export function calculateVelocityLoss(velocities: number[]): number {
  if (velocities.length < 2) return 0
  const best = Math.max(...velocities)
  if (best <= 0) return 0
  return Math.round(velocityLossForRep(velocities[velocities.length - 1], best))
}

/** Arithmetic mean of the per-rep mean-concentric velocities. */
export function calculateMeanVelocity(velocities: number[]): number {
  if (velocities.length === 0) return 0
  const sum = velocities.reduce((acc, v) => acc + v, 0)
  return sum / velocities.length
}

/**
 * Velocity-loss band thresholds (loss %), the same VL10/VL20/VL30 coaching cues
 * FatigueMeter's default thresholds use — kept in sync so a `barColor="loss"`
 * strip and a fatigue hero's VL20/VL30 reference bands agree on where amber/red start.
 */
export const VL_LOSS_THRESHOLDS: VelocityLossThresholds = [10, 20, 30]

/** Loss (%) where a bar turns yellow, orange and red, ascending; equal steps skip a colour. */
export type VelocityLossThresholds = readonly [number, number, number]

/** A loss's band: 0 green, 1 yellow, 2 orange, 3 red. */
export type VelocityLossBand = 0 | 1 | 2 | 3

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

const warnedThresholds = new Set<string>()

function warnMalformedThresholds(input: unknown) {
  const key = JSON.stringify(input) ?? String(input)
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return
  if (warnedThresholds.has(key)) return
  warnedThresholds.add(key)
  console.warn(`titan: lossThresholds ${key} is not three finite numbers; using 10/20/30.`)
}

/**
 * The thresholds as the band classifier needs them: three finite numbers, each clamped to 0..100,
 * ascending. Anything else (they arrive from a server) falls back to 10/20/30, with a dev warning.
 */
export function normalizeLossThresholds(input?: unknown): VelocityLossThresholds {
  if (input == null) return VL_LOSS_THRESHOLDS
  const valid =
    Array.isArray(input) &&
    input.length === 3 &&
    input.every((t) => typeof t === 'number' && Number.isFinite(t))
  if (!valid) {
    warnMalformedThresholds(input)
    return VL_LOSS_THRESHOLDS
  }
  const [a, b, c] = (input as number[])
    .map((t) => Math.min(100, Math.max(0, t)))
    .sort((x, y) => x - y)
  return [a, b, c]
}

export function velocityLossBand(
  lossPct: number,
  thresholds?: VelocityLossThresholds
): VelocityLossBand {
  const [t1, t2, t3] = normalizeLossThresholds(thresholds)
  // The set's best rep is never a warning, even when a threshold is 0.
  if (lossPct <= 0 || lossPct < t1) return 0
  if (lossPct < t2) return 1
  if (lossPct < t3) return 2
  return 3
}

const LOSS_BAND_TOKENS: readonly VelScaleToken[] = [
  VEL_SCALE_TOKEN.green,
  VEL_SCALE_TOKEN.yellow,
  VEL_SCALE_TOKEN.orange,
  VEL_SCALE_TOKEN.red,
]

/**
 * Map a per-rep velocity LOSS (%, from the set's own best — see {@link
 * velocityLossForRep}) onto the same green→gold→orange→red scale as the absolute
 * zone scale ({@link VEL_SCALE_TOKEN}), banded at the {@link VL_LOSS_THRESHOLDS}
 * VL10/VL20/VL30 cues. Past VL20 reads orange ("past VL20 = amber" in coaching
 * terms — this scale's amber/gold band is the yellow stop, orange is the VL20+
 * band), past VL30 reads red, so a fatiguing set reads green→red by LOSS
 * regardless of how slow its absolute velocity is. `mode` picks the theme's hex (default dark).
 */
export function getVelocityLossColor(
  lossPct: number,
  thresholds?: VelocityLossThresholds,
  mode: ThemeMode = 'dark'
): string {
  return velScaleColor(LOSS_BAND_TOKENS[velocityLossBand(lossPct, thresholds)], mode)
}

// A billionth of a percent: far below any threshold a coach sets, far above double rounding error.
const FLOAT_NOISE = 1e9

/**
 * A single rep's velocity loss (%) relative to the set's own best rep, clamped to
 * ≥ 0 (a best-so-far rep, or a set with no positive best, reports 0 loss — green).
 * NOT rounded to a whole percent: every surface bands this exact value, so a 13.33%
 * loss against a 13.3% threshold takes the higher band, as the consumer's own
 * unrounded check does. Only floating-point noise is removed (`1.0 − 0.9` is
 * `0.0999…998`), so a rep that lands exactly on a threshold takes the higher band.
 * Show it through {@link shownVelocityLoss}. Feeds `barColor="loss"` bar coloring on the hero, the
 * dual strips and PinnedLiveStrip; {@link calculateVelocityLoss} is its rounded,
 * last-rep-vs-best summary.
 */
export function velocityLossForRep(velocity: number, best: number): number {
  if (!(best > 0)) return 0
  const loss = ((best - velocity) / best) * 100
  return Math.max(0, Math.round(loss * FLOAT_NOISE) / FLOAT_NOISE)
}

/**
 * A loss as a whole percent to show beside its colour: rounded DOWN, so the number never reads
 * at or past a threshold the colour (banded on the exact loss) has not reached. 19.96 reads 19.
 */
export function shownVelocityLoss(lossPct: number): number {
  return Math.floor(lossPct)
}

/** Classify a velocity into its band (slow → fast, min inclusive / max exclusive). */
export function classifyBand(
  velocity: number,
  bands: readonly VelocityZoneBandProp[]
): VelocityZoneBandProp | undefined {
  for (const band of bands) {
    if (band.max === null || velocity < band.max) return band
  }
  return bands[bands.length - 1]
}

function bandColor(band: VelocityZoneBandProp, mode: ThemeMode): string {
  return getSemanticColors(mode)[bandIdToToken[band.id] ?? VEL_SCALE_TOKEN.green]
}

/**
 * The zone → bar-color resolver, single-sourced so every variant (and the dual
 * diverging sibling) colors reps identically: profile-derived `zones` map through
 * {@link bandColor}; the default (no-zones) path uses the built-in 4-color scale.
 * Color is ALWAYS the velocity zone — never the voltra side.
 */
export function makeBarColorFor(
  zones: readonly VelocityZoneBandProp[] | undefined,
  mode: ThemeMode
): (v: number) => string {
  const hasZones = zones != null && zones.length > 0
  return (v: number): string =>
    hasZones
      ? bandColor(classifyBand(v, zones)!, mode)
      : velScaleColor(zoneTokenMap[getVelocityZoneColor(v)], mode)
}

/** The info row's loss text: orange and red at the same thresholds as the bars, else unstyled. */
export function getLossStyle(
  loss: number,
  thresholds: VelocityLossThresholds,
  mode: ThemeMode
): Record<string, string> | null {
  const band = velocityLossBand(loss, thresholds)
  return band >= 2 ? { color: velScaleColor(LOSS_BAND_TOKENS[band], mode) } : null
}
