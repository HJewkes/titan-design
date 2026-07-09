// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Animated, Easing, type ViewProps } from 'react-native'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

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

/** Gap between set bars — ~2× the (zero) rep gap, so sets read as discrete units. */
const SET_STRIP_GAP = 5

/** ~1.9s full cycle: the active-set pulse eases up then back down (2 × half). */
const PULSE_HALF_MS = 950

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

interface Segment {
  color: string
  pulse: boolean
}

function setSegments(set: SetStripSet): Segment[] {
  if (set.status === 'todo') {
    return [{ color: TODO_COLOR, pulse: false }]
  }
  if (set.status === 'done') {
    return set.velocities.map((v) => ({ color: velocityZoneColor(v), pulse: false }))
  }
  const performed = set.velocities.map((v) => ({ color: velocityZoneColor(v), pulse: true }))
  const remaining = Math.max(0, set.planned - set.velocities.length)
  return [
    ...performed,
    ...Array.from({ length: remaining }, () => ({ color: TODO_COLOR, pulse: false })),
  ]
}

function describeSets(sets: SetStripSet[]): string {
  const done = sets.filter((s) => s.status === 'done').length
  const active = sets.filter((s) => s.status === 'active').length
  const todo = sets.filter((s) => s.status === 'todo').length
  return `Set progress: ${done} done, ${active} in progress, ${todo} upcoming`
}

function StripSegment({ seg, pulse }: { seg: Segment; pulse: Animated.Value }) {
  if (seg.pulse && PULSE_RANGE[seg.color]) {
    return (
      <Animated.View
        style={{
          flex: 1,
          height: '100%',
          backgroundColor: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: PULSE_RANGE[seg.color],
          }),
        }}
        accessibilityElementsHidden
        testID="set-strip-pulse"
      />
    )
  }
  const empty = seg.color === TODO_COLOR
  return (
    <View
      style={{ flex: 1, height: '100%', backgroundColor: seg.color }}
      accessibilityElementsHidden
      testID={empty ? 'set-strip-empty' : 'set-strip-fill'}
    />
  )
}

function SetBar({
  segments,
  height,
  animated,
}: {
  segments: Segment[]
  height: number
  animated: boolean
}) {
  const [pulse] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (!animated) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_HALF_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_HALF_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animated, pulse])

  return (
    <View
      style={{
        flexDirection: 'row',
        flex: 1,
        minWidth: 0,
        height,
        borderRadius: 2,
        overflow: 'hidden',
      }}
      testID="set-strip-set"
    >
      {segments.map((seg, i) => (
        <StripSegment key={i} seg={seg} pulse={pulse} />
      ))}
    </View>
  )
}

export interface SetStripProps extends ViewProps {
  /** Per-set performance data, in set order. */
  sets: SetStripSet[]
  /** Bar height in px. Default 8. */
  height?: number
  className?: string
}

/**
 * The per-set segmented performance strip: one continuous bar per set (rep
 * intensities as butted color segments, no rep gaps), sets separated by a fixed
 * gap. Fills its container width. Colors are the real titan ramp pins.
 */
export function SetStrip({ sets, height = 8, className, ...props }: SetStripProps) {
  return (
    <View
      className={className}
      style={{ flexDirection: 'row', width: '100%', height, gap: SET_STRIP_GAP }}
      accessibilityRole="image"
      accessibilityLabel={describeSets(sets)}
      testID="set-strip"
      {...props}
    >
      {sets.map((set, i) => (
        <SetBar
          key={i}
          segments={setSegments(set)}
          height={height}
          animated={set.status === 'active'}
        />
      ))}
    </View>
  )
}
