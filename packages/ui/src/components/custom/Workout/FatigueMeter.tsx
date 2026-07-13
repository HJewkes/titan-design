// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ViewProps } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { ZoneTrack, type ZoneTrackZone, type ZoneTrackTick } from './ZoneTrack'

const { green, yellow, orange, red } = WORKOUT_TOKENS.scale

/** Canonical fatigue band colours (fresh → stop) — the even effort-scale hue walk. */
const DEFAULT_ZONE_COLORS: [string, string, string, string] = [green, yellow, orange, red]
/** Zone boundaries in velocity-loss %, matching the VL10/VL20/VL30 coaching cues. */
const DEFAULT_THRESHOLDS: [number, number, number] = [10, 20, 30]
/** Scale labels at [min, ...thresholds, max]. */
const DEFAULT_LABELS = ['fresh', 'VL10', 'VL20', 'VL30', 'stop']
const DEFAULT_MAX = 40

export interface FatigueMeterProps extends ViewProps {
  /** Current velocity-loss percentage (0 = fresh). Drives the needle position. */
  value: number
  /** Upper bound of the fatigue scale — the "stop" end, in loss %. Default 40. */
  max?: number
  /** Zone boundary thresholds (loss %): green→gold, gold→orange, orange→red. Default [10,20,30]. */
  thresholds?: [number, number, number]
  /** Zone band colours low→high (fresh→stop). Default the canonical effort scale. */
  zoneColors?: [string, string, string, string]
  /** Tick labels at [min, ...thresholds, max]. Default ['fresh','VL10','VL20','VL30','stop']. */
  labels?: string[]
  /** Track height in px. Default 14. */
  trackHeight?: number
  /** Needle colour. Default white. */
  needleColor?: string
  className?: string
}

/**
 * A fatigue meter: a sliding needle over a fixed green→gold→orange→red velocity-loss
 * gradient with VL10/VL20/VL30/stop scale markers. This is the winning fatigue-visual
 * lineage (needle-over-zoned-gradient, three independent sources agreed) — it composes
 * the shared {@link ZoneTrack} primitive, supplying the fatigue domain, zone bands from
 * the effort-scale tokens, and the coaching-cue tick labels. Prop-driven: `value` plus
 * overridable `thresholds` / `max` / `zoneColors` / `labels`.
 *
 * @example
 * <FatigueMeter value={21} />           // needle in the VL20 (orange) zone
 * <FatigueMeter value={8} max={40} thresholds={[10, 20, 30]} />
 */
export function FatigueMeter({
  value,
  max = DEFAULT_MAX,
  thresholds = DEFAULT_THRESHOLDS,
  zoneColors = DEFAULT_ZONE_COLORS,
  labels = DEFAULT_LABELS,
  trackHeight = 14,
  needleColor,
  className,
  ...props
}: FatigueMeterProps) {
  const [t1, t2, t3] = thresholds
  const zones: ZoneTrackZone[] = [
    { upTo: t1, color: zoneColors[0] },
    { upTo: t2, color: zoneColors[1] },
    { upTo: t3, color: zoneColors[2] },
    { upTo: max, color: zoneColors[3] },
  ]

  const tickValues = [0, t1, t2, t3, max]
  const ticks: ZoneTrackTick[] = tickValues.map((v, i) => ({ value: v, label: labels[i] }))

  return (
    <ZoneTrack
      className={className}
      zones={zones}
      min={0}
      max={max}
      trackHeight={trackHeight}
      ticks={ticks}
      marker={{ type: 'needle', value, color: needleColor }}
      accessibilityLabel={`Fatigue: ${value}% velocity loss`}
      testID="fatigue-meter"
      {...props}
    />
  )
}
