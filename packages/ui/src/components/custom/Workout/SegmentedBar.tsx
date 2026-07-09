// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Animated, Easing, type ViewProps, type DimensionValue } from 'react-native'

/** ~1.9s full cycle: a pulsing segment eases up then back down (2 × half). */
const PULSE_HALF_MS = 950

/** Pulsing segments breathe their opacity between this floor and full. */
const PULSE_MIN_OPACITY = 0.45

/** Default between-segment gap — matches SetStrip's between-set gap so strips read the same. */
const SEGMENTED_BAR_GAP = 5

export interface SegmentedBarSegment {
  /** Flex weight of this segment's slot. Default 1 (all segments equal width). */
  weight?: number
  /** Fraction 0..1 of the slot the coloured fill covers, left-aligned. Default 1 (full). */
  fill?: number
  /** Fill colour — a literal hex (RNW-safe), never a `var()` token ref. */
  color: string
  /** When true the fill animates on the shared active-pulse loop. */
  pulse?: boolean
  /**
   * When pulsing, interpolate the fill's `backgroundColor` from→to over the loop
   * (full opacity). Omit to fall back to the default opacity breathe.
   */
  pulseColor?: [from: string, to: string]
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
 * vertical line at a fraction of the total width. Colours are passed-in literal hex.
 */
export function SegmentedBar({
  segments,
  height = 8,
  gap = SEGMENTED_BAR_GAP,
  radius = 2,
  marker = null,
  segmentTestID,
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
          backgroundColor: seg.color,
        }
        const testID = segmentTestID?.(seg, i) ?? 'segmented-bar-segment'
        return (
          <View
            key={i}
            style={{
              flex: seg.weight ?? 1,
              minWidth: 0,
              height: '100%',
              borderRadius: radius,
              overflow: 'hidden',
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
