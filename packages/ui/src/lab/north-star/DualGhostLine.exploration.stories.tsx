// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Dual Ghost Line` — DESIGN EXPLORATION (not shipped).
 *
 * DUAL-VOLTRA ghost-spark for the bottom of the live fatigue card. The layout decision is
 * settled: TOP/BOTTOM MIRRORED around one shared phase-colored axis band — the LEFT device
 * blooms UP, the RIGHT device blooms DOWN. Up/down is spent on DEVICE identity, so phase
 * rides the axis-band COLOR alone (magenta ecc / cyan con), with the ECC/CON labels INSIDE
 * the band.
 *
 * The point of this specimen NOW is that it is built the SAME way the single GhostSpark is:
 * it composes the SHARED `GhostBand` + two `GhostBloom`s — the top normal, the bottom just
 * `orientation="down"` (a y-flip), sharing ONE band as the single axis. There is no bespoke
 * dual component and no forked path/band/tint code; any GhostBloom improvement (the paper-
 * inspired line ground, the silver→red tint) reaches the dual for free. This is the ghost
 * analogue of the diverging VelocityStrip = two composed VelocityStrips.
 *
 * Tint is the LOCKED silver→red rule verbatim (the shared `ghostLineColor`): a controlled
 * rep reads SILVER (dimming toward a dim-silver drift grey with tempo deviation), a
 * collapsing rep warms through SHADES OF RED by severity. No greens, no ambers.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode, TextStyle, ViewStyle } from 'react'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'
import { GRIND_THRESHOLD, ghostLineColor } from '../../components/custom/Fatigue/fatigue-tokens'
import {
  GhostBand,
  GhostBloom,
  BAND_H,
  BAND_GAP,
  type Pt,
} from '../../components/custom/Fatigue'
import type { PhaseSegment } from '../../components/custom/Fatigue'

const C = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

const PARCH = C['text-primary']

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

// =================================================================================
// The LOCKED silver→red tint rule — the SHARED `ghostLineColor` from `fatigue-tokens`.
// The whole current line takes ONE control-aware tint (phase is carried by the band,
// not the line) — the same model the single GhostSpark uses.
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
/** The device's current-rep line tint — the LOCKED silver→red rule. */
function conTone(s: DeviceSpec): string {
  return ghostLineColor(tempoDeviation(s), grindSignature(s))
}
function verdictWord(s: DeviceSpec): string {
  if (isBreakdown(s)) return grindSignature(s) < 0.6 ? 'collapse → warn' : 'collapse → alarm'
  const dev = tempoDeviation(s)
  return dev < 0.12 ? 'on-tempo · silver' : 'controlled · dimmer silver'
}

// =================================================================================
// Phase-NORMALIZED shared spine — each device's own phase durations are stretched onto
// one canonical template (the on-tempo / prescribed LEFT-arm timing) so the two blooms
// share one coherent x-axis regardless of the devices' actual (differing) rep durations.
// =================================================================================
const TEMPLATE_TOTAL = LEFT_ARM.eccMs + LEFT_ARM.pBMs + LEFT_ARM.conMs + LEFT_ARM.pTMs
const TEMPLATE_BOUNDS: Record<Phase, [number, number]> = (() => {
  const b1 = LEFT_ARM.eccMs / TEMPLATE_TOTAL
  const b2 = (LEFT_ARM.eccMs + LEFT_ARM.pBMs) / TEMPLATE_TOTAL
  const b3 = (LEFT_ARM.eccMs + LEFT_ARM.pBMs + LEFT_ARM.conMs) / TEMPLATE_TOTAL
  return { ecc: [0, b1], pauseBottom: [b1, b2], con: [b2, b3], pauseTop: [b3, 1] }
})()
function phaseSpans(s: DeviceSpec): Array<{ phase: Phase; t0: number; t1: number }> {
  const b = [0, s.eccMs, s.eccMs + s.pBMs, s.eccMs + s.pBMs + s.conMs, s.eccMs + s.pBMs + s.conMs + s.pTMs]
  return [
    { phase: 'ecc', t0: b[0], t1: b[1] },
    { phase: 'pauseBottom', t0: b[1], t1: b[2] },
    { phase: 'con', t0: b[2], t1: b[3] },
    { phase: 'pauseTop', t0: b[3], t1: b[4] },
  ]
}
/** Map a device sample's real elapsed ms to the shared [0,1] phase-normalized spine. */
function normalizedU(sample: Sample, device: DeviceSpec): number {
  const span = phaseSpans(device).find((s) => s.phase === sample.phase)
  if (!span) return 0
  const localU = span.t1 > span.t0 ? clamp01((sample.t - span.t0) / (span.t1 - span.t0)) : 0
  const [b0, b1] = TEMPLATE_BOUNDS[sample.phase]
  return b0 + localU * (b1 - b0)
}

/** The band's phase runs as the shared component `PhaseSegment[]` (0..1 domain), pause
 *  phases collapsing to `idle` (unlabelled) so GhostBand labels only ECC / CON. */
const SHARED_SEGMENTS: PhaseSegment[] = (Object.keys(TEMPLATE_BOUNDS) as Phase[]).map((phase) => ({
  phase: phase === 'ecc' ? 'eccentric' : phase === 'con' ? 'concentric' : 'idle',
  startMs: TEMPLATE_BOUNDS[phase][0],
  endMs: TEMPLATE_BOUNDS[phase][1],
}))

// Shared magnitude scale across BOTH devices (current + ghosts) so the two blooms are
// directly, honestly comparable.
const ALL_SAMPLES = [...CURRENT.left, ...CURRENT.right, ...GHOSTS_LEFT.flat(), ...GHOSTS_RIGHT.flat()]
const VMAX_MAG = Math.max(0.01, ...ALL_SAMPLES.map((s) => Math.abs(s.vel))) * 1.06

// =================================================================================
// The mirrored dual — GhostBand + two GhostBlooms (top normal, bottom flipped), sharing
// ONE band. This is the whole component: no bespoke dual machinery.
// =================================================================================
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
  // still sits clear of the band rather than kissing it.
  const baseUp = bandTop - BAND_GAP
  const baseDown = bandBot + BAND_GAP
  const upH = baseUp - padTop
  const downH = h - padBot - baseDown
  const x = (u: number) => padL + u * (w - padL - padR)
  const magUp = (v: number) => clamp01(Math.abs(v) / VMAX_MAG) * upH
  const magDown = (v: number) => clamp01(Math.abs(v) / VMAX_MAG) * downH

  const pts = (samples: Sample[], device: DeviceSpec, magFn: (v: number) => number): Pt[] =>
    samples.map((s): Pt => [x(normalizedU(s, device)), magFn(s.vel)])

  const leftCur = pts(CURRENT.left, LEFT_ARM, magUp)
  const rightCur = pts(CURRENT.right, RIGHT_ARM, magDown)
  const leftGhosts = GHOSTS_LEFT.map((g) => pts(g, LEFT_ARM, magUp))
  const rightGhosts = GHOSTS_RIGHT.map((g) => pts(g, RIGHT_ARM, magDown))

  return (
    <svg width={w} height={h}>
      {/* LEFT device blooms UP, RIGHT blooms DOWN — same GhostBloom, one prop flipped. */}
      <GhostBloom current={leftCur} ghosts={leftGhosts} tint={conTone(LEFT_ARM)} baseline={baseUp} orientation="up" />
      <GhostBloom current={rightCur} ghosts={rightGhosts} tint={conTone(RIGHT_ARM)} baseline={baseDown} orientation="down" />

      {/* the single shared phase-colored band, on top — ECC/CON labelled inside. */}
      <GhostBand segments={SHARED_SEGMENTS} x={x} top={bandTop} showLabels labelColor={alpha(PARCH, 0.92)} />
      <rect x={padL} y={bandTop} width={w - padL - padR} height={BAND_H} rx={4} fill="none" stroke={alpha('#000000', 0.3)} strokeWidth={1} />

      <text x={padL} y={padTop - 9} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI} fill={C['text-tertiary']}>
        LEFT ARM
      </text>
      <text x={padL} y={h - padBot + 15} fontSize={9} fontWeight={800} letterSpacing={1} fontFamily={FONT_UI} fill={C['text-tertiary']}>
        RIGHT ARM
      </text>
    </svg>
  )
}

// --- Layout ----------------------------------------------------------------------
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

function DualGhostCard() {
  const innerW = CARD_W - CARD_PAD * 2
  const chartH = 232
  return (
    <View style={[{ width: CARD_W, borderRadius: 14, padding: CARD_PAD, gap: 10 }, paperSheet(PANEL_BG)]}>
      <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
        DUAL · TOP/BOTTOM MIRRORED · GhostBand + 2×GhostBloom
      </Text>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <DeviceLegendRow device={LEFT_ARM} />
        <DeviceLegendRow device={RIGHT_ARM} />
      </View>
      <View style={[{ borderRadius: 8, padding: 4 }, insetWell(primitiveColors.charcoal[900])]}>
        <MirroredDualBand w={innerW - 8} h={chartH} />
      </View>
      <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 14, fontStyle: 'italic' }}>
        Two `GhostBloom`s sharing one `GhostBand` axis — the LEFT blooms up, the RIGHT is the same bloom with
        `orientation=&quot;down&quot;`. No bespoke dual code: the paper line ground and the silver→red tint come straight from the
        shared primitive, so any single-spark improvement lands here too. Left Arm stays silver; Right Arm warms through
        shades of red as its concentric collapses.
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

/** The resolved dual: top/bottom mirrored, composed on the shared GhostBand + GhostBloom
 *  (the ghost analogue of the diverging VelocityStrip = two composed VelocityStrips). */
export const MirroredDual: Story = {
  name: 'Mirrored dual (GhostBand + 2×GhostBloom)',
  render: () => (
    <Page>
      <View style={{ gap: 6, maxWidth: 920 }}>
        <Text style={[{ fontSize: 9, letterSpacing: 1.4, fontFamily: FONT_MONO, color: C['text-tertiary'] }, debossLabel]}>
          DUAL-VOLTRA GHOST-SPARK · COMPOSED ON SHARED PRIMITIVES
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: FONT_HEAD, color: C['text-primary'] }}>
          One axis, two blooms — the dual is a flip of the single
        </Text>
        <Text style={{ fontSize: 13, fontFamily: FONT_UI, color: C['text-secondary'], lineHeight: 19 }}>
          Mock dual set: Left Arm on-tempo (silver), Right Arm fatiguing — concentric drifting long and sticking through a
          mid-rep collapse (grind signature crosses the red threshold). Built exactly like the single GhostSpark: a shared
          `GhostBand` for phase + two `GhostBloom`s for the lines, the bottom one flipped `orientation=&quot;down&quot;`.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <DualGhostCard />
      </View>
    </Page>
  ),
}
