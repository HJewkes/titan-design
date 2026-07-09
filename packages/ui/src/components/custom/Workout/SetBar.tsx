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

/** Grey fill for planned-but-unperformed reps / upcoming sets (charcoal placeholder). */
const TODO_COLOR = primitiveColors.charcoal[300]

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
 * One set's data. `done` = every rep performed; `active` = reps-so-far performed
 * against a planned count (remainder greyed, performed reps pulse); `todo` = a
 * planned but unstarted set (solid grey bar).
 */
export type SetStripSet =
  | { status: 'done'; velocities: number[] }
  | { status: 'active'; velocities: number[]; planned: number }
  | { status: 'todo'; planned: number }

/** Map a set's performance state to the butted per-rep segments of its bar. */
function setSegments(set: SetStripSet): SegmentedBarSegment[] {
  if (set.status === 'todo') {
    return [{ color: TODO_COLOR }]
  }
  if (set.status === 'done') {
    return set.velocities.map((v) => ({ color: velocityZoneColor(v) }))
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
