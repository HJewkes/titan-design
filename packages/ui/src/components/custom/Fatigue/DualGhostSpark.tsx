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
import { alpha } from '../../../utils/colors'
import { FONT_UI, ghostLineColor, clamp01 } from './fatigue-tokens'
import { GhostBand, BAND_H, BAND_GAP } from './GhostBand'
import { GhostBloom, type Pt } from './GhostBloom'
import type { PhaseSegment, RepVelocityCurve } from './fatigue-model'

const t = getSemanticColors('dark')

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

/** Last sample time across a curve set, 0 when there is nothing to draw. */
function lastTMs(curves: RepVelocityCurve[]): number {
  return Math.max(0, ...curves.map((c) => c.samples[c.samples.length - 1]?.tMs ?? 0))
}

export function DualGhostSpark({
  left,
  right,
  width,
  height = 232,
  leftLabel = 'LEFT',
  rightLabel = 'RIGHT',
  showDeviceLabels = true,
}: DualGhostSparkProps) {
  const w = width
  const h = height
  const padL = 14
  const padR = 14
  const padTop = 22
  const padBot = 22

  if (left.length === 0 && right.length === 0) {
    return <View testID="dual-ghost-spark" style={{ width: w, height: h }} />
  }

  // The band sits on the vertical midline; each bloom's baseline is offset off a band edge
  // by BAND_GAP so a zero-velocity moment still sits clear of the band.
  const mid = padTop + (h - padTop - padBot) / 2
  const bandTop = mid - BAND_H / 2
  const baseUp = bandTop - BAND_GAP
  const baseDown = mid + BAND_H / 2 + BAND_GAP
  // ONE wing height for both sides — the second half of the shared magnitude scale.
  const wingH = Math.max(1, Math.min(baseUp - padTop, h - padBot - baseDown))

  const allSamples = [...left, ...right].flatMap((c) => c.samples)
  const vmax = Math.max(0.01, ...allSamples.map((s) => s.velocityMps)) * 1.06
  const axisMaxT = Math.max(1, lastTMs(left), lastTMs(right)) * 1.04
  const x = (ms: number) => padL + (ms / axisMaxT) * (w - padL - padR)
  const mag = (v: number) => clamp01(v / vmax) * wingH

  const toPts = (c: RepVelocityCurve): Pt[] => c.samples.map((s) => [x(s.tMs), mag(s.velocityMps)])
  const wing = (curves: RepVelocityCurve[]) => {
    const cur = curves[curves.length - 1]
    return {
      cur,
      current: cur ? toPts(cur) : [],
      ghosts: curves.slice(0, -1).map(toPts),
      tint: cur ? ghostLineColor(cur.tempoDeviation, cur.grindSignature) : t['text-tertiary'],
    }
  }
  const up = wing(left)
  const down = wing(right)
  const segments = mergePhaseSegments(up.cur?.phaseSegments ?? [], down.cur?.phaseSegments ?? [])

  return (
    <View testID="dual-ghost-spark" style={{ paddingHorizontal: 4 }}>
      <svg width={w} height={h}>
        {/* Same bloom, one prop flipped: LEFT grows UP, RIGHT grows DOWN. */}
        {up.current.length > 0 && (
          <g data-testid="dual-ghost-bloom-left">
            <GhostBloom
              current={up.current}
              ghosts={up.ghosts}
              tint={up.tint}
              baseline={baseUp}
              orientation="up"
            />
          </g>
        )}
        {down.current.length > 0 && (
          <g data-testid="dual-ghost-bloom-right">
            <GhostBloom
              current={down.current}
              ghosts={down.ghosts}
              tint={down.tint}
              baseline={baseDown}
              orientation="down"
            />
          </g>
        )}

        {/* the ONE shared phase-coloured band, on top — ECC / CON labelled inside. */}
        <GhostBand
          segments={segments}
          x={x}
          top={bandTop}
          showLabels
          labelColor={alpha(t['text-primary'], 0.92)}
        />
        {showDeviceLabels && (
          <>
            <text
              x={padL}
              y={padTop - 9}
              fontSize={9}
              fontWeight={800}
              letterSpacing={1}
              fontFamily={FONT_UI}
              fill={t['text-tertiary']}
            >
              {leftLabel}
            </text>
            <text
              x={padL}
              y={h - padBot + 15}
              fontSize={9}
              fontWeight={800}
              letterSpacing={1}
              fontFamily={FONT_UI}
              fill={t['text-tertiary']}
            >
              {rightLabel}
            </text>
          </>
        )}
      </svg>
    </View>
  )
}
