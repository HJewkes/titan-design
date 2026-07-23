// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/Open Decisions/Hero Tempo` — DESIGN EXPLORATION (not shipped). OPEN: the
 * tempo-treatment pick (hero numerals vs cadence bar vs ambient clock) was never made —
 * not part of the aligned North Star direction, not superseded either.
 *
 * The shipped dual live view puts the prescribed tempo in the right-hand gutter as a
 * vertical `TempoDisplay` — but its magenta/cyan phase-identity chips + compact mono
 * treatment clash with the WARM hero (velocity ramp + split aura). These specimens
 * prototype THREE hero-scale tempo treatments so the warm/editorial fit can be judged
 * IN CONTEXT — each is shown as a mini dual-hero: the REAL {@link DualVelocityStrip}
 * diverging chart + a representative split aura, with the tempo treatment in the gutter,
 * two of them (top = LEFT, bottom = RIGHT) exactly like the real dual layout.
 *
 * Tempo tuple is [ecc, pauseBottom, con, pauseTop]; the CONCENTRIC phase is shown active.
 * Nothing here modifies the shipped `TempoDisplay` / `DualLiveView`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text, type ViewStyle } from 'react-native'
import { DualVelocityStrip, LiveAuraFrame } from '../../components'
import type { TempoLivePhase } from '../../components/custom/Workout/TempoDisplay'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'
import { roundTempo } from '../../utils/workout-format'
import { grainForTone } from './surfaces'

const T = getSemanticColors('dark')
const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'

// --- Fixture: bilateral cable chest press, LEFT dominant / RIGHT lagging ------
const LEFT = [0.54, 0.52, 0.5, 0.48, 0.46, 0.44]
const RIGHT = [0.49, 0.47, 0.45, 0.42, 0.4, 0.38]
const TEMPO: [number, number, number, number] = [3, 1, 1, 0]

/** LEFT = threshold (amber), RIGHT = stop (red) — matches the split aura + each side’s tone. */
const sideTone = (side: 'L' | 'R') => (side === 'L' ? T['status-warning'] : T['status-error'])

interface Phase {
  key: TempoLivePhase
  label: string
  seconds: number
}
const PHASES: Phase[] = [
  { key: 'eccentric', label: 'ECC', seconds: TEMPO[0] },
  { key: 'pauseBottom', label: 'PAUSE', seconds: TEMPO[1] },
  { key: 'concentric', label: 'CON', seconds: TEMPO[2] },
  { key: 'pauseTop', label: 'HOLD', seconds: TEMPO[3] },
]
/** The phase shown live/active in every specimen (matches the chart's concentric live state). */
const ACTIVE_KEY: TempoLivePhase = 'concentric'
/** Illustrative live countdown for the active concentric phase (1.0s target, ~0.3 remaining). */
const ACTIVE_COUNTDOWN = '0.3'
/** Warm neutral base for the cadence-bar track — cohesive with the hero, never magenta/cyan. */
const WARM_TRACK = primitiveRamps.amber[400]

// --- The in-context frame: real diverging chart + split aura + tempo gutter ----
// Frame padding is symmetric so the chart's centre axis (height/2) lands on the aura's
// 50% split — the same alignment the shipped dual view uses.
const FRAME_H = 430
const PAD = 24
const CHART_H = FRAME_H - PAD * 2

function MiniDualHero({
  gutter,
  renderTempo,
}: {
  gutter: number
  renderTempo: (side: 'L' | 'R') => ReactNode
}) {
  return (
    <View style={{ height: FRAME_H, borderRadius: 14, overflow: 'hidden' }}>
      <LiveAuraFrame
        category="threshold"
        split={{ top: 'threshold', bottom: 'stop' }}
        style={{ flex: 1, borderRadius: 14, borderWidth: 0 }}
      >
        <View style={{ flex: 1, flexDirection: 'row', padding: PAD, gap: 10 }}>
          <View style={{ flex: 1 }}>
            <DualVelocityStrip
              variant="hero"
              left={{ velocities: LEFT }}
              right={{ velocities: RIGHT }}
              liveRepIndex={LEFT.length - 1}
              targetReps={8}
              height={CHART_H}
              scale="peak"
            />
          </View>
          {/* tempo gutter — top half aligns with the up (LEFT) wing, bottom with down (RIGHT). */}
          <View style={{ width: gutter }}>
            <View style={{ height: '50%', justifyContent: 'center', alignItems: 'center' }}>
              {renderTempo('L')}
            </View>
            <View style={{ height: '50%', justifyContent: 'center', alignItems: 'center' }}>
              {renderTempo('R')}
            </View>
          </View>
        </View>
      </LiveAuraFrame>
    </View>
  )
}

// --- Treatment 1: HeroNumerals ------------------------------------------------
// Plain large numerals in the hero’s voice (matching the per-rep velocity value labels —
// on-surface white, same bold face), stacked with thin dashes. No pill chips, no
// magenta/cyan. The active phase brightens to white and fills a WARM accent (the side’s
// aura tone); resting phases sit dim. Distinction from POSITION + the live highlight.
function HeroNumeralsTempo({ side }: { side: 'L' | 'R' }) {
  const tone = sideTone(side)
  return (
    <View style={{ alignItems: 'center' }}>
      {PHASES.map((p, i) => {
        const active = p.key === ACTIVE_KEY
        return (
          <View key={p.key} style={{ alignItems: 'center' }}>
            {i > 0 && (
              <Text style={{ color: T['text-tertiary'], fontSize: 13, lineHeight: 14, opacity: 0.5 }}>
                –
              </Text>
            )}
            <View
              style={{
                minWidth: 46,
                height: 42,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {active && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '58%',
                    backgroundColor: alpha(tone, 0.32),
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: active ? 30 : 25,
                  fontWeight: '800',
                  color: active ? T['text-primary'] : T['text-tertiary'],
                }}
              >
                {p.seconds.toFixed(0)}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

// --- Treatment 2: CadenceBar --------------------------------------------------
// Tempo as a vertical SEGMENTED bar that rhymes with the velocity bars: 4 stacked
// segments sized ∝ each phase’s target seconds, on a warm-neutral track; the active
// phase fills live in the side’s tone. Numbers are secondary (small labels beside).
const CADENCE_H = 172
function CadenceBarTempo({ side }: { side: 'L' | 'R' }) {
  const tone = sideTone(side)
  // Floor the 0s (top pause) so it still reads as a hairline segment.
  const weights = PHASES.map((p) => Math.max(p.seconds, 0.5))
  const total = weights.reduce((a, b) => a + b, 0)
  return (
    <View style={{ flexDirection: 'row', gap: 8, height: CADENCE_H }}>
      <View style={{ width: 22 }}>
        {PHASES.map((p, i) => {
          const active = p.key === ACTIVE_KEY
          return (
            <View
              key={p.key}
              style={{
                height: (weights[i] / total) * CADENCE_H,
                marginTop: i ? 3 : 0,
                borderRadius: 5,
                overflow: 'hidden',
                backgroundColor: alpha(WARM_TRACK, 0.16),
              }}
            >
              {active && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '58%',
                    backgroundColor: tone,
                  }}
                />
              )}
            </View>
          )
        })}
      </View>
      <View>
        {PHASES.map((p, i) => {
          const active = p.key === ACTIVE_KEY
          return (
            <View
              key={p.key}
              style={{
                height: (weights[i] / total) * CADENCE_H,
                marginTop: i ? 3 : 0,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: active ? T['text-primary'] : T['text-tertiary'],
                  fontSize: 11,
                  fontWeight: '700',
                  fontFamily: FONT_UI,
                }}
              >
                {p.seconds.toFixed(1)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// --- Treatment 3: AmbientClock ------------------------------------------------
// Foreground ONLY the current phase as one large warm countdown (label + ticking
// number in the side’s tone); the full 4-number prescription sits small below,
// de-emphasized. The cleanest hero read.
function AmbientClockTempo({ side }: { side: 'L' | 'R' }) {
  const tone = sideTone(side)
  const active = PHASES.find((p) => p.key === ACTIVE_KEY)!
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Text style={{ color: tone, fontSize: 11, fontWeight: '800', letterSpacing: 2, fontFamily: FONT_UI }}>
        {active.label}
      </Text>
      <Text style={{ color: tone, fontSize: 46, lineHeight: 50, fontWeight: '800', fontFamily: FONT_HEAD }}>
        {ACTIVE_COUNTDOWN}
      </Text>
      <Text style={{ color: T['text-tertiary'], fontSize: 12, fontWeight: '700', letterSpacing: 1.5, fontFamily: FONT_UI }}>
        {roundTempo(TEMPO)
          .map((n) => `${n}`)
          .join(' · ')}
      </Text>
    </View>
  )
}

// =============================================================================
// ROUND 2 — refined set: paper-textured phase colors (all three) + semantic
// hit/miss of target cadence (numerals + cadence bar) + a smaller ambient clock.
// =============================================================================

/** A muted, PAPER-TEXTURED chip: darker tone + BRIGHTNESS-SCALED grain (via the shared
 *  `grainForTone`, so a dark chip only whispers) + a rim-light and soft inner shade, so a
 *  phase / semantic hue reads as a matte plane that belongs on the warm dark hero. */
const paperChip = (tone: string): ViewStyle =>
  ({
    backgroundColor: tone,
    backgroundImage: grainForTone(tone),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 4px rgba(0,0,0,0.40)',
  }) as unknown as ViewStyle

// Phase-identity hues, RECONSIDERED as DARKER + paper-textured variants of the same
// magenta(ecc)/cyan(con) so they cohere with the warm dark hero + aura instead of reading
// as bright UI chips. Pauses stay a warm neutral. Active phase steps one shade brighter.
const phaseTone: Record<TempoLivePhase, string> = {
  eccentric: primitiveRamps.magenta[900],
  pauseBottom: primitiveColors.charcoal[300],
  concentric: primitiveRamps.cyan[900],
  pauseTop: primitiveColors.charcoal[300],
}
const phaseToneActive: Record<TempoLivePhase, string> = {
  eccentric: primitiveRamps.magenta[800],
  pauseBottom: primitiveColors.charcoal[200],
  concentric: primitiveRamps.cyan[800],
  pauseTop: primitiveColors.charcoal[200],
}

// Semantic hit/miss of target cadence — also DARKER + paper-textured so the green/amber/red
// belongs on the hero. on = ran on target · off = slightly off · far = well off.
type ExecStatus = 'on' | 'off' | 'far'
const execTone: Record<ExecStatus, string> = {
  on: primitiveRamps.green[700],
  off: primitiveRamps.amber[600],
  far: primitiveRamps.red[700],
}

/** One phase's ACTUAL execution vs its TARGET duration (mocked, representative). */
interface Exec {
  key: TempoLivePhase
  label: string
  target: number
  actual: number
}
// LEFT (dominant) executes cleanly; RIGHT (lagging) breaks down — rushes the eccentric and
// the concentric — so the coach sees WHICH phases are failing, mirroring the split aura.
const EXEC_L: Exec[] = [
  { key: 'eccentric', label: 'ECC', target: 3.0, actual: 3.1 },
  { key: 'pauseBottom', label: 'PAUSE', target: 1.0, actual: 1.0 },
  { key: 'concentric', label: 'CON', target: 1.0, actual: 0.8 },
  { key: 'pauseTop', label: 'HOLD', target: 0.0, actual: 0.0 },
]
const EXEC_R: Exec[] = [
  { key: 'eccentric', label: 'ECC', target: 3.0, actual: 2.3 },
  { key: 'pauseBottom', label: 'PAUSE', target: 1.0, actual: 1.4 },
  { key: 'concentric', label: 'CON', target: 1.0, actual: 0.5 },
  { key: 'pauseTop', label: 'HOLD', target: 0.0, actual: 0.0 },
]
const execStatus = (e: Exec): ExecStatus => {
  const d = Math.abs(e.actual - e.target)
  return d <= 0.15 ? 'on' : d <= 0.4 ? 'off' : 'far'
}
/** +1 = ran slow (over target, mark ABOVE the line) · −1 = rushed (under, mark BELOW). */
const execDir = (e: Exec): number => Math.sign(e.actual - e.target)
/** Deviation seconds mapped to a 0..1 magnitude (0.8s = a full-length mark). */
const execMag = (e: Exec): number => Math.min(1, Math.abs(e.actual - e.target) / 0.8)

/**
 * The per-phase hit/miss mark: a paper-textured semantic block diverging from a centre
 * TARGET line — up (green/amber/red) when the phase ran slow, down when it rushed; an
 * on-target phase is a small green dot on the line. Length ∝ how far off it ran.
 */
function DeviationTick({ e, laneH }: { e: Exec; laneH: number }) {
  const status = execStatus(e)
  const half = laneH / 2
  const barH = Math.max(3, execMag(e) * (half - 2))
  const slow = execDir(e) > 0
  return (
    <View style={{ width: 12, height: laneH }}>
      <View
        style={{ position: 'absolute', left: 0, right: 0, top: half - 0.5, height: 1, backgroundColor: alpha(T['text-tertiary'], 0.6) }}
      />
      {status === 'on' ? (
        <View style={[{ position: 'absolute', left: 2, top: half - 4, width: 8, height: 8, borderRadius: 4, overflow: 'hidden' }, paperChip(execTone.on)]} />
      ) : (
        <View
          style={[
            { position: 'absolute', left: 2, right: 2, height: barH, borderRadius: 2, overflow: 'hidden', ...(slow ? { bottom: half } : { top: half }) },
            paperChip(execTone[status]),
          ]}
        />
      )}
    </View>
  )
}

// --- Refined 1: HeroNumerals + hit/miss + paper phase colors -------------------
function HeroNumeralsRefined({ exec }: { exec: Exec[] }) {
  return (
    <View style={{ gap: 5 }}>
      {exec.map((e) => {
        const active = e.key === ACTIVE_KEY
        const tone = active ? phaseToneActive[e.key] : phaseTone[e.key]
        const h = active ? 36 : 30
        return (
          <View key={e.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={[
                { minWidth: 42, height: h, borderRadius: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
                paperChip(tone),
              ]}
            >
              <Text style={{ fontSize: active ? 22 : 18, fontWeight: '800', color: active ? T['text-primary'] : alpha(T['text-primary'], 0.72) }}>
                {e.actual.toFixed(1)}
              </Text>
            </View>
            <DeviationTick e={e} laneH={h} />
          </View>
        )
      })}
    </View>
  )
}

// --- Refined 2: CadenceBar + hit/miss + paper phase colors ---------------------
const CADENCE_H2 = 168
function CadenceBarRefined({ exec }: { exec: Exec[] }) {
  const weights = exec.map((e) => Math.max(e.target, 0.5))
  const total = weights.reduce((a, b) => a + b, 0)
  const segH = (i: number) => (weights[i] / total) * CADENCE_H2
  return (
    <View style={{ flexDirection: 'row', gap: 7, height: CADENCE_H2 }}>
      {/* segmented bar — paper phase-hue segments sized ∝ TARGET seconds */}
      <View style={{ width: 20 }}>
        {exec.map((e, i) => {
          const active = e.key === ACTIVE_KEY
          const tone = active ? phaseToneActive[e.key] : phaseTone[e.key]
          return (
            <View
              key={e.key}
              style={[{ height: segH(i), marginTop: i ? 3 : 0, borderRadius: 4, overflow: 'hidden' }, paperChip(tone)]}
            />
          )
        })}
      </View>
      {/* secondary actual-second labels */}
      <View>
        {exec.map((e, i) => {
          const active = e.key === ACTIVE_KEY
          return (
            <View key={e.key} style={{ height: segH(i), marginTop: i ? 3 : 0, justifyContent: 'center' }}>
              <Text style={{ color: active ? T['text-primary'] : T['text-tertiary'], fontSize: 10, fontWeight: '700', fontFamily: FONT_UI }}>
                {e.actual.toFixed(1)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// --- Refined 3: smaller AmbientClock + paper phase colors ----------------------
function AmbientClockSmaller({ exec }: { exec: Exec[] }) {
  const con = exec.find((e) => e.key === ACTIVE_KEY)!
  return (
    <View style={{ alignItems: 'center', gap: 5 }}>
      <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }, paperChip(phaseToneActive.concentric)]}>
        <Text style={{ color: T['text-primary'], fontSize: 10, fontWeight: '800', letterSpacing: 1.5, fontFamily: FONT_UI }}>
          {con.label}
        </Text>
      </View>
      <Text style={{ color: T['text-primary'], fontSize: 30, lineHeight: 32, fontWeight: '800', fontFamily: FONT_HEAD }}>
        {ACTIVE_COUNTDOWN}
      </Text>
      <Text style={{ color: T['text-tertiary'], fontSize: 11, fontWeight: '700', letterSpacing: 1.2, fontFamily: FONT_UI }}>
        {roundTempo(TEMPO)
          .map((n) => `${n}`)
          .join(' · ')}
      </Text>
    </View>
  )
}

/** Refined gutter renderer: LEFT uses the clean profile, RIGHT the breaking-down one. */
const refinedTempo =
  (Comp: (p: { exec: Exec[] }) => ReactNode) =>
  (side: 'L' | 'R'): ReactNode =>
    Comp({ exec: side === 'L' ? EXEC_L : EXEC_R })

// --- Presentation scaffolding -------------------------------------------------
function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_HEAD, color: T['text-primary'] }}>{children}</Text>
}
function Caption({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 12, fontFamily: FONT_UI, color: T['text-secondary'], maxWidth: 620, lineHeight: 17 }}>{children}</Text>
}
function Kicker({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', color: T['text-tertiary'] }}>{children}</Text>
}
function Panel({ children, width }: { children: ReactNode; width?: number }) {
  return <View style={{ width, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 12 }}>{children}</View>
}
function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 24 }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/Open Decisions/Hero Tempo',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** 1 — HeroNumerals: plain warm numerals, active phase lit + filled in the side’s tone. */
export const HeroNumerals: Story = {
  name: '1 · Hero numerals',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Hero numerals — no chips, hero type</SectionTitle>
        <Caption>
          Each phase is a large plain numeral in the hero’s own voice (matching the per-rep velocity value labels —
          on-surface white, same bold face), stacked with thin dashes. Resting phases sit dim; the ACTIVE phase (concentric)
          brightens and fills a WARM accent — the side’s aura tone (LEFT amber / RIGHT red) — so phase distinction comes from
          position + the live highlight, never a clashing magenta/cyan hue.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>IN CONTEXT · dual hero · 6 of 8 · CON active</Kicker>
        <MiniDualHero gutter={70} renderTempo={(side) => <HeroNumeralsTempo side={side} />} />
      </Panel>
    </Page>
  ),
}

/** 2 — CadenceBar: vertical segmented bar sized by seconds, active fills warm. */
export const CadenceBar: Story = {
  name: '2 · Cadence bar',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Cadence bar — tempo that rhymes with the velocity bars</SectionTitle>
        <Caption>
          Tempo as a vertical SEGMENTED bar: four stacked segments sized ∝ each phase’s target seconds (a long eccentric, short
          pause/concentric, a hairline top hold) on a warm-neutral track. The active phase fills live in the side’s tone.
          Numbers are secondary — small labels beside each segment. Reads as a sibling of the velocity bars, not UI chrome.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>IN CONTEXT · dual hero · segments ∝ 3·1·1·0</Kicker>
        <MiniDualHero gutter={78} renderTempo={(side) => <CadenceBarTempo side={side} />} />
      </Panel>
    </Page>
  ),
}

/** 3 — AmbientClock: one large warm countdown, prescription de-emphasized below. */
export const AmbientClock: Story = {
  name: '3 · Ambient clock',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Ambient clock — foreground the current phase</SectionTitle>
        <Caption>
          Foreground ONLY the current phase as one large warm countdown (the phase label + a number ticking toward 0.0 in the
          side’s tone); the full four-number prescription sits small and quiet below it. The cleanest hero read — the wall
          shows what to do NOW, with the prescription available but de-emphasized.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>IN CONTEXT · dual hero · CON 0.3 · presc. 3·1·1·0</Kicker>
        <MiniDualHero gutter={92} renderTempo={(side) => <AmbientClockTempo side={side} />} />
      </Panel>
    </Page>
  ),
}

/** Overview — the three treatments tiled for side-by-side comparison. */
export const Overview: Story = {
  name: 'Overview · three treatments',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Hero tempo — three treatments, in context</SectionTitle>
        <Caption>
          The same dual hero (LEFT dominant / RIGHT lagging, concentric phase active) with three candidate gutter-tempo
          treatments. All warm and editorial — velocity zone stays the only saturated hue; the active phase borrows each side’s
          aura tone. Judge each next to the bars + split aura: which reads as hero content, not compact UI chrome.
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel width={560}>
          <Kicker>1 · HERO NUMERALS</Kicker>
          <MiniDualHero gutter={70} renderTempo={(side) => <HeroNumeralsTempo side={side} />} />
        </Panel>
        <Panel width={560}>
          <Kicker>2 · CADENCE BAR</Kicker>
          <MiniDualHero gutter={78} renderTempo={(side) => <CadenceBarTempo side={side} />} />
        </Panel>
        <Panel width={560}>
          <Kicker>3 · AMBIENT CLOCK</Kicker>
          <MiniDualHero gutter={92} renderTempo={(side) => <AmbientClockTempo side={side} />} />
        </Panel>
      </View>
    </Page>
  ),
}

// =============================================================================
// ROUND 2 — refined story exports
// =============================================================================

/** R1 — HeroNumerals refined: paper-textured phase hues + per-phase hit/miss of target. */
export const HeroNumeralsRefinedStory: Story = {
  name: '4 · Hero numerals — refined (hit/miss + paper)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Hero numerals — refined</SectionTitle>
        <Caption>
          Phase identity returns as color, but DARKER + paper-textured (muted magenta ecc / cyan con / warm-neutral pauses),
          so the chips belong on the warm dark hero instead of reading as bright UI. Each numeral is the ACTUAL duration, and a
          paper-textured semantic mark diverges from the target line per phase — up when the phase ran slow, down when it rushed,
          a green dot when on target (green / amber / red = on / slightly off / well off). LEFT executes cleanly; RIGHT rushes
          the eccentric + concentric, so a coach sees which phases are breaking down at a glance.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>IN CONTEXT · dual hero · L clean / R rushing</Kicker>
        <MiniDualHero gutter={74} renderTempo={refinedTempo((p) => <HeroNumeralsRefined {...p} />)} />
      </Panel>
    </Page>
  ),
}

/** R2 — CadenceBar refined: paper phase-hue segments + a per-phase hit/miss deviation rail. */
export const CadenceBarRefinedStory: Story = {
  name: '5 · Cadence bar — refined (hit/miss + paper)',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Cadence bar — refined</SectionTitle>
        <Caption>
          The segmented bar keeps its rhythm-with-the-velocity-bars form, with paper-textured, darker phase hues sized ∝ each
          phase’s target seconds — brightness-scaled grain so the darker segments stay calm (no hot noise). The small secondary
          labels carry the actual seconds; the +/− hit/miss marks are dropped here (they weren’t landing) — the shape + color
          selection do the work.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>IN CONTEXT · dual hero · segments ∝ target seconds</Kicker>
        <MiniDualHero gutter={78} renderTempo={refinedTempo((p) => <CadenceBarRefined {...p} />)} />
      </Panel>
    </Page>
  ),
}

/** R3 — AmbientClock smaller: dialed-back countdown + a paper-textured phase-hue label. */
export const AmbientClockSmallerStory: Story = {
  name: '6 · Ambient clock — smaller + paper',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Ambient clock — smaller</SectionTitle>
        <Caption>
          Still foregrounds the current phase, but the countdown is dialed back to a more restrained size so it stays hero
          content without shouting. The phase label sits in a paper-textured phase-hue chip (muted cyan for concentric),
          cohering with the warm hero; the full prescription stays small and quiet below.
        </Caption>
      </View>
      <Panel width={860}>
        <Kicker>IN CONTEXT · dual hero · restrained countdown</Kicker>
        <MiniDualHero gutter={84} renderTempo={refinedTempo((p) => <AmbientClockSmaller {...p} />)} />
      </Panel>
    </Page>
  ),
}

/** Refined overview — the three refined treatments tiled for comparison. */
export const RefinedOverview: Story = {
  name: 'Refined overview · three, retuned',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Hero tempo — refined set</SectionTitle>
        <Caption>
          The three treatments retuned: paper-textured, darker phase hues on all of them (magenta ecc / cyan con) with
          brightness-scaled grain so dark chips stay calm, semantic hit/miss of the target cadence on the HERO NUMERALS
          (paper-textured green / amber / red diverging marks — LEFT clean, RIGHT rushing), and a smaller ambient clock. The
          cadence bar keeps the color selection but drops the +/− marks.
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel width={560}>
          <Kicker>4 · HERO NUMERALS — REFINED</Kicker>
          <MiniDualHero gutter={74} renderTempo={refinedTempo((p) => <HeroNumeralsRefined {...p} />)} />
        </Panel>
        <Panel width={560}>
          <Kicker>5 · CADENCE BAR — REFINED</Kicker>
          <MiniDualHero gutter={78} renderTempo={refinedTempo((p) => <CadenceBarRefined {...p} />)} />
        </Panel>
        <Panel width={560}>
          <Kicker>6 · AMBIENT CLOCK — SMALLER</Kicker>
          <MiniDualHero gutter={84} renderTempo={refinedTempo((p) => <AmbientClockSmaller {...p} />)} />
        </Panel>
      </View>
    </Page>
  ),
}
