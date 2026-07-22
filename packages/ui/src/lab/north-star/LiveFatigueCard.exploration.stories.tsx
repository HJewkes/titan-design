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
import { formatVelocity } from '../../utils/workout-format'
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
const VMAX = Math.max(...SETS.flat().map((s) => Math.abs(s.vel))) * 1.08
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

// Phase base tones (on-tempo): distinguished by lightness/warmth so phase reads even
// at adherence 0 — cool steel for the lowering, warm parchment for the drive, dim for holds.
const PHASE_BASE: Record<Phase, string> = {
  ecc: '#93A4B0',
  pauseBottom: '#5B646E',
  con: '#C7BBA4',
  pauseTop: '#5B646E',
}
const RUSH = '#E8913C' // warm — faster than prescribed
const LAG = '#3FA7C4' // cool — slower than prescribed (grinding)

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
/** The two-birds line color: phase base tone shoved warm (rush) or cool (lag) by adherence. */
function lineColor(phase: Phase, adh: number): string {
  const base = PHASE_BASE[phase]
  return adh >= 0 ? mixHex(base, RUSH, Math.min(1, adh) * 0.82) : mixHex(base, LAG, Math.min(1, -adh) * 0.82)
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
  const padTop = 26
  const padBot = 24
  const mid = padTop + (h - padTop - padBot) / 2
  const half = (h - padTop - padBot) / 2
  const x = (t: number) => padL + (t / AXIS_MAX_T) * (w - padL - padR)
  const y = (v: number) => mid - (v / VMAX) * half
  const cur = SETS[current]
  const adh = ADH[current]
  const peakS = cur.reduce((a, b) => (b.vel > a.vel ? b : a), cur[0])
  const bandTone: Record<Phase, string> = {
    ecc: alpha(PARCH, 0.05),
    pauseBottom: alpha('#000000', 0.24),
    con: alpha(PARCH, 0.08),
    pauseTop: alpha('#000000', 0.24),
  }
  // Segment marks: thin phase-colored lines along the base. ecc = steel, con = parchment
  // (the phase base tones), pauses dim/neutral.
  const markColor: Record<Phase, string> = {
    ecc: PHASE_BASE.ecc,
    pauseBottom: alpha(PARCH, 0.3),
    con: PHASE_BASE.con,
    pauseTop: alpha(PARCH, 0.3),
  }
  const segY = h - padBot + 11 // in the bottom margin, below the curve
  return (
    <svg width={w} height={h}>
      {/* PRESCRIBED phases behind the curve — full-height bands OR thin base segments. */}
      {phaseMarks === 'bands'
        ? targetSpans().map((p, i) => (
            <g key={i}>
              <rect x={x(p.t0)} y={padTop} width={Math.max(0, x(p.t1) - x(p.t0))} height={h - padTop - padBot} fill={bandTone[p.phase]} />
              {revealed && x(p.t1) - x(p.t0) > 16 && (
                <text x={(x(p.t0) + x(p.t1)) / 2} y={padTop - 8} textAnchor="middle" fill={C['text-tertiary']} fontSize={8} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI}>
                  {PHASE_LABEL[p.phase]}
                </text>
              )}
            </g>
          ))
        : targetSpans().map((p, i) => {
            if (p.phase === 'pauseTop' && TARGET.pauseTop <= 0) return null // no hold segment without a prescribed hold
            const segW = Math.max(0, x(p.t1) - x(p.t0) - 2)
            const label = p.phase === 'ecc' ? 'ECC' : p.phase === 'con' ? 'CON' : null
            return (
              <g key={i}>
                <rect x={x(p.t0) + 1} y={segY} width={segW} height={3} rx={1.5} fill={markColor[p.phase]} />
                {revealed && label && segW > 14 && (
                  <text x={(x(p.t0) + x(p.t1)) / 2} y={segY - 4} textAnchor="middle" fill={C['text-tertiary']} fontSize={8} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI}>
                    {label}
                  </text>
                )}
              </g>
            )
          })}
      {/* zero axis (parchment) — concentric above, eccentric below. */}
      <line x1={padL} y1={mid} x2={w - padR} y2={mid} stroke={AXIS} strokeWidth={1} />
      {!compact && revealed && <text x={padL - 6} y={y(VMAX * 0.62)} textAnchor="end" fill={C['text-tertiary']} fontSize={8} fontFamily={FONT_MONO}>CON</text>}
      {!compact && revealed && <text x={padL - 6} y={y(-VMAX * 0.55)} textAnchor="end" fill={C['text-tertiary']} fontSize={8} fontFamily={FONT_MONO}>ECC</text>}
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
      {/* current rep — one line, colored per phase by tempo adherence (the two-birds channel). */}
      {phaseRuns(cur).map((run, i) => (
        <path
          key={i}
          d={smoothPath(run.pts.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={lineColor(run.phase, adh[run.phase])}
          strokeWidth={3.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {/* peak concentric marker — ties back to the velocity hero (annotated view only). */}
      {revealed && <circle cx={x(peakS.t)} cy={y(peakS.vel)} r={4} fill={lineColor('con', adh.con)} stroke={PANEL_BG} strokeWidth={1.5} />}
      {revealed && (
        <text x={x(peakS.t) + 7} y={y(peakS.vel) - 6} fill={C['text-primary']} fontSize={11} fontWeight={800} fontFamily={FONT_UI}>
          peak {peakS.vel.toFixed(2)} m/s
        </text>
      )}
      {/* "now" caption — pinned bottom-right so it never collides with the "time →" label. */}
      {revealed && axisCaptions && (
        <text x={w - padR} y={mid + half + 16} textAnchor="end" fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>
          rep {current + 1} (now) · {(TOTALS[current] / 1000).toFixed(1)}s
        </text>
      )}
      {revealed && axisCaptions && <text x={padL} y={mid + half + 16} fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>time →</text>}
    </svg>
  )
}

/** The combined chart's color legend — phase reads by position + bands; tone reads tempo. */
function TempoLegend({ compact = false }: { compact?: boolean }) {
  const swatch = (
    <View style={{ flexDirection: 'row' }}>
      {[LAG, mixHex(PHASE_BASE.con, LAG, 0.4), PHASE_BASE.con, mixHex(PHASE_BASE.con, RUSH, 0.4), RUSH].map((c, i) => (
        <View key={i} style={{ width: compact ? 12 : 16, height: 8, backgroundColor: c }} />
      ))}
    </View>
  )
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {swatch}
        <Text style={{ color: C['text-secondary'], fontSize: 9, fontWeight: '700', fontFamily: FONT_UI }}>lag ← on-tempo → rush</Text>
      </View>
    )
  }
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {swatch}
        <Text style={{ color: C['text-secondary'], fontSize: 10, fontWeight: '700', fontFamily: FONT_UI }}>
          lagging ← on-tempo → rushing
        </Text>
      </View>
      <Text style={{ color: C['text-tertiary'], fontSize: 10, fontFamily: FONT_UI }}>
        phase by position (ecc below · con above) + shaded target-tempo bands
      </Text>
    </View>
  )
}

/**
 * The STRIPPED sparkline variant — resting, it's just the shapes + color: the ghost trails,
 * the tempo-colored current line, and the base phase segments, sitting BARE in the card (no
 * frame, no labels, no legend, no peak marker). ON HOVER the ANNOTATIONS fade in — the phase
 * labels + peak marker return and the tempo legend overlays — but the chart stays FRAMELESS
 * in both states (no inset box). `forceRevealed` pins the revealed state (for screenshots).
 * The SVG geometry is identical, so the line never shifts — only annotations fade in.
 */
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
      {/* the divergent tempo legend — overlaid at the bottom on hover, so the card below never shifts. */}
      {revealed && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 8,
            bottom: 6,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 3,
            backgroundColor: alpha(primitiveColors.charcoal[900], 0.82),
          }}
        >
          <TempoLegend compact />
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
 * The STRIPPED ROM spark — resting, just the compact silver/red bar strip (no eyebrow, no
 * "depth vs working range / now X%" caption). ON HOVER the reference lines paint in and the
 * label caption overlays at the bottom — the same rest→bloom pattern as the ghost spark.
 */
function RomSpark({ width, current = 7, forceRevealed }: { width: number; current?: number; forceRevealed?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const revealed = forceRevealed ?? hovered
  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ gap: 4 }}>
      <RomStrip width={width} height={38} current={current} revealed={revealed} />
      {/* caption reflows in below the strip on hover (absorbed by the card's bottom spacer). */}
      {revealed && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: C['text-tertiary'], fontSize: 9, fontFamily: FONT_MONO }}>ROM · depth vs working range</Text>
          <Text style={{ color: C['text-tertiary'], fontSize: 9, fontFamily: FONT_MONO }}>now {Math.round(ROM_PCT[current] * 100)}%</Text>
        </View>
      )}
    </Pressable>
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
function WhyRow({ f }: { f: FatigueRead }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <Text style={{ fontSize: 46, fontWeight: '900', fontFamily: FONT_HEAD, color: tone, lineHeight: 46 }}>{fmtRpe(f.rpe as number)}</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: tone, marginBottom: 6, fontFamily: FONT_HEAD }}>RPE</Text>
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
      <WhyRow f={f} />
    </View>
  )
}

// =================================================================================
// P2 — THE UNIFIED FATIGUE CARD. One focal read, everything else quiet / on-demand:
//   VERDICT HERO (big tone-colored, integrated) + 3 "why" dots
//   → compact ghost SPARK (hover to bloom)
//   → compact ROM SPARK (hover to bloom).
// =================================================================================
/** Estimated verdict-hero heights (px) per mode — used to distribute a fixed card height. */
const HERO_EST: Record<'word' | 'metric', number> = { word: 96, metric: 132 }
function FatigueCard({
  width = 300,
  height,
  current = 7,
  heroMode = 'metric',
  revealChart,
}: {
  width?: number
  height?: number
  current?: number
  /** Verdict-hero treatment: `metric` (RPE lead, stop-set idiom, default) or `word` (verdict-word-led). */
  heroMode?: 'word' | 'metric'
  /** Force both spark charts into their revealed (hover) state — for static screenshots. */
  revealChart?: boolean
}) {
  const f = computeFatigue(current)
  // Responsive: when the card has a fixed height, the padding + inter-section gap + the ghost
  // chart all scale with it, so the content distributes to FILL the height (bigger chart +
  // more generous spacing when there's room) rather than a cramped top over a dead spacer.
  const hasH = height != null
  const pad = hasH ? Math.round(clamp((height as number) * 0.042, 16, 26)) : 18
  const gap = hasH ? Math.round(clamp((height as number) * 0.04, 13, 26)) : 16
  const romEst = 40
  const wellPadX = 4 // the ghost spark carries this L/R gutter internally
  const chartW = width - pad * 2 - wellPadX * 2
  // Ghost chart grows to consume the height the hero + ROM + gaps leave (min floor so it never
  // collapses); a tiny spacer absorbs estimate slack + the ROM hover caption reflow.
  const chartH = hasH ? Math.max(150, (height as number) - pad * 2 - HERO_EST[heroMode] - romEst - gap * 3) : 154
  return (
    <View style={[{ width, height, borderRadius: 14, padding: pad, gap }, paperSheet(primitiveColors.charcoal[800])]}>
      {/* the verdict as the card's hero — the instant read. */}
      <VerdictHero f={f} mode={heroMode} />
      {/* ghost spark — grows with the card height; hover blooms it (frameless). */}
      <SparkCombinedChart w={chartW} h={chartH} current={current} forceRevealed={revealChart} />
      {/* compact ROM spark — hover brings the labels + reference lines back. */}
      <RomSpark width={width - pad * 2} current={current} forceRevealed={revealChart} />
      {/* absorbs estimate slack + the ROM hover caption when the card has a tall fixed height. */}
      <View style={{ flex: 1, minHeight: 2 }} />
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
function LivePanelV2({ current = 7 }: { current?: number }) {
  const verdict = MEAN_VEL[current] / V_BEST < 0.7 ? 'stop' : MEAN_VEL[current] / V_BEST < 0.8 ? 'threshold' : 'productive'
  const heroH = PANEL_BODY_H - 26 // leaves room for the hero's own eyebrow above it
  return (
    <LiveAuraFrame category={verdict} style={{ flex: 1, borderRadius: 0, borderWidth: 0 }}>
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
          <FatigueCard width={318} height={PANEL_BODY_H} current={current} />
        </View>
      </View>
    </LiveAuraFrame>
  )
}

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
          PRESCRIBED tempo&apos;s phase regions. The current line carries ONE color that reads two things at once: phase (by
          position — eccentric dips below the zero axis, concentric rises above, reinforced by the bands) AND tempo adherence
          (warm where the phase ran FASTER than prescribed — rushing; cool where SLOWER — lagging/grinding; neutral parchment
          on-tempo). The peak concentric velocity is marked, tying the read back to the velocity hero.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>8-REP CABLE PRESS · rep 8 current · reps 1–7 ghosts · absolute time · line color = phase + tempo</Kicker>
        <View style={[{ borderRadius: 12, padding: 14 }, insetWell(primitiveColors.charcoal[900])]}>
          <CombinedChart w={800} h={320} current={7} />
        </View>
        <TempoLegend />
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

/** P1b — the stripped spark variants (ghost + ROM), resting vs their hover (revealed) state. */
export const SparkChart: Story = {
  name: 'P1b · Sparks (rest vs hover)',
  render: () => {
    const box = (child: ReactNode) => (
      <View style={{ width: 380, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16, gap: 14 }}>{child}</View>
    )
    return (
      <Page>
        <View style={{ gap: 4 }}>
          <SectionTitle>Spark variants — glance at rest, detail on hover</SectionTitle>
          <Caption>
            Both secondary reads are DEMOTED to sparklines: at rest they&apos;re just the shapes + color (the ghost trails +
            tempo-colored line + base phase segments; the silver/red ROM bars) with no frame, labels, legend, peak marker or
            captions. On HOVER only the ANNOTATIONS fade in — the ghost spark stays FRAMELESS (no box) and adds its phase
            labels + peak marker + tempo legend; the ROM spark paints its working-standard / short-threshold reference lines +
            the &quot;depth vs working range / now X%&quot; caption. Geometry is identical between states, so nothing shifts.
            (Left column = resting, hover live in Storybook; right column = the revealed state forced for the screenshot.)
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ gap: 8 }}>
            <Kicker>RESTING — bare sparklines (hover me)</Kicker>
            {box(
              <>
                <SparkCombinedChart w={348} h={180} current={7} forceRevealed={false} />
                <RomSpark width={348} current={7} forceRevealed={false} />
              </>
            )}
          </View>
          <View style={{ gap: 8 }}>
            <Kicker>HOVER — full annotated view</Kicker>
            {box(
              <>
                <SparkCombinedChart w={348} h={180} current={7} forceRevealed />
                <RomSpark width={348} current={7} forceRevealed />
              </>
            )}
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
          <SectionTitle>Phase marks — full-height bands vs base line-segments</SectionTitle>
          <Caption>
            The prescribed ecc / pause / con / hold regions drawn two ways, to judge. LEFT = the current full-height shaded
            BANDS (heavier — the phase floods the whole plot). RIGHT = thin color-coded line SEGMENTS along the base, one per
            phase sized to its prescribed time extent (ecc = steel, con = parchment, the pauses dim), only ECC + CON labelled,
            the hold segment present only when the prescribed hold &gt; 0. The segment version is wired into the card as the
            new default. Both shown revealed; at rest the labels drop and only the marks + line remain.
          </Caption>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          {cell('BANDS — current (full-height washes)', 'bands')}
          {cell('SEGMENTS — new (base line marks)', 'segments')}
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
          One focal read, everything else quiet: the VERDICT is the card&apos;s hero (a big tone-colored headline integrated
          into the card, with the three &quot;why&quot; dots beneath — metric on hover), then the ghost chart DEMOTED to a
          bare sparkline, then the ROM read demoted to a compact silver/red spark. Both sparklines bloom into their annotated
          selves on hover. Shown across the spectrum: a GOOD early rep and the BREAKING-DOWN late rep. (Verdict content is
          placeholder, to be driven by Workout Analytics.)
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
