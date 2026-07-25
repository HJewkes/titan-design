import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VelocityStrip, DualVelocityStrip } from './VelocityStrip'
import {
  Sheet,
  Note,
  ViewLabel,
  VIEW_LABEL,
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

// ── In context · the session-rail lockup ────────────────────────────────────

const RAIL_SETS = [
  { label: 'Set 1', velocities: [0.98, 0.95, 0.92, 0.9, 0.88] },
  { label: 'Set 2', velocities: [0.95, 0.9, 0.86, 0.8, 0.72] },
  { label: 'Set 3', velocities: [0.9, 0.84, 0.76, 0.66] },
]

/**
 * The strip where it actually lives: a session rail of completed sets, each a
 * resting compact strip, with the active set opened to expanded beneath them.
 *
 * The point of the lockup is the shared geometry: for a given rep COUNT, the
 * active expanded set lands its columns at the same x-positions as the resting
 * rows above it, because both go through the same bar-layout maths. Sets with a
 * different rep count get proportionally wider bars — that is the layout
 * working, not drift. If the maths ever fork, this is the story where it shows
 * up as a stagger between two rows that have the same number of reps.
 */
export const InContext: Story = {
  name: 'In Context · session rail lockup',
  render: () => (
    <Sheet width={520}>
      <View style={{ gap: 3 }}>
        <ViewLabel text="In context" />
        <Note>
          Completed sets at rest, the active set expanded below. Sets with the SAME rep count land
          their columns at identical x-positions across both views — sets 1, 2 and 4 line up; set 3
          logged four reps, so its bars are correspondingly wider. The layout adapts to rep count,
          and only to rep count.
        </Note>
      </View>

      <View style={{ gap: 12 }}>
        {RAIL_SETS.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Text style={{ color: VIEW_LABEL, fontSize: 11, width: 46 }}>{s.label}</Text>
            <View style={{ flex: 1 }}>
              <VelocityStrip velocities={s.velocities} variant="compact" height={11.5} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Text style={{ color: VIEW_LABEL, fontSize: 11, width: 46 }}>Set 4</Text>
        <View style={{ flex: 1 }}>
          <VelocityStrip
            velocities={[0.88, 0.83, 0.78]}
            variant="expanded"
            height={60}
            scale="fixed"
            targetReps={5}
            liveRepIndex={2}
            showNumbers={false}
            showInfo={false}
          />
        </View>
      </View>
    </Sheet>
  ),
}
