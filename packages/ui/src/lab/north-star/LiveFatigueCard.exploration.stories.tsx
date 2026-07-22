// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Live Fatigue Card` — DESIGN EXPLORATION (not shipped).
 *
 * The redesigned LIVE PANEL for the wall dashboard. It is two things:
 *   1. the velocity HERO (primary) — the shipped `VelocityStrip` hero with the
 *      velocity-loss threshold BANDS layered behind the bars (P3);
 *   2. a secondary UNIFIED FATIGUE CARD (P2) that replaces the old separate
 *      stop-set-decision + fatigue-vector cards with ONE card carrying:
 *        • the novel combined GHOST-TRAIL + PHASE-ANNOTATED current-rep chart (P1),
 *        • a compact ROM-progression read, and
 *        • three fatigue status lights (velocity-loss · ROM · tempo) + a verdict.
 *
 * CHANNEL DISCIPLINE — three questions, three deliberately distinct color languages:
 *   • The HERO owns the one saturated VELOCITY-ZONE hue (green→red ramp, by m/s).
 *   • The COMBINED CHART owns a diverging TEMPO-ADHERENCE color: warm when a phase
 *     runs FASTER than its prescribed tempo (rushing), cool when SLOWER (lagging),
 *     neutral parchment when on-tempo — with a per-phase base tone so phase identity
 *     and tempo adherence ride the ONE line color together. Phase is reinforced by
 *     geometry (eccentric below the zero axis, concentric above) + the target-tempo
 *     bands behind the line.
 *   • ROM is neutral PARCHMENT geometry; the status lights use status tones only.
 *
 * Mocked realistically: a fatiguing 8-rep cable press taken deep — velocity decays,
 * ROM shrinks, tempo degrades, and reps 4 & 7 are cheats (dropped/fast eccentric +
 * cut ROM, speed propped). Units honest: velocity m/s, load lb, time s. Nothing here
 * modifies a shipped component; the hero CONSUMES the shipped VelocityStrip.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'
import { View, Text, Pressable, type ViewStyle } from 'react-native'
import { LiveAuraFrame, VelocityStrip } from '../../components'
import { Tooltip } from '../../components/ui/tooltip/Tooltip'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../theme/tokens/primitives'
import { WORKOUT_TOKENS } from '../../theme/workout-tokens'
import { alpha } from '../../utils/colors'
import { formatVelocity, roundTempo } from '../../utils/workout-format'
import { paperSheet, insetWell, debossLabel } from './surfaces'

const C = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

// VELOCITY-ZONE ramp (the hero's one saturated hue), mirrors the shipped strip.
const S = WORKOUT_TOKENS.scale
function velColor(ms: number): string {
  if (ms >= 1.0) return S.green
  if (ms >= 0.75) return S.yellow
  if (ms >= 0.5) return S.orange
  return S.red
}
// Neutral geometry — parchment / steel. Never a hue.
const PARCH = C['text-primary']
const AXIS = alpha(C['text-primary'], 0.16)
const GRID = alpha(C['text-primary'], 0.08)
const ROM_STD_MM = 900 // full working range

// =================================================================================
// Mock — a fatiguing 8-rep cable press (ported from the CurvesPerRep exploration).
// =================================================================================
interface RepSpec {
  romMm: number
  eccMs: number
  pBMs: number
  conMs: number
  pTMs: number
  eccControl: number // 1 = controlled lowering, 0 = dropped / fast
  conPower: number // 1 = explosive, 0 = grinding
  loadLb: number
  note: string
}
const SPECS: RepSpec[] = [
  { romMm: 900, eccMs: 2600, pBMs: 420, conMs: 950, pTMs: 300, eccControl: 0.95, conPower: 0.9, loadLb: 62, note: 'textbook' },
  { romMm: 895, eccMs: 2650, pBMs: 380, conMs: 1000, pTMs: 250, eccControl: 0.94, conPower: 0.86, loadLb: 62, note: 'textbook' },
  { romMm: 880, eccMs: 2500, pBMs: 340, conMs: 1100, pTMs: 160, eccControl: 0.9, conPower: 0.78, loadLb: 62, note: 'slight slow' },
  { romMm: 715, eccMs: 1300, pBMs: 120, conMs: 900, pTMs: 90, eccControl: 0.34, conPower: 0.82, loadLb: 62, note: 'CHEAT — dropped ecc + cut ROM, speed propped' },
  { romMm: 840, eccMs: 2300, pBMs: 300, conMs: 1500, pTMs: 90, eccControl: 0.85, conPower: 0.44, loadLb: 62, note: 'honest grind — control intact' },
  { romMm: 800, eccMs: 2000, pBMs: 240, conMs: 1750, pTMs: 80, eccControl: 0.68, conPower: 0.34, loadLb: 62, note: 'grinding' },
  { romMm: 645, eccMs: 1200, pBMs: 100, conMs: 1650, pTMs: 70, eccControl: 0.3, conPower: 0.4, loadLb: 62, note: 'CHEAT — dropped ecc, gutted ROM' },
  { romMm: 600, eccMs: 1250, pBMs: 70, conMs: 2300, pTMs: 60, eccControl: 0.34, conPower: 0.24, loadLb: 62, note: 'spent — short + long grind' },
]

/** The PRESCRIBED tempo (ms per phase) — the target the line color is judged against. */
const TARGET = { ecc: 2600, pauseBottom: 400, con: 950, pauseTop: 280 }
const TARGET_TOTAL = TARGET.ecc + TARGET.pauseBottom + TARGET.con + TARGET.pauseTop
/** The prescribed tempo as the [ecc, pauseBottom, con, pauseTop] seconds tuple TempoDisplay renders. */
const TEMPO_TUPLE: [number, number, number, number] = [TARGET.ecc / 1000, TARGET.pauseBottom / 1000, TARGET.con / 1000, TARGET.pauseTop / 1000]

type Phase = 'ecc' | 'pauseBottom' | 'con' | 'pauseTop'
interface Sample {
  t: number
  vel: number // m/s signed (con +, ecc −)
  phase: Phase
}
function specTotal(s: RepSpec): number {
  return s.eccMs + s.pBMs + s.conMs + s.pTMs
}
function hashNoise(i: number): number {
  const x = Math.sin(i * 127.1 + 11.7) * 43758.5453
  return x - Math.floor(x)
}
function eccVelMm(u: number, s: RepSpec): number {
  const mean = s.romMm / (s.eccMs / 1000)
  const peak = mean * (Math.PI / 2)
  const skew = 0.5 - (1 - s.eccControl) * 0.22
  const sharp = 1 + (1 - s.eccControl) * 1.3
  const hump = Math.pow(Math.sin(Math.PI * Math.pow(u, skew)), sharp)
  return peak * hump * (1 + (1 - s.eccControl) * 0.7)
}
function conVelMm(u: number, s: RepSpec): number {
  const mean = s.romMm / (s.conMs / 1000)
  const peak = mean * (Math.PI / 2)
  const skew = 0.5 - s.conPower * 0.18
  const stick = (1 - s.conPower) * 0.32 * Math.exp(-Math.pow((u - 0.46) / 0.16, 2))
  const shape = Math.max(0.02, Math.sin(Math.PI * Math.pow(u, skew)) - stick)
  return peak * shape * (0.72 + s.conPower * 0.5)
}
function genSamples(s: RepSpec): Sample[] {
  const segs: Array<{ phase: Phase; dur: number }> = [
    { phase: 'ecc', dur: s.eccMs },
    { phase: 'pauseBottom', dur: s.pBMs },
    { phase: 'con', dur: s.conMs },
    { phase: 'pauseTop', dur: s.pTMs },
  ]
  const total = specTotal(s)
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
    let velMm = 0
    if (phase === 'ecc') velMm = -eccVelMm(u, s)
    else if (phase === 'con') velMm = conVelMm(u, s)
    velMm *= 1 + (hashNoise(out.length) - 0.5) * 0.05
    out.push({ t, vel: velMm / 1000, phase })
  }
  return out
}

const SETS: Sample[][] = SPECS.map(genSamples)
const TOTALS: number[] = SPECS.map(specTotal)
/** Per-rep MEAN concentric velocity (m/s) — mm/ms == m/s — the hero's + VL's metric. */
const MEAN_VEL: number[] = SPECS.map((s) => s.romMm / s.conMs)
const V_BEST = Math.max(...MEAN_VEL)
// ASYMMETRIC velocity extents — concentric (above the axis) and eccentric (below) each get
// their own scale + tightened to the real data + a hair of headroom, so the curves fill the
// plot instead of floating (the con peaks reach much higher than the ecc dips otherwise).
const VMAX_UP = Math.max(0.01, ...SETS.flat().map((s) => s.vel)) * 1.04
const VMAX_DOWN = Math.max(0.01, ...SETS.flat().map((s) => -s.vel)) * 1.04
const AXIS_MAX_T = Math.max(...TOTALS) * 1.04 // absolute time axis, shared by every rep
const ROM_PCT: number[] = SPECS.map((s) => s.romMm / ROM_STD_MM)

// =================================================================================
// Tempo adherence → the ONE line color of the combined chart.
// Per phase: how the rep's ACTUAL duration compares to the PRESCRIBED tempo.
//   adh > 0  → phase ran FASTER than target (rushing)  → warm
//   adh < 0  → phase ran SLOWER than target (lagging)  → cool
//   adh ≈ 0  → on tempo → the phase's neutral base tone
// =================================================================================
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
function phaseAdherence(s: RepSpec): Record<Phase, number> {
  const ratio = (target: number, actual: number) => clamp(target / Math.max(actual, 1) - 1, -1, 1)
  return {
    ecc: ratio(TARGET.ecc, s.eccMs),
    pauseBottom: ratio(TARGET.pauseBottom, s.pBMs),
    con: ratio(TARGET.con, s.conMs),
    pauseTop: ratio(TARGET.pauseTop, s.pTMs),
  }
}
const ADH: Record<Phase, number>[] = SPECS.map(phaseAdherence)

// GREEN-ON-TRACK diverging palette for the current-rep line — the same semantic StatusDot
// uses (on-track = status-success green, deviation = status-warning amber, off = status-error
// red). The line reads GREEN when a phase is on its prescribed tempo and warms toward amber →
// red as it deviates (rushing OR lagging); direction now lives on the axis, magnitude on the line.
const ON_TRACK = C['status-success']
const DEVIATION = C['status-warning']
const OFF_TRACK = C['status-error']

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[m(ar, br), m(ag, bg), m(ab, bb)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
/** Green-on-track line color: green when on-tempo, diverging green → amber → red by the
 *  MAGNITUDE of the phase's tempo deviation (rush or lag both read as "off"). */
function lineColor(adh: number): string {
  const sev = Math.min(1, Math.abs(adh))
  return sev <= 0.5 ? mixHex(ON_TRACK, DEVIATION, (sev / 0.5) * 0.92) : mixHex(DEVIATION, OFF_TRACK, (sev - 0.5) / 0.5)
}

// --- SVG smoothing ---------------------------------------------------------------
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

// =================================================================================
// P1 — COMBINED CHART: ghost trail + target-tempo bands + tempo-colored current rep.
// =================================================================================
const PHASE_LABEL: Record<Phase, string> = { ecc: 'ECC', pauseBottom: 'PAUSE', con: 'CON', pauseTop: 'HOLD' }
function targetSpans(): Array<{ phase: Phase; t0: number; t1: number }> {
  const b = [0, TARGET.ecc, TARGET.ecc + TARGET.pauseBottom, TARGET.ecc + TARGET.pauseBottom + TARGET.con, TARGET_TOTAL]
  return [
    { phase: 'ecc', t0: b[0], t1: b[1] },
    { phase: 'pauseBottom', t0: b[1], t1: b[2] },
    { phase: 'con', t0: b[2], t1: b[3] },
    { phase: 'pauseTop', t0: b[3], t1: b[4] },
  ]
}
/** Split one rep's samples into contiguous per-phase runs (shared boundary point → no gap). */
function phaseRuns(samples: Sample[]): Array<{ phase: Phase; pts: Sample[] }> {
  const runs: Array<{ phase: Phase; pts: Sample[] }> = []
  samples.forEach((s, i) => {
    const last = runs[runs.length - 1]
    if (!last || last.phase !== s.phase) {
      if (last) last.pts.push(s) // bridge the seam
      runs.push({ phase: s.phase, pts: [s] })
    } else last.pts.push(s)
    void i
  })
  return runs
}

function CombinedChart({
  w = 760,
  h = 300,
  current = 7,
  compact = false,
  revealed = true,
  axisCaptions = true,
  phaseMarks = 'bands',
}: {
  w?: number
  h?: number
  current?: number
  compact?: boolean
  /** When false (the resting SPARK state), all TEXT chrome + the peak marker are dropped —
   *  only the ghost trails, the tempo-colored current line, the faint phase washes and the
   *  zero axis remain. `true` restores the full annotated view (used on hover). */
  revealed?: boolean
  /** The "time →" / "rep N (now)" bottom captions. Off in the spark variant (even when
   *  revealed) so the hover legend overlay has the bottom edge to itself. */
  axisCaptions?: boolean
  /** How the prescribed phases read behind the curve: `bands` = full-height shaded washes;
   *  `segments` = thin color-coded line segments along the BASE (lighter). ECC/CON labelled
   *  (on hover), pause/hold unlabelled; the hold segment only when the prescribed hold > 0. */
  phaseMarks?: 'bands' | 'segments'
}) {
  // `compact` (in the narrow card column) trims the L/R gutters and drops the CON/ECC
  // side labels so the plot uses more of the width — geometry + bands still carry phase.
  const padL = compact ? 12 : 40
  const padR = compact ? 8 : 14
  // Compact charts drop the top phase-label band + bottom axis captions, so the vertical
  // margins tighten right down — the curves fill the height instead of floating.
  const padTop = compact ? 10 : 26
  const padBot = compact ? 12 : 24
  // Split the plot at the zero axis proportional to the up/down data extents, so BOTH the
  // concentric (up) and eccentric (down) lobes fill their half rather than floating.
  const plotH = h - padTop - padBot
  const upH = plotH * (VMAX_UP / (VMAX_UP + VMAX_DOWN))
  const downH = plotH - upH
  const mid = padTop + upH
  const x = (t: number) => padL + (t / AXIS_MAX_T) * (w - padL - padR)
  const y = (v: number) => (v >= 0 ? mid - (v / VMAX_UP) * upH : mid + (-v / VMAX_DOWN) * downH)
  const cur = SETS[current]
  const adh = ADH[current]
  const peakS = cur.reduce((a, b) => (b.vel > a.vel ? b : a), cur[0])
  const bandTone: Record<Phase, string> = {
    ecc: alpha(PARCH, 0.05),
    pauseBottom: alpha('#000000', 0.24),
    con: alpha(PARCH, 0.08),
    pauseTop: alpha('#000000', 0.24),
  }
  // The AXIS phase colors — the DARKER, muted tempo phase tones (the HeroTempo cadence-bar
  // refinement: magenta/cyan [800]s + neutral pauses), so the axis reads as a quiet phase
  // reference rather than competing with the colored current line sitting on it.
  const markColor: Record<Phase, string> = {
    ecc: primitiveRamps.magenta[800],
    pauseBottom: primitiveColors.charcoal[300],
    con: primitiveRamps.cyan[800],
    pauseTop: primitiveColors.charcoal[300],
  }
  return (
    <svg width={w} height={h}>
      {/* BANDS mode — full-height prescribed-phase washes behind the curve + a plain axis. */}
      {phaseMarks === 'bands' &&
        targetSpans().map((p, i) => (
          <g key={i}>
            <rect x={x(p.t0)} y={padTop} width={Math.max(0, x(p.t1) - x(p.t0))} height={h - padTop - padBot} fill={bandTone[p.phase]} />
            {revealed && x(p.t1) - x(p.t0) > 16 && (
              <text x={(x(p.t0) + x(p.t1)) / 2} y={padTop - 8} textAnchor="middle" fill={C['text-tertiary']} fontSize={8} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI}>
                {PHASE_LABEL[p.phase]}
              </text>
            )}
          </g>
        ))}
      {phaseMarks === 'bands' && <line x1={padL} y1={mid} x2={w - padR} y2={mid} stroke={AXIS} strokeWidth={1} />}

      {/* SEGMENTS mode — the zero AXIS itself is the phase mark: colored per prescribed phase
          along its length (ecc / pause / con / hold), sized to each phase's time extent. */}
      {phaseMarks === 'segments' &&
        targetSpans().map((p, i) => {
          if (p.phase === 'pauseTop' && TARGET.pauseTop <= 0) return null // no hold segment without a prescribed hold
          const segW = Math.max(0, x(p.t1) - x(p.t0) - 1.5)
          const label = p.phase === 'ecc' ? 'ECC' : p.phase === 'con' ? 'CON' : null
          return (
            <g key={i}>
              <rect x={x(p.t0) + 0.75} y={mid - 1.5} width={segW} height={3} rx={1.5} fill={markColor[p.phase]} />
              {revealed && label && x(p.t1) - x(p.t0) > 14 && (
                // ECC labels below the axis (its lobe), CON above — each in its own half.
                <text x={(x(p.t0) + x(p.t1)) / 2} y={p.phase === 'con' ? mid - 6 : mid + 13} textAnchor="middle" fill={C['text-tertiary']} fontSize={8} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI}>
                  {label}
                </text>
              )}
            </g>
          )
        })}
      {!compact && revealed && <text x={padL - 6} y={y(VMAX_UP * 0.62)} textAnchor="end" fill={C['text-tertiary']} fontSize={8} fontFamily={FONT_MONO}>CON</text>}
      {!compact && revealed && <text x={padL - 6} y={y(-VMAX_DOWN * 0.55)} textAnchor="end" fill={C['text-tertiary']} fontSize={8} fontFamily={FONT_MONO}>ECC</text>}
      {/* prior reps — faded grey ghosts (absolute time → the fan is the set's drift). */}
      {SETS.slice(0, current).map((samples, rep) => (
        <path
          key={rep}
          d={smoothPath(samples.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={alpha(PARCH, 0.1 + rep * 0.015)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {/* current rep — SHADOW/HALO underlay first: a soft dark, slightly wider stroke of the
          same path, so the featured line separates from the grey ghost fan + the colored axis. */}
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
      {/* current rep — one line, colored GREEN when on-tempo, warming amber → red as each
          phase deviates (the green-on-track read). */}
      {phaseRuns(cur).map((run, i) => (
        <path
          key={i}
          d={smoothPath(run.pts.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={lineColor(adh[run.phase])}
          strokeWidth={3.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {/* peak concentric marker — ties back to the velocity hero (annotated view only). */}
      {revealed && <circle cx={x(peakS.t)} cy={y(peakS.vel)} r={4} fill={lineColor(adh.con)} stroke={PANEL_BG} strokeWidth={1.5} />}
      {revealed && (
        <text x={x(peakS.t) + 7} y={y(peakS.vel) - 6} fill={C['text-primary']} fontSize={11} fontWeight={800} fontFamily={FONT_UI}>
          peak {peakS.vel.toFixed(2)} m/s
        </text>
      )}
      {/* "now" caption — pinned bottom-right so it never collides with the "time →" label. */}
      {revealed && axisCaptions && (
        <text x={w - padR} y={h - padBot + 16} textAnchor="end" fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>
          rep {current + 1} (now) · {(TOTALS[current] / 1000).toFixed(1)}s
        </text>
      )}
      {revealed && axisCaptions && <text x={padL} y={h - padBot + 16} fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>time →</text>}
    </svg>
  )
}

/**
 * The STRIPPED sparkline variant — resting, it's just the shapes + color: the ghost trails,
 * the green-on-track current line, and the phase-colored axis, sitting BARE in the card (no
 * frame, no labels, no peak marker). ON HOVER the ANNOTATIONS fade in — the ECC/CON axis
 * labels + the peak marker — but the chart stays FRAMELESS in both states (no inset box, no
 * legend). `forceRevealed` pins the revealed state (for screenshots). The SVG geometry is
 * identical, so the line never shifts — only annotations fade in.
 */
/** A bare inline tempo tuple — the colored digits + grey dashes ONLY (no cell boxes / backing),
 *  matching the rail readout's magenta-ecc / cyan-con digit coloring. Transparent. */
function MiniTempoTuple() {
  const digits = roundTempo(TEMPO_TUPLE)
  const digitColor = [primitiveRamps.magenta[400], '#6B7280', primitiveRamps.cyan[300], '#6B7280'] // ecc · pause · con · hold
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {digits.map((n, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {i > 0 && <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif', marginHorizontal: 3 }}>-</Text>}
          <Text style={{ color: digitColor[i], fontSize: 11, fontWeight: '800', fontFamily: 'Inter, sans-serif' }}>{n}</Text>
        </View>
      ))}
    </View>
  )
}

function SparkCombinedChart({
  w,
  h = 168,
  current = 7,
  forceRevealed,
  phaseMarks = 'segments',
}: {
  w: number
  h?: number
  current?: number
  forceRevealed?: boolean
  phaseMarks?: 'bands' | 'segments'
}) {
  const [hovered, setHovered] = useState(false)
  const revealed = forceRevealed ?? hovered
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      // Frameless in BOTH states — only the annotations fade in on hover, never a box.
      style={{ paddingHorizontal: 4 }}
    >
      <CombinedChart w={w} h={h} current={current} compact revealed={revealed} axisCaptions={false} phaseMarks={phaseMarks} />
      {/* on hover: the bare prescribed-tempo tuple (colored digits + dashes only, no backing),
          overlaid top-left so nothing reflows. */}
      {revealed && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 4, left: 8 }}>
          <MiniTempoTuple />
        </View>
      )}
    </Pressable>
  )
}

// =================================================================================
// P2 — ROM PROGRESSION: per-rep depth vs the working standard, neutral parchment.
// =================================================================================
const ROM_SHORT_THRESH = 0.85 // below the working standard = a short rep

/**
 * The compact ROM bar strip — the silver/red language (parchment-neutral bars, red for a
 * SHORT rep, current rep emphasised), sized like the collapsed velocity strip. When
 * `revealed` it also paints the working-standard + short-threshold reference lines and the
 * faint red short-zone; resting, the bars alone carry it at a glance.
 */
function RomStrip({ width, height, current, revealed }: { width: number; height: number; current: number; revealed: boolean }) {
  const n = current + 1
  const barW = (width - (n - 1) * 3) / n
  return (
    <View style={{ width, height, position: 'relative', flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      {revealed && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: ROM_SHORT_THRESH * height, backgroundColor: alpha(C['status-error'], 0.06) }} />}
      {revealed && <View style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: alpha(PARCH, 0.4) }} />}
      {revealed && <View style={{ position: 'absolute', left: 0, right: 0, top: (1 - ROM_SHORT_THRESH) * height, borderTopWidth: 1, borderStyle: 'dashed', borderColor: alpha(C['status-error'], 0.4) }} />}
      {ROM_PCT.slice(0, n).map((r, i) => {
        const short = r < ROM_SHORT_THRESH
        return (
          <View key={i} style={{ width: barW, alignItems: 'center', justifyContent: 'flex-end', height }}>
            <View
              style={{
                width: '80%',
                height: Math.max(3, r * height),
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                backgroundColor: short ? alpha(C['status-error'], 0.55) : alpha(PARCH, 0.5),
                ...(i === current ? { backgroundColor: short ? C['status-error'] : alpha(PARCH, 0.85) } : null),
              } as ViewStyle}
            />
          </View>
        )
      })}
    </View>
  )
}

/**
 * The ROM section — the older labeled silver/red PROGRESSION (restored): the silver/red bar
 * strip with its working-standard + short-threshold reference lines and the normal
 * "depth vs working range · now X%" caption, ALWAYS shown (no hover toggle, no number hero).
 */
function RomSection({ width, current = 7 }: { width: number; current?: number }) {
  const depth = Math.round(ROM_PCT[current] * 100)
  return (
    <View style={{ gap: 5 }}>
      <RomStrip width={width} height={38} current={current} revealed />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, color: C['text-tertiary'], fontFamily: FONT_MONO }}>ROM · depth vs working range</Text>
        <Text style={{ fontSize: 9, color: C['text-tertiary'], fontFamily: FONT_MONO }}>now {depth}%</Text>
      </View>
    </View>
  )
}

// =================================================================================
// P2 — THREE FATIGUE STATUS LIGHTS + the aggregated verdict.
// =================================================================================
type Level = 'ok' | 'warn' | 'alarm'
const LEVEL_TONE: Record<Level, string> = {
  ok: C['status-success'],
  warn: C['status-warning'],
  alarm: C['status-error'],
}
function bandLevel(v: number, warn: number, alarm: number): Level {
  return v >= alarm ? 'alarm' : v >= warn ? 'warn' : 'ok'
}
/**
 * Mock per-rep RPE estimate (WA's `estimateSetRpe`, ~1–10, null under 2 reps). Rises through
 * the fatiguing set; the cheat rep 4 dips (propped, felt easier) before the grind. Rep 8 = 10
 * (failure). Placeholder — the real value comes from Workout Analytics' view-model.
 */
const MOCK_RPE: Array<number | null> = [null, 6.5, 7.5, 7, 8.5, 9, 9.5, 10]
function fmtRpe(rpe: number): string {
  return rpe % 1 === 0 ? `${rpe}` : rpe.toFixed(1)
}
/** RPE → the explanatory reps-in-reserve line under the hero number. */
function rpeSub(rpe: number): string {
  const rir = Math.max(0, Math.round(10 - rpe))
  return rir <= 0 ? 'at failure — end the set' : `~${rir} rep${rir === 1 ? '' : 's'} in reserve`
}

interface FatigueRead {
  velLoss: { level: Level; value: string }
  /** The raw velocity-loss %, for the metric-led verdict hero (à la StopSetDecision). */
  velLossPct: number
  /** Mock RPE estimate (null under 2 reps) — the lead number of the hero. */
  rpe: number | null
  rom: { level: Level; value: string }
  tempo: { level: Level; value: string }
  verdict: { word: string; sub: string; tone: string }
}
function computeFatigue(current: number): FatigueRead {
  const vl = Math.round((1 - MEAN_VEL[current] / V_BEST) * 100)
  const velLevel = bandLevel(vl, 20, 30)
  const depth = Math.round(ROM_PCT[current] * 100)
  const romLevel: Level = depth < 80 ? 'alarm' : depth < 90 ? 'warn' : 'ok'
  const a = ADH[current]
  const tempoDev = Math.max(Math.abs(a.ecc), Math.abs(a.con)) // worst move-phase deviation
  const tempoLevel = bandLevel(tempoDev, 0.35, 0.6)
  const tempoWord = a.ecc > 0.35 ? 'ecc rushed' : a.con < -0.35 ? 'con grind' : 'on tempo'

  const levels = [velLevel, romLevel, tempoLevel]
  const alarms = levels.filter((l) => l === 'alarm').length
  const warns = levels.filter((l) => l === 'warn').length
  let verdict: FatigueRead['verdict']
  // NOTE: the verdict word/sub/thresholds are PLACEHOLDER — Workout Analytics will own
  // the real aggregation. Kept behind this one function so the content swaps in cleanly.
  if (velLevel === 'alarm' && (romLevel === 'alarm' || tempoLevel === 'alarm'))
    verdict = { word: 'Form breaking down', sub: 'velocity gone + depth/tempo failing — end the set', tone: C['status-error'] }
  else if (velLevel === 'alarm') verdict = { word: 'Approaching failure', sub: 'bar speed gutted — 0–1 clean reps left', tone: C['status-error'] }
  else if (alarms > 0) verdict = { word: 'Form breaking down', sub: 'depth / tempo degrading — clean it up or rack', tone: C['status-error'] }
  else if (warns > 0) verdict = { word: 'Slowing', sub: 'quality slipping — hold the standard', tone: C['status-warning'] }
  else verdict = { word: 'Good', sub: 'holding the standard', tone: C['status-success'] }

  return {
    velLoss: { level: velLevel, value: `${vl}%` },
    velLossPct: vl,
    rpe: MOCK_RPE[current] ?? null,
    rom: { level: romLevel, value: `${depth}%` },
    tempo: { level: tempoLevel, value: tempoWord },
    verdict,
  }
}

const LEVEL_WORD: Record<Level, string> = { ok: 'ok', warn: 'watch', alarm: 'alarm' }

/** One "why" indicator behind the verdict — a tone dot + a tiny label; the metric value is
 *  on hover. The three of these are the supporting reason for the verdict headline. */
function WhyDot({ label, level, detail }: { label: string; level: Level; detail: string }) {
  const tone = LEVEL_TONE[level]
  return (
    <Tooltip label={`${detail} · ${LEVEL_WORD[level]}`} placement="bottom">
      <View accessibilityLabel={`${detail}, ${LEVEL_WORD[level]}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: tone, boxShadow: `0 0 8px ${alpha(tone, 0.7)}` } as ViewStyle} />
        <Text style={[{ fontSize: 9, letterSpacing: 0.6, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>{label}</Text>
      </View>
    </Tooltip>
  )
}
/** The three "why" dots. `spread` distributes them evenly across the full width (space-between). */
function WhyRow({ f, spread = false }: { f: FatigueRead; spread?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: spread ? 0 : 16, alignItems: 'center', justifyContent: spread ? 'space-between' : 'flex-start' }}>
      <WhyDot label="VEL" level={f.velLoss.level} detail={`Velocity loss ${f.velLoss.value}`} />
      <WhyDot label="ROM" level={f.rom.level} detail={`ROM depth ${f.rom.value}`} />
      <WhyDot label="TEMPO" level={f.tempo.level} detail={`Tempo ${f.tempo.value}`} />
    </View>
  )
}

/**
 * The VERDICT AS HERO — the card's single focal read, in the StopSetDecision idiom: a big
 * tone-colored headline integrated straight into the card (no nested box/border), a short
 * supporting line, and the three "why" dots beneath. Two modes to compare:
 *   `word`   — verdict-word-led (the aggregated state is the headline).
 *   `metric` — a lead RPE ESTIMATE as the big number + the tone verdict word, with the
 *              supporting line explaining the RPE (reps in reserve / proximity to failure),
 *              mirroring the stop-set "37% / Approaching failure" hero idiom.
 * Verdict + RPE content is placeholder — Workout Analytics will own it.
 */
function VerdictHero({ f, mode = 'word' }: { f: FatigueRead; mode?: 'word' | 'metric' }) {
  const tone = f.verdict.tone
  const rpeLed = mode === 'metric' && f.rpe != null
  return (
    <View style={{ gap: 8 }}>
      <Text style={[{ fontSize: 9, letterSpacing: 1.5, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>FATIGUE</Text>
      {rpeLed ? (
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 7 }}>
            <Text style={{ fontSize: 62, fontWeight: '900', fontFamily: FONT_HEAD, color: tone, lineHeight: 60 }}>{fmtRpe(f.rpe as number)}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: tone, marginBottom: 9, fontFamily: FONT_HEAD }}>RPE</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', fontFamily: FONT_HEAD, color: tone }}>{f.verdict.word}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: FONT_UI, color: C['text-secondary'] }}>{rpeSub(f.rpe as number)}</Text>
        </View>
      ) : (
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', fontFamily: FONT_HEAD, color: tone, lineHeight: 28 }}>{f.verdict.word}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: FONT_UI, color: C['text-secondary'] }}>{f.verdict.sub}</Text>
        </View>
      )}
    </View>
  )
}

// =================================================================================
// P2 — THE UNIFIED FATIGUE CARD. One focal read, everything else quiet / on-demand:
//   VERDICT HERO (large tone-colored RPE) + 3 "why" dots — grouped at top
//   → flexible space → ROM section (labeled silver/red progression, always on)
//   → flexible space → ghost SPARK (green-on-track line + tempo-colored axis; hover to bloom).
// The two flexible spacers split the leftover height, so the sections spread evenly through
// the card instead of bunching at the top.
// =================================================================================
function FatigueCard({
  width = 300,
  height,
  current = 7,
  heroMode = 'metric',
  revealChart,
  fatigue,
}: {
  width?: number
  height?: number
  current?: number
  /** Verdict-hero treatment: `metric` (RPE lead, stop-set idiom, default) or `word` (verdict-word-led). */
  heroMode?: 'word' | 'metric'
  /** Force the ghost spark into its revealed (hover) state — for static screenshots. */
  revealChart?: boolean
  /** Override the derived fatigue read (for the state-variants showcase). */
  fatigue?: FatigueRead
}) {
  const f = fatigue ?? computeFatigue(current)
  const hasH = height != null
  const pad = hasH ? Math.round(clamp((height as number) * 0.042, 16, 26)) : 18
  const wellPadX = 4 // the ghost spark carries this L/R gutter internally
  const chartW = width - pad * 2 - wellPadX * 2
  // The ghost chart is a fixed (responsive) size; the leftover height goes to the two flexible
  // spacers so the sections distribute rather than bunch. Floors keep spacing in natural mode.
  const chartH = hasH ? Math.round(clamp((height as number) * 0.4, 168, 240)) : 172
  const topGap = hasH ? Math.round(clamp((height as number) * 0.026, 10, 16)) : 12
  return (
    <View style={[{ width, height, borderRadius: 14, padding: pad }, paperSheet(primitiveColors.charcoal[800])]}>
      {/* top group — verdict hero + the three "why" dots, tight together. */}
      <View style={{ gap: topGap }}>
        <VerdictHero f={f} mode={heroMode} />
        <WhyRow f={f} />
      </View>
      {/* flexible breathing room (dots ↔ ROM). */}
      <View style={{ flex: 1, minHeight: 18 }} />
      {/* ROM — the labeled silver/red progression (always on). */}
      <RomSection width={width - pad * 2} current={current} />
      {/* flexible breathing room (ROM ↔ ghost). */}
      <View style={{ flex: 1, minHeight: 18 }} />
      {/* ghost spark — green-on-track line + tempo axis; hover blooms it (frameless). */}
      <SparkCombinedChart w={chartW} h={chartH} current={current} forceRevealed={revealChart} />
    </View>
  )
}

// =================================================================================
// P3 — HERO velocity chart with the VL threshold BANDS layered behind the bars.
// Wraps the SHIPPED VelocityStrip hero and overlays VL20 / VL30 bands aligned to the
// same peak scale (denominator = max·PEAK_HEADROOM, label headroom reserved above).
// =================================================================================
const PEAK_HEADROOM = 1.06 // must match VelocityStrip's hero constant
const HERO_LABEL_HEADROOM = 20 // must match VelocityStrip's hero constant
function HeroWithVlBands({ width, height = 300, current = 7 }: { width?: number; height?: number; current?: number }) {
  const velocities = MEAN_VEL.slice(0, current + 1)
  const best = Math.max(...velocities)
  const denom = best * PEAK_HEADROOM
  const plotH = height - HERO_LABEL_HEADROOM
  const yOf = (v: number) => (v / denom) * plotH // px UP from the baseline
  const vl20 = best * 0.8
  const vl30 = best * 0.7
  const band = (loV: number, hiV: number, col: string) => (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: yOf(loV), height: Math.max(0, yOf(hiV) - yOf(loV)), backgroundColor: col }} />
  )
  const thresh = (v: number, col: string, label: string) => (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: yOf(v) }}>
      <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: col }} />
      <Text style={{ position: 'absolute', right: 2, top: -13, fontSize: 9, fontWeight: '800', fontFamily: FONT_MONO, color: col }}>{label}</Text>
    </View>
  )
  return (
    // Fixed width when given (standalone stories); otherwise flex to fill the column (LivePanelV2).
    <View style={width != null ? { width, height } : { flex: 1, height }}>
      {/* VL decision bands + thresholds, behind the bars, on the hero's own scale. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}>
        {band(0, vl30, alpha(C['status-error'], 0.09))}
        {band(vl30, vl20, alpha(C['status-warning'], 0.08))}
        {thresh(vl20, alpha(C['status-warning'], 0.75), 'VL 20%')}
        {thresh(vl30, alpha(C['status-error'], 0.75), 'VL 30%')}
      </View>
      <VelocityStrip
        variant="hero"
        velocities={velocities}
        liveRepIndex={velocities.length - 1}
        targetReps={8}
        height={height}
        scale="peak"
      />
    </View>
  )
}

// =================================================================================
// LivePanelV2 — the composition: hero (primary) + fatigue card (secondary).
// =================================================================================
function ExerciseHeaderLite({ current }: { current: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderColor: alpha(PARCH, 0.08) }}>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', fontFamily: FONT_HEAD, color: C['text-primary'] }}>Cable Chest Press</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', fontFamily: FONT_UI, color: C['text-secondary'] }}>Push A · Hypertrophy · 62 lb × 8 · tempo 2.6·0.4·0.95·0.28</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: FONT_MONO, color: C['text-tertiary'] }}>SET 3 · REP {current + 1} / 8</Text>
    </View>
  )
}

/** Panel body height — the hero and the fatigue card both fill this so their tops/bottoms align. */
const PANEL_BODY_H = 508
/** Full panel height (header + body) — fixed so panels stack in the state-variants story. */
const PANEL_H = PANEL_BODY_H + 128
type AuraCategory = 'productive' | 'threshold' | 'stop'
function LivePanelV2({
  current = 7,
  fatigue,
  aura,
}: {
  current?: number
  /** Override the derived fatigue read (for the state-variants showcase). */
  fatigue?: FatigueRead
  /** Aura flood category; defaults to a velocity-derived guess. */
  aura?: AuraCategory
}) {
  const category: AuraCategory =
    aura ?? (MEAN_VEL[current] / V_BEST < 0.7 ? 'stop' : MEAN_VEL[current] / V_BEST < 0.8 ? 'threshold' : 'productive')
  const heroH = PANEL_BODY_H - 26 // leaves room for the hero's own eyebrow above it
  return (
    <LiveAuraFrame category={category} style={{ height: PANEL_H, borderRadius: 0, borderWidth: 0 }}>
      <View style={{ flex: 1 }}>
        <ExerciseHeaderLite current={current} />
        {/* hero (~75%) beside the vertical fatigue card (~25%), both filling the body height. */}
        <View style={{ padding: 24, flexDirection: 'row', gap: 18, alignItems: 'stretch' }}>
          {/* PRIMARY — the velocity hero with VL bands. Flexes to fill the width the card leaves. */}
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[{ fontSize: 9, letterSpacing: 1.2, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>VELOCITY · this set</Text>
            <HeroWithVlBands height={heroH} current={current} />
          </View>
          {/* SECONDARY — the vertical fatigue card at a fixed narrow width (~25% of the panel). */}
          <FatigueCard width={318} height={PANEL_BODY_H} current={current} fatigue={fatigue} />
        </View>
      </View>
    </LiveAuraFrame>
  )
}

/** The four fatigue-verdict states with plausible mock reads, for the state-variants story. */
function mkRead(
  rpe: number,
  verdict: { word: string; sub: string; tone: string },
  vel: { level: Level; value: string },
  rom: { level: Level; value: string },
  tempo: { level: Level; value: string }
): FatigueRead {
  return { velLoss: vel, velLossPct: parseInt(vel.value, 10) || 0, rpe, rom, tempo, verdict }
}
const FATIGUE_STATES: Array<{ name: string; current: number; aura: AuraCategory; read: FatigueRead }> = [
  {
    name: 'GOOD · early set',
    current: 1,
    aura: 'productive',
    read: mkRead(6, { word: 'Good', sub: 'holding the standard', tone: C['status-success'] }, { level: 'ok', value: '5%' }, { level: 'ok', value: '99%' }, { level: 'ok', value: 'on tempo' }),
  },
  {
    name: 'SLOWING · mid set, bar speed dropping',
    current: 2,
    aura: 'threshold',
    read: mkRead(7.5, { word: 'Slowing', sub: 'bar speed dropping — quality slipping', tone: C['status-warning'] }, { level: 'warn', value: '24%' }, { level: 'ok', value: '98%' }, { level: 'ok', value: 'on tempo' }),
  },
  {
    name: 'GRINDING · deep velocity loss, clean form',
    current: 5,
    aura: 'threshold',
    read: mkRead(9, { word: 'Grinding', sub: 'deep bar-speed loss — form still clean', tone: C['status-warning'] }, { level: 'alarm', value: '38%' }, { level: 'ok', value: '89%' }, { level: 'ok', value: 'controlled' }),
  },
  {
    name: 'FORM BREAKING DOWN · late / cheat rep',
    current: 7,
    aura: 'stop',
    read: mkRead(10, { word: 'Form breaking down', sub: 'velocity gone + depth/tempo failing — end the set', tone: C['status-error'] }, { level: 'alarm', value: '72%' }, { level: 'alarm', value: '67%' }, { level: 'alarm', value: 'ecc rushed' }),
  },
]

// --- Scaffolding -----------------------------------------------------------------
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 24 }}>{children}</View>
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{children}</Text>
}
function Caption({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 12, fontFamily: FONT_UI, color: C['text-secondary'], maxWidth: 860, lineHeight: 18 }}>{children}</Text>
}
function Kicker({ children }: { children: ReactNode }) {
  return <Text style={[{ fontSize: 9, letterSpacing: 1, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>{children}</Text>
}
function Panel({ children, width }: { children: ReactNode; width?: number }) {
  return <View style={{ width, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 14 }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/North Star/Live Fatigue Card',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** P1 — the combined ghost-trail + phase/tempo-colored current-rep chart, standalone. */
export const CombinedChart_: Story = {
  name: 'P1 · Combined chart',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Combined chart — ghost trail + target-tempo bands + tempo-colored rep</SectionTitle>
        <Caption>
          The novel centerpiece of the fatigue card. Every prior rep is a faded grey ghost on one absolute-time axis (the
          fan IS the set&apos;s timing drift); the CURRENT rep is the solid line. Behind it, the four shaded bands are the
          PRESCRIBED tempo&apos;s phase regions. The current line is colored GREEN when a phase is on its prescribed tempo and
          warms toward amber → red as it deviates (rushing OR lagging). Phase identity reads from geometry (eccentric below the
          zero axis, concentric above) + the bands. The peak concentric velocity is marked, tying the read back to the hero.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>8-REP CABLE PRESS · rep 8 current · reps 1–7 ghosts · absolute time · line = green-on-track tempo</Kicker>
        <View style={[{ borderRadius: 12, padding: 14 }, insetWell(primitiveColors.charcoal[900])]}>
          <CombinedChart w={800} h={320} current={7} />
        </View>
      </Panel>
      <Panel width={860}>
        <Kicker>EARLY REP (rep 3, on-tempo) vs LATE REP (rep 8, dropped ecc + long con grind)</Kicker>
        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          <View style={[{ borderRadius: 12, padding: 10 }, insetWell(primitiveColors.charcoal[900])]}>
            <CombinedChart w={390} h={220} current={2} />
          </View>
          <View style={[{ borderRadius: 12, padding: 10 }, insetWell(primitiveColors.charcoal[900])]}>
            <CombinedChart w={390} h={220} current={7} />
          </View>
        </View>
      </Panel>
    </Page>
  ),
}

/** P1b — the ghost spark, resting vs its hover (revealed) state. */
export const SparkChart: Story = {
  name: 'P1b · Ghost spark (rest vs hover)',
  render: () => {
    const box = (child: ReactNode) => (
      <View style={{ width: 380, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>{child}</View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Ghost spark — glance at rest, detail on hover</SectionTitle>
          <Caption>
            The ghost chart DEMOTED to a sparkline: at rest it&apos;s just the shapes + color — the faded ghost trails, the
            GREEN-ON-TRACK current line (green on-tempo, warming amber → red as a phase rushes/lags), and the phase-colored
            AXIS (the zero axis itself is the phase mark, in the TempoDisplay phase-identity language — ecc magenta, con
            cyan-blue, pauses grey) — with no frame, labels or peak marker. On HOVER the ANNOTATIONS fade in: the ECC/CON axis
            labels, the peak marker, and the compact prescribed-tempo tuple (bare colored digits + dashes — magenta ecc /
            cyan con, no backing), overlaid top-left. The chart stays FRAMELESS (no box). Geometry is identical, so nothing
            shifts. (Left = resting,
            hover live in Storybook; right = the revealed state forced for the screenshot.)
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ gap: 8 }}>
            <Kicker>RESTING — bare sparkline (hover me)</Kicker>
            {box(<SparkCombinedChart w={348} h={190} current={7} forceRevealed={false} />)}
          </View>
          <View style={{ gap: 8 }}>
            <Kicker>HOVER — annotations faded in</Kicker>
            {box(<SparkCombinedChart w={348} h={190} current={7} forceRevealed />)}
          </View>
        </View>
      </Page>
    )
  },
}

/** P2a — the verdict-as-hero, word-led vs metric-led, compared across states. */
export const VerdictHero_: Story = {
  name: 'P2a · Verdict hero (options)',
  render: () => {
    const col = (mode: 'word' | 'metric', title: string, note: string) => (
      <View style={{ gap: 8, width: 340 }}>
        <Kicker>{title}</Kicker>
        <Caption>{note}</Caption>
        <FatigueCard width={340} heroMode={mode} current={7} />
        <FatigueCard width={340} heroMode={mode} current={2} />
      </View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Verdict as hero — two treatments to compare</SectionTitle>
          <Caption>
            The aggregated verdict promoted to the card&apos;s focal read, in the StopSetDecision idiom — a big tone-colored
            headline integrated into the card (no nested alert box), a short supporting line, and the three &quot;why&quot;
            dots (velocity-loss · ROM · tempo) beneath it, metric on hover. RIGHT (the default) leads with the RPE ESTIMATE as
            the big number, the tone verdict word, and a supporting line explaining the RPE (reps in reserve / proximity to
            failure). LEFT is the verdict-word-led alternative. Each shown breaking-down (rep 8, RPE 10) over good (rep 3, RPE 7.5).
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>
          {col('word', 'OPTION A — verdict-word-led', 'The aggregated state IS the headline.')}
          {col('metric', 'OPTION B — RPE-led (default, stop-set idiom)', 'A lead RPE number + verdict word + reps-in-reserve.')}
        </View>
      </Page>
    )
  },
}

/** P1c — phase marks: the current full-height BANDS vs the new base line-SEGMENTS. */
export const PhaseMarks: Story = {
  name: 'P1c · Phase marks (bands vs segments)',
  render: () => {
    const cell = (label: string, marks: 'bands' | 'segments') => (
      <View style={{ gap: 8 }}>
        <Kicker>{label}</Kicker>
        <View style={{ width: 440, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
          <CombinedChart w={408} h={230} current={7} compact revealed axisCaptions={false} phaseMarks={marks} />
        </View>
      </View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Phase marks — full-height bands vs the colored AXIS</SectionTitle>
          <Caption>
            The prescribed ecc / pause / con / hold regions drawn two ways, to judge. LEFT = full-height shaded BANDS (heavier
            — the phase floods the whole plot). RIGHT = the zero AXIS itself color-coded by phase along its length, each
            segment sized to that phase&apos;s prescribed time extent (ecc = magenta, con = cyan-blue, pauses grey — the
            TempoDisplay phase-identity language), only ECC +
            CON labelled, the hold segment present only when the prescribed hold &gt; 0. The axis version is wired into the
            card as the new default. Both shown revealed; at rest the labels drop and only the marks + line remain. (Note the
            current line here is the new GREEN-ON-TRACK palette — green on-tempo, amber/red off.)
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          {cell('BANDS — current (full-height washes)', 'bands')}
          {cell('AXIS SEGMENTS — new (axis IS the phase mark)', 'segments')}
        </View>
      </Page>
    )
  },
}

/** P2 — the unified fatigue card. */
export const FatigueCard_: Story = {
  name: 'P2 · Fatigue card',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Unified fatigue card — a vertical column that sits beside the hero</SectionTitle>
        <Caption>
          One focal read, everything else quiet: a LARGE RPE verdict hero → the three &quot;why&quot; dots (left-aligned) →
          the labeled silver/red ROM progression (bars + reference lines + &quot;now X%&quot; caption, always on) → the ghost
          chart LAST, a bare sparkline (green-on-track line + tempo-colored axis) that blooms its annotations on hover.
          Shown across the spectrum: a GOOD early rep and the BREAKING-DOWN late rep. (Verdict content is placeholder, to be
          driven by Workout Analytics.)
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
        <View style={{ gap: 6 }}>
          <Kicker>REP 3 — good (all three ok)</Kicker>
          <FatigueCard width={324} current={2} />
        </View>
        <View style={{ gap: 6 }}>
          <Kicker>REP 8 — form breaking down (all three alarm)</Kicker>
          <FatigueCard width={324} current={7} />
        </View>
      </View>
    </Page>
  ),
}

/** P3 — the hero with VL bands layered in. */
export const HeroWithVlBands_: Story = {
  name: 'P3 · Hero + VL bands',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Velocity hero with velocity-loss bands layered in</SectionTitle>
        <Caption>
          The shipped VelocityStrip hero (the primary live chart, the one saturated velocity-zone hue), enhanced with the VL
          20% / VL 30% threshold lines and the warn / alarm decision bands behind the bars — on the hero&apos;s own peak
          scale, so a bar crossing into the amber then red band reads as &quot;these are your last effective reps&quot; in the
          hero itself. That is why the fatigue card carries no separate VL% chart: velocity loss lives here, in the hero.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>8-REP SET · bars = per-rep mean concentric velocity · bands = VL decision zones</Kicker>
        <View style={[{ borderRadius: 12, padding: 16 }, insetWell(primitiveColors.charcoal[900])]}>
          <HeroWithVlBands width={800} height={320} current={7} />
        </View>
      </Panel>
    </Page>
  ),
}

/** The full live panel composition. */
export const LivePanelV2_: Story = {
  name: 'Live panel v2 (composition)',
  render: () => <LivePanelV2 current={7} />,
}

/** Live-view state variants — the whole system across the verdict spectrum. */
export const LiveStates: Story = {
  name: 'Live states (Good → Breaking down)',
  render: () => (
    <View style={{ backgroundColor: PAGE_BG }}>
      <View style={{ padding: 28, paddingBottom: 8, gap: 4 }}>
        <SectionTitle>Live-view states — the system across the fatigue spectrum</SectionTitle>
        <Caption>
          The live panel (velocity hero + fatigue card) rendered per verdict state, with plausible mock data driving the whole
          system — RPE, the three status dots, the green-on-track ghost line, and the ROM progression all respond together.
          GOOD (early, low RPE, all-green dots + green line, full ROM) → SLOWING (mid-set, VEL dot amber, RPE mid) → GRINDING
          (deep velocity loss but clean form — VEL alarm, ROM/tempo ok, RPE high) → FORM BREAKING DOWN (late/cheat rep — red,
          dropped-ecc red line, cut ROM). Aura flood tracks the state.
        </Caption>
      </View>
      {FATIGUE_STATES.map((s) => (
        <View key={s.name} style={{ gap: 6, paddingHorizontal: 28, paddingBottom: 22 }}>
          <Kicker>{s.name}</Kicker>
          <LivePanelV2 current={s.current} fatigue={s.read} aura={s.aura} />
        </View>
      ))}
    </View>
  ),
}

/** Overview — the pieces in priority order. */
export const Overview: Story = {
  name: 'Overview',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Live fatigue card — the redesigned live panel</SectionTitle>
        <Caption>
          The live panel = the velocity HERO (primary, with VL bands) beside a secondary UNIFIED FATIGUE CARD — a vertical
          column whose centerpiece is the combined ghost-trail + tempo-colored current-rep chart, with a ROM-progression read
          and three fatigue lights. Three questions, three color languages: the hero owns the velocity-zone hue, the combined
          chart owns the diverging tempo-adherence color, ROM stays parchment.
        </Caption>
      </View>
      {/* hero (primary) beside the vertical fatigue card (secondary) — the panel reflow. */}
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <Panel width={720}>
          <Kicker>P3 · HERO + VL BANDS (primary)</Kicker>
          <View style={[{ borderRadius: 12, padding: 16 }, insetWell(primitiveColors.charcoal[900])]}>
            <HeroWithVlBands width={660} height={470} current={7} />
          </View>
        </Panel>
        <View style={{ gap: 6 }}>
          <Kicker>P2 · FATIGUE CARD (secondary)</Kicker>
          <FatigueCard width={318} current={7} />
        </View>
      </View>
    </Page>
  ),
}
