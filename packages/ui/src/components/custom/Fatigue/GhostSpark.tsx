// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostSpark — the per-rep velocity-time sparkline, on the band model (coherent with
 * the dual ghost-line: single = one bloom + band; dual = two blooms + the same band).
 *
 * A WIDE phase-coloured AXIS BAND sits at the BOTTOM, filled per the current rep's phase
 * runs (eccentric magenta / concentric cyan / idle grey), each sized to its time extent,
 * with the ECC / CON labels INSIDE the band. Velocity is drawn as MAGNITUDE blooming UP
 * from just above the band — the current rep SOLID over faded grey GHOSTS of the prior
 * reps. Phase is carried by the band colour beneath the line (no ecc-below / con-above
 * split), so single and dual read the same.
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
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { roundTempo } from '../../../utils/workout-format'
import {
  FONT_UI,
  FONT_MONO,
  PHASE_AXIS_COLOR,
  TEMPO_DIGIT_COLOR,
  ghostLineColor,
  clamp01,
} from './fatigue-tokens'
import type { RepVelocityCurve } from './fatigue-model'

const t = getSemanticColors('dark')
const PARCH = t['text-primary']

const BAND_H = 16 // the wide phase-colored axis band, at the bottom
const BAND_GAP = 4 // gap between the band's top edge and the bloom's baseline

type Pt = [number, number]
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : ''
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

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
  const peak = cur.samples.reduce((a, b) => (b.velocityMps > a.velocityMps ? b : a), cur.samples[0])

  return (
    <Pressable
      testID="ghost-spark"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ paddingHorizontal: 4 }}
    >
      <svg width={w} height={h}>
        {/* prior reps — faded grey ghosts blooming up (absolute time → the fan is drift). */}
        {curves.slice(0, -1).map((c, rep) => (
          <path
            key={rep}
            d={smoothPath(c.samples.map((s) => [x(s.tMs), y(s.velocityMps)]))}
            fill="none"
            stroke={alpha(PARCH, 0.1 + rep * 0.015)}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ))}

        {/* current rep — a soft dark halo underlay, then the tinted line on top. */}
        <path
          d={smoothPath(curPts)}
          fill="none"
          stroke={alpha(primitiveColors.black, 0.55)}
          strokeWidth={7}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={smoothPath(curPts)}
          fill="none"
          stroke={lineTint}
          strokeWidth={3.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

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
        {cur.phaseSegments.map((seg, i) => {
          const segW = x(seg.endMs) - x(seg.startMs)
          if (segW <= 0) return null
          const label =
            seg.phase === 'eccentric' ? 'ECC' : seg.phase === 'concentric' ? 'CON' : null
          return (
            <g key={i}>
              <rect
                x={x(seg.startMs)}
                y={bandTop}
                width={Math.max(0, segW - 1)}
                height={BAND_H}
                rx={2}
                fill={PHASE_AXIS_COLOR[seg.phase]}
              />
              {revealed && label && segW > 20 && (
                <text
                  x={(x(seg.startMs) + x(seg.endMs)) / 2}
                  y={bandTop + BAND_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={t['text-primary']}
                  fontSize={8}
                  fontWeight={800}
                  letterSpacing={1}
                  fontFamily={FONT_UI}
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
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
