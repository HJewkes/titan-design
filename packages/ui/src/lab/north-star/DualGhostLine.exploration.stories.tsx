// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Dual Ghost Line` — DESIGN EXPLORATION (not shipped).
 *
 * DUAL-VOLTRA layout comparison for the ghost-spark chart at the bottom of the live
 * fatigue card. Single-voltra shows ONE ghost-spark (current rep solid, prior reps
 * faded ghosts, over a phase-colored zero axis — see `GrindingLine.exploration` and the
 * `LiveFatigueCard.exploration` specimens this is ported from). For a DUAL workout (two
 * devices, e.g. Left Arm / Right Arm) we must show BOTH devices' ghost-sparks and are
 * deciding the layout. This story renders TWO candidates, fed the SAME mock dual data,
 * at a realistic narrow card-column width, so an operator can pick:
 *
 *   • Option A — SIDE BY SIDE: two independent ghost-spark charts in a row. Each keeps
 *     its own phase axis with ECC-above / CON-below labels intact — the vertical is
 *     already spent on phase, so this is the "don't touch what works" option. Trade-off:
 *     halving the card's width per chart, at real wall-card width, crowds detail.
 *   • Option B — TOP/BOTTOM MIRRORED: one shared horizontal phase-colored spine; the
 *     LEFT device blooms UP, the RIGHT device blooms DOWN. Up/down is now spent on
 *     DEVICE identity, so phase can no longer use above/below — it rides the axis-
 *     segment COLOR alone (magenta ecc / cyan con), same as the diverging velocity hero
 *     (top=left / bottom=right around a shared axis). Trade-off: the shared spine only
 *     stays coherent if it is phase-NORMALIZED (each device's phase stretched onto a
 *     common template), so a real duration difference between the two devices' reps
 *     (the fatiguing arm's concentric genuinely ran longer) is compressed away — it
 *     shows up only as a change in line shape, not axis width.
 *
 * Both candidates reuse the LOCKED silver→red line-tint rule verbatim (the shared
 * `ghostLineColor` from `fatigue-tokens`): TWO per-rep signals — a controlled rep reads
 * SILVER, dimming slightly toward a quiet grey as `tempoDeviation` (0..1) grows; once
 * `grindSignature` (0..1, mid-concentric velocity collapse) crosses the threshold the line
 * warms through SHADES OF RED by severity. The eccentric is always drawn on-track silver
 * (a controlled lowering); only the concentric carries the tint decision.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import type { TextStyle, ViewStyle } from 'react-native'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'
import {
  SILVER,
  GRIND_THRESHOLD,
  ghostLineColor,
} from '../../components/custom/Fatigue/fatigue-tokens'

const C = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

const PARCH = C['text-primary']
const AXIS = alpha(C['text-primary'], 0.16)
/** The controlled / on-track tone for eccentric + non-concentric runs — silver, not green. */
const ON_TRACK = SILVER

// =================================================================================
// Composition-level surface helpers — inlined from the north-star `surfaces.ts`
// treatment (lab-scoped design language) so this story stays self-contained.
// =================================================================================
function perceivedLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return 0.5
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
function grainForTone(baseColor: string): string {
  const op = Math.min(0.24, Math.max(0.04, 0.02 + 0.31 * perceivedLuminance(baseColor))).toFixed(3)
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='120' height='120' filter='url(%23n)' opacity='${op}'/%3E%3C/svg%3E")`
  )
}
function paperSheet(tone: string): ViewStyle {
  return {
    backgroundColor: tone,
    backgroundImage: grainForTone(tone),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 22px rgba(0,0,0,0.50)',
  } as unknown as ViewStyle
}
function insetWell(tone: string): ViewStyle {
  return {
    backgroundColor: tone,
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.04)',
  } as unknown as ViewStyle
}
const debossLabel: TextStyle = {
  textShadowColor: 'rgba(255,255,255,0.11)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
}

// =================================================================================
// Mock dual-device data — two devices, each a real per-sample rep curve (controlled
// eccentric shared, concentric differs), plus a few faded prior "ghost" reps. The
// RIGHT arm is the more-fatigued device: its concentric runs longer AND collapses
// through a sticking point (crosses the grind threshold → warms through shades of red);
// the LEFT arm stays on-tempo (silver) so the asymmetry between devices is unambiguous.
// =================================================================================
type Phase = 'ecc' | 'pauseBottom' | 'con' | 'pauseTop'
interface Sample {
  t: number
  vel: number // m/s signed (concentric +, eccentric −)
  phase: Phase
}
interface DeviceSpec {
  key: 'left' | 'right'
  label: string
  sub: string
  eccMs: number
  pBMs: number
  conMs: number
  pTMs: number
  conVel: (u: number) => number
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** The controlled eccentric shape (m/s magnitude), identical for both devices — both
 *  arms lower together; only the concentric (the fatigue "tell") differs. */
const ECC_MS = 2600
const PB_MS = 340
const PT_MS = 240
function eccVel(u: number): number {
  return 0.46 * Math.sin(Math.PI * Math.pow(u, 0.55))
}

/** The PRESCRIBED concentric tempo both devices are judged against (ms). */
const PRESCRIBED_CON_MS = 950

const LEFT_ARM: DeviceSpec = {
  key: 'left',
  label: 'Left Arm',
  sub: 'on-tempo · healthy bar speed',
  eccMs: ECC_MS,
  pBMs: PB_MS,
  conMs: 950,
  pTMs: PT_MS,
  conVel: (u) => 1.0 * clamp01(u / 0.15) * (1 - 0.82 * smoothstep(0.8, 1.0, u)),
}
const RIGHT_ARM: DeviceSpec = {
  key: 'right',
  label: 'Right Arm',
  sub: 'fatiguing · concentric drifting long + sticking',
  eccMs: ECC_MS,
  pBMs: PB_MS,
  conMs: 1700,
  pTMs: PT_MS,
  // Peaks early, craters through a mid sticking point, small late recovery — a grind.
  conVel: (u) => {
    const spike = 0.85 * Math.exp(-Math.pow((u - 0.12) / 0.13, 2))
    const recover = 0.5 * Math.exp(-Math.pow((u - 0.95) / 0.12, 2))
    return Math.max(0.34, spike, recover)
  },
}
const DEVICES: DeviceSpec[] = [LEFT_ARM, RIGHT_ARM]

function hashNoise(i: number): number {
  const x = Math.sin(i * 127.1 + 11.7) * 43758.5453
  return x - Math.floor(x)
}
function genSamples(s: DeviceSpec, seed = 0): Sample[] {
  const segs: Array<{ phase: Phase; dur: number }> = [
    { phase: 'ecc', dur: s.eccMs },
    { phase: 'pauseBottom', dur: s.pBMs },
    { phase: 'con', dur: s.conMs },
    { phase: 'pauseTop', dur: s.pTMs },
  ]
  const total = s.eccMs + s.pBMs + s.conMs + s.pTMs
  const dt = 1000 / 11
  const out: Sample[] = []
  for (let t = 0; t <= total + 1; t += dt) {
    let acc = 0
    let phase: Phase = 'pauseTop'
    let u = 0
    for (let k = 0; k < segs.length; k++) {
      if (t < acc + segs[k].dur || k === segs.length - 1) {
        phase = segs[k].phase
        u = Math.min(1, Math.max(0, (t - acc) / Math.max(segs[k].dur, 1)))
        break
      }
      acc += segs[k].dur
    }
    let vel = 0
    if (phase === 'ecc') vel = -eccVel(u)
    else if (phase === 'con') vel = s.conVel(u)
    vel *= 1 + (hashNoise(out.length + seed * 991) - 0.5) * 0.04
    out.push({ t, vel, phase })
  }
  return out
}

const CURRENT: Record<string, Sample[]> = { left: genSamples(LEFT_ARM), right: genSamples(RIGHT_ARM) }
const TOTAL_MS: Record<string, number> = {
  left: LEFT_ARM.eccMs + LEFT_ARM.pBMs + LEFT_ARM.conMs + LEFT_ARM.pTMs,
  right: RIGHT_ARM.eccMs + RIGHT_ARM.pBMs + RIGHT_ARM.conMs + RIGHT_ARM.pTMs,
}
// Faded prior "ghost" reps per device — LEFT stays steady across its set; RIGHT's
// ghosts are progressively healthier (its earlier reps, before the sticking point
// set in), so the current (fatigued) rep visibly regresses from its own ghost fan.
const GHOSTS_LEFT: Sample[][] = [0, 1, 2].map((g) =>
  genSamples(
    { ...LEFT_ARM, conMs: 780 - g * 90, conVel: (u) => (1.0 - g * 0.05) * clamp01(u / (0.15 + g * 0.03)) * (1 - 0.82 * smoothstep(0.8, 1.0, u)) },
    g + 1
  )
)
const GHOSTS_RIGHT: Sample[][] = [0, 1, 2].map((g) =>
  genSamples(
    {
      ...RIGHT_ARM,
      conMs: 1050 + g * 120,
      conVel: (u) => 0.95 * clamp01(u / 0.14) * (1 - 0.6 * smoothstep(0.82, 1.0, u)) * (1 - g * 0.08),
    },
    g + 4
  )
)
const GHOSTS: Record<string, Sample[][]> = { left: GHOSTS_LEFT, right: GHOSTS_RIGHT }

// =================================================================================
// The LOCKED silver→red tint rule — the SHARED `ghostLineColor` from `fatigue-tokens`:
// a controlled rep reads SILVER (dimming slightly toward a quiet grey with tempo drift),
// a collapsing rep warms through SHADES OF RED by severity. No green, no amber.
// =================================================================================
/** How far the concentric DURATION overran the prescribed tempo (0..1). */
function tempoDeviation(s: DeviceSpec): number {
  return clamp01((s.conMs / PRESCRIBED_CON_MS - 1) / 1.3)
}
/** The GRIND SIGNATURE — velocity collapse within the concentric (peak → mid trough),
 *  the WA `getPhaseVelocityDropPct` concept, ignoring the natural end-of-ROM taper. */
function grindSignature(s: DeviceSpec): number {
  const N = 200
  let peak = 0
  let minMid = Infinity
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const v = s.conVel(u)
    if (v > peak) peak = v
    if (u >= 0.2 && u <= 0.85 && v < minMid) minMid = v
  }
  if (peak <= 0) return 0
  return clamp01((peak - minMid) / peak)
}
function isBreakdown(s: DeviceSpec): boolean {
  return grindSignature(s) >= GRIND_THRESHOLD
}
/** The concentric line tint for a device's current rep — the LOCKED silver→red rule. */
function conTone(s: DeviceSpec): string {
  return ghostLineColor(tempoDeviation(s), grindSignature(s))
}
function verdictWord(s: DeviceSpec): string {
  if (isBreakdown(s)) return grindSignature(s) < 0.6 ? 'collapse → warn' : 'collapse → alarm'
  const dev = tempoDeviation(s)
  return dev < 0.12 ? 'on-tempo · silver' : 'controlled · dimmer silver'
}

// --- SVG smoothing + phase-run splitting (lifted from the LiveFatigueCard specimen) ---
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
function phaseRuns(samples: Sample[]): Array<{ phase: Phase; pts: Sample[] }> {
  const runs: Array<{ phase: Phase; pts: Sample[] }> = []
  samples.forEach((s) => {
    const last = runs[runs.length - 1]
    if (!last || last.phase !== s.phase) {
      if (last) last.pts.push(s)
      runs.push({ phase: s.phase, pts: [s] })
    } else last.pts.push(s)
  })
  return runs
}
const AXIS_TONE: Record<Phase, string> = {
  ecc: primitiveRamps.magenta[800],
  pauseBottom: primitiveColors.charcoal[300],
  con: primitiveRamps.cyan[800],
  pauseTop: primitiveColors.charcoal[300],
}
function phaseSpans(s: DeviceSpec): Array<{ phase: Phase; t0: number; t1: number }> {
  const b = [0, s.eccMs, s.eccMs + s.pBMs, s.eccMs + s.pBMs + s.conMs, s.eccMs + s.pBMs + s.conMs + s.pTMs]
  return [
    { phase: 'ecc', t0: b[0], t1: b[1] },
    { phase: 'pauseBottom', t0: b[1], t1: b[2] },
    { phase: 'con', t0: b[2], t1: b[3] },
    { phase: 'pauseTop', t0: b[3], t1: b[4] },
  ]
}

// Shared plot scales across BOTH devices (current rep + all ghosts) so the two charts
// (Option A) or the two blooms (Option B) are directly, honestly comparable.
const ALL_SAMPLES = [...CURRENT.left, ...CURRENT.right, ...GHOSTS_LEFT.flat(), ...GHOSTS_RIGHT.flat()]
const VMAX_UP = Math.max(0.01, ...ALL_SAMPLES.map((s) => s.vel)) * 1.06
const VMAX_DOWN = Math.max(0.01, ...ALL_SAMPLES.map((s) => -s.vel)) * 1.06
const VMAX_MAG = Math.max(VMAX_UP, VMAX_DOWN)
const AXIS_MAX_T = Math.max(TOTAL_MS.left, TOTAL_MS.right) * 1.04

// =================================================================================
// OPTION A — independent ghost-spark per device, full phase axis (ECC above / CON
// below) intact. Real elapsed-ms x-scale, shared across both charts (so a device
// that runs long is honestly wider, not silently normalized away).
// =================================================================================
function GhostSparkSolo({ device, w, h }: { device: DeviceSpec; w: number; h: number }) {
  const padL = 12
  const padR = 10
  const padTop = 12
  const padBot = 12
  const plotH = h - padTop - padBot
  const upH = plotH * (VMAX_UP / (VMAX_UP + VMAX_DOWN))
  const downH = plotH - upH
  const mid = padTop + upH
  const x = (t: number) => padL + (t / AXIS_MAX_T) * (w - padL - padR)
  const y = (v: number) => (v >= 0 ? mid - (v / VMAX_UP) * upH : mid + (-v / VMAX_DOWN) * downH)
  const cur = CURRENT[device.key]
  const ghosts = GHOSTS[device.key]
  const conColor = conTone(device)
  const runColor = (phase: Phase) => (phase === 'con' ? conColor : ON_TRACK)
  const peakS = cur.reduce((acc, s) => (s.vel > acc.vel ? s : acc), cur[0])
  return (
    <svg width={w} height={h}>
      {phaseSpans(device).map((p, i) => {
        const segW = Math.max(0, x(p.t1) - x(p.t0) - 1.5)
        const label = p.phase === 'ecc' ? 'ECC' : p.phase === 'con' ? 'CON' : null
        return (
          <g key={i}>
            <rect x={x(p.t0) + 0.75} y={mid - 1.5} width={segW} height={3} rx={1.5} fill={AXIS_TONE[p.phase]} />
            {label && x(p.t1) - x(p.t0) > 16 && (
              <text
                x={(x(p.t0) + x(p.t1)) / 2}
                y={p.phase === 'con' ? mid + 14 : mid - 7}
                textAnchor="middle"
                fill={C['text-tertiary']}
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
      {ghosts.map((samples, g) => (
        <path
          key={`gh${g}`}
          d={smoothPath(samples.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={alpha(PARCH, 0.1 + g * 0.02)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {phaseRuns(cur).map((run, i) => (
        <path
          key={`sh${i}`}
          d={smoothPath(run.pts.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={alpha('#000000', 0.55)}
          strokeWidth={7}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {phaseRuns(cur).map((run, i) => (
        <path
          key={i}
          d={smoothPath(run.pts.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={runColor(run.phase)}
          strokeWidth={3.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      <circle cx={x(peakS.t)} cy={y(peakS.vel)} r={3.5} fill={conColor} stroke={PANEL_BG} strokeWidth={1.5} />
    </svg>
  )
}

// =================================================================================
// OPTION B — one shared spine. LEFT device blooms UP, RIGHT blooms DOWN. Phase can no
// longer use above/below (both halves are spent on device identity), so it rides the
// axis-segment COLOR alone. The spine is phase-NORMALIZED — each device's own phase
// durations are stretched onto a shared canonical template (the on-tempo / prescribed
// LEFT-arm timing) so the two blooms share one coherent x-axis regardless of the
// devices' actual (differing) rep durations.
// =================================================================================
const TEMPLATE_TOTAL = LEFT_ARM.eccMs + LEFT_ARM.pBMs + LEFT_ARM.conMs + LEFT_ARM.pTMs
const TEMPLATE_BOUNDS: Record<Phase, [number, number]> = (() => {
  const b0 = 0
  const b1 = LEFT_ARM.eccMs / TEMPLATE_TOTAL
  const b2 = (LEFT_ARM.eccMs + LEFT_ARM.pBMs) / TEMPLATE_TOTAL
  const b3 = (LEFT_ARM.eccMs + LEFT_ARM.pBMs + LEFT_ARM.conMs) / TEMPLATE_TOTAL
  const b4 = 1
  return { ecc: [b0, b1], pauseBottom: [b1, b2], con: [b2, b3], pauseTop: [b3, b4] }
})()
/** Map a device sample's real elapsed ms to the shared [0,1] phase-normalized spine:
 *  the sample's LOCAL progress within its own phase is stretched onto that phase's
 *  canonical (template) fraction of the spine. */
function normalizedU(sample: Sample, device: DeviceSpec): number {
  const spans = phaseSpans(device)
  const span = spans.find((s) => s.phase === sample.phase)
  if (!span) return 0
  const localU = span.t1 > span.t0 ? clamp01((sample.t - span.t0) / (span.t1 - span.t0)) : 0
  const [b0, b1] = TEMPLATE_BOUNDS[sample.phase]
  return b0 + localU * (b1 - b0)
}

function MirroredDual({ w, h }: { w: number; h: number }) {
  const padL = 14
  const padR = 14
  const padTop = 22
  const padBot = 22
  const plotH = h - padTop - padBot
  const halfH = plotH / 2
  const mid = padTop + halfH
  const x = (u: number) => padL + u * (w - padL - padR)
  const yUp = (mag: number) => mid - clamp01(mag / VMAX_MAG) * halfH
  const yDown = (mag: number) => mid + clamp01(mag / VMAX_MAG) * halfH

  const leftCur = CURRENT.left
  const rightCur = CURRENT.right
  const leftColor = conTone(LEFT_ARM)
  const rightColor = conTone(RIGHT_ARM)

  const path = (samples: Sample[], device: DeviceSpec, dir: 'up' | 'down') =>
    smoothPath(samples.map((s) => [x(normalizedU(s, device)), dir === 'up' ? yUp(Math.abs(s.vel)) : yDown(Math.abs(s.vel))]))

  const leftPeak = leftCur.reduce((acc, s) => (s.vel > acc.vel ? s : acc), leftCur[0])
  const rightPeak = rightCur.reduce((acc, s) => (s.vel > acc.vel ? s : acc), rightCur[0])

  /** Current-rep phase runs for a device, pre-rendered to path `d` + tint once. */
  const runsFor = (samples: Sample[], device: DeviceSpec, dir: 'up' | 'down', color: (phase: Phase) => string) =>
    phaseRuns(samples).map((run, i) => ({ key: i, d: path(run.pts, device, dir), color: color(run.phase) }))
  const leftRuns = runsFor(leftCur, LEFT_ARM, 'up', (phase) => (phase === 'con' ? leftColor : ON_TRACK))
  const rightRuns = runsFor(rightCur, RIGHT_ARM, 'down', (phase) => (phase === 'con' ? rightColor : ON_TRACK))

  return (
    <svg width={w} height={h}>
      {/* shared phase-colored spine — the ONLY carrier of phase in this layout. */}
      {(Object.keys(TEMPLATE_BOUNDS) as Phase[]).map((phase) => {
        const [b0, b1] = TEMPLATE_BOUNDS[phase]
        const segW = Math.max(0, x(b1) - x(b0) - 1.5)
        return <rect key={phase} x={x(b0) + 0.75} y={mid - 1.75} width={segW} height={3.5} rx={1.75} fill={AXIS_TONE[phase]} />
      })}
      <line x1={padL} y1={mid} x2={w - padR} y2={mid} stroke={AXIS} strokeWidth={1} />

      {/* faded ghost fans, both directions. */}
      {GHOSTS_LEFT.map((samples, g) => (
        <path key={`ghl${g}`} d={path(samples, LEFT_ARM, 'up')} fill="none" stroke={alpha(PARCH, 0.1 + g * 0.02)} strokeWidth={1.5} strokeLinejoin="round" />
      ))}
      {GHOSTS_RIGHT.map((samples, g) => (
        <path key={`ghr${g}`} d={path(samples, RIGHT_ARM, 'down')} fill="none" stroke={alpha(PARCH, 0.1 + g * 0.02)} strokeWidth={1.5} strokeLinejoin="round" />
      ))}

      {/* current reps — dark halo underlay, then tinted line. Ecc stays on-track silver;
          con carries the device's LOCKED-rule tint. */}
      {leftRuns.map((r) => (
        <path key={`shl${r.key}`} d={r.d} fill="none" stroke={alpha('#000000', 0.55)} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {rightRuns.map((r) => (
        <path key={`shr${r.key}`} d={r.d} fill="none" stroke={alpha('#000000', 0.55)} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {leftRuns.map((r) => (
        <path key={`l${r.key}`} d={r.d} fill="none" stroke={r.color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {rightRuns.map((r) => (
        <path key={`r${r.key}`} d={r.d} fill="none" stroke={r.color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      ))}

      <circle cx={x(normalizedU(leftPeak, LEFT_ARM))} cy={yUp(Math.abs(leftPeak.vel))} r={3.5} fill={leftColor} stroke={PANEL_BG} strokeWidth={1.5} />
      <circle cx={x(normalizedU(rightPeak, RIGHT_ARM))} cy={yDown(Math.abs(rightPeak.vel))} r={3.5} fill={rightColor} stroke={PANEL_BG} strokeWidth={1.5} />

      {/* device-identity labels — up/down now carries DEVICE, not phase. */}
      <text x={padL} y={padTop - 9} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI} fill={C['text-tertiary']}>
        LEFT ARM
      </text>
      <text x={padL} y={h - padBot + 15} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI} fill={C['text-tertiary']}>
        RIGHT ARM
      </text>
    </svg>
  )
}

// =================================================================================
// OPTION B2 — TOP/BOTTOM MIRRORED, but the central axis WIDENS into a phase-colored
// BAND. The band (a) makes phase timing the most legible element, (b) hosts the ECC/CON
// labels INSIDE it — recovering the phase text the plain mirrored layout loses — and
// (c) doubles as a gutter: both blooms are OFFSET off the band edges (a small gap) so the
// two lines can never touch the axis or overlap each other. Same phase-normalized spine.
// =================================================================================
const BAND_H = 16
const BAND_GAP = 4
function MirroredDualBand({ w, h }: { w: number; h: number }) {
  const padL = 14
  const padR = 14
  const padTop = 22
  const padBot = 22
  const plotH = h - padTop - padBot
  const mid = padTop + plotH / 2
  const bandTop = mid - BAND_H / 2
  const bandBot = mid + BAND_H / 2
  // Bloom baselines are OFFSET off the band edges by BAND_GAP, so a zero-velocity moment
  // (a pause) still sits clear of the band rather than kissing it.
  const baseUp = bandTop - BAND_GAP
  const baseDown = bandBot + BAND_GAP
  const upH = baseUp - padTop
  const downH = h - padBot - baseDown
  const x = (u: number) => padL + u * (w - padL - padR)
  const yUp = (mag: number) => baseUp - clamp01(mag / VMAX_MAG) * upH
  const yDown = (mag: number) => baseDown + clamp01(mag / VMAX_MAG) * downH

  const leftCur = CURRENT.left
  const rightCur = CURRENT.right
  const leftColor = conTone(LEFT_ARM)
  const rightColor = conTone(RIGHT_ARM)

  const path = (samples: Sample[], device: DeviceSpec, dir: 'up' | 'down') =>
    smoothPath(samples.map((s) => [x(normalizedU(s, device)), dir === 'up' ? yUp(Math.abs(s.vel)) : yDown(Math.abs(s.vel))]))

  const leftPeak = leftCur.reduce((acc, s) => (s.vel > acc.vel ? s : acc), leftCur[0])
  const rightPeak = rightCur.reduce((acc, s) => (s.vel > acc.vel ? s : acc), rightCur[0])
  const runsFor = (samples: Sample[], device: DeviceSpec, dir: 'up' | 'down', color: (phase: Phase) => string) =>
    phaseRuns(samples).map((run, i) => ({ key: i, d: path(run.pts, device, dir), color: color(run.phase) }))
  const leftRuns = runsFor(leftCur, LEFT_ARM, 'up', (phase) => (phase === 'con' ? leftColor : ON_TRACK))
  const rightRuns = runsFor(rightCur, RIGHT_ARM, 'down', (phase) => (phase === 'con' ? rightColor : ON_TRACK))

  return (
    <svg width={w} height={h}>
      {/* the wide phase-colored central BAND — carries phase timing + ECC/CON labels,
          and separates the two blooms. */}
      {(Object.keys(TEMPLATE_BOUNDS) as Phase[]).map((phase) => {
        const [b0, b1] = TEMPLATE_BOUNDS[phase]
        const segW = Math.max(0, x(b1) - x(b0))
        const label = phase === 'ecc' ? 'ECC' : phase === 'con' ? 'CON' : null
        return (
          <g key={phase}>
            <rect x={x(b0)} y={bandTop} width={segW} height={BAND_H} fill={AXIS_TONE[phase]} />
            {label && segW > 22 && (
              <text
                x={(x(b0) + x(b1)) / 2}
                y={mid + 2.8}
                textAnchor="middle"
                fill={alpha(PARCH, 0.92)}
                fontSize={8}
                fontWeight={800}
                letterSpacing={1.2}
                fontFamily={FONT_UI}
              >
                {label}
              </text>
            )}
          </g>
        )
      })}
      <rect x={padL} y={bandTop} width={w - padL - padR} height={BAND_H} rx={4} fill="none" stroke={alpha('#000000', 0.3)} strokeWidth={1} />

      {/* faded ghost fans, offset off the band, both directions. */}
      {GHOSTS_LEFT.map((samples, g) => (
        <path key={`ghl${g}`} d={path(samples, LEFT_ARM, 'up')} fill="none" stroke={alpha(PARCH, 0.1 + g * 0.02)} strokeWidth={1.5} strokeLinejoin="round" />
      ))}
      {GHOSTS_RIGHT.map((samples, g) => (
        <path key={`ghr${g}`} d={path(samples, RIGHT_ARM, 'down')} fill="none" stroke={alpha(PARCH, 0.1 + g * 0.02)} strokeWidth={1.5} strokeLinejoin="round" />
      ))}

      {/* current reps — halo underlay then tinted line. */}
      {leftRuns.map((r) => (
        <path key={`shl${r.key}`} d={r.d} fill="none" stroke={alpha('#000000', 0.55)} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {rightRuns.map((r) => (
        <path key={`shr${r.key}`} d={r.d} fill="none" stroke={alpha('#000000', 0.55)} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {leftRuns.map((r) => (
        <path key={`l${r.key}`} d={r.d} fill="none" stroke={r.color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {rightRuns.map((r) => (
        <path key={`r${r.key}`} d={r.d} fill="none" stroke={r.color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      ))}

      <circle cx={x(normalizedU(leftPeak, LEFT_ARM))} cy={yUp(Math.abs(leftPeak.vel))} r={3.5} fill={leftColor} stroke={PANEL_BG} strokeWidth={1.5} />
      <circle cx={x(normalizedU(rightPeak, RIGHT_ARM))} cy={yDown(Math.abs(rightPeak.vel))} r={3.5} fill={rightColor} stroke={PANEL_BG} strokeWidth={1.5} />

      <text x={padL} y={padTop - 9} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI} fill={C['text-tertiary']}>
        LEFT ARM
      </text>
      <text x={padL} y={h - padBot + 15} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI} fill={C['text-tertiary']}>
        RIGHT ARM
      </text>
    </svg>
  )
}

// =================================================================================
// Layout — the card mockups at a REALISTIC narrow card-column width (~330px; the
// established `FatigueCard` width in the shipped specimen is 300–340px, ~1/4 of a
// wide wall display), so Option A's cramping trade-off is honest, not idealized.
// =================================================================================
const CARD_W = 332
const CARD_PAD = 18

function DeviceLegendRow({ device }: { device: DeviceSpec }) {
  const tone = conTone(device)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} />
        <Text style={{ fontSize: 11, fontWeight: '800', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{device.label}</Text>
      </View>
      <Text style={{ fontSize: 8.5, fontFamily: FONT_MONO, color: tone, fontWeight: '700' }}>{verdictWord(device)}</Text>
    </View>
  )
}

function OptionCardA() {
  const innerW = CARD_W - CARD_PAD * 2
  const gap = 8
  const chartW = (innerW - gap) / 2
  const chartH = 168
  return (
    <View style={[{ width: CARD_W, borderRadius: 14, padding: CARD_PAD, gap: 10 }, paperSheet(PANEL_BG)]}>
      <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>OPTION A · SIDE BY SIDE</Text>
      <View style={{ flexDirection: 'row', gap }}>
        {DEVICES.map((d) => (
          <View key={d.key} style={{ width: chartW, gap: 4 }}>
            <DeviceLegendRow device={d} />
            <View style={[{ borderRadius: 8, padding: 4 }, insetWell(primitiveColors.charcoal[900])]}>
              <GhostSparkSolo device={d} w={chartW - 8} h={chartH} />
            </View>
          </View>
        ))}
      </View>
      <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 14, fontStyle: 'italic' }}>
        Each chart keeps its own full phase axis (ECC above · CON below) — legible per arm. Trade-off: at real card width, two
        charts halve to ~{Math.round(chartW)}px each — peak markers and axis labels crowd the narrow column.
      </Text>
    </View>
  )
}

function OptionCardB() {
  const innerW = CARD_W - CARD_PAD * 2
  const chartH = 232
  return (
    <View style={[{ width: CARD_W, borderRadius: 14, padding: CARD_PAD, gap: 10 }, paperSheet(PANEL_BG)]}>
      <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
        OPTION B · TOP/BOTTOM MIRRORED
      </Text>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <DeviceLegendRow device={LEFT_ARM} />
        <DeviceLegendRow device={RIGHT_ARM} />
      </View>
      <View style={[{ borderRadius: 8, padding: 4 }, insetWell(primitiveColors.charcoal[900])]}>
        <MirroredDual w={innerW - 8} h={chartH} />
      </View>
      <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 14, fontStyle: 'italic' }}>
        One shared spine reclaims full chart width per device (mirrored up/down) — no split-width penalty. Trade-off: phase can no
        longer sit above/below (both halves are spent on device identity), so it rides axis-segment COLOR alone, no ECC/CON text;
        and the spine is phase-normalized, so Right Arm&apos;s concentric genuinely running ~79% longer (1700ms vs 950ms) shows
        only as line shape, not a wider axis segment.
      </Text>
    </View>
  )
}

function OptionCardB2() {
  const innerW = CARD_W - CARD_PAD * 2
  const chartH = 232
  return (
    <View style={[{ width: CARD_W, borderRadius: 14, padding: CARD_PAD, gap: 10 }, paperSheet(PANEL_BG)]}>
      <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
        OPTION B2 · MIRRORED + AXIS BAND
      </Text>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <DeviceLegendRow device={LEFT_ARM} />
        <DeviceLegendRow device={RIGHT_ARM} />
      </View>
      <View style={[{ borderRadius: 8, padding: 4 }, insetWell(primitiveColors.charcoal[900])]}>
        <MirroredDualBand w={innerW - 8} h={chartH} />
      </View>
      <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 14, fontStyle: 'italic' }}>
        The axis widens into a phase-colored BAND — it carries the ECC/CON labels INSIDE it (recovering the phase text plain mirrored
        loses) and doubles as a gutter: both blooms are offset off its edges, so the two lines never touch the axis or overlap. Phase
        timing becomes the most legible element; each device reads as one clean stroke.
      </Text>
    </View>
  )
}

// --- Scaffolding -----------------------------------------------------------------
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 22 }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/North Star/Dual Ghost Line',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** The head-to-head: same dual mock data (Left Arm on-tempo, Right Arm fatiguing/grinding),
 *  two candidate layouts, at realistic narrow card-column width. */
export const SideBySideVsMirrored: Story = {
  name: 'Side-by-side vs top/bottom mirrored',
  render: () => (
    <Page>
      <View style={{ gap: 6, maxWidth: 920 }}>
        <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
          DUAL-VOLTRA GHOST-SPARK · LAYOUT DECISION
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: FONT_HEAD, color: C['text-primary'] }}>
          Two devices, one fatigue card — where does the second ghost-spark go?
        </Text>
        <Text style={{ fontSize: 13, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 19 }}>
          Same mock dual set both columns: Left Arm on-tempo (silver), Right Arm fatiguing — concentric drifting long and
          sticking through a mid-rep collapse (grind signature crosses the red threshold). Both candidates apply the LOCKED
          silver→red tint rule verbatim (tempo deviation dims the silver, grind signature warms it through shades of red).
          Rendered at the established ~330px card-column width so the real trade-off — cramped detail vs. lost phase labels —
          reads honestly, not idealized.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <OptionCardA />
        <OptionCardB />
        <OptionCardB2 />
      </View>
    </Page>
  ),
}
