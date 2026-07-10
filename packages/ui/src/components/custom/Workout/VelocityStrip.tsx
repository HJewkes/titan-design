// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'
import { formatVelocity } from '../../../utils/workout-format'
import { SET_STRIP_VARIABLE_COLOR } from './SetStrip'

/**
 * Structural velocity-zone band accepted from an upstream analytics source
 * (e.g. workout-analytics' `VelocityZones.bands`).
 *
 * Deliberately a plain structural shape — titan never imports the analytics
 * package (same policy as TempoBar's presentational phase key). Any object with
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

export interface VelocityStripProps extends ViewProps {
  /**
   * Per-rep MEAN concentric velocity (m/s), one entry per rep (brain WA-D02).
   * Drives both bar height and — in the default path — zone color. Callers must
   * feed mean (not peak) concentric velocity so bar color, height, and the
   * summary label all describe one metric.
   *
   * Optional: provide exactly one of `velocities` or {@link VelocityStripProps.set}.
   * When neither is given the strip renders nothing.
   */
  velocities?: number[]
  /**
   * Optional structured strength-training set descriptor (see {@link VelocitySet}).
   * When present it supersedes `velocities`: the done-velocity array is derived
   * from the set (so mean / loss / zone summaries still work) and the strip is
   * drawn as a typed slot list — grey todo, cyan variable / continue windows and
   * the wide-gap chunking that distinguishes drop / myo / cluster sets. Provide
   * exactly one of `velocities` or `set`.
   */
  set?: VelocitySet
  /**
   * Optional velocity-zone bands (shape-compatible with WA's
   * `VelocityZones.bands`). When provided, bar color and the summary zone label
   * come from these bands via {@link zoneIdToScaleToken}. When omitted, the
   * built-in default scale (≥1.0 / ≥0.75 / ≥0.5) is used — identical to prior
   * releases. Colors NEVER come from the bands themselves.
   */
  zones?: readonly VelocityZoneBandProp[]
  /**
   * Live mode: index of the most-recently-completed rep. That bar animates in
   * with a "pop"; if it is also the current set peak (a new best), it "bounces"
   * instead. Only the latest bar animates. Honors `prefers-reduced-motion`.
   * Full variant only.
   */
  liveRepIndex?: number
  expanded?: boolean
  onToggle?: () => void
  onRepPress?: (index: number, velocity: number) => void
  variant?: 'full' | 'mini'
  showInfo?: boolean
  className?: string
}

// Canonical 4-color performance scale shared with SetRow's RPE color
// (see theme/workout-tokens.ts). green = fastest, red = slowest/grinding.
const VEL_COLORS = WORKOUT_TOKENS.scale

/**
 * Map a velocity-zone id (WA's 5-band taxonomy) onto the canonical 4-color
 * scale. The scale has 4 hues but the taxonomy has 5 bands, so the two slowest
 * bands — `maximalStrength` and `grinding` — intentionally share `red`: both
 * read as "heavy / effortful" and there is no distinct 5th data-viz hue. The
 * top three bands align 1:1 with the legacy default scale so an exercise moving
 * from default to profile-derived zones never shifts its fast-end colors.
 *
 * Legacy default parity: speed=green, power=yellow, strengthSpeed=orange, and
 * the old sub-0.5 "Strength" band (now split into maximalStrength + grinding)
 * stays red.
 *
 * Unknown ids fall back to `green` (matching the historical default-path
 * fallback), so a forward-compatible band id never renders an empty bar.
 */
const zoneIdToScaleToken: Record<string, keyof typeof VEL_COLORS> = {
  speed: 'green',
  power: 'yellow',
  strengthSpeed: 'orange',
  maximalStrength: 'red',
  grinding: 'red',
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

const zoneHexMap: Record<string, string> = {
  'vel-green': VEL_COLORS.green,
  'vel-yellow': VEL_COLORS.yellow,
  'vel-orange': VEL_COLORS.orange,
  'vel-red': VEL_COLORS.red,
}

/**
 * Velocity loss for a set, as a whole percentage. Uses the running-best rep as
 * the reference (matching WA-02.05 / brain WA-D01): `(vBest − vLast) / vBest`,
 * clamped to ≥ 0 so a set that ends on its best rep reports 0 loss.
 */
export function calculateVelocityLoss(velocities: number[]): number {
  if (velocities.length < 2) return 0
  const best = Math.max(...velocities)
  if (best <= 0) return 0
  const last = velocities[velocities.length - 1]
  return Math.max(0, Math.round(((best - last) / best) * 100))
}

/** Arithmetic mean of the per-rep mean-concentric velocities. */
export function calculateMeanVelocity(velocities: number[]): number {
  if (velocities.length === 0) return 0
  const sum = velocities.reduce((acc, v) => acc + v, 0)
  return sum / velocities.length
}

/** Classify a velocity into its band (slow → fast, min inclusive / max exclusive). */
function classifyBand(
  velocity: number,
  bands: readonly VelocityZoneBandProp[]
): VelocityZoneBandProp | undefined {
  for (const band of bands) {
    if (band.max === null || velocity < band.max) return band
  }
  return bands[bands.length - 1]
}

function bandColor(band: VelocityZoneBandProp): string {
  const token = zoneIdToScaleToken[band.id]
  return token ? VEL_COLORS[token] : VEL_COLORS.green
}

function getLossStyle(loss: number): Record<string, string> | null {
  if (loss > 25) return { color: VEL_COLORS.red }
  if (loss > 20) return { color: VEL_COLORS.orange }
  return null
}

// --- Set-type slot model -----------------------------------------------------
// The strength-training set vocabulary (operator-approved in the Set Modalities
// exploration): one strip encoding for every per-rep set type. A set resolves to
// an ordered list of slots; the slot `kind` picks the color and `leadingGap`
// encodes the chunk pattern (rep gap vs the wide notch that splits drop sub-loads
// / myo clusters / cluster intra-rests). Set-LEVEL types (pyramid / superset /
// tempo) belong to the heading, not the strip.

/**
 * A structured strength-training set. Supply as {@link VelocityStripProps.set} to
 * render its set-type encoding; the done-velocity array (used for the mean / loss
 * / zone summary) is derived from the type's velocity fields.
 */
export type VelocitySet =
  /** Fixed reps at a fixed load: done reps colored + a grey todo remainder to `planned`. */
  | { type: 'straight'; velocities: number[]; planned?: number }
  /** Bounded reps: committed slots `0..floor`, then a cyan variable window `floor..max`. */
  | { type: 'range'; velocities: number[]; floor: number; max: number }
  /** As-many-reps-as-possible: done reps + a trailing cyan "continue" slot that never closes. */
  | { type: 'amrap'; velocities: number[]; target?: number }
  /** Load drops with no rest: each sub-load's reps, split by a WIDE notch gap. */
  | { type: 'drop'; subloads: number[][] }
  /** Rest-pause: an activation chunk + mini-clusters split by WIDE gaps; `open` adds a cyan continue. */
  | { type: 'myo'; activation: number[]; clusters: number[][]; open?: boolean }
  /** Fixed count broken by intra-set rests: reps grouped by `groupSize` with WIDE intra-rest gaps. */
  | { type: 'cluster'; velocities: number[]; groupSize: number; planned?: number }

/** One drawn cell of the strip. `kind` picks the color; `leadingGap` the spacing before it. */
interface VelocitySlot {
  kind: 'rep' | 'todo' | 'variable' | 'continue'
  velocity?: number
  leadingGap: number
}

/** Butted reps carry this gap; chunk boundaries carry {@link WIDE_GAP}. */
const REP_GAP = 2
/** Drop sub-load notch / myo cluster gap / cluster intra-rest gap — one wide value carries the chunk identity. */
const WIDE_GAP = 7

/** Grey fill for planned-but-unperformed reps (charcoal placeholder, literal hex). */
const TODO_COLOR = primitiveColors.charcoal[300]
/** The thin cyan-800 outline on the open-ended "continue" slot — reads as "keep going". */
const CONTINUE_OUTLINE = primitiveRamps.cyan[800]

/** The done-velocity array a set contributes to the mean / loss / zone summary. */
function deriveDoneVelocities(set: VelocitySet): number[] {
  switch (set.type) {
    case 'drop':
      return set.subloads.flat()
    case 'myo':
      return [...set.activation, ...set.clusters.flat()]
    default:
      return set.velocities
  }
}

/** Flatten velocity chunks into rep slots, carving a WIDE gap before each chunk but the first. */
function chunkedRepSlots(chunks: number[][]): VelocitySlot[] {
  const slots: VelocitySlot[] = []
  chunks.forEach((chunk) => {
    chunk.forEach((velocity, ri) => {
      const first = slots.length === 0
      slots.push({ kind: 'rep', velocity, leadingGap: first ? 0 : ri === 0 ? WIDE_GAP : REP_GAP })
    })
  })
  return slots
}

/** Resolve a set to its ordered slot list — the exact vocabulary of the Set Modalities sheet. */
function buildSlots(set: VelocitySet): VelocitySlot[] {
  switch (set.type) {
    case 'straight': {
      const total = Math.max(set.velocities.length, set.planned ?? set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const done = i < set.velocities.length
        return {
          kind: done ? 'rep' : 'todo',
          velocity: done ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : REP_GAP,
        }
      })
    }
    case 'range': {
      const total = Math.max(set.max, set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const kind: VelocitySlot['kind'] =
          i < set.velocities.length ? 'rep' : i < set.floor ? 'todo' : 'variable'
        return {
          kind,
          velocity: kind === 'rep' ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : REP_GAP,
        }
      })
    }
    case 'amrap': {
      const reps = set.velocities.map<VelocitySlot>((velocity, i) => ({
        kind: 'rep',
        velocity,
        leadingGap: i === 0 ? 0 : REP_GAP,
      }))
      reps.push({ kind: 'continue', leadingGap: reps.length === 0 ? 0 : REP_GAP })
      return reps
    }
    case 'drop':
      return chunkedRepSlots(set.subloads)
    case 'myo': {
      const slots = chunkedRepSlots([set.activation, ...set.clusters])
      if (set.open) slots.push({ kind: 'continue', leadingGap: slots.length === 0 ? 0 : REP_GAP })
      return slots
    }
    case 'cluster': {
      const total = Math.max(set.velocities.length, set.planned ?? set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const done = i < set.velocities.length
        const boundary = i > 0 && i % set.groupSize === 0
        return {
          kind: done ? 'rep' : 'todo',
          velocity: done ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : boundary ? WIDE_GAP : REP_GAP,
        }
      })
    }
  }
}

/** A concise, set-type-aware summary for the strip's accessibility label. */
function setAccessibilityLabel(set: VelocitySet, repCount: number): string {
  switch (set.type) {
    case 'straight':
      return `Velocity strip, straight set, ${repCount} reps`
    case 'range':
      return `Velocity strip, rep-range set, floor ${set.floor} to ${set.max}, ${repCount} reps done`
    case 'amrap':
      return `Velocity strip, AMRAP set, ${repCount} reps and counting`
    case 'drop':
      return `Velocity strip, drop set, ${set.subloads.length} loads, ${repCount} reps`
    case 'myo':
      return `Velocity strip, myo-reps set, ${set.clusters.length} clusters${set.open ? ', open' : ''}, ${repCount} reps`
    case 'cluster':
      return `Velocity strip, cluster set, groups of ${set.groupSize}, ${repCount} reps`
  }
}

/** Per-slot accessibility label for the expanded set-type bars. */
function slotAccessibilityLabel(slot: VelocitySlot, index: number): string {
  switch (slot.kind) {
    case 'rep':
      return `Rep ${index + 1}: ${formatVelocity(slot.velocity ?? 0)} meters per second`
    case 'todo':
      return `Rep ${index + 1}: planned`
    case 'variable':
      return `Rep ${index + 1}: variable`
    case 'continue':
      return 'Keep going'
  }
}

/** Straight-set expanded stub height for a planned (todo) rep, as a % of the plot. */
const EXPANDED_TODO_STUB_PCT = 16
/** Expanded height for advanced set-types (drop / myo / cluster / range / amrap): a short mini-style bar. */
const EXPANDED_ENCODED_PCT = 45

function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Track the OS "reduce motion" preference; falls back to `false` (jsdom/SSR). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotionPreference)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mq.matches)
    handler()
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

const ANIMATION_DURATION = 400
const ANIMATION_EASING = Easing.bezier(0.22, 1, 0.36, 1)
const POP_EASING = Easing.bezier(0.34, 1.56, 0.64, 1)

export function VelocityStrip({
  velocities,
  set,
  zones,
  liveRepIndex,
  expanded = false,
  onToggle,
  onRepPress,
  variant = 'full',
  showInfo = true,
  className,
  ...props
}: VelocityStripProps) {
  // A `set` descriptor derives its own done-velocity array; the legacy
  // `velocities` path stays the source of truth otherwise. Every summary calc
  // (mean / loss / zone) runs on this one array so the info row works either way.
  const doneVelocities = set ? deriveDoneVelocities(set) : (velocities ?? [])
  const slots: VelocitySlot[] = set
    ? buildSlots(set)
    : doneVelocities.map((v, i) => ({
        kind: 'rep',
        velocity: v,
        leadingGap: i === 0 ? 0 : REP_GAP,
      }))

  const maxVelocity = Math.max(...doneVelocities, 0)
  const meanVelocity = calculateMeanVelocity(doneVelocities)
  const loss = calculateVelocityLoss(doneVelocities)

  const hasZones = zones != null && zones.length > 0
  const barColorFor = (v: number): string =>
    hasZones ? bandColor(classifyBand(v, zones)!) : zoneHexMap[getVelocityZoneColor(v)]
  const slotColor = (slot: VelocitySlot): string => {
    if (slot.kind === 'rep') return barColorFor(slot.velocity ?? 0)
    if (slot.kind === 'todo') return TODO_COLOR
    return SET_STRIP_VARIABLE_COLOR
  }
  const meanZone = hasZones
    ? (classifyBand(meanVelocity, zones)?.label ?? '')
    : getVelocityZoneName(meanVelocity)

  const prefersReducedMotion = usePrefersReducedMotion()
  const [heightAnim] = useState(() => new Animated.Value(expanded ? 60 : 3))
  const [labelOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))
  const [infoOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))
  const [liveScale] = useState(() => new Animated.Value(1))

  // Newest-rep animation: pop for a normal rep, bounce when it sets a new peak.
  const liveVelocity = liveRepIndex != null ? doneVelocities[liveRepIndex] : undefined
  const isNewPeak = liveVelocity != null && maxVelocity > 0 && liveVelocity === maxVelocity
  useEffect(() => {
    if (variant === 'mini' || liveRepIndex == null || liveVelocity == null) return
    if (prefersReducedMotion) {
      liveScale.setValue(1)
      return
    }
    if (isNewPeak) {
      liveScale.setValue(1)
      Animated.sequence([
        Animated.timing(liveScale, {
          toValue: 1.25,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(liveScale, {
          toValue: 1,
          friction: 3,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      liveScale.setValue(0.8)
      Animated.timing(liveScale, {
        toValue: 1,
        duration: 300,
        easing: POP_EASING,
        useNativeDriver: true,
      }).start()
    }
  }, [variant, liveRepIndex, liveVelocity, isNewPeak, prefersReducedMotion, liveScale])

  useEffect(() => {
    if (variant === 'mini') return

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: expanded ? 60 : 3,
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
        useNativeDriver: false,
      }),
      Animated.timing(labelOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 150 : 0,
        useNativeDriver: false,
      }),
      Animated.timing(infoOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 200 : 0,
        useNativeDriver: false,
      }),
    ]).start()
  }, [expanded, variant, heightAnim, labelOpacity, infoOpacity])

  // Nothing to draw: neither a legacy velocity array nor a set descriptor.
  if (set == null && velocities == null) return null

  const repCount = doneVelocities.length
  const miniLabel = set ? setAccessibilityLabel(set, repCount) : `Velocity strip, ${repCount} reps`

  if (variant === 'mini') {
    const { style: externalStyle, ...restProps } = props
    // The container keeps the uniform REP_GAP (so a no-`set` strip is byte-identical
    // to prior releases and holds HTML-parity); per-slot `marginLeft` carries only
    // the EXTRA spacing for the WIDE notch that chunks drop / myo / cluster sets.
    return (
      <View
        className={className}
        style={[
          { flexDirection: 'row', height: 3, gap: REP_GAP, borderRadius: 2, overflow: 'hidden' },
          externalStyle,
        ]}
        accessibilityRole="image"
        accessibilityLabel={miniLabel}
        testID="velocity-strip-mini"
        {...restProps}
      >
        {slots.map((slot, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: slotColor(slot),
              borderRadius: 1,
              minWidth: 4,
              height: '100%' as unknown as number,
              marginLeft: Math.max(0, slot.leadingGap - REP_GAP),
              ...(slot.kind === 'continue'
                ? { borderWidth: 1, borderColor: CONTINUE_OUTLINE }
                : {}),
            }}
            accessibilityElementsHidden
            testID={slot.kind === 'rep' ? `velocity-bar-${i}` : `velocity-slot-${slot.kind}`}
          />
        ))}
      </View>
    )
  }

  const stripLabel = set
    ? `${setAccessibilityLabel(set, repCount)}, tap to ${expanded ? 'collapse' : 'expand'}`
    : `Velocity chart for set, ${repCount} reps, tap to ${expanded ? 'collapse' : 'expand'}`
  // When onToggle wraps the strip or individual reps are interactive, the container itself is not a button
  const hasInteractiveContainer = onToggle != null
  const hasInteractiveReps = onRepPress != null && expanded

  // Expanded set-type bars: `straight` is the active-set spotlight (velocity-height
  // done reps + short grey planned stubs); the advanced types render as a short,
  // mini-style encoding (the gaps + colors carry identity, height is uniform).
  const setBars =
    set != null &&
    slots.map((slot, i) => {
      const isStraightRep = set.type === 'straight' && slot.kind === 'rep'
      const heightPct = isStraightRep
        ? maxVelocity > 0
          ? Math.round(((slot.velocity ?? 0) / (maxVelocity * 1.15)) * 100)
          : 0
        : set.type === 'straight'
          ? EXPANDED_TODO_STUB_PCT
          : EXPANDED_ENCODED_PCT
      return (
        <View
          key={i}
          style={{
            flex: 1,
            height: '100%',
            justifyContent: 'flex-end',
            marginLeft: slot.leadingGap,
          }}
        >
          <View
            style={{
              height: `${heightPct}%`,
              minHeight: 2,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              backgroundColor: slotColor(slot),
              ...(slot.kind === 'continue'
                ? { borderWidth: 1, borderColor: CONTINUE_OUTLINE }
                : {}),
            }}
            testID={slot.kind === 'rep' ? `velocity-bar-${i}` : `velocity-slot-${slot.kind}`}
            accessibilityRole="image"
            accessibilityLabel={slotAccessibilityLabel(slot, i)}
          />
        </View>
      )
    })

  const stripContent = (
    <Animated.View
      className={[className, expanded ? 'bg-surface-raised' : 'bg-transparent']
        .filter(Boolean)
        .join(' ')}
      style={[
        {
          height: heightAnim,
          width: '100%',
          gap: 2,
          borderRadius: expanded ? 6 : 2,
          paddingTop: expanded ? 16 : 0,
          paddingBottom: expanded ? 24 : 0,
          paddingHorizontal: expanded ? 6 : 0,
          paddingVertical: expanded ? undefined : 8,
          overflow: expanded ? 'visible' : 'hidden',
        },
      ]}
      accessibilityRole={hasInteractiveContainer || hasInteractiveReps ? 'none' : 'button'}
      accessibilityLabel={hasInteractiveContainer || hasInteractiveReps ? undefined : stripLabel}
      testID="velocity-strip"
      {...props}
    >
      <View style={{ flexDirection: 'row', flex: 1, gap: set ? 0 : 2, alignItems: 'flex-end' }}>
        {set
          ? setBars
          : doneVelocities.map((v, i) => {
              const barBackground = barColorFor(v)
              // Guard all-zero velocities (idle / pre-rep): maxVelocity === 0 makes
              // this 0 / 0 === NaN and emits height:'NaN%'. Flatten the bars instead.
              const barHeightPct =
                maxVelocity > 0 ? Math.round((v / (maxVelocity * 1.15)) * 100) : 0
              const isLive = liveRepIndex === i
              const liveLabelSuffix = isLive
                ? isNewPeak
                  ? ', latest rep, new set peak'
                  : ', latest rep'
                : ''

              const barStyle: ViewStyle = expanded
                ? {
                    height: `${barHeightPct}%`,
                    minHeight: 2,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    backgroundColor: barBackground,
                  }
                : {
                    minHeight: '100%' as unknown as number,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    backgroundColor: barBackground,
                  }

              const barInner = isLive ? (
                <Animated.View
                  style={[barStyle, { transform: [{ scale: liveScale }] }]}
                  testID={`velocity-bar-${i}`}
                  accessibilityRole="image"
                  accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second${liveLabelSuffix}`}
                />
              ) : (
                <View
                  style={barStyle}
                  testID={`velocity-bar-${i}`}
                  accessibilityRole="image"
                  accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second`}
                />
              )

              const bar = (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                  }}
                >
                  {expanded && (
                    <Animated.View
                      style={{
                        opacity: labelOpacity,
                        alignItems: 'center',
                        position: 'absolute',
                        top: -13,
                        left: 0,
                        right: 0,
                      }}
                      accessibilityElementsHidden
                    >
                      <Text
                        className="text-text-secondary"
                        style={{ fontSize: 8, fontWeight: '600' }}
                        testID={`velocity-label-${i}`}
                      >
                        {formatVelocity(v)}
                      </Text>
                    </Animated.View>
                  )}
                  {barInner}
                </View>
              )

              if (onRepPress && expanded) {
                return (
                  <Pressable
                    key={i}
                    style={{ flex: 1, height: '100%' }}
                    onPress={() => onRepPress(i, v)}
                    accessibilityRole="button"
                    accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second, tap for details`}
                    testID={`velocity-bar-pressable-${i}`}
                  >
                    {bar}
                  </Pressable>
                )
              }

              return bar
            })}
      </View>
      {expanded && showInfo && (
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            opacity: infoOpacity,
            position: 'absolute',
            bottom: 4,
            left: 6,
            right: 6,
          }}
          testID="velocity-info-row"
        >
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {meanZone} {'·'} {formatVelocity(meanVelocity)} m/s
          </Text>
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              ...getLossStyle(loss),
            }}
          >
            Loss: {loss}%
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )

  if (onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={stripLabel}
        testID="velocity-strip-pressable"
      >
        {stripContent}
      </Pressable>
    )
  }

  return stripContent
}
