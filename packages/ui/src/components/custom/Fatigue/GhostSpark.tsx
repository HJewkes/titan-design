// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostSpark — the per-rep velocity-time sparkline. The current rep draws SOLID over
 * faded grey GHOSTS of the prior reps (absolute time, so the fan reads as the set's
 * drift). The zero axis is the PHASE MARK: coloured per the current rep's phase runs
 * (eccentric magenta / concentric cyan / idle grey), each sized to its time extent.
 *
 * The current line's TINT is control-aware silver/red (see {@link ghostLineColor}): a
 * controlled rep stays silver (dimming slightly with tempo drift), a collapsing rep goes
 * through shades of red.
 *
 * At rest it's a bare sparkline. On HOVER the annotations bloom — the ECC/CON axis
 * labels, the concentric-peak marker, and the current-rep TEMPO tuple (colored digits,
 * overlaid top-left) — with identical geometry, so nothing shifts. Tempo lives HERE
 * (embedded); there is no standalone hero-tempo treatment.
 */
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { roundTempo } from '../../../utils/workout-format'
import {
  FONT_UI,
  FONT_MONO,
  PHASE_AXIS_COLOR,
  TEMPO_DIGIT_COLOR,
  ghostLineColor,
} from './fatigue-tokens'
import type { RepVelocityCurve, VelocitySample } from './fatigue-model'

const t = getSemanticColors('dark')
const PARCH = t['text-primary']
const AXIS = alpha(PARCH, 0.16)

/** Signed velocity for a sample: concentric above the axis, eccentric below, idle at zero. */
function signedVel(s: VelocitySample): number {
  if (s.phase === 'eccentric') return -s.velocityMps
  if (s.phase === 'concentric') return s.velocityMps
  return 0
}

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
  const padBot = 12

  if (curves.length === 0) {
    return <View testID="ghost-spark" style={{ width: w, height: h }} />
  }

  const cur = curves[curves.length - 1]
  const allSamples = curves.flatMap((c) => c.samples)
  const vmaxUp = Math.max(0.01, ...allSamples.map((s) => signedVel(s))) * 1.04
  const vmaxDown = Math.max(0.01, ...allSamples.map((s) => -signedVel(s))) * 1.04
  const axisMaxT =
    Math.max(1, ...curves.map((c) => c.samples[c.samples.length - 1]?.tMs ?? 0)) * 1.04

  const plotH = h - padTop - padBot
  const upH = plotH * (vmaxUp / (vmaxUp + vmaxDown))
  const downH = plotH - upH
  const mid = padTop + upH
  const x = (ms: number) => padL + (ms / axisMaxT) * (w - padL - padR)
  const y = (v: number) => (v >= 0 ? mid - (v / vmaxUp) * upH : mid + (-v / vmaxDown) * downH)

  const lineTint = ghostLineColor(cur.tempoDeviation, cur.grindSignature)
  const curPts: Pt[] = cur.samples.map((s) => [x(s.tMs), y(signedVel(s))])
  const peak = cur.samples.reduce((a, b) => (signedVel(b) > signedVel(a) ? b : a), cur.samples[0])

  return (
    <Pressable
      testID="ghost-spark"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ paddingHorizontal: 4 }}
    >
      <svg width={w} height={h}>
        {/* zero-axis phase marks — the axis IS the phase reference, coloured per the
            current rep's phase runs, each sized to its time extent. */}
        {cur.phaseSegments.map((seg, i) => {
          const segW = Math.max(0, x(seg.endMs) - x(seg.startMs) - 1.5)
          if (segW <= 0) return null
          const label =
            seg.phase === 'eccentric' ? 'ECC' : seg.phase === 'concentric' ? 'CON' : null
          return (
            <g key={i}>
              <rect
                x={x(seg.startMs) + 0.75}
                y={mid - 1.5}
                width={segW}
                height={3}
                rx={1.5}
                fill={PHASE_AXIS_COLOR[seg.phase]}
              />
              {revealed && label && x(seg.endMs) - x(seg.startMs) > 14 && (
                // label opposite its curve: ECC (below the axis) labels above; CON (above) labels below.
                <text
                  x={(x(seg.startMs) + x(seg.endMs)) / 2}
                  y={seg.phase === 'concentric' ? mid + 14 : mid - 7}
                  textAnchor="middle"
                  fill={t['text-tertiary']}
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
        <line x1={padL} y1={mid} x2={w - padR} y2={mid} stroke={AXIS} strokeWidth={1} />

        {/* prior reps — faded grey ghosts (absolute time → the fan is the set's drift). */}
        {curves.slice(0, -1).map((c, rep) => (
          <path
            key={rep}
            d={smoothPath(c.samples.map((s) => [x(s.tMs), y(signedVel(s))]))}
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
          stroke={alpha('#000000', 0.55)}
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

        {/* concentric-peak marker (annotated view only) — ties back to the velocity hero. */}
        {revealed && peak && (
          <>
            <circle
              cx={x(peak.tMs)}
              cy={y(signedVel(peak))}
              r={4}
              fill={lineTint}
              stroke={t['background-base']}
              strokeWidth={1.5}
            />
            <text
              x={x(peak.tMs) + 7}
              y={y(signedVel(peak)) - 6}
              fill={t['text-primary']}
              fontSize={11}
              fontWeight={800}
              fontFamily={FONT_UI}
            >
              peak {peak.velocityMps.toFixed(2)} m/s
            </text>
          </>
        )}
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
