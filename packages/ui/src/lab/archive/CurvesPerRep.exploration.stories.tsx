// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/Archive/Curves/Per Rep` — DESIGN EXPLORATION (not shipped). ARCHIVED: superseded
 * exploration, kept for provenance — not the aligned North Star direction.
 *
 * Grounded in the signals audit: the per-sample stream (time, position, velocity, force,
 * phase) is persisted per rep at ~11 Hz. These specimens render PROPER SMOOTH per-rep
 * curves (inline `<svg>` + Catmull-Rom bezier — the web-target renders SVG fine, same
 * pattern as titan's SvgIcon) rather than the crude histograms of the earlier attempt.
 *
 * Channel discipline (unchanged): VELOCITY is the one saturated hue (the zone ramp,
 * by mean concentric m/s). ROM / position / FORCE / eccentric are NEUTRAL parchment &
 * steel geometry — never a competing hue. Units are labelled honestly: velocity m/s
 * (from mm/s), force lb, position mm.
 *
 * Mocked realistically: a fatiguing 8-rep cable-press set. Velocity declines; the
 * eccentric stays controlled early then gets DROPPED (reps 4 & 7 — fast/uncontrolled,
 * plus cut ROM: the cheats); the concentric GRINDS late (rep 5 = honest grind, control
 * intact). Nothing here modifies a shipped component.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'
import { WORKOUT_TOKENS } from '../../theme/workout-tokens'
import { alpha } from '../../utils/colors'
import { insetWell } from '../north-star/surfaces'

const C = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

// VELOCITY = the only saturated FILL/STROKE hue (green→red ramp, by mean concentric m/s).
const S = WORKOUT_TOKENS.scale
function velColor(ms: number): string {
  if (ms >= 1.0) return S.green
  if (ms >= 0.75) return S.yellow
  if (ms >= 0.5) return S.orange
  return S.red
}
// Neutral geometry: parchment (position/ROM/eccentric), steel (force). Never a hue.
const PARCH = C['text-primary']
const STEEL = C['text-secondary']
const AXIS = alpha(C['text-primary'], 0.16)
const GRID = alpha(C['text-primary'], 0.08)

const ROM_STD_MM = 900 // full working range for the position axis

// --- Rep specs → a realistic ~11 Hz sample stream --------------------------------
interface RepSpec {
  romMm: number
  eccMs: number
  pBMs: number
  conMs: number
  pTMs: number
  /** 1 = controlled slow lowering, 0 = dropped / uncontrolled (fast). */
  eccControl: number
  /** 1 = explosive concentric, 0 = grinding. */
  conPower: number
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

type Phase = 'ecc' | 'pauseBottom' | 'con' | 'pauseTop'
interface Sample {
  t: number // ms
  pos: number // mm from top (0..rom)
  vel: number // m/s, signed (concentric +, eccentric −)
  force: number // lb
  phase: Phase
}

function specTotal(s: RepSpec): number {
  return s.eccMs + s.pBMs + s.conMs + s.pTMs
}
/** Deterministic low-amplitude sample noise so the stream reads like real 11 Hz data. */
function hashNoise(i: number): number {
  const x = Math.sin(i * 127.1 + 11.7) * 43758.5453
  return x - Math.floor(x)
}
/** Eccentric velocity (mm/s, magnitude): controlled = broad hump; dropped = early tall spike. */
function eccVelMm(u: number, s: RepSpec): number {
  const mean = s.romMm / (s.eccMs / 1000)
  const peak = mean * (Math.PI / 2)
  const skew = 0.5 - (1 - s.eccControl) * 0.22
  const sharp = 1 + (1 - s.eccControl) * 1.3
  const hump = Math.pow(Math.sin(Math.PI * Math.pow(u, skew)), sharp)
  return peak * hump * (1 + (1 - s.eccControl) * 0.7)
}
/** Concentric velocity (mm/s): explosive = early peak; grind = flatter with a sticking dip. */
function conVelMm(u: number, s: RepSpec): number {
  const mean = s.romMm / (s.conMs / 1000)
  const peak = mean * (Math.PI / 2)
  const skew = 0.5 - s.conPower * 0.18
  const stick = (1 - s.conPower) * 0.32 * Math.exp(-Math.pow((u - 0.46) / 0.16, 2))
  const shape = Math.max(0.02, Math.sin(Math.PI * Math.pow(u, skew)) - stick)
  return peak * shape * (0.72 + s.conPower * 0.5)
}
/** Eccentric force (lb): controlled ≈ load, steady; dropped = plunge (let go) + catch spike. */
function eccForce(u: number, s: RepSpec): number {
  const sag = s.loadLb * (0.9 - (1 - s.eccControl) * 0.5 * Math.exp(-Math.pow((u - 0.5) / 0.26, 2)))
  const grab = s.loadLb * (1 - s.eccControl) * 0.85 * Math.exp(-Math.pow((u - 0.86) / 0.08, 2))
  return sag + grab
}
/** Concentric force (lb): early push (explosive) + a sustained sticking plateau (grind). */
function conForce(u: number, s: RepSpec): number {
  const base = s.loadLb * 1.02
  const early = s.loadLb * (0.5 + s.conPower * 0.55) * Math.exp(-Math.pow((u - 0.16) / 0.18, 2))
  const stick = s.loadLb * (1 - s.conPower) * 0.55 * Math.exp(-Math.pow((u - 0.5) / 0.22, 2))
  return base + early + stick
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
  let pos = 0
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
    let force = s.loadLb * 0.95
    if (phase === 'ecc') {
      velMm = -eccVelMm(u, s)
      force = eccForce(u, s)
    } else if (phase === 'con') {
      velMm = conVelMm(u, s)
      force = conForce(u, s)
    }
    velMm *= 1 + (hashNoise(out.length) - 0.5) * 0.05
    force *= 1 + (hashNoise(out.length + 91) - 0.5) * 0.05
    pos = Math.min(s.romMm, Math.max(0, pos + (-velMm * dt) / 1000)) // ecc (v<0) descends → pos grows
    out.push({ t, pos, vel: velMm / 1000, force: Math.max(0, force), phase })
  }
  return out
}

const SETS: Sample[][] = SPECS.map(genSamples)
const TOTALS: number[] = SPECS.map(specTotal)
const MEAN_VEL: number[] = SPECS.map((s) => s.romMm / s.conMs) // m/s mean concentric (mm/ms == m/s)
const VMAX = Math.max(...SETS.flat().map((s) => Math.abs(s.vel))) * 1.08
const FMAX = Math.max(...SETS.flat().map((s) => s.force)) * 1.08

// --- SVG helpers -----------------------------------------------------------------
type Pt = [number, number]
/** Catmull-Rom → cubic-bezier smoothing for an open polyline. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
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
function areaPath(pts: Pt[], baselineY: number): string {
  if (pts.length < 2) return ''
  return `${smoothPath(pts)} L ${pts[pts.length - 1][0].toFixed(1)} ${baselineY} L ${pts[0][0].toFixed(1)} ${baselineY} Z`
}

// --- 1 · Velocity-time curve (whole-set small multiples) --------------------------
// Per-rep velocity vs time as one smooth continuous line through every phase: the
// eccentric dips BELOW the zero line (parchment), the concentric rises ABOVE it (zone
// hue); each lobe's area ≈ the displacement it covered (≈ ROM). Small-multipled across
// the set with cell width ∝ real duration, so fatigue visibly deforms the shape.
const PX_PER_SEC = 34
function MiniVelCurve({ rep }: { rep: number }) {
  const samples = SETS[rep]
  const total = TOTALS[rep]
  const h = 128
  const pad = 10
  const w = Math.max(70, (total / 1000) * PX_PER_SEC)
  const mid = h / 2
  const hue = velColor(MEAN_VEL[rep])
  const x = (t: number) => pad + (t / total) * (w - 2 * pad)
  const y = (v: number) => mid - (v / VMAX) * (mid - pad)
  const line: Pt[] = samples.map((s) => [x(s.t), y(s.vel)])
  const eccPts: Pt[] = samples.filter((s) => s.vel < -0.01).map((s) => [x(s.t), y(s.vel)])
  const conPts: Pt[] = samples.filter((s) => s.vel > 0.01).map((s) => [x(s.t), y(s.vel)])
  const peak = Math.max(...samples.map((s) => s.vel))
  return (
    <View style={{ alignItems: 'center', width: w + 4 }}>
      <svg width={w} height={h}>
        <line x1={pad} y1={mid} x2={w - pad} y2={mid} stroke={AXIS} strokeWidth={1} />
        {conPts.length > 1 && <path d={areaPath(conPts, mid)} fill={alpha(hue, 0.26)} />}
        {eccPts.length > 1 && <path d={areaPath(eccPts, mid)} fill={alpha(PARCH, 0.12)} />}
        <path d={smoothPath(line)} fill="none" stroke={alpha(PARCH, 0.55)} strokeWidth={1.5} strokeLinejoin="round" />
        {conPts.length > 1 && <path d={smoothPath(conPts)} fill="none" stroke={hue} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
      <Text style={{ color: C['text-primary'], fontSize: 11, fontWeight: '800', marginTop: 2 }}>{peak.toFixed(2)}<Text style={{ color: C['text-tertiary'], fontSize: 8, fontWeight: '700' }}> m/s</Text></Text>
      <Text style={{ color: C['text-tertiary'], fontSize: 9, fontWeight: '700', fontFamily: FONT_MONO }}>rep {rep + 1} · {Math.round((SPECS[rep].romMm / ROM_STD_MM) * 100)}%</Text>
    </View>
  )
}

// --- 2 · Ghost-trail set (overlay, time-normalized) -------------------------------
// Every rep overlaid on ONE time-normalized axis: prior reps faded grey underneath, the
// LAST rep solid + saturated. The fan of grey ghosts is the set's consistency; the live
// rep sliding down through them is the drift. No legend needed. (Generalises directly to
// force and position — same overlay, swap the y-channel.)
function GhostTrail() {
  const w = 840
  const h = 300
  const padX = 44
  const padTop = 22
  const padBot = 30
  const mid = padTop + (h - padTop - padBot) / 2
  const half = (h - padTop - padBot) / 2
  const x = (u01: number) => padX + u01 * (w - padX - 16)
  const y = (v: number) => mid - (v / VMAX) * half
  const lastHue = velColor(MEAN_VEL[SETS.length - 1])
  const trail = (rep: number): Pt[] => SETS[rep].map((s) => [x(s.t / TOTALS[rep]), y(s.vel)])
  return (
    <svg width={w} height={h}>
      {[VMAX / 2, 0, -VMAX / 2].map((v, i) => (
        <line key={i} x1={padX} y1={y(v)} x2={w - 16} y2={y(v)} stroke={v === 0 ? AXIS : GRID} strokeWidth={1} />
      ))}
      <text x={padX - 8} y={y(VMAX / 2) + 4} textAnchor="end" fill={C['text-tertiary']} fontSize={10} fontFamily={FONT_MONO}>{(VMAX / 2).toFixed(1)}</text>
      <text x={padX - 8} y={mid + 4} textAnchor="end" fill={C['text-tertiary']} fontSize={10} fontFamily={FONT_MONO}>0</text>
      <text x={12} y={padTop + 8} fill={C['text-secondary']} fontSize={10} fontFamily={FONT_UI} fontWeight={700}>CON ↑ m/s</text>
      <text x={12} y={h - padBot} fill={C['text-secondary']} fontSize={10} fontFamily={FONT_UI} fontWeight={700}>ECC ↓</text>
      {/* prior reps — faded grey ghosts */}
      {SETS.slice(0, -1).map((_, rep) => (
        <path key={rep} d={smoothPath(trail(rep))} fill="none" stroke={alpha(PARCH, 0.16 + rep * 0.02)} strokeWidth={2} strokeLinejoin="round" />
      ))}
      {/* last rep — solid + saturated + faint fill */}
      <path d={areaPath(SETS[SETS.length - 1].filter((s) => s.vel > 0.01).map((s) => [x(s.t / TOTALS[SETS.length - 1]), y(s.vel)]), mid)} fill={alpha(lastHue, 0.14)} />
      <path d={smoothPath(trail(SETS.length - 1))} fill="none" stroke={lastHue} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      <text x={x(1) - 4} y={y(SETS[SETS.length - 1][SETS[SETS.length - 1].length - 1]?.vel ?? 0) - 8} textAnchor="end" fill={lastHue} fontSize={11} fontWeight={800} fontFamily={FONT_UI}>rep 8 (now)</text>
      <text x={(padX + w) / 2} y={h - 6} textAnchor="middle" fill={C['text-tertiary']} fontSize={10} fontFamily={FONT_MONO}>time (normalized per rep) →</text>
    </svg>
  )
}

// --- 3 · Phase-annotated curve (single-rep drilldown) -----------------------------
// One rep, large, with the four phases drawn as shaded regions labelled ON the plot
// (the ForceDecks / Hawkin pattern) — velocity on top, force stacked below, one shared
// time axis + phase bands. The peak concentric velocity is marked.
const PHASE_LABEL: Record<Phase, string> = { ecc: 'ECCENTRIC', pauseBottom: 'PAUSE', con: 'CONCENTRIC', pauseTop: 'HOLD' }
function phaseSpans(rep: number): Array<{ phase: Phase; t0: number; t1: number }> {
  const s = SPECS[rep]
  const b = [0, s.eccMs, s.eccMs + s.pBMs, s.eccMs + s.pBMs + s.conMs, specTotal(s)]
  return [
    { phase: 'ecc', t0: b[0], t1: b[1] },
    { phase: 'pauseBottom', t0: b[1], t1: b[2] },
    { phase: 'con', t0: b[2], t1: b[3] },
    { phase: 'pauseTop', t0: b[3], t1: b[4] },
  ]
}
function PhaseAnnotated({ rep }: { rep: number }) {
  const samples = SETS[rep]
  const total = TOTALS[rep]
  const w = 840
  const padX = 46
  const velH = 168
  const forceH = 96
  const gap = 26
  const h = velH + gap + forceH + 28
  const hue = velColor(MEAN_VEL[rep])
  const x = (t: number) => padX + (t / total) * (w - padX - 16)
  const velMid = velH / 2
  const yV = (v: number) => velMid - (v / VMAX) * (velMid - 12)
  const fTop = velH + gap
  const yF = (f: number) => fTop + forceH - (f / FMAX) * (forceH - 10)
  const velLine: Pt[] = samples.map((s) => [x(s.t), yV(s.vel)])
  const conPts: Pt[] = samples.filter((s) => s.vel > 0.01).map((s) => [x(s.t), yV(s.vel)])
  const eccPts: Pt[] = samples.filter((s) => s.vel < -0.01).map((s) => [x(s.t), yV(s.vel)])
  const forceLine: Pt[] = samples.map((s) => [x(s.t), yF(s.force)])
  const peakS = samples.reduce((a, b) => (b.vel > a.vel ? b : a), samples[0])
  const bandFill: Record<Phase, string> = {
    ecc: alpha(PARCH, 0.05),
    pauseBottom: alpha('#000000', 0.22),
    con: alpha(hue, 0.07),
    pauseTop: alpha('#000000', 0.22),
  }
  return (
    <svg width={w} height={h}>
      {/* phase bands (span both plots) + labels */}
      {phaseSpans(rep).map((p, i) => (
        <g key={i}>
          <rect x={x(p.t0)} y={0} width={Math.max(0, x(p.t1) - x(p.t0))} height={fTop + forceH} fill={bandFill[p.phase]} />
          {x(p.t1) - x(p.t0) > 26 && (
            <text x={(x(p.t0) + x(p.t1)) / 2} y={12} textAnchor="middle" fill={C['text-secondary']} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI}>{PHASE_LABEL[p.phase]}</text>
          )}
        </g>
      ))}
      {/* velocity plot */}
      <line x1={padX} y1={velMid} x2={w - 16} y2={velMid} stroke={AXIS} strokeWidth={1} />
      {conPts.length > 1 && <path d={areaPath(conPts, velMid)} fill={alpha(hue, 0.24)} />}
      {eccPts.length > 1 && <path d={areaPath(eccPts, velMid)} fill={alpha(PARCH, 0.12)} />}
      <path d={smoothPath(velLine)} fill="none" stroke={alpha(PARCH, 0.5)} strokeWidth={1.5} strokeLinejoin="round" />
      {conPts.length > 1 && <path d={smoothPath(conPts)} fill="none" stroke={hue} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
      <circle cx={x(peakS.t)} cy={yV(peakS.vel)} r={4.5} fill={hue} stroke={PANEL_BG} strokeWidth={1.5} />
      <text x={x(peakS.t) + 8} y={yV(peakS.vel) - 6} fill={C['text-primary']} fontSize={11} fontWeight={800} fontFamily={FONT_UI}>peak {peakS.vel.toFixed(2)} m/s</text>
      <text x={padX - 8} y={yV(VMAX * 0.7) + 4} textAnchor="end" fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>m/s</text>
      {/* force plot */}
      <line x1={padX} y1={fTop + forceH} x2={w - 16} y2={fTop + forceH} stroke={AXIS} strokeWidth={1} />
      <path d={areaPath(forceLine, fTop + forceH)} fill={alpha(STEEL, 0.14)} />
      <path d={smoothPath(forceLine)} fill="none" stroke={alpha(PARCH, 0.62)} strokeWidth={2} strokeDasharray="1 0" strokeLinejoin="round" />
      <text x={padX - 8} y={fTop + 14} textAnchor="end" fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>lb</text>
      <text x={w - 16} y={fTop + forceH + 22} textAnchor="end" fill={C['text-tertiary']} fontSize={10} fontFamily={FONT_MONO}>{(total / 1000).toFixed(1)} s →</text>
    </svg>
  )
}

// --- 4 · Ecc vs Con split (control / asymmetry) -----------------------------------
// Fold the rep over POSITION so the two phases share one x-axis (0 → full range): the
// eccentric (parchment) and concentric (zone hue) traced as velocity-vs-position. A
// controlled eccentric is a low broad arc; a DROPPED one spikes. Shown clean-vs-cheat so
// the loss of control + the shortened range read at a glance. (Same fold works for force.)
function EccConcPanel({ rep, title }: { rep: number; title: string }) {
  const samples = SETS[rep]
  const w = 384
  const h = 250
  const padX = 40
  const padTop = 18
  const padBot = 34
  const hue = velColor(MEAN_VEL[rep])
  const x = (pos: number) => padX + (pos / ROM_STD_MM) * (w - padX - 14)
  const y = (v: number) => h - padBot - (Math.abs(v) / VMAX) * (h - padTop - padBot)
  const eccPts: Pt[] = samples.filter((s) => s.phase === 'ecc' && Math.abs(s.vel) > 0.005).map((s) => [x(s.pos), y(s.vel)])
  const conPts: Pt[] = samples.filter((s) => s.phase === 'con' && Math.abs(s.vel) > 0.005).map((s) => [x(s.pos), y(s.vel)])
  const eccPeak = Math.max(0, ...samples.filter((s) => s.phase === 'ecc').map((s) => Math.abs(s.vel)))
  const romPct = Math.round((SPECS[rep].romMm / ROM_STD_MM) * 100)
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: C['text-primary'], fontSize: 12, fontWeight: '800', fontFamily: FONT_UI }}>{title}</Text>
      <svg width={w} height={h}>
        <line x1={padX} y1={h - padBot} x2={w - 14} y2={h - padBot} stroke={AXIS} strokeWidth={1} />
        <line x1={padX} y1={padTop} x2={padX} y2={h - padBot} stroke={AXIS} strokeWidth={1} />
        {/* full-range marker */}
        <line x1={x(ROM_STD_MM)} y1={padTop} x2={x(ROM_STD_MM)} y2={h - padBot} stroke={GRID} strokeWidth={1} strokeDasharray="4 4" />
        <text x={x(ROM_STD_MM)} y={h - padBot + 22} textAnchor="middle" fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>full</text>
        <text x={x(SPECS[rep].romMm)} y={h - padBot + 12} textAnchor="middle" fill={alpha(PARCH, 0.5)} fontSize={9} fontFamily={FONT_MONO}>{romPct}%</text>
        {eccPts.length > 1 && <path d={smoothPath(eccPts)} fill="none" stroke={alpha(PARCH, 0.6)} strokeWidth={2.5} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />}
        {conPts.length > 1 && <path d={smoothPath(conPts)} fill="none" stroke={hue} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
        {/* ecc peak marker */}
        <text x={w - 14} y={padTop + 10} textAnchor="end" fill={alpha(PARCH, 0.8)} fontSize={10} fontWeight={700} fontFamily={FONT_UI}>ECC peak {eccPeak.toFixed(2)}</text>
        <text x={padX + 4} y={h - padBot - 4} fill={C['text-tertiary']} fontSize={9} fontFamily={FONT_MONO}>position (mm) →</text>
      </svg>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <LegendSwatch color={alpha(PARCH, 0.7)} dashed label="eccentric" />
        <LegendSwatch color={hue} label="concentric" />
      </View>
    </View>
  )
}

// --- Scaffolding -----------------------------------------------------------------
function LegendSwatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 18, height: 0, borderTopWidth: 2.5, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={{ color: C['text-secondary'], fontSize: 11, fontWeight: '700', fontFamily: FONT_UI }}>{label}</Text>
    </View>
  )
}
function ChannelLegend() {
  return (
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <LegendSwatch color={S.orange} label="VELOCITY — zone hue (concentric)" />
      <LegendSwatch color={alpha(PARCH, 0.7)} dashed label="eccentric / position — parchment" />
      <LegendSwatch color={alpha(PARCH, 0.6)} label="force (lb) — steel, neutral" />
    </View>
  )
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{children}</Text>
}
function Caption({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 12, fontFamily: FONT_UI, color: C['text-secondary'], maxWidth: 820, lineHeight: 18 }}>{children}</Text>
}
function Kicker({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 9, letterSpacing: 1, fontFamily: FONT_MONO, color: C['text-tertiary'] }}>{children}</Text>
}
const wellStyle = { ...insetWell(), borderRadius: 12, padding: 16 } as ViewStyle
function Panel({ children, width }: { children: ReactNode; width?: number }) {
  return <View style={{ width, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 14 }}>{children}</View>
}
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 24 }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/Archive/Curves/Per Rep',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** 1 — Velocity-time curve, whole-set small multiples. */
export const VelocityTimeCurve: Story = {
  name: '1 · Velocity-time (small multiples)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Velocity–time curve — the whole shape of every rep</SectionTitle>
        <Caption>
          Each rep's velocity plotted against time as one smooth continuous line through all four phases: the eccentric dips
          BELOW the zero line (parchment), the concentric rises ABOVE it (zone hue), and each lobe's area ≈ the displacement
          it covered (≈ ROM). Small-multipled across the set with cell width ∝ real rep duration, so fatigue deforms the
          shape: the broad controlled eccentric collapses into a fast spike (reps 4 & 7), the concentric flattens and
          lengthens (grind, reps 5→8), and the whole curve shrinks as depth is cut.
        </Caption>
        <ChannelLegend />
      </View>
      <Panel width={1180}>
        <Kicker>8-REP CABLE PRESS · ~11 Hz stream · x = time (to scale) · up = concentric · down = eccentric</Kicker>
        <View style={[wellStyle, { flexDirection: 'row', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }]}>
          {SETS.map((_, rep) => <MiniVelCurve key={rep} rep={rep} />)}
        </View>
      </Panel>
    </Page>
  ),
}

/** 2 — Ghost-trail overlay (consistency / drift). */
export const GhostTrailSet: Story = {
  name: '2 · Ghost-trail set (overlay)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Ghost-trail set — every rep on one axis</SectionTitle>
        <Caption>
          All eight reps overlaid on ONE time-normalized axis: the prior reps fade to grey ghosts underneath, the last
          (current) rep is solid and saturated. The spread of the grey fan is the set's consistency; the live rep sliding
          down and out through the fan is the fatigue drift — instant, no legend. The concentric lobe shrinking and the
          eccentric spiking as the set wears in read at a single glance. Generalises directly to force or position — same
          overlay, swap the y-channel.
        </Caption>
        <ChannelLegend />
      </View>
      <Panel width={920}>
        <Kicker>8-REP CABLE PRESS · overlay · time normalized per rep · last rep saturated, priors grey</Kicker>
        <View style={wellStyle}>
          <GhostTrail />
        </View>
      </Panel>
    </Page>
  ),
}

/** 3 — Phase-annotated single-rep drilldown. */
export const PhaseAnnotatedCurve: Story = {
  name: '3 · Phase-annotated (drilldown)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Phase-annotated curve — one rep, drilled down</SectionTitle>
        <Caption>
          A single rep at review scale with the four phases drawn as shaded regions labelled directly on the plot (the
          ForceDecks / Hawkin pattern), not chopped into separate tiles. Velocity sits on top (eccentric parchment /
          concentric hue) with the peak concentric marked; FORCE (lb) is stacked below on a shared time axis + phase bands,
          so the concentric grind — high force while the bar barely moves — and the eccentric control both read in one view.
        </Caption>
        <ChannelLegend />
      </View>
      <Panel width={920}>
        <Kicker>REP 3 · ~11 Hz · velocity (m/s) over force (lb) · shared phase bands</Kicker>
        <View style={wellStyle}>
          <PhaseAnnotated rep={2} />
        </View>
      </Panel>
    </Page>
  ),
}

/** 4 — Ecc vs Con split, clean vs cheat. */
export const EccConcSplit: Story = {
  name: '4 · Ecc vs Con (control)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Eccentric vs concentric — control &amp; asymmetry</SectionTitle>
        <Caption>
          Each rep folded over POSITION so the lowering and the lift share one x-axis (0 → full range): eccentric
          (parchment, dashed) vs concentric (zone hue), as velocity-vs-position. A controlled eccentric is a low broad arc;
          a DROPPED one spikes. Shown clean rep vs cheat rep — the cheat's eccentric spikes to a high peak AND its whole
          trace stops short of full range (cut ROM), so the loss of control and the shortened depth read together. The same
          position-fold works for force.
        </Caption>
      </View>
      <Panel width={880}>
        <Kicker>POSITION-FOLD · velocity vs position · clean (rep 2) vs cheat (rep 7)</Kicker>
        <View style={[wellStyle, { flexDirection: 'row', gap: 24, flexWrap: 'wrap' }]}>
          <EccConcPanel rep={1} title="Rep 2 — controlled" />
          <EccConcPanel rep={6} title="Rep 7 — dropped eccentric + cut ROM (cheat)" />
        </View>
      </Panel>
    </Page>
  ),
}

/** Overview — the four curve encodings tiled. */
export const Overview: Story = {
  name: 'Overview · four curve reads',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Curves per rep — four reads on one ~11 Hz stream</SectionTitle>
        <Caption>
          The same fatiguing 8-rep set (reps 4 &amp; 7 = dropped-eccentric + cut-ROM cheats, rep 5 = honest grind) rendered
          four ways from the real per-sample stream. Velocity stays the one saturated hue; eccentric / position / force are
          neutral parchment &amp; steel geometry. Small-multiples + overlay show the set decay; drilldown + ecc/con split
          show a single rep's mechanics.
        </Caption>
        <ChannelLegend />
      </View>
      <View style={{ flexDirection: 'column', gap: 20 }}>
        <Panel width={1180}>
          <Kicker>1 · VELOCITY-TIME — whole-set small multiples</Kicker>
          <View style={[wellStyle, { flexDirection: 'row', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }]}>
            {SETS.map((_, rep) => <MiniVelCurve key={rep} rep={rep} />)}
          </View>
        </Panel>
        <Panel width={920}>
          <Kicker>2 · GHOST-TRAIL — overlay, consistency / drift</Kicker>
          <View style={wellStyle}>
            <GhostTrail />
          </View>
        </Panel>
        <Panel width={920}>
          <Kicker>3 · PHASE-ANNOTATED — single-rep drilldown</Kicker>
          <View style={wellStyle}>
            <PhaseAnnotated rep={2} />
          </View>
        </Panel>
        <Panel width={880}>
          <Kicker>4 · ECC vs CON — control / asymmetry</Kicker>
          <View style={[wellStyle, { flexDirection: 'row', gap: 24, flexWrap: 'wrap' }]}>
            <EccConcPanel rep={1} title="Rep 2 — controlled" />
            <EccConcPanel rep={6} title="Rep 7 — cheat" />
          </View>
        </Panel>
      </View>
    </Page>
  ),
}
