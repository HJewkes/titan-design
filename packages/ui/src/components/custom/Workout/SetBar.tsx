// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'

/**
 * The four canonical rep-intensity zone pins (real titan ramp pins). A rep's mean
 * velocity ratio maps to one of these; butted together they form a set's bar.
 */
export const SET_STRIP_ZONES = {
  slow: primitiveRamps.red[600],
  moderate: primitiveRamps.orange[400],
  fast: primitiveRamps.amber[300],
  fastest: primitiveRamps.green[300],
} as const

/**
 * Grey fill for planned-but-unperformed reps / upcoming sets (charcoal placeholder).
 * Sits one ramp step above charcoal[300] so it stays legible against the warm
 * content plane (surface-base) the rail now sits flat on — [300] read ~ΔL*4 from
 * surface-base and vanished under the upcoming-row dim; [200] holds ~ΔL*11.
 */
const TODO_COLOR = primitiveColors.charcoal[200]

/**
 * The learned "variable / unknown / opportunity" semantic (cyan-900, a real ramp
 * pin): an unperformed rep in a range's variable zone, and the fading trail of a
 * myo set whose cluster count isn't yet known.
 */
export const SET_STRIP_VARIABLE_COLOR = primitiveRamps.cyan[900]

// Gap hierarchy — the chunk-size *pattern* carries set-type identity:
// butted reps (0) < NOTCH (drop sub-load) < CLUSTER (myo rest-pause) < SET_GAP (5, between sets).
/** Drop-set sub-load divider — a thin notch, narrower than a myo cluster gap. */
const NOTCH_GAP = 2
/** Myo rest-pause divider between the activation chunk and each mini-cluster. */
const CLUSTER_GAP = 3

/** myo-upcoming trail defaults: N fading expected clusters, each this many reps. */
const MYO_UPCOMING_CLUSTERS = 3
const MYO_UPCOMING_CLUSTER_LEN = 5
/** Per-cluster opacity decay along the "count unknown" trail (1 · 0.6 · 0.36 · …). */
const MYO_UPCOMING_FADE = 0.6

/**
 * Active-set pulse range per zone: each segment eases between its pin's adjacent
 * lighter/darker ramp steps, keeping the intensity reading while signalling "live".
 */
const PULSE_RANGE: Record<string, [string, string]> = {
  [SET_STRIP_ZONES.slow]: [primitiveRamps.red[500], primitiveRamps.red[700]],
  [SET_STRIP_ZONES.moderate]: [primitiveRamps.orange[300], primitiveRamps.orange[500]],
  [SET_STRIP_ZONES.fast]: [primitiveRamps.amber[200], primitiveRamps.amber[400]],
  [SET_STRIP_ZONES.fastest]: [primitiveRamps.green[200], primitiveRamps.green[400]],
}

/** Map a per-rep mean-velocity ratio to its zone pin (fastest = green, slowest = red). */
export function velocityZoneColor(v: number): string {
  if (v < 0.5) return SET_STRIP_ZONES.slow
  if (v < 0.75) return SET_STRIP_ZONES.moderate
  if (v < 1.0) return SET_STRIP_ZONES.fast
  return SET_STRIP_ZONES.fastest
}

/**
 * One set's data. Flat variants: `done` = every rep performed; `active` = reps-so-far
 * performed against a planned count (remainder greyed, performed reps pulse); `todo` =
 * a planned but unstarted set (solid grey bar). Set-type variants:
 * - `range` — variable rep-range (e.g. 15–20): `max` segments; committed zone
 *   `0..floor` (done = velocity, todo = grey), variable zone `floor..max` (done =
 *   velocity, todo = the variable/opportunity cyan). `doneVels` may run past `floor`.
 * - `drop` — one set, no rest: `subloads` butted internally, split by 2px notches.
 * - `myo` — done rest-pause: `activation` chunk + `clusters`, split by 3px cluster gaps.
 * - `myo-upcoming` — planned myo, length unknown: grey activation (`activationLen`) +
 *   a fading cyan "clusters-to-failure" trail with the right edge left open.
 */
export type SetStripSet =
  | { status: 'done'; velocities: number[] }
  | { status: 'active'; velocities: number[]; planned: number }
  | { status: 'todo'; planned: number }
  | { status: 'range'; floor: number; max: number; doneVels: number[] }
  | { status: 'drop'; subloads: number[][] }
  | { status: 'myo'; activation: number[]; clusters: number[][] }
  | { status: 'myo-upcoming'; activationLen: number; clusterCount?: number }

/** Flatten velocity chunks into butted segments, carving `gap` before each chunk but the first. */
function chunkedSegments(chunks: number[][], gap: number): SegmentedBarSegment[] {
  return chunks.flatMap((vels, ci) =>
    vels.map((v, ri) => ({
      color: velocityZoneColor(v),
      ...(ci > 0 && ri === 0 ? { leadingGap: gap } : {}),
    }))
  )
}

/** The variable rep-range's `max` segments: velocity where done, else grey (committed) / cyan (variable). */
function rangeSegments(floor: number, max: number, doneVels: number[]): SegmentedBarSegment[] {
  return Array.from({ length: max }, (_, i) => {
    if (i < doneVels.length) return { color: velocityZoneColor(doneVels[i]) }
    return { color: i < floor ? TODO_COLOR : SET_STRIP_VARIABLE_COLOR }
  })
}

/** Grey activation chunk + a fading, right-open cyan trail of expected rest-pause clusters. */
function myoUpcomingSegments(activationLen: number, clusterCount: number): SegmentedBarSegment[] {
  const activation = Array.from({ length: activationLen }, () => ({ color: TODO_COLOR }))
  const trail = Array.from({ length: clusterCount }, (_, ci) =>
    Array.from({ length: MYO_UPCOMING_CLUSTER_LEN }, (_, ri) => ({
      color: SET_STRIP_VARIABLE_COLOR,
      opacity: MYO_UPCOMING_FADE ** ci,
      ...(ri === 0 ? { leadingGap: CLUSTER_GAP } : {}),
    }))
  ).flat()
  return [...activation, ...trail]
}

/** Map a set's performance state to the butted per-rep segments of its bar. */
function setSegments(set: SetStripSet): SegmentedBarSegment[] {
  if (set.status === 'todo') {
    return [{ color: TODO_COLOR }]
  }
  if (set.status === 'done') {
    return set.velocities.map((v) => ({ color: velocityZoneColor(v) }))
  }
  if (set.status === 'range') {
    return rangeSegments(set.floor, set.max, set.doneVels)
  }
  if (set.status === 'drop') {
    return chunkedSegments(set.subloads, NOTCH_GAP)
  }
  if (set.status === 'myo') {
    return chunkedSegments([set.activation, ...set.clusters], CLUSTER_GAP)
  }
  if (set.status === 'myo-upcoming') {
    return myoUpcomingSegments(set.activationLen, set.clusterCount ?? MYO_UPCOMING_CLUSTERS)
  }
  const performed = set.velocities.map((v) => {
    const color = velocityZoneColor(v)
    return { color, pulse: true, pulseColor: PULSE_RANGE[color] }
  })
  const remaining = Math.max(0, set.planned - set.velocities.length)
  return [...performed, ...Array.from({ length: remaining }, () => ({ color: TODO_COLOR }))]
}

/** Preserve SetBar's per-segment test hooks over the generic SegmentedBar fills. */
function setBarSegmentTestID(seg: SegmentedBarSegment): string {
  if (seg.pulse) return 'set-strip-pulse'
  if (seg.color === SET_STRIP_VARIABLE_COLOR) return 'set-strip-variable'
  return seg.color === TODO_COLOR ? 'set-strip-empty' : 'set-strip-fill'
}

export interface SetBarProps {
  /** One set's performance state (done / active / todo). */
  set: SetStripSet
  /** Bar height in px. Default 8. */
  height?: number
}

/**
 * ONE set's multi-coloured bar: the butted per-rep colour segments for a single
 * set (`done` = velocity-coloured reps · `active` = performed reps pulsing + grey
 * remainder · `todo` = a solid grey bar), composed over {@link SegmentedBar}.
 * Fills its flex slot; {@link SetStrip} lays several side by side. Colours are the
 * real titan ramp pins.
 */
export function SetBar({ set, height = 8 }: SetBarProps) {
  return (
    <SegmentedBar
      segments={setSegments(set)}
      height={height}
      gap={0}
      radius={0}
      segmentTestID={setBarSegmentTestID}
      style={{ flex: 1, minWidth: 0, borderRadius: 2, overflow: 'hidden' }}
      testID="set-strip-set"
    />
  )
}
