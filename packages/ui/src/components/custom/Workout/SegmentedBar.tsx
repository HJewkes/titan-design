// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState, type ReactNode } from 'react'
import { View, Animated, Easing, type ViewProps, type DimensionValue } from 'react-native'
import { SET_LEVEL_FLAT_BAR } from '../charts/flatBarGeometry'

/** ~1.9s full cycle: a pulsing segment eases up then back down (2 × half). */
const PULSE_HALF_MS = 950

/** Pulsing segments breathe their opacity between this floor and full. */
const PULSE_MIN_OPACITY = 0.45

/** Default between-segment gap — matches SetStrip's between-set gap so strips read the same. */
const SEGMENTED_BAR_GAP = SET_LEVEL_FLAT_BAR.gap

export interface SegmentedBarSegment {
  /** Flex weight of this segment's slot. Default 1 (all segments equal width). */
  weight?: number
  /** Fraction 0..1 of the slot the coloured fill covers, left-aligned. Default 1 (full). */
  fill?: number
  /** Fill colour. Pass `resolveColor(token)` — a plain fill takes a `var()` ref fine. */
  color: string
  /** When true the fill animates on the shared active-pulse loop. */
  pulse?: boolean
  /**
   * When pulsing, interpolate the fill's `backgroundColor` from→to over the loop
   * (full opacity). Omit to fall back to the default opacity breathe.
   *
   * Literal hex only: `Animated.interpolate` parses these two endpoints itself
   * and cannot read a `var()` ref, so `resolveColor(token)` does not work here.
   */
  pulseColor?: [from: string, to: string]
  /**
   * A fixed gap (px) carved in before this segment's slot — lets a composer split
   * an otherwise-butted bar into sub-structure (drop notch, myo cluster) without a
   * uniform {@link SegmentedBarProps.gap}. Default 0 (butted against the previous).
   */
  leadingGap?: number
  /**
   * Static fill opacity 0..1 for a non-pulsing segment (e.g. a fading "count
   * unknown" trail). Ignored for `pulse` segments, which drive their own opacity.
   */
  opacity?: number
  /**
   * Draw the slot as a 1px outline in `color` with no fill — a cell that is
   * present but unearned (a planned rep, a week whose target was missed).
   */
  outline?: boolean
  /** A 1px ring around the whole slot, over any fill: "this is the one you are in". */
  ringColor?: string
  /**
   * Slot height as a fraction of the track, bottom-aligned. Default 1 (full).
   * Lets one cell in a row stand taller than its neighbours.
   */
  heightFraction?: number
}

export interface SegmentedBarProps extends ViewProps {
  /** The weighted segments, laid left-to-right. */
  segments: SegmentedBarSegment[]
  /** Track height in px. Default 8. */
  height?: number
  /** Gap between segment slots in px. Default 5 (SetStrip's between-set gap). */
  gap?: number
  /** Corner radius of each segment slot in px. Default 2. */
  radius?: number
  /** An absolutely-positioned vertical marker line at `position` (0..1 of total width). */
  marker?: { position: number; color: string } | null
  /**
   * Resolve the testID of a segment's fill element. Lets a composing component
   * (e.g. SetBar) preserve its own test hooks; defaults to `segmented-bar-segment`.
   */
  segmentTestID?: (segment: SegmentedBarSegment, index: number) => string | undefined
  /**
   * Wrap each rendered slot — a tooltip, a press target — without this atom
   * knowing what the wrapper is. Returns the slot unchanged by default.
   */
  renderSegment?: (slot: ReactNode, segment: SegmentedBarSegment, index: number) => ReactNode
}

/** The shared active-pulse loop: a single 0→1→0 value driving every pulsing segment. */
function usePulse(active: boolean): Animated.Value {
  const [value] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (!active) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: PULSE_HALF_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: PULSE_HALF_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [active, value])

  return value
}

/**
 * A horizontal track split into weighted, individually-fillable segments — the
 * presentational atom the per-set strips are built from. Each segment is a flex
 * slot (flex = `weight`) holding a left-aligned fill (`fill` fraction, `color`);
 * `pulse` segments breathe on a shared active-pulse loop, and `marker` drops a
 * vertical line at a fraction of the total width. Every colour is injected by the
 * composer, so this atom holds no palette of its own.
 */
export function SegmentedBar({
  segments,
  height = SET_LEVEL_FLAT_BAR.height,
  gap = SEGMENTED_BAR_GAP,
  radius = SET_LEVEL_FLAT_BAR.radius,
  marker = null,
  segmentTestID,
  renderSegment,
  style,
  ...props
}: SegmentedBarProps) {
  const pulse = usePulse(segments.some((s) => s.pulse))

  return (
    <View style={[{ flexDirection: 'row', height, gap, position: 'relative' }, style]} {...props}>
      {segments.map((seg, i) => {
        const fillStyle = {
          width: `${(seg.fill ?? 1) * 100}%` as DimensionValue,
          height: '100%' as DimensionValue,
          backgroundColor: seg.outline ? 'transparent' : seg.color,
          borderWidth: seg.outline ? 1 : undefined,
          borderColor: seg.outline ? seg.color : undefined,
          opacity: seg.opacity,
        }
        const testID = segmentTestID?.(seg, i) ?? 'segmented-bar-segment'
        // Without a wrapper the slot keeps its own flex and leading gap, so the
        // rendered tree is unchanged for every existing consumer.
        const slot = (
          <View
            key={i}
            style={{
              // Inside a wrapper the slot must not grow, or `flex` beats its
              // height and every cell renders full height.
              flex: renderSegment ? undefined : (seg.weight ?? 1),
              alignSelf: renderSegment ? 'stretch' : undefined,
              minWidth: 0,
              height: `${(seg.heightFraction ?? 1) * 100}%` as DimensionValue,
              // Bottom-aligns in a row and in a column; `alignSelf` would collapse
              // the slot's width inside a wrapper that lays its child out vertically.
              marginTop: 'auto',
              marginLeft: renderSegment ? undefined : seg.leadingGap,
              borderRadius: radius,
              overflow: 'hidden',
              borderWidth: seg.ringColor ? 1 : undefined,
              borderColor: seg.ringColor,
            }}
          >
            {seg.pulse ? (
              <Animated.View
                style={{
                  ...fillStyle,
                  ...(seg.pulseColor
                    ? {
                        backgroundColor: pulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: seg.pulseColor,
                        }),
                      }
                    : {
                        opacity: pulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [PULSE_MIN_OPACITY, 1],
                        }),
                      }),
                }}
                accessibilityElementsHidden
                testID={testID}
              />
            ) : (
              <View style={fillStyle} accessibilityElementsHidden testID={testID} />
            )}
          </View>
        )
        return (
          <View
            key={i}
            style={{
              flex: seg.weight ?? 1,
              minWidth: 0,
              height: '100%',
              marginLeft: seg.leadingGap,
            }}
          >
            {renderSegment ? renderSegment(slot, seg, i) : slot}
          </View>
        )
      })}
      {marker ? (
        <View
          style={{
            position: 'absolute',
            left: `${marker.position * 100}%` as DimensionValue,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: marker.color,
          }}
          accessibilityElementsHidden
          testID="segmented-bar-marker"
        />
      ) : null}
    </View>
  )
}
