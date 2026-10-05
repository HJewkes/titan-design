// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * DualGhostSpark — the DUAL-VOLTRA ghost sparkline: ONE shared {@link GhostBand} with TWO
 * {@link GhostBloom}s mirrored around it, the LEFT device blooming UP and the RIGHT device
 * blooming DOWN. Up/down is spent on DEVICE identity, so phase rides the band COLOUR alone
 * (magenta ecc / cyan con) with the ECC / CON labels INSIDE the band.
 *
 * It is built exactly the way the single {@link GhostSpark} is — the same band, the same
 * bloom, the bottom one just `orientation="down"`. There is no forked path / band / tint
 * code, so any bloom improvement (the paper-inspired line ground, the silver→red tint)
 * reaches the dual for free; single↔dual drift is structurally impossible rather than
 * merely avoided. (The ghost analogue of the diverging VelocityStrip = two composed
 * VelocityStrips.)
 *
 * Both wings share ONE time scale and ONE magnitude scale (a single `vmax` over every
 * sample on both sides, and equal wing heights), so an L/R asymmetry reads as BLOOM SIZE.
 * Per-side scales would let a weak side fill its wing and hide the imbalance.
 *
 * Layout is the locked B3 exploration
 * (`lab/north-star/DualGhostLine.exploration.stories.tsx`): centred band + silver line.
 */
import { View } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { alpha } from '../../../utils/colors'
import { ghostSparkA11y } from './ghostSparkSummary'
import { GhostBand } from './GhostBand'
import type { TempoTuple } from './tempo-pacing'
import { dualSparkLayout, sparkWing } from './dualGhostSparkLayout'
import { DualDeviceLabels, DualWingBloom } from './DualGhostSparkParts'
import { GHOST_GUTTER } from './GhostSpark'
import type { PhaseSegment, RepVelocityCurve } from './fatigue-model'

export interface DualGhostSparkProps {
  /** LEFT device per-rep curves, oldest first (last = current rep) — blooms UP. */
  left: RepVelocityCurve[]
  /** RIGHT device per-rep curves, oldest first (last = current rep) — blooms DOWN. */
  right: RepVelocityCurve[]
  width: number
  /** Plot height in px. Default 232. */
  height?: number
  /** Caption above the upper wing. Default `LEFT`. */
  leftLabel?: string
  /** Caption below the lower wing. Default `RIGHT`. */
  rightLabel?: string
  /** Reveal the device captions. Default `true`. */
  showDeviceLabels?: boolean
  /** Prescribed tempo — turns on the shared band's phase pacing. */
  targetTempoSeconds?: TempoTuple | null
  /** Text alternative. Default: a summary of the current rep and each side's peak velocity. */
  accessibilityLabel?: string
}

/** The phase covering `ms`, or `null` where the side has no coverage. */
function phaseAt(segments: PhaseSegment[], ms: number): PhaseSegment['phase'] | null {
  const hit = segments.find((s) => ms >= s.startMs && ms < s.endMs)
  return hit ? hit.phase : null
}

/**
 * The SHARED band's phase runs: the two devices' current-rep runs reconciled onto one
 * timeline. Where both sides are in the same phase the band takes it; where they are in
 * DIFFERENT phases it reads `idle`, so the band never claims a phase the devices are not
 * actually sharing. Where only one side has a stream at all (the other lags, or is still
 * mid-rep), the covered side speaks for the band — a lagging device shouldn't grey out the
 * phase the other device is genuinely in.
 */
export function mergePhaseSegments(a: PhaseSegment[], b: PhaseSegment[]): PhaseSegment[] {
  if (a.length === 0) return b
  if (b.length === 0) return a
  const bounds = Array.from(new Set([...a, ...b].flatMap((s) => [s.startMs, s.endMs]))).sort(
    (p, q) => p - q
  )

  const out: PhaseSegment[] = []
  for (let i = 0; i < bounds.length - 1; i++) {
    const startMs = bounds[i]
    const endMs = bounds[i + 1]
    if (endMs <= startMs) continue
    const mid = (startMs + endMs) / 2
    const pa = phaseAt(a, mid)
    const pb = phaseAt(b, mid)
    const phase = pa == null ? (pb ?? 'idle') : pb == null ? pa : pa === pb ? pa : 'idle'
    const last = out[out.length - 1]
    if (last && last.phase === phase && last.endMs === startMs) last.endMs = endMs
    else out.push({ phase, startMs, endMs })
  }
  return out
}

export function DualGhostSpark({
  left,
  right,
  width,
  height = 232,
  leftLabel = 'LEFT',
  rightLabel = 'RIGHT',
  showDeviceLabels = true,
  targetTempoSeconds = null,
  accessibilityLabel,
}: DualGhostSparkProps) {
  const a11y = ghostSparkA11y(accessibilityLabel, { left, right })
  const t = getSemanticColors(useSurfaceMode())
  if (left.length === 0 && right.length === 0) {
    return <View testID="dual-ghost-spark" {...a11y} style={{ width, height }} />
  }

  const layout = dualSparkLayout(left, right, width, height)
  const up = sparkWing(left, layout, t['text-tertiary'])
  const down = sparkWing(right, layout, t['text-tertiary'])
  const segments = mergePhaseSegments(up.cur?.phaseSegments ?? [], down.cur?.phaseSegments ?? [])

  return (
    <View testID="dual-ghost-spark" {...a11y} style={{ paddingHorizontal: GHOST_GUTTER }}>
      <svg width={width} height={height} aria-hidden="true">
        <DualWingBloom
          wing={up}
          baseline={layout.baseUp}
          orientation="up"
          testID="dual-ghost-bloom-left"
        />
        <DualWingBloom
          wing={down}
          baseline={layout.baseDown}
          orientation="down"
          testID="dual-ghost-bloom-right"
        />

        {/* the ONE shared phase-coloured band, on top — ECC / CON labelled inside. */}
        <GhostBand
          segments={segments}
          x={layout.x}
          top={layout.bandTop}
          showLabels
          labelColor={alpha(t['text-primary'], 0.92)}
          targetTempoSeconds={targetTempoSeconds}
        />
        {showDeviceLabels && (
          <DualDeviceLabels
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            layout={layout}
            colors={t}
          />
        )}
      </svg>
    </View>
  )
}
