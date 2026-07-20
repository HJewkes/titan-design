// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
//
// LAB EXPLORATION — Session Rail Format & its relationship to the live panel.
//
// The design question: the big live panel (a per-REP VelocityStrip "hero") is really the
// EXPANDED view of the current set, while the rail's exercise row is the COLLAPSED view of
// that same set (a per-SET SetStrip). These stories prototype rail formats that make that
// rail <-> live-panel relationship legible — a shared bar vocabulary across scales, a literal
// "unfurl", a zoom ladder, a docked active header, and the phone-vs-wall tradeoff.
//
// NOT shipped components — lab-only mocks + real primitives composed to react to. Neutral
// surface treatment on purpose (format & relationship, not surface styling).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode } from 'react'
import { View, Text } from 'react-native'
import {
  SessionRail,
  SetStrip,
  VelocityStrip,
  SetsRepsLoad,
  MetricTiles,
} from '../../components'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { dashboardFixture, deriveRailExercises } from './fixtures'

const t = getSemanticColors('dark')

// The "tie" accent — a single cyan used wherever two elements are the SAME set data at
// different scales. Illustrative exploration accent (brand-secondary), not a new token.
const LINK = t['brand-secondary']
const LINK_WASH = 'rgba(48, 123, 155, 0.18)'
const FUNNEL = 'rgba(48, 123, 155, 0.16)'

const HEAD = '"Space Grotesk", sans-serif'

// --- Shared fixture-derived content ------------------------------------------
const MODEL = dashboardFixture
const RAIL = deriveRailExercises(MODEL)
const ACTIVE = RAIL[0] // Cable Chest Press — the live exercise
const ACTIVE_SET = ACTIVE.setStates[2] // the { status:'active', velocities: liveVels } bar
const LIVE_VELS = MODEL.live.repVelocities // same array the hero blows up
const TARGET_REPS = 8
const METRICS = [
  { label: 'Volume', value: '76%' },
  { label: 'Load', value: '7.3k' },
  { label: 'Fatigue', value: 'MOD', valueColor: t['status-warning'] },
]

// --- Small shared lab atoms ---------------------------------------------------

/** The option label + one-line rationale banner across the top of each story. */
function SrfBanner({ title, blurb }: { title: string; blurb: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: t['border-subtle'],
        backgroundColor: t['background-base'],
        gap: 3,
      }}
    >
      <Text style={{ color: t['text-primary'], fontSize: 15, fontWeight: '700', fontFamily: HEAD }}>
        {title}
      </Text>
      <Text style={{ color: t['text-secondary'], fontSize: 12, lineHeight: 16 }}>{blurb}</Text>
    </View>
  )
}

/** A tiny uppercase caption chip used to annotate the mocks on-screen. */
function SrfTag({ text, color = t['text-tertiary'] }: { text: string; color?: string }) {
  return (
    <Text style={{ color, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>
      {text.toUpperCase()}
    </Text>
  )
}

/** The live hero panel: exercise name + targets over the per-rep VelocityStrip hero. */
function SrfHero({
  height = 280,
  tie = false,
  headingSlot,
}: {
  height?: number
  tie?: boolean
  headingSlot?: ReactNode
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 22,
        gap: 14,
        backgroundColor: t['surface-base'],
        borderWidth: tie ? 2 : 0,
        borderColor: LINK,
      }}
    >
      {headingSlot ?? (
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Text style={{ color: t['text-primary'], fontSize: 26, fontWeight: '700', fontFamily: HEAD }}>
            {ACTIVE.name}
          </Text>
          <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={20} />
        </View>
      )}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <VelocityStrip
          variant="hero"
          velocities={LIVE_VELS}
          targetReps={TARGET_REPS}
          liveRepIndex={LIVE_VELS.length - 1}
          height={height}
          scale="peak"
        />
      </View>
    </View>
  )
}

/** The whole-story frame — a fixed-height dark wall with the banner + a rail|stage row. */
function SrfFrame({
  title,
  blurb,
  children,
}: {
  title: string
  blurb: string
  children: ReactNode
}) {
  return (
    <View style={{ height: 820, backgroundColor: t['background-base'], flexDirection: 'column' }}>
      <SrfBanner title={title} blurb={blurb} />
      <View style={{ flex: 1, flexDirection: 'row' }}>{children}</View>
    </View>
  )
}

// =============================================================================
// Option A — Shared Bar Language (Echo)
// The real rail, unchanged. The hero's HEADER re-shows the active set's collapsed
// SetStrip bar (the exact bar living in the rail's chest-press row), then blows it up
// into per-rep bars below. Same motif, twice — no layout surgery.
// =============================================================================

function SrfEchoHeroHeading() {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ color: t['text-primary'], fontSize: 26, fontWeight: '700', fontFamily: HEAD }}>
          {ACTIVE.name}
        </Text>
        <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={20} />
      </View>
      {/* The echo: the SAME collapsed strip that sits in the rail row, pinned atop the hero. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: LINK,
          backgroundColor: LINK_WASH,
        }}
      >
        <SrfTag text="collapsed in rail" color={LINK} />
        <View style={{ flex: 1 }}>
          <SetStrip sets={ACTIVE.setStates} height={12} />
        </View>
        <Text style={{ color: LINK, fontSize: 16, fontWeight: '800' }}>{'↓'}</Text>
        <SrfTag text="expanded below" color={LINK} />
      </View>
    </View>
  )
}

export const OptionAEcho: Story = {
  render: () => (
    <SrfFrame
      title="A · Shared bar language (echo)"
      blurb="Rail is unchanged. The hero's header re-shows the active set's collapsed SetStrip — the exact bar in the rail's Chest Press row — then blows that one bar up into per-rep bars. Same motif at two scales; the cyan echo band is the bridge."
    >
      <SessionRail
        title={MODEL.session.title}
        exercises={RAIL}
        setsDone={2.75}
        elapsedMs={18 * 60_000}
        budgetMs={45 * 60_000}
        metrics={METRICS}
        width={272}
      />
      <SrfHero height={240} headingSlot={<SrfEchoHeroHeading />} />
    </SrfFrame>
  ),
}

// =============================================================================
// Option B — Unfurl (connector)
// The active exercise is docked at the stage top as its collapsed bar, then a cyan
// FUNNEL widens down into the hero — the thin bar literally opening into per-rep bars.
// =============================================================================

export const OptionBUnfurl: Story = {
  render: () => (
    <SrfFrame
      title="B · Unfurl (connector)"
      blurb="The active set's collapsed bar sits at the top of the stage; a cyan funnel widens it down into the full per-rep hero. Makes the collapsed→expanded move spatial: one thin bar unfurling into the wall hero."
    >
      <SessionRail
        title={MODEL.session.title}
        exercises={RAIL}
        setsDone={2.75}
        elapsedMs={18 * 60_000}
        budgetMs={45 * 60_000}
        metrics={METRICS}
        width={272}
      />
      <View style={{ flex: 1, alignItems: 'center', padding: 24, backgroundColor: t['surface-base'] }}>
        {/* collapsed active bar (the apex of the funnel) */}
        <View style={{ width: 260, gap: 6, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ color: t['text-primary'], fontSize: 15, fontWeight: '700', fontFamily: HEAD }}>
              {ACTIVE.name}
            </Text>
            <SrfTag text="active set" color={LINK} />
          </View>
          <View style={{ width: '100%' }}>
            <SetStrip sets={[ACTIVE_SET]} height={14} />
          </View>
        </View>
        {/* funnel: apex up (at the bar), wide base down (at the hero) */}
        <View
          style={{
            width: 0,
            height: 0,
            marginTop: 2,
            borderLeftWidth: 300,
            borderRightWidth: 300,
            borderBottomWidth: 64,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: FUNNEL,
          }}
        />
        {/* the hero — the unfurled bar */}
        <View style={{ width: 620, maxWidth: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <SrfTag text="live · expanded per rep" color={LINK} />
            <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={16} />
          </View>
          <VelocityStrip
            variant="hero"
            velocities={LIVE_VELS}
            targetReps={TARGET_REPS}
            liveRepIndex={LIVE_VELS.length - 1}
            height={300}
            scale="peak"
          />
        </View>
      </View>
    </SrfFrame>
  ),
}

// =============================================================================
// Option C — Zoom ladder (filmstrip)
// Three labeled cells at increasing scale: rail row → isolated active set → hero.
// Progressive disclosure made literal: the hero IS the rail row, zoomed.
// =============================================================================

function SrfLadderCell({
  tag,
  caption,
  children,
}: {
  tag: string
  caption: string
  children: ReactNode
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: t['border-subtle'],
        borderRadius: 12,
        backgroundColor: t['surface-elevated'],
      }}
    >
      <SrfTag text={tag} color={LINK} />
      <View style={{ flex: 1, justifyContent: 'center' }}>{children}</View>
      <Text style={{ color: t['text-tertiary'], fontSize: 11, lineHeight: 15 }}>{caption}</Text>
    </View>
  )
}

function SrfArrow() {
  return (
    <View style={{ justifyContent: 'center', paddingHorizontal: 4 }}>
      <Text style={{ color: LINK, fontSize: 22, fontWeight: '800' }}>{'→'}</Text>
    </View>
  )
}

export const OptionCZoomLadder: Story = {
  render: () => (
    <SrfFrame
      title="C · Zoom ladder (filmstrip)"
      blurb="Three scales of the SAME set, left to right: the collapsed rail row, the active set isolated & enlarged, then the full hero. Teaches the relationship as a zoom — the wall hero is the rail row magnified."
    >
      <SessionRail
        title={MODEL.session.title}
        exercises={RAIL}
        setsDone={2.75}
        elapsedMs={18 * 60_000}
        budgetMs={45 * 60_000}
        metrics={METRICS}
        width={252}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: 24,
          gap: 4,
          backgroundColor: t['surface-base'],
        }}
      >
        <SrfLadderCell
          tag="1 · rail row"
          caption="Collapsed: one thin multi-color bar per set. This is what the rail lists."
        >
          <View style={{ gap: 6 }}>
            <Text style={{ color: t['text-primary'], fontSize: 13, fontWeight: '700', fontFamily: HEAD }}>
              {ACTIVE.name}
            </Text>
            <SetStrip sets={ACTIVE.setStates} height={8} />
          </View>
        </SrfLadderCell>
        <SrfArrow />
        <SrfLadderCell
          tag="2 · active set"
          caption="The one active set, pulled out and enlarged — reps now read as heights."
        >
          <VelocityStrip
            velocities={LIVE_VELS}
            variant="expanded"
            showNumbers={false}
            showInfo={false}
            height={96}
            scale="peak"
          />
        </SrfLadderCell>
        <SrfArrow />
        <SrfLadderCell
          tag="3 · live hero"
          caption="Full wall hero: per-rep bars, values, best-line, pending stubs. The set, blown up."
        >
          <VelocityStrip
            variant="hero"
            velocities={LIVE_VELS}
            targetReps={TARGET_REPS}
            liveRepIndex={LIVE_VELS.length - 1}
            height={300}
            scale="peak"
          />
        </SrfLadderCell>
      </View>
    </SrfFrame>
  ),
}

// =============================================================================
// Option D — Docked active header (spine)
// The active exercise is LIFTED OUT of the rail list and docked flush atop the hero as
// its heading — hero + heading read as one object. The rail becomes a clean done/next
// queue. Current-vs-upcoming reads instantly; the hero visibly belongs to one row.
// =============================================================================

function SrfQueueRow({
  name,
  meta,
  strip,
  dim = false,
}: {
  name: string
  meta: string
  strip: ReactNode
  dim?: boolean
}) {
  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 7,
        opacity: dim ? 0.5 : 1,
        borderBottomWidth: 1,
        borderBottomColor: t['border-subtle'],
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ color: t['text-primary'], fontSize: 13, fontWeight: '700', fontFamily: HEAD }}>
          {name}
        </Text>
        <Text style={{ color: t['text-secondary'], fontSize: 11 }}>{meta}</Text>
      </View>
      {strip}
    </View>
  )
}

export const OptionDDockedActive: Story = {
  render: () => {
    const [, incline, cableFly] = RAIL
    return (
      <SrfFrame
        title="D · Docked active header (spine)"
        blurb="The active exercise is lifted out of the rail and docked flush atop the hero as its heading — so hero + heading are one object. The rail is left as a clean done/next queue. The current exercise visibly lives on the stage, not in the list."
      >
        {/* rail = queue only (done count + upcoming); active exercise is NOT here */}
        <View style={{ width: 272, backgroundColor: t['surface-elevated'] }}>
          <View style={{ padding: 12, gap: 10, backgroundColor: t['background-base'] }}>
            <Text style={{ color: t['text-primary'], fontSize: 16, fontWeight: '700', fontFamily: HEAD }}>
              {MODEL.session.title}
            </Text>
            <MetricTiles metrics={METRICS} />
            <SrfTag text="2 of 4 sets · exercise 1 of 3" />
          </View>
          <SrfQueueRow
            name={ACTIVE.name}
            meta="live →"
            strip={<SrfTag text="on stage →" color={LINK} />}
          />
          <SrfQueueRow
            name={incline.name}
            meta="3×10 · 55 lb"
            dim
            strip={<SetStrip sets={incline.setStates} height={6} />}
          />
          <SrfQueueRow
            name={cableFly.name}
            meta="3×12 · 30 lb"
            dim
            strip={<SetStrip sets={cableFly.setStates} height={6} />}
          />
        </View>
        {/* stage: the docked heading (one object with the hero) */}
        <View style={{ flex: 1, backgroundColor: t['surface-base'] }}>
          <View
            style={{
              padding: 22,
              paddingBottom: 14,
              gap: 12,
              borderLeftWidth: 3,
              borderLeftColor: LINK,
              backgroundColor: t['surface-elevated'],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                <SrfTag text="now" color={LINK} />
                <Text style={{ color: t['text-primary'], fontSize: 26, fontWeight: '700', fontFamily: HEAD }}>
                  {ACTIVE.name}
                </Text>
              </View>
              <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={20} />
            </View>
            {/* the docked heading carries the collapsed per-set strip — done/active/todo */}
            <SetStrip sets={ACTIVE.setStates} height={10} />
          </View>
          <View style={{ flex: 1, padding: 22, borderLeftWidth: 3, borderLeftColor: LINK }}>
            <VelocityStrip
              variant="hero"
              velocities={LIVE_VELS}
              targetReps={TARGET_REPS}
              liveRepIndex={LIVE_VELS.length - 1}
              height={300}
              scale="peak"
            />
          </View>
        </View>
      </SrfFrame>
    )
  },
}

// =============================================================================
// Option E — Phone vs Wall parity
// The SAME active exercise, two responsive treatments side by side. Phone: the rail row
// expands IN PLACE into per-set rows (no hero). Wall: the rail stays collapsed and the
// set blows up as the hero. Directly frames the PO's phone-vs-wall tradeoff.
// =============================================================================

function SrfExpandedSetRow({
  n,
  vels,
  state,
}: {
  n: number
  vels?: number[]
  state: 'done' | 'live' | 'todo'
}) {
  const label =
    state === 'todo' ? '— · — lb' : `${vels?.length ?? 0} reps · 140 lb`
  const tint =
    state === 'live' ? LINK : state === 'done' ? t['text-secondary'] : t['text-tertiary']
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        opacity: state === 'todo' ? 0.55 : 1,
        borderBottomWidth: 1,
        borderBottomColor: t['border-subtle'],
        backgroundColor: state === 'live' ? LINK_WASH : 'transparent',
      }}
    >
      <Text style={{ color: tint, fontSize: 12, fontWeight: '800', width: 34 }}>SET {n}</Text>
      <View style={{ flex: 1 }}>
        {vels && vels.length > 0 ? (
          <VelocityStrip velocities={vels} variant="mini" />
        ) : (
          <View style={{ height: 3, borderRadius: 2, backgroundColor: t['surface-raised'] }} />
        )}
      </View>
      <Text style={{ color: tint, fontSize: 11, width: 92, textAlign: 'right' }}>{label}</Text>
    </View>
  )
}

export const OptionEPhoneWallParity: Story = {
  render: () => (
    <SrfFrame
      title="E · Phone vs wall parity"
      blurb="Same set, two devices. Phone (left): the active rail row expands in place into per-set rows — the expanded set view replaces the hero. Wall (right): the rail stays collapsed and the set blows up as the hero. One shared model, two scales."
    >
      {/* PHONE — expanded set view in place, no hero */}
      <View style={{ width: 360, backgroundColor: t['surface-base'], borderRightWidth: 1, borderRightColor: t['border-subtle'] }}>
        <View style={{ padding: 14, gap: 10, backgroundColor: t['background-base'] }}>
          <SrfTag text="phone · no hero" color={LINK} />
          <Text style={{ color: t['text-primary'], fontSize: 18, fontWeight: '700', fontFamily: HEAD }}>
            {ACTIVE.name}
          </Text>
          <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={18} />
        </View>
        <SrfExpandedSetRow n={1} vels={MODEL.session.completedSets[0].reps} state="done" />
        <SrfExpandedSetRow n={2} vels={MODEL.session.completedSets[1].reps} state="done" />
        <SrfExpandedSetRow n={3} vels={LIVE_VELS} state="live" />
        <SrfExpandedSetRow n={4} state="todo" />
        <View style={{ padding: 12 }}>
          <SrfTag text="the set, expanded in place" />
        </View>
      </View>
      {/* WALL — collapsed rail + hero */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <SessionRail
          title={MODEL.session.title}
          exercises={RAIL}
          setsDone={2.75}
          elapsedMs={18 * 60_000}
          budgetMs={45 * 60_000}
          metrics={METRICS}
          width={240}
        />
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
            <SrfTag text="wall · hero" color={LINK} />
          </View>
          <SrfHero height={260} />
        </View>
      </View>
    </SrfFrame>
  ),
}

// --- Meta ---------------------------------------------------------------------

const meta: Meta = {
  title: 'Lab/North Star/Session Rail Format',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Lab exploration of session-rail FORMATS that surface the rail <-> live-panel ' +
          'relationship: the live hero is the current set EXPANDED; the rail row is that set ' +
          'COLLAPSED. Five options — echo, unfurl, zoom ladder, docked header, phone/wall parity.',
      },
    },
  },
}

export default meta
type Story = StoryObj
