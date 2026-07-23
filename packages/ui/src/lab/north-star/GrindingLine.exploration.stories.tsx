// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Grinding Line` — DESIGN EXPLORATION (not shipped).
 *
 * A DECISION story. The ghost-spark chart in `LiveFatigueCard.exploration` tints the
 * current rep's line GREEN when on prescribed tempo, warming amber → red by how far the
 * rep DEVIATES from that tempo. THE OPEN QUESTION: that rule tints by tempo-deviation
 * MAGNITUDE, so ANY slow concentric warms — including a rep that is slow because the
 * lifter is doing controlled/deliberate TEMPO WORK (smooth, steady, low velocity, no
 * failure). Is that right? A slow-but-controlled rep is factually "off prescribed tempo,"
 * but it is NOT a form breakdown — whereas a slow rep caused by GRINDING (velocity
 * collapses/sticks mid-concentric, barely completing) IS a fatigue/breakdown signal. To a
 * pure-deviation tint the two look identical.
 *
 * This story renders the SAME three rep archetypes under TWO tint rules, side by side, so
 * a design operator can rule on it:
 *   • Option A — "Deviation" (the current rule): tint by how far the concentric DURATION
 *     departs from the prescribed tempo. Result: the slow-but-controlled rep → AMBER, the
 *     grind → RED. Slow-controlled and grind look similar.
 *   • Option B — "Control-aware": tint by the GRIND SIGNATURE — the within-concentric
 *     velocity COLLAPSE (drop from the concentric's peak to its mid/late trough, the real
 *     WA `getPhaseVelocityDropPct` concept). Result: the slow-but-controlled rep (smooth,
 *     low collapse) → stays GREEN; the grind (deep collapse) → RED. Duration alone does
 *     not warm the line.
 *
 * The ghost-spark line + the phase-colored zero-axis (ecc magenta below / con cyan above /
 * pauses grey) are lifted faithfully from the LiveFatigueCard specimen; the ONLY thing
 * that varies between the two columns is the line-tint FUNCTION.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'
import { paperSheet, insetWell, debossLabel } from './surfaces'

const C = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

const PARCH = C['text-primary']
const AXIS = alpha(C['text-primary'], 0.16)

// The titan status language — the same tones the ghost-spark line already uses.
const ON_TRACK = C['status-success'] // green
const DEVIATION = C['status-warning'] // amber
const OFF_TRACK = C['status-error'] // red

// =================================================================================
// The three rep archetypes — each a full rep (controlled eccentric below the axis,
// concentric above) generated per-sample, so this is real curve data, not a mockup.
// The eccentric is IDENTICAL across all three (a controlled lowering) so the ONLY
// visible difference is the concentric — the phase where the decision is made.
// =================================================================================
type Phase = 'ecc' | 'pauseBottom' | 'con' | 'pauseTop'
interface Sample {
  t: number
  vel: number // m/s signed (concentric +, eccentric −)
  phase: Phase
}

/** The PRESCRIBED concentric tempo the deviation rule judges against (ms). */
const PRESCRIBED_CON_MS = 950
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

interface Arch {
  key: string
  label: string
  sub: string
  eccMs: number
  pBMs: number
  conMs: number
  pTMs: number
  /** Concentric velocity shape, u∈[0,1] → m/s (peak-relative). */
  conVel: (u: number) => number
}

const ECC_MS = 2600
const PB_MS = 340
const PT_MS = 240
/** A single controlled eccentric shape (m/s magnitude), shared by every archetype. */
function eccVel(u: number): number {
  return 0.46 * Math.sin(Math.PI * Math.pow(u, 0.55))
}

const ARCHES: Arch[] = [
  {
    key: 'on-tempo',
    label: 'On-tempo',
    sub: 'normal duration · healthy bar speed',
    eccMs: ECC_MS,
    pBMs: PB_MS,
    conMs: 950,
    pTMs: PT_MS,
    // Fast rep: quick rise, high broad plateau, natural lockout taper. Stays fast across ROM.
    conVel: (u) => 1.0 * clamp01(u / 0.15) * (1 - 0.82 * smoothstep(0.8, 1.0, u)),
  },
  {
    key: 'mildly-slow',
    label: 'Mildly slow, controlled',
    sub: 'a touch under tempo · still smooth + steady',
    eccMs: ECC_MS,
    pBMs: PB_MS,
    conMs: 1250,
    pTMs: PT_MS,
    // A moderate, still-smooth plateau — off tempo but no collapse. The MID green intensity.
    conVel: (u) => 0.7 * clamp01(u / 0.13) * (1 - 0.5 * smoothstep(0.83, 1.0, u)),
  },
  {
    key: 'slow-controlled',
    label: 'Slow but controlled',
    sub: 'deliberate tempo work · low but STEADY, smooth',
    eccMs: ECC_MS,
    pBMs: PB_MS,
    conMs: 1500,
    pTMs: PT_MS,
    // Low, flat plateau: rises to a modest velocity, holds it steady, gentle end taper.
    // Monotonic-ish, no mid-rep collapse — the crux case (the DEEPEST controlled green).
    conVel: (u) => 0.5 * clamp01(u / 0.12) * (1 - 0.45 * smoothstep(0.85, 1.0, u)),
  },
  {
    key: 'grinding',
    label: 'Grinding',
    sub: 'velocity collapses through a sticking point · barely completes',
    eccMs: ECC_MS,
    pBMs: PB_MS,
    conMs: 2150,
    pTMs: PT_MS,
    // Peaks EARLY then CRATERS toward zero through a mid/late sticking point, with a small
    // late recovery that just completes the rep.
    conVel: (u) => {
      const spike = 0.72 * Math.exp(-Math.pow((u - 0.13) / 0.13, 2))
      const recover = 0.3 * Math.exp(-Math.pow((u - 0.86) / 0.16, 2))
      return Math.max(0.07, spike, recover)
    },
  },
]

function hashNoise(i: number): number {
  const x = Math.sin(i * 127.1 + 11.7) * 43758.5453
  return x - Math.floor(x)
}
function genSamples(a: Arch): Sample[] {
  const segs: Array<{ phase: Phase; dur: number }> = [
    { phase: 'ecc', dur: a.eccMs },
    { phase: 'pauseBottom', dur: a.pBMs },
    { phase: 'con', dur: a.conMs },
    { phase: 'pauseTop', dur: a.pTMs },
  ]
  const total = a.eccMs + a.pBMs + a.conMs + a.pTMs
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
    else if (phase === 'con') vel = a.conVel(u)
    vel *= 1 + (hashNoise(out.length) - 0.5) * 0.04
    out.push({ t, vel, phase })
  }
  return out
}

const SETS: Sample[][] = ARCHES.map(genSamples)
const TOTALS: number[] = ARCHES.map((a) => a.eccMs + a.pBMs + a.conMs + a.pTMs)

// Shared plot scales, so every cell across both columns is directly comparable.
const VMAX_UP = Math.max(0.01, ...SETS.flat().map((s) => s.vel)) * 1.06
const VMAX_DOWN = Math.max(0.01, ...SETS.flat().map((s) => -s.vel)) * 1.06
const AXIS_MAX_T = Math.max(...TOTALS) * 1.04

// --- A few faded prior "ghost" reps (earlier fresh reps of the set) — the ghost-spark
//     aesthetic: a light on-tempo fan behind every cell, identical across cells so it's
//     neutral context. The current line reads against it (the grind craters below it). ---
const GHOSTS: Sample[][] = [0, 1, 2].map((g) =>
  genSamples({ ...ARCHES[0], conMs: 900 - g * 30 }).map((s, i) => ({
    ...s,
    vel: s.vel * (1 + (hashNoise(i * 7 + g * 31) - 0.5) * 0.08),
  }))
)

// =================================================================================
// The two tint RULES. Both map a 0..1 severity onto the SAME green → amber → red status
// ramp (a small green deadzone so an on-track rep reads unambiguously green).
// =================================================================================
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
/** severity (0..1) → the green-on-track ramp. */
function toneFor(sev: number): string {
  const s = clamp01((sev - 0.12) / 0.88)
  return s <= 0.5 ? mixHex(ON_TRACK, DEVIATION, s / 0.5) : mixHex(DEVIATION, OFF_TRACK, (s - 0.5) / 0.5)
}

/** OPTION A — deviation: how far the concentric DURATION overran the prescribed tempo. */
function severityDeviation(a: Arch): number {
  return clamp01((a.conMs / PRESCRIBED_CON_MS - 1) / 1.3)
}
/** OPTION B — control-aware: the GRIND SIGNATURE — velocity collapse WITHIN the concentric,
 *  (peakVel − min mid-phase vel) / peakVel over the moving window, ignoring the natural
 *  end-of-ROM lockout taper (the WA getPhaseVelocityDropPct concept). */
function severityGrind(a: Arch): number {
  const N = 200
  let peak = 0
  let minMid = Infinity
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const v = a.conVel(u)
    if (v > peak) peak = v
    if (u >= 0.2 && u <= 0.85 && v < minMid) minMid = v
  }
  if (peak <= 0) return 0
  return clamp01((peak - minMid) / peak)
}

// --- OPTION B palette: green INTENSITY encodes tempo adherence; HUE stays green until the
//     grind signature appears, then warms amber → red. -------------------------------------
/** Above this grind signature a rep is a BREAKDOWN (hue warms); below it stays green. */
const GRIND_THRESHOLD = 0.35
/** The titan green RAMP, brightest → deepest — the hue is held green the whole way (no drift
 *  to yellow/olive), only lightness falls. On-tempo = brightest, more-off-tempo = deeper. */
const GREEN_RAMP = [
  primitiveRamps.green[200], // #58F69E — brightest (perfectly on-tempo)
  primitiveRamps.green[300],
  primitiveRamps.green[400],
  primitiveRamps.green[500],
  primitiveRamps.green[600],
  primitiveRamps.green[700], // #2B6B25 — deepest (well off-tempo, still controlled)
]
/** Controlled rep → a green whose INTENSITY (lightness) tracks tempo-deviation magnitude. */
function greenByDeviation(dev: number): string {
  const p = clamp01(dev / 0.5) * (GREEN_RAMP.length - 1)
  const i = Math.min(GREEN_RAMP.length - 2, Math.floor(p))
  return mixHex(GREEN_RAMP[i], GREEN_RAMP[i + 1], p - i)
}
/** Breakdown rep → amber (at the grind threshold) warming to red (full collapse). */
function warmByCollapse(grind: number): string {
  const t = clamp01((grind - GRIND_THRESHOLD) / (1 - GRIND_THRESHOLD))
  return mixHex(DEVIATION, OFF_TRACK, t)
}

type RuleKey = 'deviation' | 'grind'
/** Is this rep a breakdown under the control-aware rule (velocity collapse present)? */
function isBreakdown(a: Arch): boolean {
  return severityGrind(a) >= GRIND_THRESHOLD
}
/** The concentric line tint for a rep under a rule.
 *  A (deviation): green→amber→red by tempo-deviation magnitude alone.
 *  B (control-aware): TWO-STAGE — controlled reps hold the green hue and vary only intensity
 *    by tempo deviation; a grind (collapse) is the ONLY thing that warms the hue. */
function conTone(rule: RuleKey, a: Arch): string {
  if (rule === 'deviation') return toneFor(severityDeviation(a))
  return isBreakdown(a) ? warmByCollapse(severityGrind(a)) : greenByDeviation(severityDeviation(a))
}

// --- SVG smoothing (lifted from the LiveFatigueCard specimen) ---------------------
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
/** Split one rep's samples into contiguous per-phase runs (shared boundary → no gap). */
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

// The phase-colored zero-axis (segments mode) — the shared reference, UNAFFECTED by the
// tint choice: ecc = magenta, con = cyan, pauses grey (the TempoDisplay phase language).
const AXIS_TONE: Record<Phase, string> = {
  ecc: primitiveRamps.magenta[800],
  pauseBottom: primitiveColors.charcoal[300],
  con: primitiveRamps.cyan[800],
  pauseTop: primitiveColors.charcoal[300],
}
function targetSpans(a: Arch): Array<{ phase: Phase; t0: number; t1: number }> {
  const b = [0, a.eccMs, a.eccMs + a.pBMs, a.eccMs + a.pBMs + a.conMs, a.eccMs + a.pBMs + a.conMs + a.pTMs]
  return [
    { phase: 'ecc', t0: b[0], t1: b[1] },
    { phase: 'pauseBottom', t0: b[1], t1: b[2] },
    { phase: 'con', t0: b[2], t1: b[3] },
    { phase: 'pauseTop', t0: b[3], t1: b[4] },
  ]
}

// =================================================================================
// The ghost-spark chart for ONE rep under ONE tint rule. The eccentric run is drawn ON
// -TRACK green (all three lowerings are controlled) so the eye lands on the concentric,
// whose color is the ONLY thing the tint rule decides.
// =================================================================================
function GhostSpark({ arch, rule, w, h }: { arch: Arch; rule: RuleKey; w: number; h: number }) {
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
  const cur = SETS[ARCHES.indexOf(arch)]
  const conColor = conTone(rule, arch)
  const runColor = (phase: Phase) => (phase === 'con' ? conColor : ON_TRACK)
  const peakS = cur.reduce((acc, s) => (s.vel > acc.vel ? s : acc), cur[0])
  return (
    <svg width={w} height={h}>
      {/* phase-colored zero AXIS (shared reference; tint-independent). */}
      {targetSpans(arch).map((p, i) => {
        const segW = Math.max(0, x(p.t1) - x(p.t0) - 1.5)
        const label = p.phase === 'ecc' ? 'ECC' : p.phase === 'con' ? 'CON' : null
        return (
          <g key={i}>
            <rect x={x(p.t0) + 0.75} y={mid - 1.5} width={segW} height={3} rx={1.5} fill={AXIS_TONE[p.phase]} />
            {label && x(p.t1) - x(p.t0) > 16 && (
              // Label sits on the OPPOSITE side of the axis from its line, so it stays clear
              // of the curve: ECC (line runs below) labels ABOVE; CON (line runs above) BELOW.
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
      {/* baseline (the zero axis line under the colored segments). */}
      <line x1={padL} y1={mid} x2={w - padR} y2={mid} stroke={AXIS} strokeWidth={1} />
      {/* faded prior ghost reps — the earlier fresh reps of the set. */}
      {GHOSTS.map((samples, g) => (
        <path
          key={`gh${g}`}
          d={smoothPath(samples.map((s) => [x(s.t), y(s.vel)]))}
          fill="none"
          stroke={alpha(PARCH, 0.1 + g * 0.02)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {/* current rep — dark halo underlay, so the tinted line separates from the ghost fan. */}
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
      {/* current rep — the tinted line. Concentric carries the tint-rule's verdict color. */}
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
      {/* peak concentric marker — ties to the velocity read. */}
      <circle cx={x(peakS.t)} cy={y(peakS.vel)} r={3.5} fill={conColor} stroke={PANEL_BG} strokeWidth={1.5} />
    </svg>
  )
}

// =================================================================================
// Layout — two labeled columns (Option A · Option B), the same reps in each, row-aligned
// so the SAME rep sits across from itself.
// =================================================================================
const CHART_W = 380
const CHART_H = 150
/** The crux row (deepest controlled rep) — captioned in both columns. */
const CRUX_KEY = 'slow-controlled'
const VERDICT: Record<RuleKey, (a: Arch) => { tone: string; word: string }> = {
  deviation: (a) => {
    const sev = severityDeviation(a)
    return { tone: conTone('deviation', a), word: sev < 0.12 ? 'on-tempo' : sev < 0.5 ? 'off-tempo → warn' : 'off-tempo → alarm' }
  },
  grind: (a) => {
    const tone = conTone('grind', a)
    if (isBreakdown(a)) return { tone, word: severityGrind(a) < 0.6 ? 'collapse → warn' : 'collapse → alarm' }
    const dev = severityDeviation(a)
    return { tone, word: dev < 0.12 ? 'on-tempo · bright' : 'controlled · deeper green' }
  },
}

/** The green-intensity → amber/red legend under Option B's header, so the mapping is legible:
 *  a bright→deep GREEN ramp (tempo adherence, hue held) then the amber/red breakdown hues. */
function GreenRampLegend() {
  return (
    <View style={{ gap: 4, padding: 8, borderRadius: 8, backgroundColor: alpha('#000000', 0.22) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ flex: 6, flexDirection: 'row', height: 11, borderRadius: 3, overflow: 'hidden' }}>
          {GREEN_RAMP.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
        <View style={{ width: 1, height: 15, backgroundColor: alpha(PARCH, 0.35) }} />
        <View style={{ flex: 2, flexDirection: 'row', height: 11, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ flex: 1, backgroundColor: DEVIATION }} />
          <View style={{ flex: 1, backgroundColor: OFF_TRACK }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 8, fontFamily: FONT_MONO, color: C['text-tertiary'] }}>on-tempo</Text>
        <Text style={{ fontSize: 8, fontFamily: FONT_MONO, color: C['text-tertiary'] }}>green intensity = tempo (hue held)</Text>
        <Text style={{ fontSize: 8, fontFamily: FONT_MONO, color: C['text-tertiary'] }}>grind → breakdown</Text>
      </View>
    </View>
  )
}

function RepCell({ arch, rule, caption }: { arch: Arch; rule: RuleKey; caption?: boolean }) {
  const v = VERDICT[rule](arch)
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: v.tone }} />
          <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{arch.label}</Text>
        </View>
        <Text style={{ fontSize: 9, fontFamily: FONT_MONO, color: v.tone, fontWeight: '700' }}>{v.word}</Text>
      </View>
      <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: C['text-tertiary'] }}>{arch.sub}</Text>
      <View style={[{ borderRadius: 10, padding: 8 }, insetWell(primitiveColors.charcoal[900])]}>
        <GhostSpark arch={arch} rule={rule} w={CHART_W - 16} h={CHART_H} />
      </View>
      {caption && (
        <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: v.tone, fontStyle: 'italic', maxWidth: CHART_W }}>
          {rule === 'deviation'
            ? 'slow concentric → off prescribed tempo → warn (looks like a grind)'
            : 'slow but SMOOTH → no collapse → DEEP GREEN, not amber (intensity carries tempo, hue stays green)'}
        </Text>
      )}
    </View>
  )
}

function OptionColumn({ rule, title, note }: { rule: RuleKey; title: string; note: string }) {
  return (
    <View style={[{ width: CHART_W + 36, borderRadius: 14, padding: 18, gap: 16 }, paperSheet(PANEL_BG)]}>
      <View style={{ gap: 3 }}>
        <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
          {rule === 'deviation' ? 'OPTION A' : 'OPTION B'}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '900', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{title}</Text>
        <Text style={{ fontSize: 11, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 16 }}>{note}</Text>
      </View>
      {rule === 'grind' && <GreenRampLegend />}
      {ARCHES.map((a) => (
        <RepCell key={a.key} arch={a} rule={rule} caption={a.key === CRUX_KEY} />
      ))}
    </View>
  )
}

// --- Scaffolding -----------------------------------------------------------------
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 22 }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/North Star/Grinding Line',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** The head-to-head: the same reps, two tint rules — B now a two-stage green-intensity scale. */
export const DeviationVsControlAware: Story = {
  name: 'Deviation vs control-aware',
  render: () => (
    <Page>
      <View style={{ gap: 6, maxWidth: 900 }}>
        <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
          GHOST-SPARK LINE-TINT · OPEN DECISION
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: FONT_HEAD, color: C['text-primary'] }}>
          Green intensity for tempo, hue reserved for breakdown
        </Text>
        <Text style={{ fontSize: 13, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 19 }}>
          The current line tints by tempo-deviation MAGNITUDE, so any slow concentric warms toward amber — including deliberate
          tempo work. Below, the SAME reps (identical controlled eccentric; only the concentric differs) under two rules. Option
          B is refined: a controlled rep STAYS green, but its green INTENSITY tracks tempo deviation (on-tempo = brightest → more
          off-tempo = deeper green, hue held); the HUE only warms to amber → red when the grind signature (velocity collapse)
          appears. So the three controlled reps read as three green depths — bright → mid → deep — and only the grind goes amber.
          The phase-colored zero-axis (ecc magenta · con cyan · pauses grey) is shared and unaffected.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
        <OptionColumn
          rule="deviation"
          title="Deviation"
          note="Tint by how far the concentric duration departs from the prescribed tempo. Slow → warm to amber, regardless of why."
        />
        <OptionColumn
          rule="grind"
          title="Control-aware"
          note="Green INTENSITY encodes tempo adherence (hue stays green); the hue only warms to amber/red on the grind signature — velocity collapse within the concentric."
        />
      </View>
    </Page>
  ),
}
