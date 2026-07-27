import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { VelocityStrip, DualVelocityStrip } from './VelocityStrip'
import { SessionRail, type SessionRailExercise } from './SessionRail'
import type { SetRowProps } from './SetRow'
import {
  Note,
  ViewLabel,
  SURFACE_BG,
  VIEW_HEIGHT,
  dualVariantFor,
  dualOf,
  LEFT_SLOT,
  RIGHT_SLOT,
  REP_SET,
  REP_SET_LAGGING,
  type StripView,
} from './velocity-story-kit'

/**
 * Per-rep velocity strip.
 *
 * Three views, each with its own story group:
 * - **[Compact](?path=/docs/workout-dataviz-velocitystrip-compact--docs)** — the flat resting strip
 * - **[Expanded](?path=/docs/workout-dataviz-velocitystrip-expanded--docs)** — the value-height chart
 * - **[Hero](?path=/docs/workout-dataviz-velocitystrip-hero--docs)** — the across-the-room wall treatment
 *
 * Dual is NOT a fourth view. It is the same strip when the exercise used two
 * Voltras, so every group pairs single above dual on one dataset.
 *
 * Feed either `velocities` or a `set` descriptor (set-type aware). `height` sets
 * the plot height; `scale` is `peak` (to the set max) or `fixed` (a fixed
 * ceiling, cross-set comparable — recommended for a live hero so bar heights
 * never reflow as reps land). `barColor` picks the fill scale: `zone` is the
 * absolute velocity zone, `loss` colours each bar by its drop from the set's own
 * best, so a fatiguing set reads green-to-red regardless of absolute speed.
 *
 * This root group holds only the cross-cutting stories — the per-view scenarios
 * live in the three group files above.
 */
const meta: Meta<typeof VelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip',
  component: VelocityStrip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'expanded', 'hero'],
      description: 'Display variant',
    },
    targetReps: {
      control: 'number',
      description: 'hero: planned rep count — reps beyond `velocities` draw as dashed placeholders',
    },
    expanded: {
      control: 'boolean',
      description: 'expanded (framed): whether the chart is open (toggle for tap-to-expand)',
    },
    showNumbers: {
      control: 'boolean',
      description: 'expanded framed chart: per-bar m/s labels (default true)',
    },
    showInfo: {
      control: 'boolean',
      description: 'expanded framed chart: the mean/loss info row (default true)',
    },
    height: {
      control: { type: 'number', min: 12, max: 260, step: 2 },
      description: 'expanded/hero plot height in px (bars scale to this). Default 60 / 220 (hero).',
    },
    scale: {
      control: 'inline-radio',
      options: ['peak', 'fixed'],
      description: 'expanded bar scaling: peak (set max) or fixed (cross-set ceiling)',
    },
    barColor: {
      control: 'inline-radio',
      options: ['zone', 'loss'],
      description:
        "bar-fill scale: zone (default, absolute velocity) or loss (relative to set's own best)",
    },
  },
}
export default meta
type Story = StoryObj<typeof VelocityStrip>

/** Controls-driven: flip `variant` / `showNumbers` / `showInfo` / `height` / `scale` in the panel. */
export const Playground: Story = {
  args: {
    velocities: [0.88, 0.85, 0.82, 0.78, 0.76],
    variant: 'expanded',
    expanded: true,
    showNumbers: true,
    showInfo: true,
    height: 60,
    scale: 'peak',
    onToggle: () => {},
  },
  decorators: [
    (Story) => (
      <View style={{ width: 300, padding: 16, backgroundColor: SURFACE_BG }}>
        <Story />
      </View>
    ),
  ],
}

// ── All views · the alignment matrix ────────────────────────────────────────
// ONE dataset across all three views, each in its single and dual form. The
// whole SetBarChart fold exists so these share ONE geometry; this is the story
// that catches drift at a glance.

const AV_VIEWS: { view: StripView; note: string }[] = [
  { view: 'compact', note: 'single fills · dual folds to rounded L/R pills' },
  { view: 'expanded', note: 'value-height bars' },
  { view: 'hero', note: 'wall treatment' },
]

/**
 * The hero reserves a 34px slot-label gutter; compact and expanded are
 * gutter-less in production. They are indented here ONLY so every row's bars
 * line up under the hero's — a comparison affordance, not production layout.
 */
const AV_GUTTER = 34

export const AllViews: Story = {
  name: 'All Views · single × dual matrix',
  render: () => (
    <View style={{ padding: 24, backgroundColor: SURFACE_BG, gap: 26, width: 760 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ width: 92 }} />
        <View style={{ flex: 1 }}>
          <ViewLabel text="Single slot" />
        </View>
        <View style={{ flex: 1 }}>
          <ViewLabel text="Dual · diverging" />
        </View>
      </View>
      <Note>
        The SAME set across every row — compact is the flattened expanded (identical bar
        x-positions, only the heights change). Shown at actual size.
      </Note>
      {AV_VIEWS.map(({ view, note }) => (
        <View key={view} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ width: 92, gap: 3 }}>
            <ViewLabel text={view} />
            <Note>{note}</Note>
          </View>
          <View style={{ flex: 1, paddingLeft: view === 'hero' ? 0 : AV_GUTTER }}>
            <VelocityStrip
              velocities={REP_SET}
              variant={view}
              height={VIEW_HEIGHT[view].single}
              scale="peak"
              {...(view === 'hero' ? { label: 'Set' } : {})}
              {...(view === 'expanded' ? { showNumbers: false, showInfo: false } : {})}
            />
          </View>
          <View style={{ flex: 1, paddingLeft: view === 'hero' ? 0 : AV_GUTTER }}>
            <DualVelocityStrip
              left={dualOf(REP_SET, LEFT_SLOT)}
              right={dualOf(REP_SET_LAGGING, RIGHT_SLOT)}
              variant={dualVariantFor(view)}
              height={VIEW_HEIGHT[view].dual}
              scale="peak"
            />
          </View>
        </View>
      ))}
    </View>
  ),
}

// ── In context · the real session rail + expanded exercise ──────────────────

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

/**
 * The current exercise's set table. This is where BOTH strip views ship: a
 * `done` row carries the flat compact strip, the `live` row carries the
 * velocity-height spotlight, and `todo` rows carry a grey stub.
 */
const CURRENT_SETS: SetRowProps[] = [
  {
    state: 'done',
    setNumber: 1,
    unit: 'lbs',
    reps: 10,
    weight: 90,
    rpe: 7,
    velocities: decay(10, 0.72),
  },
  {
    state: 'live',
    setNumber: 2,
    unit: 'lbs',
    target: { reps: 10, weight: 90 },
    reps: 5,
    weight: 90,
    velocities: decay(5, 0.62),
    liveRepIndex: 4,
  },
  { state: 'todo', setNumber: 3, unit: 'lbs', target: { reps: 10, weight: 90 }, planned: 10 },
]

/** A live session, mid-workout: two done, one active, one still upcoming. */
const RAIL_SESSION: SessionRailExercise[] = [
  {
    name: 'Seated Cable Row',
    summary: { sets: 5, reps: 8, weight: 145, unit: 'lbs' },
    tempo: [3, 1, 2, 0],
    indicator: 'pr',
    setStates: [1.0, 0.9, 0.8, 0.7, 0.6].map((v) => ({
      status: 'done' as const,
      velocities: decay(8, v),
    })),
  },
  {
    name: 'Incline DB Press',
    summary: { sets: 3, reps: 8, weight: 70, unit: 'lbs' },
    tempo: [3, 0, 3, 0],
    setStates: [0.72, 0.62, 0.54].map((v) => ({
      status: 'done' as const,
      velocities: decay(8, v),
    })),
  },
  {
    name: 'Cable Chest Press',
    summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' },
    tempo: [2, 1, 2, 0],
    indicator: 'info',
    setStates: [
      { status: 'done', velocities: decay(10, 0.72) },
      { status: 'active', velocities: decay(5, 0.62), planned: 10 },
      { status: 'todo', planned: 10 },
    ],
    sets: CURRENT_SETS,
  },
  {
    name: 'Standing Calf Raise',
    summary: { sets: 5, reps: 20, weight: 25, unit: 'lbs' },
    tempo: [2, 1, 2, 0],
    upcoming: true,
    setStates: [1, 2, 3, 4, 5].map(() => ({ status: 'todo' as const, planned: 20 })),
  },
]

/**
 * The strip in the place it actually ships, at production size, using the real
 * components — no mock rows.
 *
 * Left: `SessionRail`, which draws SET-level bars (`SetStrip`, `stripHeight={8}`)
 * — one bar per set, segmented per rep. Right: the current exercise opened as an
 * `ExerciseCard`, whose set table is where BOTH strip views live in production —
 * a `done` row renders `compact`, the `live` row renders the velocity-height
 * spotlight (`expanded` at h=24), and a `todo` row renders a grey stub.
 *
 * That composition is the honest answer to "where does this component appear":
 * the SPA renders `ExerciseCard` in its hero panel and rest view, so compact
 * ships through this table rather than through any direct call site. Reading
 * left to right is a zoom — set-level bars, then the same sets rep by rep — and
 * a fork in the flat-bar language shows up here as a mismatch in bar height,
 * radius or gap between the rail and the table.
 */
export const InContext: Story = {
  name: 'In Context · session rail',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <View style={{ flexDirection: 'row', backgroundColor: SURFACE_BG, minHeight: 640 }}>
      <SessionRail
        title="Pull A · Intensification"
        exercises={RAIL_SESSION}
        stripHeight={8}
        width={560}
        expandedIndex={2}
        setsDone={7.2}
        elapsedMs={(42 * 60 + 18) * 1000}
        budgetMs={60 * 60 * 1000}
        metrics={[
          { label: 'Volume', value: '76%' },
          { label: 'Load', value: '7.3k' },
          { label: 'Fatigue', value: 'MOD' },
        ]}
      />

      <View style={{ flex: 1, padding: 28, gap: 6 }}>
        <ViewLabel text="reading the rail" />
        <Note>
          Collapsed rows draw SET-level bars — one per set, segmented per rep, at the same 8px
          flat-bar language. The expanded row is the same exercise rep by rep: its `done` rows carry
          the compact strip, the `live` row the velocity-height spotlight, `todo` rows a grey stub.
          A zoom, not a repeat.
        </Note>
      </View>
    </View>
  ),
}
