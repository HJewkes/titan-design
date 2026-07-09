/**
 * SHEET · Session Rail — set-type encodings (R&D). Throwaway specimen at real rail width, on real tokens.
 * Explores the cases the flat `sets × reps @ load` strip doesn't model:
 *   1. Variable rep-range — range-max segments; the variable zone (floor→max) upcoming part gets its OWN color.
 *   2. Drop set — ONE bar, sub-loads separated by thin NOTCHES (< the between-set gap); reps velocity-colored.
 *   3. Myo-rep / rest-pause — activation chunk + mini-clusters separated by small cluster gaps.
 * Gap hierarchy: butted reps (0) < notch (2, drop sub-load) < cluster gap (3, myo rest-pause) < SET_GAP (5, sets).
 * Hardens into a SetStrip model extension (SetState variants: range/drop/myo) — a post-harden follow-up.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment } from 'react'
import { primitiveColors, primitiveRamps as ramp } from '../../../theme/tokens/primitives'
import { GREY, RAIL_W, SET_GAP, T_PRIMARY, T_SECONDARY, T_TERTIARY, INSET, velColor, reps, Page, sectionTitle } from './setHeadingKit'

// ---- variable-zone (floor→max) upcoming color — real ramp candidates (no invented hex)
const VAR_GREY = primitiveColors.charcoal[200] // #3C3C3C — lighter charcoal (the paler-grey reference)
const VAR_BLUE_800 = ramp.blue[800] // #14407E — clearly blue, a touch brighter
const VAR_BLUE_900 = ramp.blue[900] // #112C5A — dark muted navy, recessive
const VAR_CYAN_900 = ramp.cyan[900] // #0B3149 — teal alt, sidesteps info-blue adjacency
const NOTCH = 2 // drop sub-load divider
const CLUSTER_GAP = 3 // myo rest-pause divider

type Chunk = { colors: string[]; gapAfter?: number }
function Bar({ chunks, h }: { chunks: Chunk[]; h: number }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: h, borderRadius: 2, overflow: 'hidden' }}>
      {chunks.map((ch, ci) => (
        <Fragment key={ci}>
          {ch.colors.map((c, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0, height: '100%', background: c }} />
          ))}
          {ci < chunks.length - 1 && <div style={{ flex: `0 0 ${ch.gapAfter ?? NOTCH}px`, height: '100%', background: INSET }} />}
        </Fragment>
      ))}
    </div>
  )
}

// ---- 1. variable rep-range: `max` segments; committed 0..floor, variable floor..max; variable-todo gets VAR color
function rangeColors(floor: number, max: number, doneVels: number[], varColor: string): string[] {
  return Array.from({ length: max }, (_, i) => {
    if (i < doneVels.length) return velColor(doneVels[i])
    return i < floor ? GREY : varColor
  })
}
function RangeBar({ floor, max, done, varColor, h }: { floor: number; max: number; done: number[]; varColor: string; h: number }) {
  return <Bar chunks={[{ colors: rangeColors(floor, max, done, varColor) }]} h={h} />
}

// ---- 2. drop set: one bar, sub-loads butted internally, separated by thin notches
function DropBar({ subloads, h }: { subloads: number[][]; h: number }) {
  const chunks: Chunk[] = subloads.map((vels, i) => ({ colors: vels.map(velColor), gapAfter: NOTCH, ...(i === subloads.length - 1 ? { gapAfter: undefined } : {}) }))
  return <Bar chunks={chunks} h={h} />
}

// ---- 3. myo-rep: activation chunk + mini-clusters, separated by cluster gaps
function MyoBar({ activation, clusters, h }: { activation: number[]; clusters: number[][]; h: number }) {
  const chunks: Chunk[] = [{ colors: activation.map(velColor), gapAfter: CLUSTER_GAP }, ...clusters.map((c) => ({ colors: c.map(velColor), gapAfter: CLUSTER_GAP }))]
  return <Bar chunks={chunks} h={h} />
}

// ---- 3b. UPCOMING myo, unknown length: grey activation (expected) + a blue "clusters-to-failure" trail
// that fades and leaves the right edge open — signalling "N more clusters, count unknown".
function MyoUpcomingBar({ activationLen, blue, h }: { activationLen: number; blue: string; h: number }) {
  const fades = [1, 0.6, 0.32] // decreasing opacity per expected cluster → "and maybe more"
  return (
    <div style={{ display: 'flex', width: '100%', height: h, gap: 0 }}>
      <div style={{ display: 'flex', flex: activationLen, height: '100%', borderRadius: '2px 0 0 2px', overflow: 'hidden' }}>
        {Array.from({ length: activationLen }, (_, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: GREY }} />
        ))}
      </div>
      {fades.map((op, ci) => (
        <Fragment key={ci}>
          <div style={{ flex: `0 0 ${CLUSTER_GAP}px`, height: '100%', background: INSET }} />
          <div style={{ display: 'flex', flex: 5, height: '100%', overflow: 'hidden', opacity: op }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: '100%', background: blue }} />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

// ---- row scaffold at real rail width, on the sunk inset surface
function Row({ name, meta, children }: { name: string; meta: string; children: React.ReactNode }) {
  return (
    <div style={{ width: RAIL_W, background: INSET, padding: '9px 12px', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: T_PRIMARY }}>{name}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T_TERTIARY }}>{meta}</span>
      </div>
      {children}
    </div>
  )
}
function Col({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ ...sectionTitle, color: T_SECONDARY }}>{label}</span>
      {children}
    </div>
  )
}

const H = 8

function Sheet() {
  return (
    <Page title="Session Rail — set-type encodings" note="R&D for prescriptions the flat sets×reps strip doesn't model. Rail width, real velocity ramp pins. Rep-range: range-max segments, the variable zone (floor→max) upcoming part gets its own color. Drop: one bar, sub-loads split by thin notches. Myo: activation + mini-clusters split by cluster gaps.">
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 1. variable rep-range — real ramp candidates for the variable zone */}
        <Col label="1 · variable rep-range — LOCKED: cyan 900">
          {([
            ['grey · charcoal 200', VAR_GREY],
            ['blue 800 · #14407E', VAR_BLUE_800],
            ['blue 900 · #112C5A', VAR_BLUE_900],
            ['cyan 900 · #0B3149', VAR_CYAN_900],
          ] as const).map(([label, c]) => (
            <Row key={label} name="Face Pull" meta="3 × 15–20 @ 40">
              <span style={{ fontSize: 9, color: T_TERTIARY, display: 'block', marginBottom: 5 }}>{label}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SET_GAP }}>
                <RangeBar floor={15} max={20} done={[]} varColor={c} h={H} />
                <RangeBar floor={15} max={20} done={reps(12, 0.9)} varColor={c} h={H} />
                <RangeBar floor={15} max={20} done={reps(17, 0.8)} varColor={c} h={H} />
              </div>
            </Row>
          ))}
          <span style={{ fontSize: 10, color: T_TERTIARY, maxWidth: RAIL_W }}>Each block: todo · 12 done (committed) · 17 done (into the variable zone). Variable-todo = the swatch; committed-todo = grey.</span>
        </Col>

        {/* 2. drop set */}
        <Col label="2 · drop set">
          <Row name="Lat Pulldown" meta="1 drop · 10→8→6 @ 120→80">
            <DropBar subloads={[reps(10, 0.85), reps(8, 0.7), reps(6, 0.6)]} h={H} />
          </Row>
          <Row name="Leg Extension" meta="1 drop · 12→10→8→6 @ 90→45">
            <DropBar subloads={[reps(12, 0.8), reps(10, 0.7), reps(8, 0.62), reps(6, 0.55)]} h={H} />
          </Row>
          <span style={{ fontSize: 10, color: T_TERTIARY, maxWidth: RAIL_W }}>One set, no rest; notches mark each load drop. Notch (2px) &lt; set gap (5px) so drops read as sub-structure of a single set.</span>
        </Col>

        {/* 3. myo-rep */}
        <Col label="3 · myo-rep / rest-pause">
          <Row name="Cable Curl" meta="myo · done · 15 + 5 + 5 + 5">
            <MyoBar activation={reps(15, 0.75)} clusters={[reps(5, 0.6), reps(5, 0.55), reps(5, 0.5)]} h={H} />
          </Row>
          <Row name="Triceps Pushdown" meta="myo · done · 12 + 4 + 4">
            <MyoBar activation={reps(12, 0.7)} clusters={[reps(4, 0.55), reps(4, 0.5)]} h={H} />
          </Row>
          <span style={{ fontSize: 10, color: T_TERTIARY, maxWidth: RAIL_W }}>Done: activation to near-failure, then rest-pause clusters. Cluster gap (3px) between notch and set gap.</span>
          <span style={{ ...sectionTitle, color: T_SECONDARY, marginTop: 6 }}>upcoming · length unknown</span>
          <Row name="Cable Curl" meta="myo · ~15 + clusters to failure">
            <MyoUpcomingBar activationLen={15} blue={VAR_CYAN_900} h={H} />
          </Row>
          <Row name="Triceps Pushdown" meta="myo · ~12 + clusters to failure">
            <MyoUpcomingBar activationLen={12} blue={VAR_CYAN_900} h={H} />
          </Row>
          <span style={{ fontSize: 10, color: T_TERTIARY, maxWidth: RAIL_W }}>{'Grey activation (expected) + blue "clusters-to-failure" trail that fades and leaves the right edge open — reuses the variable/opportunity blue, signalling "more coming, count unknown."'}</span>
        </Col>
      </div>
    </Page>
  )
}

const meta: Meta = {
  title: 'Custom/Workout/Explorations/Set Types',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const Encodings: Story = { render: () => <Sheet /> }
