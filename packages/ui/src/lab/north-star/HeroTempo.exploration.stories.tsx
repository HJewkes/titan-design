// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Hero Tempo` — DESIGN EXPLORATION (not shipped).
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
import { View, Text } from 'react-native'
import { DualVelocityStrip, LiveAuraFrame } from '../../components'
import type { TempoLivePhase } from '../../components/custom/Workout/TempoDisplay'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors, primitiveRamps } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'
import { roundTempo } from '../../utils/workout-format'

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
  title: 'Lab/North Star/Hero Tempo',
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
