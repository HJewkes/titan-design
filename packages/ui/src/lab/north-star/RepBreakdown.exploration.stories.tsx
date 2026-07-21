// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Rep Breakdown` — DESIGN EXPLORATION (not shipped).
 *
 * The shipped diverging velocity chart shows ONE dimension per rep — how fast the
 * concentric moved. But a single cable rep has THREE measurable dimensions that
 * together tell the fatigue / form story, and velocity alone hides the worst of it:
 *
 *   • VELOCITY — concentric speed (m/s). Falls as you fatigue. (zone-colored, the
 *     one saturated hue — the green→red ramp the shipped strip already uses.)
 *   • CADENCE  — tempo adherence vs the prescription [ecc·pauseBottom·con·pauseTop].
 *     Late reps DROP the eccentric (no control) and GRIND the concentric; pauses
 *     collapse. Encoded by SHAPE + a desaturated on-target/off signal, never a hue.
 *   • ROM      — range of motion vs full depth. Fatigue SHORTENS reps and makes them
 *     inconsistent. Encoded by NEUTRAL geometry (a light parchment fill / width /
 *     depth), never a hue.
 *
 * Why three: a late-set rep can keep VELOCITY up by cutting depth and rushing the
 * eccentric — real form breakdown you'd miss from the bar alone. The mock set below
 * plants two such "cheat" reps (4 & 7: fast bar, cut ROM, dropped eccentric) so each
 * encoding has to earn its keep by making that jump out.
 *
 * Four encodings + an Overview. The shipped VelocityStrip / DualVelocityStrip are NOT
 * modified — these are complementary/augmented per-rep marks explored in isolation.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'
import { WORKOUT_TOKENS } from '../../theme/workout-tokens'
import { alpha } from '../../utils/colors'
import { formatVelocity } from '../../utils/workout-format'

const C = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

// --- Channel roles (kept strict so the three dimensions never mush together) -----
// VELOCITY = the only saturated FILL hue (green→red ramp).
const S = WORKOUT_TOKENS.scale
function velColor(v: number): string {
  if (v >= 1.0) return S.green
  if (v >= 0.75) return S.yellow
  if (v >= 0.5) return S.orange
  return S.red
}
// ROM = neutral warm PARCHMENT geometry (never a hue).
const ROM_FILL = alpha(C['text-primary'], 0.82)
const ROM_GHOST = alpha(C['text-primary'], 0.1)
const ROM_LINE = alpha(C['text-primary'], 0.32)
// CADENCE off-target signal = a desaturated warn/stop, reserved for "wrong", not fill.
const OFF_WARN = C['status-warning']
const OFF_STOP = C['status-error']
const CAD_NEUTRAL = alpha(C['text-primary'], 0.5)

/** ~0.18α matte paper grain — the same fractalNoise tile the hero bars carry. */
const BAR_GRAIN =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
  `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
  `%3Crect width='120' height='120' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E")`
const grain = { backgroundImage: BAR_GRAIN } as unknown as ViewStyle
/** A recessed plot well — the inset-well surface language, so bars read as sitting IN the wall. */
const well = {
  backgroundColor: primitiveColors.charcoal[900],
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.04)',
} as unknown as ViewStyle

// --- Mock set: 8-rep cable press with a clear fatigue signature ------------------
// Velocity declines; the eccentric gets DROPPED and the concentric GRINDS; ROM
// shortens + gets inconsistent. Reps 4 & 7 are the "cheats": velocity propped up
// while ROM is cut and the eccentric is abandoned — the form breakdown to surface.
interface Rep {
  /** Mean concentric velocity (m/s). */
  v: number
  /** Achieved range as a fraction of full depth (0..1). */
  rom: number
  /** Actual phase durations (s): eccentric, pause-bottom, concentric, pause-top. */
  ecc: number
  pB: number
  con: number
  pT: number
  /** A short "what happened" note (specimen annotation only). */
  note?: string
}
const TARGET = { ecc: 3, pB: 1, con: 1, pT: 0 }
const SET: Rep[] = [
  { v: 0.82, rom: 0.98, ecc: 3.0, pB: 1.0, con: 0.9, pT: 0.2, note: 'textbook' },
  { v: 0.8, rom: 0.97, ecc: 3.1, pB: 1.0, con: 1.0, pT: 0.1, note: 'textbook' },
  { v: 0.74, rom: 0.95, ecc: 2.8, pB: 0.9, con: 1.1, pT: 0.0 },
  { v: 0.76, rom: 0.79, ecc: 1.5, pB: 0.2, con: 0.9, pT: 0.0, note: 'CHEAT — fast, but depth cut + ecc dropped' },
  { v: 0.63, rom: 0.9, ecc: 2.4, pB: 0.6, con: 1.4, pT: 0.0, note: 'honest fatigue' },
  { v: 0.54, rom: 0.83, ecc: 2.0, pB: 0.3, con: 1.7, pT: 0.0, note: 'grinding' },
  { v: 0.57, rom: 0.69, ecc: 1.2, pB: 0.1, con: 1.6, pT: 0.0, note: 'CHEAT — propped speed, depth gutted' },
  { v: 0.38, rom: 0.65, ecc: 1.3, pB: 0.0, con: 2.3, pT: 0.0, note: 'spent — short + grinding' },
]

const MAX_V = Math.max(...SET.map((r) => r.v)) * 1.06
/** Total tempo seconds used to scale the cadence lane (target 5s + headroom for grinds). */
const CAD_SCALE = 5.5

/** Cadence "off-ness" 0..~1 — dropped eccentric (rush) + grinding concentric + collapsed pause. */
function cadenceOff(r: Rep): number {
  const eccDrop = Math.max(0, (TARGET.ecc - r.ecc) / TARGET.ecc)
  const conGrind = Math.max(0, (r.con - TARGET.con) / TARGET.con)
  const pauseDrop = Math.max(0, (TARGET.pB - r.pB) / TARGET.pB)
  return eccDrop * 0.5 + conGrind * 0.3 + pauseDrop * 0.2
}
/** A rep is "breaking down" when depth is cut AND cadence is off together. */
function isFormBreak(r: Rep): boolean {
  return r.rom < 0.86 && cadenceOff(r) > 0.35
}
/** Per-phase adherence tone: neutral when on-target, warn→stop as it deviates the WRONG way. */
function phaseTone(kind: 'ecc' | 'pause' | 'con', actual: number, target: number): string {
  const span = Math.max(target, 0.6)
  const dev =
    kind === 'con'
      ? Math.max(0, (actual - target) / span) // grind = too slow
      : Math.max(0, (target - actual) / span) // ecc / pause = too short (rushed / collapsed)
  if (dev > 0.5) return OFF_STOP
  if (dev > 0.25) return OFF_WARN
  return CAD_NEUTRAL
}

// --- Shared marks ----------------------------------------------------------------
/** The amber "form breaking down" flag — a distinct mark, never a fill, so it can't be missed. */
function FormFlag({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  const s = size === 'sm' ? { fs: 10, pv: 2, ph: 6 } : { fs: 8, pv: 1, ph: 4 }
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: s.pv,
        paddingHorizontal: s.ph,
        borderRadius: 4,
        backgroundColor: alpha(OFF_WARN, 0.18),
        borderWidth: 1,
        borderColor: alpha(OFF_WARN, 0.55),
      }}
    >
      <Text style={{ color: OFF_WARN, fontSize: s.fs + 1, fontWeight: '900', lineHeight: s.fs + 2 }}>⚠</Text>
      <Text style={{ color: OFF_WARN, fontSize: s.fs, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_UI }}>
        FORM
      </Text>
    </View>
  )
}
function RepTicks({ count, width }: { count: number; width?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, width }}>
      {Array.from({ length: count }, (_, i) => (
        <Text
          key={i}
          style={{ flex: 1, textAlign: 'center', color: C['text-tertiary'], fontSize: 11, fontWeight: '700', fontFamily: FONT_MONO }}
        >
          {i + 1}
        </Text>
      ))}
    </View>
  )
}

// =================================================================================
// Encoding A — COMPOSITE COLUMN ("Loaded bar")
// height = velocity (zone hue) · width = ROM (a skinny bar = cut depth, sitting in a
// faint full-range envelope) · top cap = cadence quality (clean paper cap on-target,
// a broken hollow cap when the tempo is off). A tall-but-skinny bar = the cheat rep.
// =================================================================================
const A_H = 250
function CompositeColumn({ r }: { r: Rep }) {
  const barH = Math.max(6, (r.v / MAX_V) * (A_H - 34))
  const off = cadenceOff(r)
  const capBroken = off > 0.35
  const flag = isFormBreak(r)
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ height: 18, justifyContent: 'flex-end' }}>{flag && <FormFlag size="xs" />}</View>
      <Text style={{ color: C['text-primary'], fontSize: 13, fontWeight: '800', marginBottom: 3 }}>
        {formatVelocity(r.v)}
      </Text>
      {/* full-range envelope (faint) — the colored bar's width shortfall = cut ROM */}
      <View style={{ width: '100%', height: barH, alignItems: 'center', justifyContent: 'flex-start' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: '6%', right: '6%', backgroundColor: ROM_GHOST, borderRadius: 5 }} />
        {/* cadence cap */}
        {capBroken ? (
          <View
            style={{
              width: `${6 + r.rom * 88}%`,
              height: 7,
              borderTopLeftRadius: 5,
              borderTopRightRadius: 5,
              borderWidth: 1.5,
              borderBottomWidth: 0,
              borderStyle: 'dashed',
              borderColor: alpha(OFF_STOP, 0.85),
            }}
          />
        ) : (
          <View
            style={[
              { width: `${6 + r.rom * 88}%`, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: alpha(velColor(r.v), 0.9) },
              grain,
            ]}
          />
        )}
        {/* velocity bar, width ∝ ROM */}
        <View
          style={[
            {
              width: `${6 + r.rom * 88}%`,
              flex: 1,
              backgroundColor: velColor(r.v),
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 6px 14px rgba(0,0,0,0.45)',
            } as unknown as ViewStyle,
            grain,
          ]}
        />
      </View>
      <Text style={{ color: ROM_LINE, fontSize: 10, fontWeight: '700', marginTop: 5, fontFamily: FONT_MONO }}>
        {Math.round(r.rom * 100)}%
      </Text>
    </View>
  )
}

// =================================================================================
// Encoding B — REP DIAL GRID (per-rep glyph, three nested sub-indicators)
// outer conic RING = ROM (parchment sweep vs dark track) · inner disc FILL = velocity
// (zone hue, rising from the bottom) · four ticks below = cadence phases (length ∝
// actual seconds, tinted warn/stop when off). Dials visibly drain across the set.
// =================================================================================
const DIAL = 104
const RING_W = 9
function romRingStyle(rom: number): ViewStyle {
  return {
    backgroundImage: `conic-gradient(${ROM_FILL} ${Math.round(rom * 360)}deg, ${ROM_GHOST} 0deg)`,
  } as unknown as ViewStyle
}
function RepDial({ r }: { r: Rep }) {
  const inner = DIAL - RING_W * 2
  const fillH = Math.max(4, (r.v / MAX_V) * inner)
  const phases: Array<{ k: 'ecc' | 'pause' | 'con'; a: number; t: number }> = [
    { k: 'ecc', a: r.ecc, t: TARGET.ecc },
    { k: 'pause', a: r.pB, t: TARGET.pB },
    { k: 'con', a: r.con, t: TARGET.con },
    { k: 'pause', a: r.pT, t: TARGET.pT },
  ]
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ height: 16 }}>{isFormBreak(r) && <FormFlag size="xs" />}</View>
      {/* ROM ring + velocity disc */}
      <View style={[{ width: DIAL, height: DIAL, borderRadius: DIAL / 2, alignItems: 'center', justifyContent: 'center' }, romRingStyle(r.rom)]}>
        <View style={[{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', justifyContent: 'flex-end' }, well]}>
          <View style={[{ height: fillH, backgroundColor: velColor(r.v) }, grain]} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C['text-primary'], fontSize: 17, fontWeight: '800', fontFamily: FONT_HEAD }}>{formatVelocity(r.v)}</Text>
            <Text style={{ color: ROM_LINE, fontSize: 10, fontWeight: '700', fontFamily: FONT_MONO }}>{Math.round(r.rom * 100)}% ROM</Text>
          </View>
        </View>
      </View>
      {/* cadence phase ticks */}
      <View style={{ flexDirection: 'row', gap: 4, height: 26, alignItems: 'flex-end' }}>
        {phases.map((p, i) => (
          <View
            key={i}
            style={{ width: 7, height: Math.max(3, (p.a / 3.2) * 24), borderRadius: 2, backgroundColor: p.t === 0 ? alpha(CAD_NEUTRAL, 0.4) : phaseTone(p.k, p.a, p.t) }}
          />
        ))}
      </View>
    </View>
  )
}

// =================================================================================
// Encoding C — THREE-TRACK STRIP (aligned small multiples)
// Three lanes sharing one rep axis: VELOCITY (height bars, zone hue) · CADENCE (a
// mini 4-phase tempo column per rep — the SHAPE flips from ecc-heavy to con-heavy as
// control is lost) · DEPTH (a downward bar from the full-range line — short = cut ROM).
// Reading a vertical slice = one rep's whole story; the set decays lane by lane.
// =================================================================================
const C_VEL_H = 118
const C_CAD_H = 92
const C_ROM_H = 96
function LaneLabel({ children }: { children: ReactNode }) {
  return (
    <Text style={{ width: 74, color: C['text-tertiary'], fontSize: 10, fontWeight: '800', letterSpacing: 1, fontFamily: FONT_UI, textAlign: 'right' }}>
      {children}
    </Text>
  )
}
function ThreeTrack() {
  const cadPhases = (r: Rep): Array<{ k: 'ecc' | 'pause' | 'con'; a: number; t: number }> => [
    { k: 'ecc', a: r.ecc, t: TARGET.ecc },
    { k: 'pause', a: r.pB, t: TARGET.pB },
    { k: 'con', a: r.con, t: TARGET.con },
  ]
  return (
    <View style={{ gap: 6 }}>
      {/* VELOCITY lane */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <LaneLabel>VELOCITY</LaneLabel>
        <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: C_VEL_H, borderRadius: 8, padding: 8 }, well]}>
          {SET.map((r, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text style={{ color: C['text-primary'], fontSize: 11, fontWeight: '800', marginBottom: 2 }}>{formatVelocity(r.v)}</Text>
              <View style={[{ width: '78%', height: Math.max(4, (r.v / MAX_V) * (C_VEL_H - 34)), borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: velColor(r.v) }, grain]} />
            </View>
          ))}
        </View>
      </View>
      {/* CADENCE lane — a mini tempo column per rep (shape = adherence) */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <LaneLabel>CADENCE</LaneLabel>
        <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: C_CAD_H, borderRadius: 8, padding: 8 }, well]}>
          {SET.map((r, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              {cadPhases(r).map((p, j) => (
                <View
                  key={j}
                  style={{ width: '62%', height: Math.max(2, (p.a / CAD_SCALE) * (C_CAD_H - 16)), marginTop: j ? 2 : 0, borderRadius: 2, backgroundColor: phaseTone(p.k, p.a, p.t) }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      {/* DEPTH (ROM) lane — a downward bar from the full-range line */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <LaneLabel>DEPTH</LaneLabel>
        <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, height: C_ROM_H, borderRadius: 8, padding: 8, borderTopWidth: 2, borderTopColor: ROM_LINE }, well]}>
          {SET.map((r, i) => {
            const full = C_ROM_H - 26
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* full-range ghost — the exposed bottom gap is the depth left on the table */}
                <View style={{ width: '72%', height: full, borderRadius: 4, backgroundColor: ROM_GHOST, justifyContent: 'flex-start' }}>
                  <View style={[{ width: '100%', height: Math.max(4, r.rom * full), borderRadius: 4, backgroundColor: ROM_FILL }, grain]} />
                </View>
                <Text style={{ color: ROM_LINE, fontSize: 10, fontWeight: '700', marginTop: 3, fontFamily: FONT_MONO }}>{Math.round(r.rom * 100)}</Text>
              </View>
            )
          })}
        </View>
      </View>
      {/* shared rep axis */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ width: 74 }} />
        <RepTicks count={SET.length} />
      </View>
    </View>
  )
}

// =================================================================================
// Encoding D — VELOCITY ENVELOPE + ROM FILL + PHASE BANDS ("Filled rep")
// Each rep is a velocity-height ENVELOPE (zone-colored outline). A solid fill rises to
// ROM% of that envelope = achieved depth; the hollow gap above = the range left on the
// table. The fill is banded into the actual tempo phases (ecc textured = control); a
// tall outline barely filled with a stub eccentric = the cheat rep, unmistakably.
// =================================================================================
const D_H = 250
function FilledRep({ r }: { r: Rep }) {
  const envH = Math.max(10, (r.v / MAX_V) * (D_H - 34))
  const fillH = envH * r.rom
  const col = velColor(r.v)
  // phase bands within the fill (bottom→top: ecc, pause, con), sized by actual seconds
  const segs: Array<{ k: 'ecc' | 'pause' | 'con'; a: number; t: number }> = [
    { k: 'ecc', a: r.ecc, t: TARGET.ecc },
    { k: 'pause', a: r.pB, t: TARGET.pB },
    { k: 'con', a: r.con, t: TARGET.con },
  ]
  const segTotal = segs.reduce((s, p) => s + Math.max(p.a, 0.15), 0)
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ height: 18, justifyContent: 'flex-end' }}>{isFormBreak(r) && <FormFlag size="xs" />}</View>
      <Text style={{ color: C['text-primary'], fontSize: 13, fontWeight: '800', marginBottom: 3 }}>{formatVelocity(r.v)}</Text>
      {/* velocity envelope */}
      <View style={{ width: '80%', height: envH, borderWidth: 2, borderColor: col, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: alpha(col, 0.08) }}>
        {/* ROM shortfall (hollow, hatched top) */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: envH - fillH, borderBottomWidth: 1, borderBottomColor: ROM_LINE, borderStyle: 'dashed' }} />
        {/* achieved depth fill, banded by tempo phase */}
        <View style={{ height: fillH }}>
          {segs
            .slice()
            .reverse()
            .map((p, i) => {
              const h = (Math.max(p.a, 0.15) / segTotal) * fillH
              const isEcc = p.k === 'ecc'
              return (
                <View
                  key={i}
                  style={[
                    { height: h, backgroundColor: alpha(col, isEcc ? 0.95 : 0.72), borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(0,0,0,0.35)' },
                    isEcc ? grain : null,
                    { borderLeftWidth: 3, borderLeftColor: phaseTone(p.k, p.a, p.t) } as ViewStyle,
                  ]}
                />
              )
            })}
        </View>
      </View>
      <Text style={{ color: ROM_LINE, fontSize: 10, fontWeight: '700', marginTop: 5, fontFamily: FONT_MONO }}>{Math.round(r.rom * 100)}%</Text>
    </View>
  )
}

// --- Presentation scaffolding ----------------------------------------------------
function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_HEAD, color: C['text-primary'] }}>{children}</Text>
}
function Caption({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 12, fontFamily: FONT_UI, color: C['text-secondary'], maxWidth: 760, lineHeight: 18 }}>{children}</Text>
}
function Kicker({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 9, letterSpacing: 1, fontFamily: FONT_MONO, color: C['text-tertiary'] }}>{children}</Text>
}
function Legend() {
  const item = (swatch: ReactNode, label: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {swatch}
      <Text style={{ color: C['text-secondary'], fontSize: 11, fontWeight: '700', fontFamily: FONT_UI }}>{label}</Text>
    </View>
  )
  return (
    <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
      {item(<View style={{ width: 22, height: 10, borderRadius: 2, backgroundColor: S.orange }} />, 'VELOCITY — zone hue (green→red)')}
      {item(<View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: ROM_FILL }} />, 'ROM — parchment / neutral')}
      {item(<View style={{ flexDirection: 'row', gap: 2 }}><View style={{ width: 4, height: 14, backgroundColor: CAD_NEUTRAL }} /><View style={{ width: 4, height: 10, backgroundColor: OFF_WARN }} /><View style={{ width: 4, height: 8, backgroundColor: OFF_STOP }} /></View>, 'CADENCE — shape + off signal')}
      {item(<FormFlag size="xs" />, 'both cut → form breaking')}
    </View>
  )
}
function Panel({ children, width }: { children: ReactNode; width?: number | string }) {
  return <View style={{ width: width as number, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 14 }}>{children}</View>
}
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 24 }}>{children}</View>
}
function Row({ children, h, align = 'flex-end' }: { children: ReactNode; h: number; align?: 'flex-end' | 'flex-start' }) {
  return <View style={{ flexDirection: 'row', alignItems: align, gap: 8, height: h }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/North Star/Rep Breakdown',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** A — Composite column: height=velocity, width=ROM, cap=cadence. */
export const CompositeColumns: Story = {
  name: '1 · Composite column',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Composite column — one augmented bar, three channels</SectionTitle>
        <Caption>
          Each rep is a single bar. HEIGHT is velocity (the zone hue, so the set warms green→red as it tires). WIDTH is
          ROM — the colored bar sits inside a faint full-range envelope, so a cut rep reads as a skinny spike leaving the
          frame half-empty. The TOP CAP is cadence: a clean textured paper cap on-target, a broken dashed-red cap when the
          tempo is off. Reps 4 & 7 jump out — tall (fast) but skinny with a broken cap: speed propped up by cutting depth
          and dropping the eccentric.
        </Caption>
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · velocity=height · ROM=width · cadence=cap</Kicker>
        <Legend />
        <View style={[{ borderRadius: 10, padding: 12 }, well]}>
          <Row h={A_H}>{SET.map((r, i) => <CompositeColumn key={i} r={r} />)}</Row>
          <RepTicks count={SET.length} />
        </View>
      </Panel>
    </Page>
  ),
}

/** B — Rep dial grid: ROM ring + velocity disc + cadence ticks. */
export const RepDials: Story = {
  name: '2 · Rep dial grid',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Rep dial grid — a nested glyph per rep</SectionTitle>
        <Caption>
          One dial per rep. The outer RING is ROM (a parchment sweep on a dark track — a partial ring = cut depth). The
          inner DISC fills from the bottom with velocity in the zone hue. The four TICKS below are the tempo phases
          (ecc·pause·con·hold), length ∝ actual seconds and tinted warn→stop when a phase deviates. Across the set the
          dials visibly drain — rings open up, discs fall, ticks flip from a tall controlled eccentric to a stub + a long
          grinding concentric. Reps 4 & 7 carry the FORM flag.
        </Caption>
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · ring=ROM · disc=velocity · ticks=cadence</Kicker>
        <Legend />
        <View style={[{ borderRadius: 10, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'space-between' }, well]}>
          {SET.map((r, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <RepDial r={r} />
              <Text style={{ color: C['text-tertiary'], fontSize: 11, fontWeight: '700', fontFamily: FONT_MONO }}>rep {i + 1}</Text>
            </View>
          ))}
        </View>
      </Panel>
    </Page>
  ),
}

/** C — Three-track strip: aligned velocity / cadence / depth lanes. */
export const ThreeTrackStrip: Story = {
  name: '3 · Three-track strip',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Three-track strip — aligned small multiples</SectionTitle>
        <Caption>
          Three lanes over one shared rep axis, so a vertical slice is one rep's whole story. VELOCITY is the familiar
          height bars (zone hue). CADENCE is a mini tempo column per rep — its SHAPE flips from eccentric-heavy (controlled)
          to concentric-heavy (grinding) as form is lost, phases tinted warn→stop. DEPTH hangs down from the full-range line
          — a short bar is a cut rep. Each lane decays on its own, and where all three go at once (reps 4, 7, 8) the
          breakdown is unmistakable. The most analytic read — clearest for coaching / review.
        </Caption>
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · three aligned lanes</Kicker>
        <Legend />
        <ThreeTrack />
      </Panel>
    </Page>
  ),
}

/** D — Filled rep: velocity envelope + ROM fill-level + phase bands. */
export const FilledReps: Story = {
  name: '4 · Filled rep',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Filled rep — depth as a fill inside the velocity envelope</SectionTitle>
        <Caption>
          Each rep is a velocity-height ENVELOPE (the zone-hue outline — how fast). A solid fill rises to ROM% of the
          envelope = how deep it actually went; the hatched hollow at the top is the range left on the table. The fill is
          banded into the actual tempo phases (the textured band is the eccentric — control), with a warn/stop edge when a
          phase is off. A tall outline barely filled, with a stub eccentric, is the cheat rep — the empty top and the
          missing texture make "fast but shallow and rushed" a single glance.
        </Caption>
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · outline=velocity · fill=ROM · bands=cadence</Kicker>
        <Legend />
        <View style={[{ borderRadius: 10, padding: 12 }, well]}>
          <Row h={D_H}>{SET.map((r, i) => <FilledRep key={i} r={r} />)}</Row>
          <RepTicks count={SET.length} />
        </View>
      </Panel>
    </Page>
  ),
}

/** Overview — the four encodings tiled on the same fatiguing set. */
export const Overview: Story = {
  name: 'Overview · four encodings',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Rep breakdown — four encodings, one fatiguing set</SectionTitle>
        <Caption>
          The same 8-rep set (velocity declines, cadence degrades, ROM shortens; reps 4 & 7 prop speed up by cutting depth +
          dropping the eccentric) rendered four ways. In every one VELOCITY is the only saturated hue, ROM is neutral
          parchment geometry, and CADENCE is shape + a desaturated off signal — so the three dimensions never mush together.
          Judge which makes the set "look tired" and the two cheat reps jump out fastest at wall scale.
        </Caption>
        <Legend />
      </View>
      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel width={620}>
          <Kicker>1 · COMPOSITE COLUMN — height/width/cap</Kicker>
          <View style={[{ borderRadius: 10, padding: 10 }, well]}>
            <Row h={200}>{SET.map((r, i) => <CompositeColumn key={i} r={r} />)}</Row>
            <RepTicks count={SET.length} />
          </View>
        </Panel>
        <Panel width={620}>
          <Kicker>4 · FILLED REP — envelope/fill/bands</Kicker>
          <View style={[{ borderRadius: 10, padding: 10 }, well]}>
            <Row h={200}>{SET.map((r, i) => <FilledRep key={i} r={r} />)}</Row>
            <RepTicks count={SET.length} />
          </View>
        </Panel>
        <Panel width={620}>
          <Kicker>2 · REP DIALS — ring/disc/ticks</Kicker>
          <View style={[{ borderRadius: 10, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }, well]}>
            {SET.map((r, i) => <RepDial key={i} r={r} />)}
          </View>
        </Panel>
        <Panel width={620}>
          <Kicker>3 · THREE-TRACK STRIP — aligned lanes</Kicker>
          <ThreeTrack />
        </Panel>
      </View>
    </Page>
  ),
}

// =================================================================================
// ROUND 2 — DIRECTIONAL form semantics + three new directions
// =================================================================================
// Form breakdown is DIRECTIONAL, not a symmetric "on/off target" deviation. We only
// ever raise a signal on the genuinely-bad side, with a severity:
//   • CONCENTRIC — faster = explosive = GOOD (never flag). Slower = GRINDING = a MILD
//     fatigue signal (never "severe").
//   • ECCENTRIC  — slower = milking the stretch = GOOD (never flag). Faster = LOSS OF
//     CONTROL = a SEVERE breakdown (worse than grinding).
//   • ROM        — cut short of the working standard = BAD. A bit LONG = neutral/"weird",
//     never alarmed.
// (Velocity here = concentric velocity; ROM + tempo compose INTO it — velocity =
// distance/time — so they aren't fully independent, which Direction B leans on.)
const STD_ROM = 0.95 // the working-ROM standard a cut rep falls short of

type Sev = 'ok' | 'mild' | 'severe'
const SEV_RANK: Record<Sev, number> = { ok: 0, mild: 1, severe: 2 }
function sevColor(s: Sev): string {
  return s === 'severe' ? OFF_STOP : s === 'mild' ? OFF_WARN : CAD_NEUTRAL
}
/** Eccentric CONTROL — only a faster-than-target eccentric is bad (dropped = loss of control). */
function eccControl(r: Rep): Sev {
  const rushed = (TARGET.ecc - r.ecc) / TARGET.ecc
  // Only a MEANINGFULLY dropped eccentric flags: an honest ~20%-shorter lowering (still
  // under control) stays silent; a big drop is loss of control (severe).
  return rushed > 0.45 ? 'severe' : rushed > 0.28 ? 'mild' : 'ok'
}
/** Concentric GRIND — only a slower-than-target concentric signals, and it caps at MILD (fatigue, not failure). */
function concGrind(r: Rep): Sev {
  const grind = (r.con - TARGET.con) / TARGET.con
  return grind > 0.35 ? 'mild' : 'ok'
}
/** ROM SHALLOW — only falling short of the standard is bad; a bit long is neutral. */
function romShallow(r: Rep): Sev {
  const short = (STD_ROM - r.rom) / STD_ROM
  return short > 0.15 ? 'severe' : short > 0.08 ? 'mild' : 'ok'
}
function worstSev(r: Rep): Sev {
  return [eccControl(r), concGrind(r), romShallow(r)].reduce<Sev>((w, s) => (SEV_RANK[s] > SEV_RANK[w] ? s : w), 'ok')
}
interface Warn {
  label: string
  note: string
  sev: Sev
}
/** The directional warnings for a rep — ONLY the genuinely-bad ones, each with a severity. */
function repWarnings(r: Rep): Warn[] {
  const out: Warn[] = []
  const ecc = eccControl(r)
  if (ecc !== 'ok') out.push({ label: 'CONTROL', note: 'fast eccentric', sev: ecc })
  const rom = romShallow(r)
  if (rom !== 'ok') out.push({ label: 'SHALLOW', note: `${Math.round(r.rom * 100)}% ROM`, sev: rom })
  const grind = concGrind(r)
  if (grind !== 'ok') out.push({ label: 'GRIND', note: 'slow concentric', sev: grind })
  return out.sort((a, b) => SEV_RANK[b.sev] - SEV_RANK[a.sev])
}
function verdictWord(r: Rep): string {
  const w = repWarnings(r)
  return w.length ? w[0].label : 'CLEAN'
}

// --- Direction A (refined) — Composite column with directional semantics ----------
// height = concentric velocity (hue) · width = ROM inside a dashed STANDARD-ROM frame
// (narrow = shallow) · cap = eccentric control (clean when slow/on-target, red broken
// when DROPPED) · thin amber base sliver = grinding concentric. Good/neutral directions
// raise nothing — so a healthy-but-tiring rep looks calm, a cheat rep shouts.
const A2_H = 250
function BrokenCap({ w, color }: { w: number; color: string }) {
  return (
    <View
      style={{ width: `${w * 100}%`, height: 8, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 1.5, borderBottomWidth: 0, borderStyle: 'dashed', borderColor: color }}
    />
  )
}
function RefinedColumn({ r }: { r: Rep }) {
  const barH = Math.max(8, (r.v / MAX_V) * (A2_H - 42))
  const ecc = eccControl(r)
  const grind = concGrind(r)
  const rom = romShallow(r)
  const romW = Math.min(1, r.rom / STD_ROM)
  const worst = worstSev(r)
  const col = velColor(r.v)
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ height: 14, justifyContent: 'center' }}>
        {worst !== 'ok' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sevColor(worst) }} />}
      </View>
      <Text style={{ color: C['text-primary'], fontSize: 13, fontWeight: '800', marginBottom: 3 }}>{formatVelocity(r.v)}</Text>
      {/* dashed standard-ROM frame — a bar narrower than the frame is SHALLOW */}
      <View
        style={{
          width: '86%',
          height: barH,
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderRadius: 6,
          borderColor: rom !== 'ok' ? alpha(sevColor(rom), 0.6) : ROM_GHOST,
        }}
      >
        {/* eccentric-control cap */}
        {ecc === 'severe' ? (
          <BrokenCap w={romW} color={OFF_STOP} />
        ) : ecc === 'mild' ? (
          <View style={{ width: `${romW * 100}%`, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: OFF_WARN }} />
        ) : (
          <View style={[{ width: `${romW * 100}%`, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: alpha(col, 0.9) }, grain]} />
        )}
        {/* velocity bar, width ∝ ROM/standard, with a grind sliver at its base */}
        <View style={[{ width: `${romW * 100}%`, flex: 1, backgroundColor: col, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.22)' } as unknown as ViewStyle, grain]}>
          {grind !== 'ok' && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, backgroundColor: OFF_WARN }} />}
        </View>
      </View>
      <Text style={{ color: worst === 'severe' ? OFF_STOP : worst === 'mild' ? OFF_WARN : alpha(C['status-success'], 0.9), fontSize: 9, fontWeight: '800', marginTop: 5, letterSpacing: 0.5, fontFamily: FONT_UI }}>
        {verdictWord(r)}
      </Text>
    </View>
  )
}

// --- Direction B — per-rep VELOCITY-over-time curve (whole-rep shape) --------------
// One continuous velocity-vs-time curve per rep, small-multipled with cell WIDTH ∝ the
// rep's real duration (a grind visibly stretches). Below the centerline = ECCENTRIC
// descent (neutral parchment); above = CONCENTRIC ascent (velocity hue). Each lobe's
// AREA is distance = ROM, so a short rep is a small curve. Fatigue deforms the shape:
// the wide low eccentric hump collapses into a tall narrow SPIKE (loss of control), the
// concentric flattens + lengthens (grind), the whole curve shrinks (cut depth).
const PX_PER_SEC = 18
const B_H = 160
const B_HALF = B_H / 2
function repDuration(r: Rep): number {
  return r.ecc + r.pB + r.con + r.pT
}
/** Signed velocity at absolute time t in the rep: concentric +, eccentric −. */
function velAt(r: Rep, t: number): number {
  const { ecc, pB, con } = r
  if (t < ecc) {
    const u = ecc > 0 ? t / ecc : 0
    const peak = (r.rom / Math.max(ecc, 0.3)) * 1.15 // fast drop (small ecc) spikes tall
    return -peak * Math.sin(Math.PI * u)
  }
  if (t < ecc + pB) return 0
  const tc = t - ecc - pB
  if (tc < con) {
    const u = con > 0 ? tc / con : 0
    const shape = Math.sin(Math.PI * Math.pow(u, 0.65)) // skews the peak early (explosive); a long con reads flat + late
    return r.v * 1.7 * shape
  }
  return 0
}
const B_MAXMAG = Math.max(...SET.map((r) => Math.max((r.rom / Math.max(r.ecc, 0.3)) * 1.15, r.v * 1.7)))
function RepCurve({ r, idx }: { r: Rep; idx: number }) {
  const T = repDuration(r)
  const w = Math.max(36, T * PX_PER_SEC)
  const n = Math.max(10, Math.round(w / 3))
  const strips = Array.from({ length: n }, (_, i) => velAt(r, (i / (n - 1)) * T))
  const col = velColor(r.v)
  const worst = worstSev(r)
  return (
    <View style={{ width: w, alignItems: 'center' }}>
      <Text style={{ color: C['text-primary'], fontSize: 12, fontWeight: '800', marginBottom: 2 }}>{formatVelocity(r.v)}</Text>
      <View style={[{ width: '100%', height: B_H, borderRadius: 8, overflow: 'hidden' }, well]}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: B_HALF, height: 1, backgroundColor: alpha(C['text-primary'], 0.18) }} />
        {/* phase boundaries */}
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${(r.ecc / T) * 100}%`, width: 1, backgroundColor: alpha(C['text-primary'], 0.1) }} />
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${((r.ecc + r.pB) / T) * 100}%`, width: 1, backgroundColor: alpha(C['text-primary'], 0.1) }} />
        <View style={{ flexDirection: 'row', height: '100%', alignItems: 'stretch' }}>
          {strips.map((v, i) => {
            const mag = Math.min(1, Math.abs(v) / B_MAXMAG) * (B_HALF - 6)
            return (
              <View key={i} style={{ flex: 1, height: '100%' }}>
                <View style={{ height: B_HALF, justifyContent: 'flex-end' }}>
                  {v > 0 && <View style={[{ height: mag, backgroundColor: alpha(col, 0.92) }, grain]} />}
                </View>
                <View style={{ height: B_HALF, justifyContent: 'flex-start' }}>
                  {v < 0 && <View style={{ height: mag, backgroundColor: ROM_FILL }} />}
                </View>
              </View>
            )
          })}
        </View>
        {worst !== 'ok' && <View style={{ position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: sevColor(worst) }} />}
      </View>
      <Text style={{ color: ROM_LINE, fontSize: 10, fontWeight: '700', marginTop: 3, fontFamily: FONT_MONO }}>{Math.round(r.rom * 100)}% · rep {idx + 1}</Text>
    </View>
  )
}

// --- Direction C — WARNINGS model (clean velocity bar + directional flags) ---------
// Keep ONE uncluttered velocity bar as the primary read; don't encode every deviation
// as a channel. Fire a discrete flag ONLY when something is actually wrong, on the bad
// direction, with severity. A clean rep just reads ✓.
const C2_VEL_H = 156
function WarnChip({ w }: { w: Warn }) {
  const col = sevColor(w.sev)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 5, backgroundColor: alpha(col, 0.16), borderWidth: 1, borderColor: alpha(col, w.sev === 'severe' ? 0.7 : 0.45) }}>
      <Text style={{ color: col, fontSize: 9, fontWeight: '900' }}>{w.sev === 'severe' ? '⚠' : '•'}</Text>
      <Text style={{ color: col, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_UI }}>{w.label}</Text>
    </View>
  )
}
function WarningsPanel() {
  return (
    <View style={{ gap: 8 }}>
      <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: C2_VEL_H, borderRadius: 10, padding: 12 }, well]}>
        {SET.map((r, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ color: C['text-primary'], fontSize: 12, fontWeight: '800', marginBottom: 3 }}>{formatVelocity(r.v)}</Text>
            <View
              style={[
                { width: '70%', height: Math.max(6, (r.v / MAX_V) * (C2_VEL_H - 48)), borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: velColor(r.v), boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 6px 14px rgba(0,0,0,0.45)' } as unknown as ViewStyle,
                grain,
              ]}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {SET.map((r, i) => {
          const w = repWarnings(r)
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3, minHeight: 54 }}>
              {w.length === 0 ? (
                <Text style={{ color: alpha(C['status-success'], 0.95), fontSize: 10, fontWeight: '800', fontFamily: FONT_UI }}>✓ clean</Text>
              ) : (
                w.map((x, j) => <WarnChip key={j} w={x} />)
              )}
            </View>
          )
        })}
      </View>
      <RepTicks count={SET.length} />
    </View>
  )
}

/** The directional-semantics legend shared by all Round-2 stories. */
function DirectionalLegend() {
  const chip = (col: string, icon: string, label: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(col, 0.16), borderWidth: 1, borderColor: alpha(col, 0.5) }}>
        <Text style={{ color: col, fontSize: 9, fontWeight: '900' }}>{icon}</Text>
      </View>
      <Text style={{ color: C['text-secondary'], fontSize: 11, fontWeight: '700', fontFamily: FONT_UI }}>{label}</Text>
    </View>
  )
  return (
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      {chip(OFF_STOP, '⚠', 'CONTROL — fast eccentric (severe)')}
      {chip(OFF_STOP, '⚠', 'SHALLOW — ROM cut short (bad)')}
      {chip(OFF_WARN, '•', 'GRIND — slow concentric (mild)')}
      <Text style={{ color: C['text-tertiary'], fontSize: 11, fontStyle: 'italic', fontFamily: FONT_UI }}>
        explosive concentric · slow eccentric · slightly-long ROM → not flagged
      </Text>
    </View>
  )
}

/** R2·A — Composite column re-cut with directional (bad-direction-only) semantics. */
export const RefinedComposite: Story = {
  name: 'R2 · 1 · Composite (directional)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Composite column, refined — directional form semantics</SectionTitle>
        <Caption>
          The closest Round-1 encoding, re-cut so signals fire ONLY on the genuinely-bad direction. HEIGHT is concentric
          velocity (hue). WIDTH is ROM inside a dashed STANDARD-ROM frame — a bar that fills the frame is at depth; a narrow
          bar inside it is SHALLOW (bad). The CAP is eccentric control: a clean textured cap when the lowering is controlled
          or slow (good), a red BROKEN cap when the eccentric is dropped (loss of control — severe). A thin amber base sliver
          = a grinding concentric (mild fatigue). Explosive concentric, a slow eccentric, and a slightly-long ROM raise
          NOTHING. Reps 4 & 7 (skinny + red broken cap) shout; the honest-fatigue rep 5 shows only the calm amber grind.
        </Caption>
        <DirectionalLegend />
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · height=velocity · width=ROM/std · cap=eccentric · base=grind</Kicker>
        <View style={[{ borderRadius: 10, padding: 12 }, well]}>
          <Row h={A2_H}>{SET.map((r, i) => <RefinedColumn key={i} r={r} />)}</Row>
          <RepTicks count={SET.length} />
        </View>
      </Panel>
    </Page>
  ),
}

/** R2·B — per-rep velocity-vs-time curve; the whole rep shape, area≈ROM. */
export const VelocityCurves: Story = {
  name: 'R2 · 2 · Velocity curves',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Velocity curves — the whole shape of every rep</SectionTitle>
        <Caption>
          One velocity-vs-time curve per rep, as small multiples (cell WIDTH ∝ the rep's real duration, so a grinding rep
          visibly stretches). Below the centerline is the ECCENTRIC descent (neutral parchment); above is the CONCENTRIC
          ascent (velocity hue). Each lobe's AREA is the distance travelled — i.e. ROM — so a short rep is a small curve.
          Fatigue deforms the shape: the controlled early eccentric (a wide low hump) collapses into a tall narrow SPIKE
          (dropped — loss of control), the concentric flattens and lengthens (grind), and the whole curve shrinks as depth
          is cut. Reps 4 & 7 show the tell — a fast eccentric spike over a small concentric lobe.
        </Caption>
        <DirectionalLegend />
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · x=time (to scale) · up=concentric · down=eccentric · area≈ROM</Kicker>
        <View style={[{ borderRadius: 10, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }, well]}>
          {SET.map((r, i) => <RepCurve key={i} r={r} idx={i} />)}
        </View>
      </Panel>
    </Page>
  ),
}

/** R2·C — clean velocity bar stays primary; ROM/tempo become directional warning flags. */
export const WarningsModel: Story = {
  name: 'R2 · 3 · Warnings model',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Warnings model — velocity stays primary, problems become directional flags</SectionTitle>
        <Caption>
          The cleanest hypothesis: keep ONE uncluttered velocity bar as the main read, and don't encode every deviation as a
          channel. Instead raise a discrete WARNING only when something is actually wrong — on the bad direction, with
          severity. A dropped eccentric → red ⚠ CONTROL (severe). A cut ROM → red ⚠ SHALLOW (bad). A grinding concentric →
          amber • GRIND (mild fatigue). Explosive concentric, a slow controlled eccentric, and a slightly-long ROM stay
          silent — a clean rep just reads ✓. Reps 4 & 7 light up red; the honest-fatigue rep 5 shows one calm amber grind;
          the early reps are silent.
        </Caption>
        <DirectionalLegend />
      </View>
      <Panel width={900}>
        <Kicker>8-REP CABLE PRESS · velocity bar = primary · flags = directional + severity</Kicker>
        <WarningsPanel />
      </Panel>
    </Page>
  ),
}

/** R2 Overview — the three new directions tiled on the same fatiguing set. */
export const OverviewR2: Story = {
  name: 'R2 · Overview · new directions',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Round 2 — three new directions, one fatiguing set</SectionTitle>
        <Caption>
          Directional semantics throughout: only a FAST eccentric (loss of control, severe), a SLOW concentric (grind,
          mild), and a SHORT ROM (shallow, bad) ever raise a signal — the good/neutral directions stay quiet. Composite
          (refined) bakes the signals into one bar; Velocity curves show each rep's whole shape (area≈ROM); Warnings keeps a
          clean velocity bar and surfaces only genuine, severity-ranked problems.
        </Caption>
        <DirectionalLegend />
      </View>
      <View style={{ flexDirection: 'column', gap: 20 }}>
        <Panel width={900}>
          <Kicker>3 · WARNINGS MODEL — clean bar + directional flags</Kicker>
          <WarningsPanel />
        </Panel>
        <Panel width={900}>
          <Kicker>2 · VELOCITY CURVES — whole-rep shape · area≈ROM</Kicker>
          <View style={[{ borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }, well]}>
            {SET.map((r, i) => <RepCurve key={i} r={r} idx={i} />)}
          </View>
        </Panel>
        <Panel width={900}>
          <Kicker>1 · COMPOSITE (DIRECTIONAL) — height/width/cap/base</Kicker>
          <View style={[{ borderRadius: 10, padding: 10 }, well]}>
            <Row h={220}>{SET.map((r, i) => <RefinedColumn key={i} r={r} />)}</Row>
            <RepTicks count={SET.length} />
          </View>
        </Panel>
      </View>
    </Page>
  ),
}
