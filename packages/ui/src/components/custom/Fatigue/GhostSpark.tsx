// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostSpark — the per-rep velocity-time sparkline, on the band model (coherent with
 * the dual ghost-line: single = one bloom + band; dual = two blooms + the same band).
 *
 * A WIDE phase-coloured AXIS BAND ({@link GhostBand}) sits at the BOTTOM, filled per the
 * current rep's phase runs (eccentric magenta / concentric cyan / idle grey), each sized
 * to its time extent, with the ECC / CON labels INSIDE the band. Velocity is drawn as
 * MAGNITUDE blooming UP from just above the band ({@link GhostBloom}) — the current rep
 * SOLID over faded grey GHOSTS of the prior reps. Phase is carried by the band colour
 * beneath the line (no ecc-below / con-above split), so single and dual read the same.
 *
 * The current line's TINT is control-aware silver/red (see {@link ghostLineColor}): a
 * controlled rep stays silver (dimming slightly with tempo drift), a collapsing rep goes
 * through shades of red.
 *
 * At rest it's the band + the bloom. On HOVER the annotations bloom — the ECC/CON band
 * labels, the peak marker, and the current-rep TEMPO tuple (colored digits, overlaid
 * top-left) — with identical geometry, so nothing shifts. Tempo lives HERE (embedded);
 * there is no standalone hero-tempo treatment.
 */
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { roundTempo } from '../../../utils/workout-format'
import { FONT_UI, FONT_MONO, TEMPO_DIGIT_COLOR, ghostLineColor, clamp01 } from './fatigue-tokens'
import { GhostBand, BAND_H, BAND_GAP } from './GhostBand'
import { GhostBloom, type Pt } from './GhostBloom'
import type { RepVelocityCurve } from './fatigue-model'

const t = getSemanticColors('dark')

export interface GhostSparkProps {
  /** Per-rep velocity-time curves, oldest first (last = current rep). */
  curves: RepVelocityCurve[]
  /** Current-rep tempo tuple `[ecc, pauseBottom, con, pauseTop]` seconds — the hover overlay. `null` = no overlay. */
  tempoSeconds: [number, number, number, number] | null
  width: number
  /** Plot height in px. Default 172. */
  height?: number
  /** Pin the revealed (hover) state — for static screenshots / tests. */
  forceRevealed?: boolean
}

/** A bare inline tempo tuple — colored digits + grey dashes only (ecc magenta / con cyan). */
function MiniTempoTuple({ tempo }: { tempo: [number, number, number, number] }) {
  const digits = roundTempo(tempo)
  const dash = t['text-tertiary']
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {digits.map((n, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {i > 0 && (
            <Text
              style={{
                color: dash,
                fontSize: 11,
                fontWeight: '700',
                fontFamily: FONT_UI,
                marginHorizontal: 3,
              }}
            >
              -
            </Text>
          )}
          <Text
            style={{
              color: TEMPO_DIGIT_COLOR[i],
              fontSize: 11,
              fontWeight: '800',
              fontFamily: FONT_UI,
            }}
          >
            {n}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function GhostSpark({
  curves,
  tempoSeconds,
  width,
  height = 172,
  forceRevealed,
}: GhostSparkProps) {
  const [hovered, setHovered] = useState(false)
  const revealed = forceRevealed ?? hovered

  const w = width
  const h = height
  const padL = 12
  const padR = 8
  const padTop = 10
  const padBot = 6

  if (curves.length === 0) {
    return <View testID="ghost-spark" style={{ width: w, height: h }} />
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
  const y = (mag: number) => baseline - clamp01(mag / vmax) * plotH

  const lineTint = ghostLineColor(cur.tempoDeviation, cur.grindSignature)
  const curPts: Pt[] = cur.samples.map((s) => [x(s.tMs), y(s.velocityMps)])
  const ghostPts: Pt[][] = curves
    .slice(0, -1)
    .map((c) => c.samples.map((s): Pt => [x(s.tMs), y(s.velocityMps)]))
  const peak = cur.samples.reduce((a, b) => (b.velocityMps > a.velocityMps ? b : a), cur.samples[0])

  return (
    <Pressable
      testID="ghost-spark"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ paddingHorizontal: 4 }}
    >
      <svg width={w} height={h}>
        {/* the ghost fan + halo + tinted current line. */}
        <GhostBloom current={curPts} ghosts={ghostPts} tint={lineTint} />

        {/* peak marker (annotated view only) — ties back to the velocity hero. */}
        {revealed && peak && (
          <>
            <circle
              cx={x(peak.tMs)}
              cy={y(peak.velocityMps)}
              r={4}
              fill={lineTint}
              stroke={t['background-base']}
              strokeWidth={1.5}
            />
            <text
              x={x(peak.tMs) + 7}
              y={y(peak.velocityMps) - 6}
              fill={t['text-primary']}
              fontSize={11}
              fontWeight={800}
              fontFamily={FONT_UI}
            >
              peak {peak.velocityMps.toFixed(2)} m/s
            </text>
          </>
        )}

        {/* the WIDE phase-colored axis band at the bottom — the sole carrier of phase,
            filled per the current rep's phase runs, ECC/CON labelled INSIDE (on hover). */}
        <GhostBand segments={cur.phaseSegments} x={x} top={bandTop} showLabels={revealed} />
      </svg>

      {/* hover: the bare current-rep tempo tuple, overlaid top-left so nothing reflows. */}
      {revealed && tempoSeconds && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 4, left: 8 }}>
          <MiniTempoTuple tempo={tempoSeconds} />
        </View>
      )}
      {/* a11y: the tempo digits are decorative on hover; expose the tuple as a label. */}
      {tempoSeconds && (
        <Text
          accessibilityElementsHidden
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, fontFamily: FONT_MONO }}
        >
          tempo {roundTempo(tempoSeconds).join('-')}
        </Text>
      )}
    </Pressable>
  )
}
