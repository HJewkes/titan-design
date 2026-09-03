// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostSpark — the per-rep velocity-time sparkline, on the band model (coherent with
 * the mirrored dual: single = one bloom + band; dual = two blooms sharing one band).
 *
 * A WIDE phase-coloured AXIS BAND ({@link GhostBand}) sits at the BOTTOM, filled per the
 * current rep's phase runs (eccentric magenta / concentric cyan / hold and idle grey),
 * each sized to its ACTUAL time extent, with the ECC / HOLD / CON labels shown INSIDE it.
 * Given `targetTempoSeconds` the runs also PACE — muted base, fill earned against the
 * prescribed phase duration, label toned ahead/on-pace/over. Velocity is
 * drawn as MAGNITUDE blooming UP from just above the band ({@link GhostBloom}) — the current
 * rep SOLID over faded grey GHOSTS of the prior reps. Phase is carried by the band colour
 * beneath the line (no ecc-below / con-above split), so single and dual read the same.
 *
 * The current line's TINT is control-aware silver/red (see {@link ghostLineColor}): a
 * controlled rep stays silver (dimming slightly with tempo drift), a collapsing rep goes
 * through shades of red. The line rides a paper-inspired ground treatment (soft contact
 * shadow), not a hard outline.
 */
import { View } from 'react-native'
import { ghostLineColor, clamp01 } from './fatigue-tokens'
import { GhostBand, BAND_H, BAND_GAP } from './GhostBand'
import { GhostBloom, type Pt } from './GhostBloom'
import { prescribedSegments, type TempoTuple } from './tempo-pacing'
import type { RepVelocityCurve } from './fatigue-model'

export interface GhostSparkProps {
  /** Per-rep velocity-time curves, oldest first (last = current rep). */
  curves: RepVelocityCurve[]
  width: number
  /** Plot height in px. Default 172. */
  height?: number
  /**
   * Prescribed tempo `[ecc, pauseBottom, con, pauseTop]` seconds — turns on the band's
   * phase PACING (muted base + earned fill, pacing-toned labels). Omit when nothing was
   * prescribed: the band then paints flat, which is the honest read.
   */
  targetTempoSeconds?: TempoTuple | null
}

export function GhostSpark({
  curves,
  width,
  height = 172,
  targetTempoSeconds = null,
}: GhostSparkProps) {
  const w = width
  const h = height
  const padL = 12
  const padR = 8
  const padTop = 10
  const padBot = 6

  // Nothing performed yet. With a prescription there is still something true to draw: the
  // SHAPE of the rep being asked for, laid out at its target durations and unfilled. An
  // empty axis says "no data"; this says "here is the rep you are about to do".
  if (curves.length === 0) {
    const prescribed = prescribedSegments(targetTempoSeconds)
    if (prescribed.length === 0) {
      return <View testID="ghost-spark" style={{ width: w, height: h }} />
    }
    const totalMs = prescribed[prescribed.length - 1].endMs
    const bandTopEmpty = h - padBot - BAND_H
    const xEmpty = (ms: number): number => padL + (ms / (totalMs * 1.04)) * (w - padL - padR)
    return (
      <View testID="ghost-spark" style={{ paddingHorizontal: 4 }}>
        <svg width={w} height={h}>
          <GhostBand
            segments={prescribed}
            x={xEmpty}
            top={bandTopEmpty}
            showLabels
            targetTempoSeconds={targetTempoSeconds}
            prescribed
          />
        </svg>
      </View>
    )
  }

  const cur = curves[curves.length - 1]
  const allSamples = curves.flatMap((c) => c.samples)
  const vmax = Math.max(0.01, ...allSamples.map((s) => s.velocityMps)) * 1.06
  const axisMaxT =
    Math.max(1, ...curves.map((c) => c.samples[c.samples.length - 1]?.tMs ?? 0)) * 1.04

  // Band pinned to the bottom; the bloom baseline sits a small gap above its top edge,
  // and magnitude blooms UP toward padTop.
  const bandBottom = h - padBot
  const bandTop = bandBottom - BAND_H
  const baseline = bandTop - BAND_GAP
  const plotH = Math.max(1, baseline - padTop)
  const x = (ms: number) => padL + (ms / axisMaxT) * (w - padL - padR)
  const mag = (v: number) => clamp01(v / vmax) * plotH

  const lineTint = ghostLineColor(cur.tempoDeviation, cur.grindSignature)
  const curPts: Pt[] = cur.samples.map((s) => [x(s.tMs), mag(s.velocityMps)])
  const ghostPts: Pt[][] = curves
    .slice(0, -1)
    .map((c) => c.samples.map((s): Pt => [x(s.tMs), mag(s.velocityMps)]))

  return (
    <View testID="ghost-spark" style={{ paddingHorizontal: 4 }}>
      <svg width={w} height={h}>
        {/* the ghost fan + paper-treated tinted current line, blooming up from the band. */}
        <GhostBloom
          current={curPts}
          ghosts={ghostPts}
          tint={lineTint}
          baseline={baseline}
          orientation="up"
        />

        {/* the WIDE phase-colored axis band at the bottom — the sole carrier of phase,
            filled per the current rep's phase runs, ECC/HOLD/CON labelled INSIDE. */}
        <GhostBand
          segments={cur.phaseSegments}
          x={x}
          top={bandTop}
          showLabels
          targetTempoSeconds={targetTempoSeconds}
        />
      </svg>
    </View>
  )
}
