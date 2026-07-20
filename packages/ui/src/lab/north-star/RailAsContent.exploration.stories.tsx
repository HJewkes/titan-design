// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
//
// LAB EXPLORATION — Rail As Content (not chrome).
//
// The problem: the session rail currently reads as a SECOND NAV COLUMN — its header is a
// `<Surface level="background">` (the darkest bezel/frame tone) and the whole panel is
// butted against the left nav, so it registers as shell chrome, not workout content.
//
// The decision: the session rail is workout CONTENT that lives INSIDE the recessed well,
// alongside the live set — not part of the shell frame. These stories prototype that shift.
// Every treatment here:
//   (a) retones the rail onto the LIT content plane (`surface-base`, #252321) — the in-well
//       plane — instead of the bezel/background frame tone, so it sits IN the well with the
//       live set rather than framing it;
//   (b) expresses the heading's hierarchy via TYPE + hairline + recessed `insetWell` tiles,
//       never by borrowing shell tone;
//   (c) keeps the live set the STAR — it stays on the brightest, most-lifted plane
//       (`paperSheet(surface-overlay)`); the rail is the quieter supporting glance.
//
// NOT shipped components — lab-only mocks + real primitives (SessionRail / SetStrip /
// VelocityStrip / SetsRepsLoad) composed to react to. The bezel/nav chrome is mocked inline
// to make the frame-vs-well relationship legible. Nothing here edits a shared component.
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import { View, Text } from 'react-native'
import {
  SessionRail,
  SetStrip,
  VelocityStrip,
  SetsRepsLoad,
} from '../../components'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { paperSheet, insetWell, debossLabel } from './surfaces'
import { dashboardFixture, deriveRailExercises } from './fixtures'

const t = getSemanticColors('dark')
const HEAD = '"Space Grotesk", sans-serif'

// The "you are here" / live accent — a single cyan (brand-secondary) marking the ONE thing
// happening now. Illustrative exploration accent, not a new token.
const LIVE = t['brand-secondary']
const LIVE_WASH = 'rgba(48, 123, 155, 0.16)'

// --- Fixture-derived content --------------------------------------------------
const MODEL = dashboardFixture
const RAIL = deriveRailExercises(MODEL)
const ACTIVE = RAIL[0] // Cable Chest Press — the live exercise (2 sets done, set 3 active)
const LIVE_VELS = MODEL.live.repVelocities // [0.52 … 0.405] — the declining live strip
const TARGET_REPS = 8
const METRICS = [
  { label: 'Volume', value: '76%', tint: t['text-primary'] },
  { label: 'Load', value: '7.3k', tint: t['text-primary'] },
  { label: 'Fatigue', value: 'MOD', tint: t['status-warning'] },
]

// =============================================================================
// Shared lab atoms
// =============================================================================

/** The option label + one-line rationale banner across the top of each story. */
function Banner({ title, blurb }: { title: string; blurb: string }) {
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

/** An engraved section eyebrow — debossed into the lit plane (pressed-in, not a chrome bar). */
function Eyebrow({ children, color = t['text-tertiary'] }: { children: string; color?: string }) {
  return (
    <Text
      style={{
        color,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
        fontFamily: HEAD,
        ...debossLabel,
      }}
    >
      {children.toUpperCase()}
    </Text>
  )
}

/** A tiny uppercase caption chip for on-screen annotation. */
function Tag({ text, color = t['text-tertiary'] }: { text: string; color?: string }) {
  return (
    <Text style={{ color, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>
      {text.toUpperCase()}
    </Text>
  )
}

/** A self-normalizing alpha-white hairline — the content separator (never a shell edge). */
function Hairline({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: t['border-subtle'] }, style]} />
}

/** A stat cell recessed INTO the lit plane via `insetWell` — hierarchy by depth, not tone. */
function StatWell({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View
      style={[
        { flex: 1, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, gap: 3 },
        insetWell(t['surface-input']),
      ]}
    >
      <Text style={{ color: t['text-tertiary'], fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <Text
        style={{ color: tint ?? t['text-primary'], fontSize: 16, fontWeight: '700', fontFamily: HEAD }}
      >
        {value}
      </Text>
    </View>
  )
}

function StatWellRow() {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {METRICS.map((m) => (
        <StatWell key={m.label} label={m.label} value={m.value} tint={m.tint} />
      ))}
    </View>
  )
}

/**
 * One exercise as CONTENT on the lit plane: name + prescription + per-set strip. The active
 * exercise carries the "you are here" cyan marker + a faint wash (a highlight, not a plane).
 */
function ExerciseRow({
  ex,
  state,
  stripHeight = 7,
}: {
  ex: (typeof RAIL)[number]
  state: 'done' | 'active' | 'upcoming'
  stripHeight?: number
}) {
  return (
    <View
      style={{
        paddingVertical: 11,
        paddingHorizontal: 14,
        gap: 7,
        opacity: state === 'upcoming' ? 0.5 : 1,
        backgroundColor: state === 'active' ? LIVE_WASH : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {state === 'active' && (
          <View
            style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: LIVE }}
          />
        )}
        <Text
          style={{ color: t['text-primary'], fontSize: 14, fontWeight: '700', fontFamily: HEAD }}
        >
          {ex.name}
        </Text>
        <View style={{ flex: 1 }} />
        <SetsRepsLoad
          sets={ex.summary.sets}
          reps={ex.summary.reps}
          load={ex.summary.weight}
          unit="lb"
          fontSize={11}
        />
      </View>
      {ex.setStates.length > 0 && <SetStrip sets={ex.setStates} height={stripHeight} />}
    </View>
  )
}

// --- The chrome frame: bezel + top bar + left nav sliver + a RECESSED well ----

/** A stack of nav-icon glyphs — pure chrome, so the well's content reads as "not this". */
function NavSliver() {
  return (
    <View
      style={{
        width: 52,
        backgroundColor: t['background-base'],
        borderRightWidth: 1,
        borderRightColor: t['border-subtle'],
        alignItems: 'center',
        paddingTop: 16,
        gap: 22,
      }}
    >
      {['◆', '≣', '⟳', '◷', '⚙'].map((g, i) => (
        <Text key={i} style={{ color: i === 1 ? t['text-secondary'] : t['text-tertiary'], fontSize: 16 }}>
          {g}
        </Text>
      ))}
    </View>
  )
}

/** The top chrome bar — bezel tone, hairline base. */
function TopChrome() {
  return (
    <View
      style={{
        height: 40,
        backgroundColor: t['background-base'],
        borderBottomWidth: 1,
        borderBottomColor: t['border-subtle'],
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      <View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: t['status-live'] }} />
      <Text style={{ color: t['text-secondary'], fontSize: 12, fontWeight: '700', fontFamily: HEAD }}>
        Live Session
      </Text>
    </View>
  )
}

/**
 * The full dashboard chrome: a warm near-black bezel (top bar + nav sliver) with the main
 * content sunk into a WELL — the lit `surface-base` plane pressed BELOW the frame by an inner
 * shadow on its top + left edges. Everything passed as `children` lives INSIDE that well.
 */
function Bezel({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: t['background-base'] }}>
      <TopChrome />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <NavSliver />
        <View
          style={
            {
              flex: 1,
              flexDirection: 'row',
              backgroundColor: t['surface-base'],
              boxShadow: 'inset 0 4px 11px rgba(0,0,0,0.55), inset 4px 0 11px rgba(0,0,0,0.40)',
            } as unknown as ViewStyle
          }
        >
          {children}
        </View>
      </View>
    </View>
  )
}

/** The whole-story frame — banner over a fixed-height dark wall holding a {@link Bezel}. */
function Frame({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <View style={{ height: 860, backgroundColor: '#100D0A', flexDirection: 'column' }}>
      <Banner title={title} blurb={blurb} />
      <View style={{ flex: 1 }}>
        <Bezel>{children}</Bezel>
      </View>
    </View>
  )
}

// --- The live set: the STAR (brightest, most-lifted plane) --------------------

/**
 * The dominant live hero — the current set blown up to per-rep bars on the brightest,
 * most-lifted plane (`paperSheet(surface-overlay)`). Big type + a live readout row. This is
 * the star: the rail must always read quieter than this.
 */
function LiveHero({ height = 300 }: { height?: number }) {
  return (
    <View
      style={[
        { flex: 1, margin: 16, borderRadius: 18, padding: 26, gap: 18, justifyContent: 'flex-end' },
        paperSheet(t['surface-overlay']),
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: t['status-live'] }} />
          <Text style={{ color: t['text-primary'], fontSize: 32, fontWeight: '700', fontFamily: HEAD }}>
            {ACTIVE.name}
          </Text>
        </View>
        <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={22} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 28 }}>
        <View style={{ gap: 2 }}>
          <Eyebrow>velocity</Eyebrow>
          <Text style={{ color: t['text-primary'], fontSize: 40, fontWeight: '700', fontFamily: HEAD }}>
            0.41
            <Text style={{ fontSize: 16, color: t['text-secondary'] }}> m/s</Text>
          </Text>
        </View>
        <View style={{ gap: 2 }}>
          <Eyebrow>vel loss</Eyebrow>
          <Text style={{ color: t['status-warning'], fontSize: 40, fontWeight: '700', fontFamily: HEAD }}>
            22
            <Text style={{ fontSize: 16, color: t['text-secondary'] }}> %</Text>
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', minHeight: height }}>
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

/**
 * A QUIETER live glance — the live set still present on the lit plane (proving the rail is
 * in-well beside content), but muted so the heading treatment stays the subject.
 */
function LiveGhost() {
  return (
    <View style={{ flex: 1, padding: 26, gap: 14, justifyContent: 'flex-end', opacity: 0.9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Eyebrow color={t['text-secondary']}>live · cable chest press</Eyebrow>
        <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={16} />
      </View>
      <VelocityStrip
        variant="hero"
        velocities={LIVE_VELS}
        targetReps={TARGET_REPS}
        liveRepIndex={LIVE_VELS.length - 1}
        height={230}
        scale="peak"
      />
    </View>
  )
}

// =============================================================================
// Overview — before / after
// The current SessionRail (chrome, abutting the nav) beside the recommended content rail
// (lit plane, in the well). One glance at the core shift.
// =============================================================================

// The fixture's current exercise is Cable Chest Press (row 0, the one with the active set);
// the two accessories are upcoming. Exercise-level state drives the "you are here" highlight.
const RAIL_STATE = ['active', 'upcoming', 'upcoming'] as const

// The progression stories (C/D) prepend a COMPLETED session opener so the spine/stepper can
// show the full done → active → upcoming node vocabulary — the fixture alone has no finished
// exercise (its active exercise is #1). Illustrative fixture extension, lab-only.
const PROG_RAIL = [
  {
    id: 'opener',
    name: 'Band Pull-Apart',
    summary: { sets: 2, reps: 15, weight: '—', unit: 'lbs' },
    setStates: [
      { status: 'done', velocities: [0.9, 0.88, 0.87, 0.85] },
      { status: 'done', velocities: [0.86, 0.84, 0.83, 0.8] },
    ],
  } as (typeof RAIL)[number],
  ...RAIL,
]
const PROG_STATE = ['done', 'active', 'upcoming', 'upcoming'] as const

/** The recommended content rail (Treatment A body) — reused in the Overview "after". */
function ContentRail({ width = 300 }: { width?: number }) {
  return (
    <View style={{ width, paddingTop: 18, gap: 14 }}>
      <View style={{ paddingHorizontal: 14, gap: 12 }}>
        <Text style={{ color: t['text-primary'], fontSize: 18, fontWeight: '700', fontFamily: HEAD }}>
          {MODEL.session.title}
        </Text>
        <StatWellRow />
      </View>
      <Hairline style={{ marginHorizontal: 14 }} />
      <View>
        {RAIL.map((ex, i) => (
          <View key={ex.id}>
            <ExerciseRow ex={ex} state={RAIL_STATE[i]} />
            {i < RAIL.length - 1 && <Hairline style={{ marginHorizontal: 14 }} />}
          </View>
        ))}
      </View>
    </View>
  )
}

export const Overview: Story = {
  render: () => (
    <View style={{ height: 900, backgroundColor: '#100D0A' }}>
      <Banner
        title="Rail as content — before / after"
        blurb="Left: today's SessionRail — its header is the darkest bezel tone and the panel abuts the nav, so it reads as a SECOND NAV COLUMN. Right: the rail retoned onto the lit well plane (surface-base), heading expressed by type + hairline + recessed insetWell tiles. Same data; content, not chrome."
      />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* BEFORE */}
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: t['border-subtle'] }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: '#100D0A' }}>
            <Tag text="before · reads as chrome" color={t['status-warning']} />
          </View>
          <Bezel>
            <SessionRail
              title={MODEL.session.title}
              exercises={RAIL}
              setsDone={2.75}
              elapsedMs={18 * 60_000}
              budgetMs={45 * 60_000}
              metrics={METRICS.map((m) => ({ label: m.label, value: m.value, valueColor: m.tint }))}
              width={300}
            />
            <LiveGhost />
          </Bezel>
        </View>
        {/* AFTER */}
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: '#100D0A' }}>
            <Tag text="after · content in the well" color={t['status-live']} />
          </View>
          <Bezel>
            <ContentRail width={300} />
            <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
            <LiveGhost />
          </Bezel>
        </View>
      </View>
    </View>
  ),
}

// =============================================================================
// A — Heading as a content section header
// The heading is plain content ON the lit plane: session title (type) + Volume/Load/Fatigue
// as small recessed insetWell tiles + a hairline. No plane of its own. The exercise list
// flows below as content, hairline-separated, "you are here" on the active row.
// =============================================================================

export const HeadingSectionHeader: Story = {
  render: () => (
    <Frame
      title="A · Heading as a content section header"
      blurb="The heading is plain content on the lit well plane — title as type, Volume/Load/Fatigue as small recessed insetWell tiles, a hairline divider. No plane of its own, no shell tone. The exercise list flows straight below as content; the active row carries the cyan 'you are here' marker + wash."
    >
      <ContentRail width={312} />
      <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
      <LiveGhost />
    </Frame>
  ),
}

// =============================================================================
// B — Heading as a lifted card
// The heading rides a slightly RAISED paperSheet card floating inside the well (rim + contact
// shadow), the exercise list recessed BELOW it in an insetWell trough. Depth ranks the
// heading above the list without borrowing shell tone.
// =============================================================================

export const HeadingLiftedCard: Story = {
  render: () => (
    <Frame
      title="B · Heading as a lifted card"
      blurb="The session summary rides a raised paperSheet card floating in the well (top rim-light + contact shadow); the exercise list is recessed below it in an insetWell trough. Hierarchy is expressed by DEPTH — heading lifted, list sunk — never by the dark shell tone. Still one continuous content column in the well."
    >
      <View style={{ width: 312, padding: 14, gap: 12 }}>
        {/* lifted heading card */}
        <View style={[{ padding: 14, borderRadius: 14, gap: 12 }, paperSheet(t['surface-raised'])]}>
          <Text style={{ color: t['text-primary'], fontSize: 18, fontWeight: '700', fontFamily: HEAD }}>
            {MODEL.session.title}
          </Text>
          <StatWellRow />
        </View>
        {/* recessed list trough */}
        <View
          style={[
            { flex: 1, borderRadius: 14, paddingVertical: 4, overflow: 'hidden' },
            insetWell(t['surface-input']),
          ]}
        >
          {RAIL.map((ex, i) => (
            <View key={ex.id}>
              <ExerciseRow ex={ex} state={RAIL_STATE[i]} />
              {i < RAIL.length - 1 && <Hairline style={{ marginHorizontal: 14 }} />}
            </View>
          ))}
        </View>
      </View>
      <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
      <LiveGhost />
    </Frame>
  ),
}

// =============================================================================
// C — Progression spine (you-are-here)
// A vertical connective spine down the exercise list: filled nodes = done, a glowing cyan
// node = the current exercise, hollow = upcoming. The set-strip pips + the spine node make
// "where am I in the session" readable at a glance, as content.
// =============================================================================

function SpineGutter({ state, first, last }: { state: 'done' | 'active' | 'upcoming'; first: boolean; last: boolean }) {
  const doneLine = t['text-secondary']
  const dim = t['border-subtle']
  return (
    <View style={{ width: 20, alignItems: 'center' }}>
      <View
        style={{ width: 2, height: 15, backgroundColor: first ? 'transparent' : state === 'upcoming' ? dim : doneLine }}
      />
      <View
        style={
          {
            width: state === 'active' ? 14 : 10,
            height: state === 'active' ? 14 : 10,
            borderRadius: 99,
            backgroundColor: state === 'active' ? LIVE : state === 'done' ? doneLine : 'transparent',
            borderWidth: state === 'upcoming' ? 2 : 0,
            borderColor: dim,
            boxShadow: state === 'active' ? `0 0 0 4px ${LIVE_WASH}` : undefined,
          } as unknown as ViewStyle
        }
      />
      <View style={{ flex: 1, width: 2, backgroundColor: last ? 'transparent' : state === 'done' ? doneLine : dim }} />
    </View>
  )
}

function SpineRow({
  ex,
  state,
  first,
  last,
}: {
  ex: (typeof RAIL)[number]
  state: 'done' | 'active' | 'upcoming'
  first: boolean
  last: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 14 }}>
      <SpineGutter state={state} first={first} last={last} />
      <View style={{ flex: 1, paddingVertical: 10, gap: 7, opacity: state === 'upcoming' ? 0.55 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{ color: t['text-primary'], fontSize: 14, fontWeight: '700', fontFamily: HEAD, flexShrink: 0 }}
          >
            {ex.name}
          </Text>
          {state === 'active' && (
            <Text
              numberOfLines={1}
              style={{ color: LIVE, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, flexShrink: 0 }}
            >
              SET 3 OF 4
            </Text>
          )}
          <View style={{ flex: 1 }} />
          <SetsRepsLoad sets={ex.summary.sets} reps={ex.summary.reps} load={ex.summary.weight} unit="lb" fontSize={11} />
        </View>
        {ex.setStates.length > 0 && <SetStrip sets={ex.setStates} height={7} />}
      </View>
    </View>
  )
}

export const ProgressionSpine: Story = {
  render: () => (
    <Frame
      title="C · Progression spine (you-are-here)"
      blurb="A vertical connective spine runs the exercise list: solid nodes + line = done, a glowing cyan node = the current exercise, hollow = upcoming. The spine + the per-set pips answer 'where am I in the session' at a glance — as content in the well, not a chrome rail."
    >
      <View style={{ width: 348, paddingTop: 18, gap: 14 }}>
        <View style={{ paddingHorizontal: 14, gap: 12 }}>
          <Text style={{ color: t['text-primary'], fontSize: 18, fontWeight: '700', fontFamily: HEAD }}>
            {MODEL.session.title}
          </Text>
          <StatWellRow />
        </View>
        <Hairline style={{ marginHorizontal: 14 }} />
        <View style={{ gap: 2 }}>
          {PROG_RAIL.map((ex, i) => (
            <SpineRow
              key={ex.id}
              ex={ex}
              state={PROG_STATE[i]}
              first={i === 0}
              last={i === PROG_RAIL.length - 1}
            />
          ))}
        </View>
      </View>
      <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
      <LiveGhost />
    </Frame>
  ),
}

// =============================================================================
// D — Stage stepper (compact progression header)
// A compact horizontal stage indicator sits under the title: one step per exercise (active
// filled), a "set N of M" readout, and a pace line. The list below is then just the queue —
// progression lives in a single glanceable strip rather than being inferred from the rows.
// =============================================================================

function StageStepper() {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {PROG_RAIL.map((ex, i) => {
          const state = PROG_STATE[i]
          return (
            <View key={ex.id} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={
                  {
                    width: state === 'active' ? 12 : 9,
                    height: state === 'active' ? 12 : 9,
                    borderRadius: 99,
                    backgroundColor: state === 'active' ? LIVE : state === 'done' ? t['text-secondary'] : 'transparent',
                    borderWidth: state === 'upcoming' ? 2 : 0,
                    borderColor: t['border-subtle'],
                    boxShadow: state === 'active' ? `0 0 0 4px ${LIVE_WASH}` : undefined,
                  } as unknown as ViewStyle
                }
              />
              {i < PROG_RAIL.length - 1 && (
                <View style={{ flex: 1, height: 2, backgroundColor: state === 'done' ? t['text-secondary'] : t['border-subtle'] }} />
              )}
            </View>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ color: LIVE, fontSize: 12, fontWeight: '800', fontFamily: HEAD }}>
          Cable Chest Press · Set 3 of 4
        </Text>
        <Text style={{ color: t['text-tertiary'], fontSize: 11 }}>18:04 / 45:00 · on pace</Text>
      </View>
    </View>
  )
}

export const StageStepper_: Story = {
  name: 'Stage Stepper',
  render: () => (
    <Frame
      title="D · Stage stepper (compact progression header)"
      blurb="Progression is lifted into ONE glanceable strip under the title: a step per exercise (active glowing), a 'Set 3 of 4' readout and a pace line — so 'how far along am I' reads instantly instead of being inferred from the rows. The list below is then simply the queue."
    >
      <View style={{ width: 320, paddingTop: 18, gap: 14 }}>
        <View style={{ paddingHorizontal: 14, gap: 12 }}>
          <Text style={{ color: t['text-primary'], fontSize: 18, fontWeight: '700', fontFamily: HEAD }}>
            {MODEL.session.title}
          </Text>
          <StageStepper />
          <StatWellRow />
        </View>
        <Hairline style={{ marginHorizontal: 14 }} />
        <View>
          {PROG_RAIL.map((ex, i) => (
            <View key={ex.id}>
              <ExerciseRow ex={ex} state={PROG_STATE[i]} />
              {i < PROG_RAIL.length - 1 && <Hairline style={{ marginHorizontal: 14 }} />}
            </View>
          ))}
        </View>
      </View>
      <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
      <LiveGhost />
    </Frame>
  ),
}

// =============================================================================
// E — Beside the live panel (weight balance)
// The content rail as a QUIET column beside the DOMINANT live hero. The hero is the brightest,
// most-lifted plane (paperSheet on surface-overlay), big type; the rail is flat surface-base,
// smaller type. Proves the rail became content without stealing the live set's priority.
// =============================================================================

export const BesideLivePanel: Story = {
  render: () => (
    <Frame
      title="E · Beside the live panel (weight balance)"
      blurb="The content rail (Treatment A) as a QUIET column beside the live hero. The hero owns the brightest, most-lifted plane (paperSheet on surface-overlay) with big type + a live readout; the rail is flat on surface-base with smaller type. The rail is content now — but the live set stays unmistakably the star."
    >
      <ContentRail width={300} />
      <View style={{ width: 1, backgroundColor: t['border-subtle'] }} />
      <LiveHero height={300} />
    </Frame>
  ),
}

// =============================================================================
// F — Merged active handoff (integration tweak)
// The rail's active row visibly HANDS OFF to the hero: the "you are here" node extends a cyan
// connector to the live panel, and the hero re-shows the active set's collapsed SetStrip as an
// echo. Progression context and live state are stitched together — live still dominant.
// =============================================================================

export const MergedActiveHandoff: Story = {
  render: () => (
    <Frame
      title="F · Merged active handoff (integration tweak)"
      blurb="The rail's active row visibly hands off to the hero: a cyan connector runs from its 'you are here' node into the live panel, and the hero re-shows the active set's collapsed SetStrip as an echo above the blown-up per-rep bars. Rail progression + live state read as one thread — the hero still dominant."
    >
      {/* rail with an emphasized active row that connects rightward */}
      <View style={{ width: 300, paddingTop: 18, gap: 14 }}>
        <View style={{ paddingHorizontal: 14, gap: 12 }}>
          <Text style={{ color: t['text-primary'], fontSize: 18, fontWeight: '700', fontFamily: HEAD }}>
            {MODEL.session.title}
          </Text>
          <StatWellRow />
        </View>
        <Hairline style={{ marginHorizontal: 14 }} />
        <View>
          {RAIL.map((ex, i) => {
            const state = RAIL_STATE[i]
            return (
              <View
                key={ex.id}
                style={{
                  borderTopRightRadius: state === 'active' ? 0 : 0,
                  // active row bleeds a cyan wash to its right edge → the handoff origin
                  ...(state === 'active'
                    ? { borderRightWidth: 2, borderRightColor: LIVE }
                    : {}),
                }}
              >
                <ExerciseRow ex={ex} state={state} />
                {i < RAIL.length - 1 && <Hairline style={{ marginHorizontal: 14 }} />}
              </View>
            )
          })}
        </View>
      </View>
      {/* connector — top-aligned so it runs from the active row into the hero's echo strip */}
      <View style={{ width: 44, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 126 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <View style={{ flex: 1, height: 2, backgroundColor: LIVE }} />
          <Text style={{ color: LIVE, fontSize: 16, fontWeight: '800', marginLeft: -2 }}>→</Text>
        </View>
      </View>
      {/* hero with the echo strip */}
      <View
        style={[
          { flex: 1, margin: 16, marginLeft: 0, borderRadius: 18, padding: 26, gap: 16, justifyContent: 'flex-end' },
          paperSheet(t['surface-overlay']),
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: t['status-live'] }} />
            <Text style={{ color: t['text-primary'], fontSize: 30, fontWeight: '700', fontFamily: HEAD }}>
              {ACTIVE.name}
            </Text>
          </View>
          <SetsRepsLoad sets={4} reps={8} load={140} unit="lb" fontSize={20} />
        </View>
        {/* the echo — the SAME collapsed per-set strip that lives in the rail's active row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: LIVE,
            backgroundColor: LIVE_WASH,
          }}
        >
          <Tag text="from rail" color={LIVE} />
          <View style={{ flex: 1 }}>
            <SetStrip sets={ACTIVE.setStates} height={11} />
          </View>
          <Text style={{ color: LIVE, fontSize: 15, fontWeight: '800' }}>↓</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end', minHeight: 260 }}>
          <VelocityStrip
            variant="hero"
            velocities={LIVE_VELS}
            targetReps={TARGET_REPS}
            liveRepIndex={LIVE_VELS.length - 1}
            height={260}
            scale="peak"
          />
        </View>
      </View>
    </Frame>
  ),
}

// --- Meta ---------------------------------------------------------------------

const meta: Meta = {
  title: 'Lab/North Star/Rail As Content',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Lab exploration retoning the session rail from CHROME (a second nav column) to ' +
          'CONTENT living in the recessed well: heading as a content section header (A) or a ' +
          'lifted card (B), session progression as a spine (C) or a compact stepper (D), and ' +
          'the rail beside the dominant live hero (E) — plus a merged active handoff (F). The ' +
          'live set stays the star throughout.',
      },
    },
  },
}

export default meta
type Story = StoryObj
