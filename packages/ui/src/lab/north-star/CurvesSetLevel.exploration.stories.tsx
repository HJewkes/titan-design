// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Curves Set Level` — DESIGN EXPLORATION (not shipped).
 *
 * The live wall answers "how is THIS rep going". This surface is its REVIEW / ANALYSIS
 * counterpart: the set- and session-level reads a lifter (or coach) looks at BETWEEN
 * sets and after the workout — the derived curves the VBT literature is built on.
 *
 * Voltras already persists the raw material for all of these (per-rep concentric peak
 * & mean velocity, per-rep peak force + ROM + tempo, per-set velocity-loss vs a best
 * rep, and load↔velocity pairs across sets — confirmed by the signals audit). Only the
 * across-session load-velocity PROFILE (#3) needs backend plumbing to assemble; the
 * rest are buildable today.
 *
 * Channel discipline (same as the shipped strip + the RepBreakdown per-rep exploration):
 *   • VELOCITY is the ONE saturated hue — the green→red zone ramp. Nothing else gets a hue.
 *   • FORCE / LOAD / neutral geometry is warm PARCHMENT (alpha text-primary) — never a hue.
 *   • Grids, axes, regression lines, drift arrows are the faintest parchment.
 * Charts carry the wall's craft: a recessed plot well (inset surface), a faint grid, an
 * area fill under the trend, emphasized endpoints — not default chart chrome.
 *
 * Units are labelled honestly: velocity m/s, force lb. Work/power would be lb·cable-units
 * (NOT joules/watts) — shown only where labelled as such.
 *
 * Exports: VelocityLossInSet · ForceVelocityScatter · LoadVelocityProfile · AnalysisLayout · Overview.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'
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

// --- Channel roles ----------------------------------------------------------------
const S = WORKOUT_TOKENS.scale
/** VELOCITY — the only saturated fill hue (green→red zone ramp, mirrors the shipped strip). */
function velColor(v: number): string {
  if (v >= 1.0) return S.green
  if (v >= 0.75) return S.yellow
  if (v >= 0.5) return S.orange
  return S.red
}
function velZoneName(v: number): string {
  if (v >= 1.0) return 'Speed'
  if (v >= 0.75) return 'Power'
  if (v >= 0.5) return 'Strength-speed'
  return 'Strength'
}
// FORCE / LOAD / neutral geometry — warm parchment, never a hue.
const PARCH = alpha(C['text-primary'], 0.8)
const PARCH_DIM = alpha(C['text-primary'], 0.34)
const PARCH_GHOST = alpha(C['text-primary'], 0.1)
const GRID = alpha(C['text-primary'], 0.09)
const AXIS = alpha(C['text-primary'], 0.2)

/** ~0.18α matte paper grain — the same fractalNoise tile the hero bars carry. */
const BAR_GRAIN =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
  `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
  `%3Crect width='120' height='120' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E")`
const grain = { backgroundImage: BAR_GRAIN } as unknown as ViewStyle

// =================================================================================
// Mock data — realistic cable strength-training numbers.
// =================================================================================

/** A fatiguing hypertrophy set: 10 reps, velocity decaying from a best of 0.95 → 0.60 m/s. */
const SET_VL = [0.92, 0.95, 0.91, 0.86, 0.81, 0.76, 0.71, 0.66, 0.62, 0.6]
const V_BEST = Math.max(...SET_VL)
/** Velocity loss (%) vs the set's best rep — the literature's headline set metric. */
function vlPct(v: number): number {
  return Math.round((1 - v / V_BEST) * 100)
}
const VL_FINAL = vlPct(SET_VL[SET_VL.length - 1])
/** VL% → velocity level (for drawing the threshold lines). */
const vAtLoss = (loss: number) => V_BEST * (1 - loss / 100)

/** Per-rep (peakForce lb, peakVelocity m/s) WITHIN one set — the fatigue-drift scatter. */
const FV: Array<{ f: number; v: number }> = [
  { f: 210, v: 0.72 },
  { f: 214, v: 0.71 },
  { f: 218, v: 0.68 },
  { f: 221, v: 0.64 },
  { f: 224, v: 0.6 },
  { f: 228, v: 0.56 },
  { f: 231, v: 0.52 },
  { f: 233, v: 0.49 },
  { f: 235, v: 0.46 },
  { f: 236, v: 0.44 },
]

/** (load lb, mean concentric velocity m/s) across sets — the across-session L-V profile. */
const LV: Array<{ load: number; v: number }> = [
  { load: 95, v: 0.86 },
  { load: 115, v: 0.73 },
  { load: 135, v: 0.61 },
  { load: 155, v: 0.49 },
  { load: 175, v: 0.37 },
]
/** Minimum-velocity threshold (m/s) — the velocity at a true 1RM; where the fit is extrapolated to. */
const MVT = 0.3

// --- Small math -------------------------------------------------------------------
interface Fit {
  slope: number
  intercept: number
  at: (x: number) => number
  atY: (y: number) => number
}
/** Ordinary-least-squares fit of y on x. */
function linReg(pts: Array<{ x: number; y: number }>): Fit {
  const n = pts.length
  const sx = pts.reduce((s, p) => s + p.x, 0)
  const sy = pts.reduce((s, p) => s + p.y, 0)
  const sxx = pts.reduce((s, p) => s + p.x * p.x, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const intercept = (sy - slope * sx) / n
  return { slope, intercept, at: (x) => slope * x + intercept, atY: (y) => (y - intercept) / slope }
}
/** Linear map from a data domain onto a pixel range. */
const scale = (v: number, dMin: number, dMax: number, rMin: number, rMax: number) =>
  rMin + ((v - dMin) / (dMax - dMin)) * (rMax - rMin)

/** The VL% verdict — the stop-set decision, tone-coded. */
function vlVerdict(loss: number): { word: string; sub: string; tone: string } {
  if (loss < 10) return { word: 'Strength / speed', sub: 'bar speed preserved — plenty left', tone: C['status-success'] }
  if (loss < 20) return { word: 'Power–strength', sub: 'high quality — keep going', tone: C['status-success'] }
  if (loss < 30) return { word: 'Hypertrophy', sub: 'productive fatigue zone', tone: S.yellow }
  if (loss < 40) return { word: 'Approaching failure', sub: 'last effective reps — consider racking', tone: C['status-warning'] }
  return { word: 'Near failure', sub: 'velocity gutted — end the set', tone: C['status-error'] }
}

// --- Presentation scaffolding -----------------------------------------------------
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 24 }}>{children}</View>
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{children}</Text>
}
function Caption({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 12, fontFamily: FONT_UI, color: C['text-secondary'], maxWidth: 780, lineHeight: 18 }}>{children}</Text>
}
function Kicker({ children }: { children: ReactNode }) {
  return <Text style={[{ fontSize: 9, letterSpacing: 1, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>{children}</Text>
}
function Panel({ children, width }: { children: ReactNode; width?: number | string }) {
  return <View style={{ width: width as number, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 14 }}>{children}</View>
}
/** A recessed plot well — the inset-well surface language, so a chart reads as cut INTO the wall. */
const plotWell = insetWell(primitiveColors.charcoal[900])

// =================================================================================
// #1 — VELOCITY LOSS IN SET
// Per-rep concentric velocity bars (zone hue) over a rep axis, with VL20 / VL30
// threshold lines and productive/hypertrophy/failure bands behind them, plus a
// stop-set verdict readout. The whole "keep going or rack it" call in one glance.
// =================================================================================
function VelocityLossChart({ width = 560, height = 300 }: { width?: number; height?: number }) {
  const plotH = height - 40 // room for the value labels above the bars
  const vAxisMax = V_BEST * 1.08
  const yFromV = (v: number) => (v / vAxisMax) * plotH
  const y20 = yFromV(vAtLoss(20))
  const y30 = yFromV(vAtLoss(30))
  const yBest = yFromV(V_BEST)
  const band = (bottom: number, h: number, col: string) => (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom, height: h, backgroundColor: col }} />
  )
  const line = (bottom: number, col: string, label: string) => (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom }}>
      <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: col }} />
      <Text style={{ position: 'absolute', right: 4, top: -14, fontSize: 9, fontWeight: '800', fontFamily: FONT_MONO, color: col }}>{label}</Text>
    </View>
  )
  return (
    <View style={[{ width, borderRadius: 12, padding: 14 }, plotWell]}>
      <View style={{ height, position: 'relative' }}>
        {/* Decision bands (faint) — productive / hypertrophy / failure, by velocity level. */}
        {band(0, y30, alpha(C['status-error'], 0.1))}
        {band(y30, y20 - y30, alpha(C['status-warning'], 0.09))}
        {band(y20, plotH - y20, alpha(C['status-success'], 0.07))}
        {/* Threshold + running-best reference lines. */}
        {line(yBest, alpha(PARCH, 0.5), `best ${formatVelocity(V_BEST)}`)}
        {line(y20, alpha(C['status-warning'], 0.7), 'VL 20%')}
        {line(y30, alpha(C['status-error'], 0.7), 'VL 30%')}
        {/* Velocity bars. */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          {SET_VL.map((v, i) => {
            const h = Math.max(6, yFromV(v))
            const col = velColor(v)
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: C['text-primary'], fontSize: 11, fontWeight: '800', marginBottom: 3, fontFamily: FONT_MONO }}>{formatVelocity(v)}</Text>
                <View
                  style={[
                    { width: '82%', height: h, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: col, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 6px 14px rgba(0,0,0,0.45)' } as unknown as ViewStyle,
                    grain,
                  ]}
                />
              </View>
            )
          })}
        </View>
      </View>
      {/* Rep axis. */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
        {SET_VL.map((_, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', color: C['text-tertiary'], fontSize: 10, fontWeight: '700', fontFamily: FONT_MONO }}>{i + 1}</Text>
        ))}
      </View>
    </View>
  )
}

/** The stop-set verdict — a paper readout with the big VL number, its zone word, and a mini VL trace. */
function VerdictTile({ width = 300 }: { width?: number }) {
  const verdict = vlVerdict(VL_FINAL)
  const w = 260
  const h = 54
  const maxLoss = Math.max(...SET_VL.map(vlPct), 30)
  return (
    <View style={[{ width, borderRadius: 12, padding: 18, gap: 12, justifyContent: 'center' }, paperSheet(primitiveColors.charcoal[800])]}>
      <Text style={[{ fontSize: 10, letterSpacing: 1.5, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>STOP-SET DECISION</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <Text style={{ fontSize: 52, fontWeight: '900', fontFamily: FONT_HEAD, color: verdict.tone, lineHeight: 52 }}>{VL_FINAL}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: verdict.tone, marginBottom: 6 }}>%</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C['text-tertiary'], marginBottom: 9, fontFamily: FONT_UI }}>velocity loss</Text>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', fontFamily: FONT_HEAD, color: verdict.tone }}>{verdict.word}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: C['text-secondary'], fontFamily: FONT_UI }}>{verdict.sub}</Text>
      </View>
      {/* Mini VL-progression trace — how loss accumulated rep by rep. */}
      <View>
        <Text style={{ fontSize: 9, fontFamily: FONT_MONO, color: C['text-tertiary'], marginBottom: 4 }}>VL% PER REP →</Text>
        <svg width={w} height={h}>
          <line x1={0} y1={h - scale(20, 0, maxLoss, 0, h)} x2={w} y2={h - scale(20, 0, maxLoss, 0, h)} stroke={alpha(C['status-warning'], 0.5)} strokeWidth={1} strokeDasharray="3 3" />
          <line x1={0} y1={h - scale(30, 0, maxLoss, 0, h)} x2={w} y2={h - scale(30, 0, maxLoss, 0, h)} stroke={alpha(C['status-error'], 0.5)} strokeWidth={1} strokeDasharray="3 3" />
          <polyline
            points={SET_VL.map((v, i) => `${scale(i, 0, SET_VL.length - 1, 3, w - 3)},${h - scale(vlPct(v), 0, maxLoss, 0, h)}`).join(' ')}
            fill="none"
            stroke={PARCH}
            strokeWidth={2}
          />
          {SET_VL.map((v, i) => (
            <circle key={i} cx={scale(i, 0, SET_VL.length - 1, 3, w - 3)} cy={h - scale(vlPct(v), 0, maxLoss, 0, h)} r={i === SET_VL.length - 1 ? 4 : 2} fill={velColor(v)} />
          ))}
        </svg>
      </View>
    </View>
  )
}

// =================================================================================
// #2 — FORCE-VELOCITY SCATTER (within a set)
// Each rep is a point at (peakForce x, peakVelocity y). As the set fatigues the
// cloud DRIFTS down-and-right — velocity falls while force holds/creeps up. The
// drift vector itself is the fatigue read. A faint regression + an arrow name it.
// =================================================================================
function ForceVelocityChart({ width = 760, height = 360 }: { width?: number; height?: number }) {
  const pad = { l: 58, r: 24, t: 20, b: 46 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const xDom: [number, number] = [204, 242]
  const yDom: [number, number] = [0.4, 0.78]
  const px = (f: number) => pad.l + scale(f, xDom[0], xDom[1], 0, iw)
  const py = (v: number) => pad.t + scale(v, yDom[1], yDom[0], 0, ih)
  const fit = linReg(FV.map((p) => ({ x: p.f, y: p.v })))
  const xTicks = [210, 220, 230, 240]
  const yTicks = [0.4, 0.5, 0.6, 0.7]
  // Drift arrow: first rep → last rep.
  const a = { x: px(FV[0].f), y: py(FV[0].v) }
  const b = { x: px(FV[FV.length - 1].f), y: py(FV[FV.length - 1].v) }
  const ang = Math.atan2(b.y - a.y, b.x - a.x)
  const head = (s: number) =>
    `${b.x},${b.y} ${b.x + s * Math.cos(ang + Math.PI - 0.45)},${b.y + s * Math.sin(ang + Math.PI - 0.45)} ${b.x + s * Math.cos(ang + Math.PI + 0.45)},${b.y + s * Math.sin(ang + Math.PI + 0.45)}`
  return (
    <View style={[{ width, borderRadius: 12, padding: 8 }, plotWell]}>
      <svg width={width} height={height}>
        {/* grid */}
        {xTicks.map((t) => (
          <line key={`gx${t}`} x1={px(t)} y1={pad.t} x2={px(t)} y2={pad.t + ih} stroke={GRID} strokeWidth={1} />
        ))}
        {yTicks.map((t) => (
          <line key={`gy${t}`} x1={pad.l} y1={py(t)} x2={pad.l + iw} y2={py(t)} stroke={GRID} strokeWidth={1} />
        ))}
        {/* axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ih} stroke={AXIS} strokeWidth={1.5} />
        <line x1={pad.l} y1={pad.t + ih} x2={pad.l + iw} y2={pad.t + ih} stroke={AXIS} strokeWidth={1.5} />
        {/* regression (faint parchment) */}
        <line x1={px(xDom[0])} y1={py(fit.at(xDom[0]))} x2={px(xDom[1])} y2={py(fit.at(xDom[1]))} stroke={alpha(PARCH, 0.35)} strokeWidth={1.5} strokeDasharray="5 5" />
        {/* fatigue drift arrow (neutral) */}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={alpha(PARCH, 0.55)} strokeWidth={2.5} />
        <polygon points={head(11)} fill={alpha(PARCH, 0.7)} />
        {/* points — the one hue */}
        {FV.map((p, i) => {
          const emph = i === 0 || i === FV.length - 1
          return (
            <g key={i}>
              {emph && <circle cx={px(p.f)} cy={py(p.v)} r={9} fill="none" stroke={alpha(velColor(p.v), 0.5)} strokeWidth={1.5} />}
              <circle cx={px(p.f)} cy={py(p.v)} r={emph ? 6 : 4.5} fill={velColor(p.v)} stroke={PAGE_BG} strokeWidth={1} />
              <text x={px(p.f)} y={py(p.v) - 11} fontSize={9} fontFamily={FONT_MONO} fontWeight="700" fill={C['text-tertiary']} textAnchor="middle">{i + 1}</text>
            </g>
          )
        })}
        {/* drift label */}
        <text x={(a.x + b.x) / 2 + 14} y={(a.y + b.y) / 2 - 8} fontSize={10} fontFamily={FONT_UI} fontWeight="800" fill={alpha(PARCH, 0.8)} textAnchor="start">fatigue drift ↘</text>
        {/* axis ticks + labels */}
        {xTicks.map((t) => (
          <text key={`tx${t}`} x={px(t)} y={pad.t + ih + 16} fontSize={10} fontFamily={FONT_MONO} fill={C['text-tertiary']} textAnchor="middle">{t}</text>
        ))}
        {yTicks.map((t) => (
          <text key={`ty${t}`} x={pad.l - 10} y={py(t) + 3} fontSize={10} fontFamily={FONT_MONO} fill={C['text-tertiary']} textAnchor="end">{t.toFixed(2)}</text>
        ))}
        <text x={pad.l + iw / 2} y={height - 6} fontSize={11} fontFamily={FONT_UI} fontWeight="700" fill={C['text-secondary']} textAnchor="middle">peak force (lb) →</text>
        <text x={16} y={pad.t + ih / 2} fontSize={11} fontFamily={FONT_UI} fontWeight="700" fill={C['text-secondary']} textAnchor="middle" transform={`rotate(-90 16 ${pad.t + ih / 2})`}>peak velocity (m/s) →</text>
      </svg>
    </View>
  )
}

// =================================================================================
// #3 — LOAD-VELOCITY PROFILE (across loads / sets)
// Scatter of (load x, mean velocity y) with a fitted regression extrapolated DOWN to
// the minimum-velocity threshold → an estimated 1RM, plus a target-velocity-per-load
// readout. "Tap a point → that set's detail" shown as a visual affordance.
// (Coaching gold, but assembling the pairs across sessions needs backend plumbing.)
// =================================================================================
function LoadVelocityChart({ width = 620, height = 360 }: { width?: number; height?: number }) {
  const pad = { l: 58, r: 24, t: 20, b: 46 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const fit = linReg(LV.map((p) => ({ x: p.load, y: p.v })))
  const est1RM = Math.round(fit.atY(MVT))
  const xDom: [number, number] = [85, est1RM + 8]
  const yDom: [number, number] = [MVT - 0.05, 0.95]
  const px = (l: number) => pad.l + scale(l, xDom[0], xDom[1], 0, iw)
  const py = (v: number) => pad.t + scale(v, yDom[1], yDom[0], 0, ih)
  const xTicks = [95, 125, 155, est1RM]
  const yTicks = [0.3, 0.5, 0.7, 0.9]
  const lastLoad = LV[LV.length - 1].load
  // The tapped-point affordance sits on the middle set.
  const tap = LV[2]
  return (
    <View style={[{ width, borderRadius: 12, padding: 8 }, plotWell]}>
      <svg width={width} height={height}>
        {yTicks.map((t) => (
          <line key={`gy${t}`} x1={pad.l} y1={py(t)} x2={pad.l + iw} y2={py(t)} stroke={GRID} strokeWidth={1} />
        ))}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ih} stroke={AXIS} strokeWidth={1.5} />
        <line x1={pad.l} y1={pad.t + ih} x2={pad.l + iw} y2={pad.t + ih} stroke={AXIS} strokeWidth={1.5} />
        {/* MVT line — the velocity at a true 1RM. */}
        <line x1={pad.l} y1={py(MVT)} x2={pad.l + iw} y2={py(MVT)} stroke={alpha(C['status-error'], 0.45)} strokeWidth={1} strokeDasharray="4 4" />
        <text x={pad.l + 6} y={py(MVT) - 5} fontSize={9} fontFamily={FONT_MONO} fontWeight="700" fill={alpha(C['status-error'], 0.9)}>MVT {MVT.toFixed(2)} m/s = 1RM</text>
        {/* Fitted profile: solid across measured loads, dashed extrapolation to the MVT / est 1RM. */}
        <line x1={px(LV[0].load)} y1={py(fit.at(LV[0].load))} x2={px(lastLoad)} y2={py(fit.at(lastLoad))} stroke={alpha(PARCH, 0.55)} strokeWidth={2} />
        <line x1={px(lastLoad)} y1={py(fit.at(lastLoad))} x2={px(est1RM)} y2={py(MVT)} stroke={alpha(PARCH, 0.4)} strokeWidth={2} strokeDasharray="6 5" />
        {/* Estimated 1RM marker on the load axis. */}
        <circle cx={px(est1RM)} cy={py(MVT)} r={5} fill={C['status-error']} stroke={PAGE_BG} strokeWidth={1.5} />
        <line x1={px(est1RM)} y1={py(MVT)} x2={px(est1RM)} y2={pad.t + ih} stroke={alpha(C['status-error'], 0.4)} strokeWidth={1} strokeDasharray="2 3" />
        {/* Measured points — velocity hue, emphasized ends. */}
        {LV.map((p, i) => {
          const emph = i === 0 || i === LV.length - 1
          return (
            <g key={i}>
              <circle cx={px(p.load)} cy={py(p.v)} r={emph ? 7 : 5.5} fill={velColor(p.v)} stroke={PAGE_BG} strokeWidth={1.5} />
              <text x={px(p.load)} y={py(p.v) - 12} fontSize={9} fontFamily={FONT_MONO} fontWeight="700" fill={C['text-tertiary']} textAnchor="middle">{p.load}lb</text>
            </g>
          )
        })}
        {/* "Tap → set detail" affordance on one point. */}
        <circle cx={px(tap.load)} cy={py(tap.v)} r={13} fill="none" stroke={alpha(C['text-primary'], 0.45)} strokeWidth={1} strokeDasharray="2 3" />
        <line x1={px(tap.load) + 12} y1={py(tap.v) - 12} x2={px(tap.load) + 60} y2={py(tap.v) - 44} stroke={alpha(PARCH, 0.4)} strokeWidth={1} />
        <g transform={`translate(${px(tap.load) + 60} ${py(tap.v) - 62})`}>
          <rect x={0} y={0} width={132} height={34} rx={6} fill={alpha(primitiveColors.charcoal[700], 0.95)} stroke={alpha(C['text-primary'], 0.2)} strokeWidth={1} />
          <text x={10} y={14} fontSize={10} fontFamily={FONT_UI} fontWeight="800" fill={C['text-primary']}>↳ tap point</text>
          <text x={10} y={27} fontSize={9} fontFamily={FONT_UI} fill={C['text-secondary']}>open that set&apos;s reps</text>
        </g>
        {/* axis ticks + labels */}
        {xTicks.map((t) => (
          <text key={`tx${t}`} x={px(t)} y={pad.t + ih + 16} fontSize={10} fontFamily={FONT_MONO} fill={t === est1RM ? alpha(C['status-error'], 0.95) : C['text-tertiary']} fontWeight={t === est1RM ? '800' : '400'} textAnchor="middle">{t}</text>
        ))}
        {yTicks.map((t) => (
          <text key={`ty${t}`} x={pad.l - 10} y={py(t) + 3} fontSize={10} fontFamily={FONT_MONO} fill={C['text-tertiary']} textAnchor="end">{t.toFixed(2)}</text>
        ))}
        <text x={pad.l + iw / 2} y={height - 6} fontSize={11} fontFamily={FONT_UI} fontWeight="700" fill={C['text-secondary']} textAnchor="middle">load (lb) →</text>
        <text x={16} y={pad.t + ih / 2} fontSize={11} fontFamily={FONT_UI} fontWeight="700" fill={C['text-secondary']} textAnchor="middle" transform={`rotate(-90 16 ${pad.t + ih / 2})`}>mean velocity (m/s) →</text>
      </svg>
    </View>
  )
}

/** The L-V coaching readout: estimated 1RM + the load that hits each target velocity zone. */
function LVReadout({ width = 260 }: { width?: number }) {
  const fit = linReg(LV.map((p) => ({ x: p.load, y: p.v })))
  const est1RM = Math.round(fit.atY(MVT))
  const targets = [
    { v: 0.75, name: 'Speed / power' },
    { v: 0.5, name: 'Strength-speed' },
    { v: 0.35, name: 'Max strength' },
  ]
  return (
    <View style={[{ width, borderRadius: 12, padding: 18, gap: 12 }, paperSheet(primitiveColors.charcoal[800])]}>
      <Text style={[{ fontSize: 10, letterSpacing: 1.5, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>PROFILE READOUT</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        <Text style={{ fontSize: 44, fontWeight: '900', fontFamily: FONT_HEAD, color: C['text-primary'], lineHeight: 44 }}>{est1RM}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: C['text-tertiary'], marginBottom: 8, fontFamily: FONT_UI }}>lb est. 1RM</Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: C['text-secondary'], fontFamily: FONT_UI }}>extrapolated to MVT {MVT.toFixed(2)} m/s (dashed) — needs a fresh re-test to trust the low end</Text>
      <View style={{ height: 1, backgroundColor: PARCH_GHOST }} />
      <Text style={[{ fontSize: 9, letterSpacing: 1, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>LOAD FOR TARGET VELOCITY</Text>
      {targets.map((t) => (
        <View key={t.v} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: velColor(t.v) }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: C['text-secondary'], fontFamily: FONT_UI }}>{t.name}</Text>
            <Text style={{ fontSize: 10, color: C['text-tertiary'], fontFamily: FONT_MONO }}>{t.v.toFixed(2)}</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C['text-primary'], fontFamily: FONT_MONO }}>{Math.round(fit.atY(t.v))} lb</Text>
        </View>
      ))}
    </View>
  )
}

/** The FV drift readout — the fatigue vector in words + numbers. */
function FVReadout({ width = 260 }: { width?: number }) {
  const first = FV[0]
  const last = FV[FV.length - 1]
  const vDrop = Math.round((1 - last.v / first.v) * 100)
  const fRise = Math.round((last.f / first.f - 1) * 100)
  return (
    <View style={[{ width, borderRadius: 12, padding: 18, gap: 10 }, paperSheet(primitiveColors.charcoal[800])]}>
      <Text style={[{ fontSize: 10, letterSpacing: 1.5, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>FATIGUE VECTOR</Text>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', fontFamily: FONT_HEAD, color: C['status-error'] }}>↓{vDrop}%</Text>
          <Text style={{ fontSize: 11, color: C['text-tertiary'], fontFamily: FONT_UI }}>peak velocity</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', fontFamily: FONT_HEAD, color: PARCH }}>↑{fRise}%</Text>
          <Text style={{ fontSize: 11, color: C['text-tertiary'], fontFamily: FONT_UI }}>peak force</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C['text-secondary'], fontFamily: FONT_UI, lineHeight: 17 }}>
        Velocity collapsed while force held and even crept up — the signature of true neuromuscular fatigue, not a light set. The down-right drift IS the read.
      </Text>
    </View>
  )
}

// =================================================================================
// A placeholder slot for the per-rep CURVES another agent is building (RepBreakdown).
// =================================================================================
function CurvesSlot({ width, height = 150 }: { width?: number | string; height?: number }) {
  return (
    <View style={[{ width: width as number, height, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 6 }, insetWell(primitiveColors.charcoal[900])]}>
      <Text style={[{ fontSize: 10, letterSpacing: 1.5, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>PER-REP CURVES</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C['text-secondary'], fontFamily: FONT_UI, textAlign: 'center', maxWidth: 320 }}>
        slot for the velocity-vs-time / rep-breakdown small multiples (Lab · Rep Breakdown) — the drill-down when a set flags
      </Text>
    </View>
  )
}

// --- Stage relationship banner (live wall ⟶ this review surface) ------------------
function LiveToReviewBanner() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: alpha(C['text-primary'], 0.05), borderWidth: 1, borderColor: PARCH_GHOST }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C['status-live'] }} />
        <Text style={{ fontSize: 11, fontWeight: '800', fontFamily: FONT_UI, color: C['text-tertiary'] }}>LIVE WALL</Text>
      </View>
      <Text style={{ fontSize: 13, color: PARCH_DIM }}>⟶</Text>
      <Text style={{ fontSize: 11, fontWeight: '800', fontFamily: FONT_UI, color: C['text-primary'] }}>REVIEW / ANALYSIS</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', fontFamily: FONT_UI, color: C['text-secondary'] }}>· the between-set + post-session counterpart to the single-rep glance</Text>
    </View>
  )
}

// =================================================================================
// Stories
// =================================================================================
const meta: Meta = {
  title: 'Lab/North Star/Curves Set Level',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const VelocityLossInSet: Story = {
  name: '1 · Velocity loss in set',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Velocity loss in set — the stop-or-continue call</SectionTitle>
        <Caption>
          The literature&apos;s #1 set metric. Per-rep concentric velocity bars (the zone hue) over the rep axis, with the
          running-best reference and the VL 20% / VL 30% threshold lines. The plot floor is banded productive → hypertrophy →
          failure by velocity level, so a bar crossing into the amber or red band reads as &quot;these are your last effective
          reps&quot; without any math. The verdict tile turns VL% = 100·(1−V/V-best) into one word. Buildable today.
        </Caption>
      </View>
      <Panel width={940}>
        <Kicker>10-REP CABLE PRESS · bars = per-rep velocity · lines = VL thresholds · bands = decision zones</Kicker>
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'stretch' }}>
          <VelocityLossChart width={580} height={300} />
          <VerdictTile width={320} />
        </View>
      </Panel>
    </Page>
  ),
}

export const ForceVelocityScatter: Story = {
  name: '2 · Force–velocity scatter',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Force–velocity scatter — the within-set fatigue drift</SectionTitle>
        <Caption>
          Every rep of one set plotted at (peak force, peak velocity). A fresh set clusters top-left; as the set fatigues the
          points march DOWN and to the RIGHT — velocity falls while the muscle grinds out the same (or more) force. That drift
          vector, not any single point, is the fatigue signal, so the arrow and the faint regression are the headline. Points
          carry the one velocity hue; force, the grid, the trend and the arrow stay neutral parchment. Buildable today.
        </Caption>
      </View>
      <Panel width={940}>
        <Kicker>10-REP SET · x = peak force (lb) · y = peak velocity (m/s) · arrow = rep 1 → rep 10</Kicker>
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'stretch' }}>
          <ForceVelocityChart width={640} height={360} />
          <FVReadout width={260} />
        </View>
      </Panel>
    </Page>
  ),
}

export const LoadVelocityProfile: Story = {
  name: '3 · Load–velocity profile',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Load–velocity profile — estimated 1RM without a 1RM test</SectionTitle>
        <Caption>
          Across sets (and sessions), each load&apos;s mean velocity is a point; the fitted line is nearly linear for a given
          lifter, so extrapolating it down to the minimum-velocity threshold (≈{MVT.toFixed(2)} m/s) estimates a 1RM from
          sub-max sets — and reading it the other way gives the load for any target velocity zone. This is coaching gold, but
          it needs backend plumbing to assemble the (load, velocity) pairs across sessions. The dashed segment is
          extrapolation — honestly weaker than the measured span. Tap a point → that set&apos;s reps.
        </Caption>
      </View>
      <Panel width={940}>
        <Kicker>5 SETS ACROSS LOADS · x = load (lb) · y = mean velocity (m/s) · dashed = extrapolation to 1RM</Kicker>
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'stretch' }}>
          <LoadVelocityChart width={640} height={360} />
          <LVReadout width={260} />
        </View>
      </Panel>
    </Page>
  ),
}

export const AnalysisLayout: Story = {
  name: '4 · Analysis layout (review screen)',
  render: () => (
    <Page>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: FONT_HEAD, color: C['text-primary'] }}>Cable Chest Press · Set 3 review</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', fontFamily: FONT_UI, color: C['text-secondary'] }}>Push A · Hypertrophy — 140 lb × 10 · analysed from persisted per-rep signals</Text>
          </View>
          <LiveToReviewBanner />
        </View>
      </View>
      {/* Top row: the set-level decision (VL) as the hero, verdict + fatigue-vector readouts stacked beside it. */}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
        <Panel width={720}>
          <Kicker>SET DECISION · velocity loss</Kicker>
          <VelocityLossChart width={680} height={260} />
        </Panel>
        <View style={{ gap: 16 }}>
          <VerdictTile width={300} />
          <FVReadout width={300} />
        </View>
      </View>
      {/* Middle row: the two scatter analyses side by side. */}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
        <Panel width={560}>
          <Kicker>WITHIN-SET · force–velocity drift</Kicker>
          <ForceVelocityChart width={520} height={300} />
        </Panel>
        <Panel width={456}>
          <Kicker>ACROSS SETS · load–velocity profile</Kicker>
          <LoadVelocityChart width={416} height={300} />
        </Panel>
      </View>
      {/* Bottom row: the drill-down slot (per-rep curves) + the profile readout. */}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
        <Panel width={720}>
          <Kicker>DRILL-DOWN · per-rep curves (opens on a flagged set)</Kicker>
          <CurvesSlot width={680} height={150} />
        </Panel>
        <LVReadout width={300} />
      </View>
    </Page>
  ),
}

export const Overview: Story = {
  name: 'Overview · three set-level reads',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Set-level analysis — three derived curves off one set of persisted signals</SectionTitle>
        <Caption>
          The review counterpart to the live wall glance. Left: velocity loss in the set (the stop-set call). Middle: the
          within-set force–velocity drift (the fatigue vector). Right: the across-sets load–velocity profile (estimated 1RM +
          target loads). Velocity is the single saturated hue throughout; force, load, grids and fits are neutral parchment.
        </Caption>
        <LiveToReviewBanner />
      </View>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel width={470}>
          <Kicker>1 · VELOCITY LOSS IN SET</Kicker>
          <VelocityLossChart width={430} height={240} />
          <VerdictTile width={430} />
        </Panel>
        <Panel width={470}>
          <Kicker>2 · FORCE–VELOCITY DRIFT</Kicker>
          <ForceVelocityChart width={430} height={240} />
          <FVReadout width={430} />
        </Panel>
        <Panel width={470}>
          <Kicker>3 · LOAD–VELOCITY PROFILE</Kicker>
          <LoadVelocityChart width={430} height={240} />
          <LVReadout width={430} />
        </Panel>
      </View>
    </Page>
  ),
}
