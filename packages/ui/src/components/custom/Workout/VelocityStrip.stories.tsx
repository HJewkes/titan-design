import { useState, type ReactNode } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable, Animated } from 'react-native'
import { VelocityStrip, DualVelocityStrip, getVelocityLossColor } from './VelocityStrip'
import { velColor } from './setHeadingKit'
import { surfaceRampDark } from '../../../theme/tokens/primitives'

/** The real dark surface-background plane — the stories sit on the actual token, not an ad-hoc grey. */
const SURFACE_BG = surfaceRampDark.background
import { SetBarChart, type SetSlot } from '../charts/SetBarChart'
import { formatVelocity } from '../../../utils/workout-format'
import { Surface } from '../../ui/surface/Surface'
import type { SurfaceLevel } from '../../ui/surface/SurfaceContext'

const meta: Meta<typeof VelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip',
  component: VelocityStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Per-rep velocity strip. Three variants: `compact` (a flat resting strip — SetBarChart in flat mode), `expanded` ' +
          '(the velocity-HEIGHT bar chart, rounded tops), and `hero` (the across-the-room, single-set ' +
          'wall treatment — tall bars, per-bar value labels, a dashed running-best reference line, and ' +
          'dashed placeholders for the reps still to come via `targetReps`). The `expanded` chrome is ' +
          'prop-driven — with `showNumbers`/`showInfo` on it is the framed chart (raised surface, per-bar ' +
          'm/s labels, mean/loss info row, interactive tap-to-expand); with both off it is a bare strip, ' +
          'the active-set spotlight. `height` sets the plot height; `scale` is `peak` (to the set max) ' +
          'or `fixed` (a fixed ceiling, cross-set-comparable — recommended for the live `hero` so bar ' +
          'heights never reflow as reps land). Feed either `velocities` or a `set` ' +
          'descriptor (set-type aware — see the ' +
          '[modalities](?path=/docs/workout-dataviz-velocitystrip-modalities--docs) sheet). ' +
          '`barColor` picks the bar-fill scale: `zone` (default) is the absolute velocity-zone ' +
          "scale above; `loss` colors each bar by its velocity LOSS from the set's own best " +
          '(the VL10/VL20/VL30 bands FatigueMeter uses), so a fatiguing set reads green-to-red ' +
          'by loss regardless of its absolute speed. The newest `liveRepIndex` bar grows up ' +
          'from the baseline as it enters (a new set peak overshoots slightly then settles).',
      },
    },
  },
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
    liveRepIndex: {
      control: 'number',
      description:
        'expanded framed chart: index of the newest rep to animate (pop / new-peak bounce)',
    },
    set: { control: false, description: 'Structured set descriptor (supersedes `velocities`)' },
    zones: { control: false, description: 'Velocity-zone bands (WA); default scale when absent' },
  },
}

export default meta
type Story = StoryObj<typeof VelocityStrip>

const fastSet = [1.15, 1.12, 1.08, 1.05, 1.02]
const slowSet = [0.65, 0.58, 0.52, 0.48, 0.42]
const mixedSet = [1.1, 0.95, 0.82, 0.68, 0.55, 0.45]
const moderateSet = [0.88, 0.85, 0.82, 0.78, 0.76]

/** Controls-driven: flip `variant` / `showNumbers` / `showInfo` / `height` / `scale` in the panel. */
export const Playground: Story = {
  args: {
    velocities: moderateSet,
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
      <View style={{ width: 300, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
}

// --- All-views alignment matrix (the reorg centerpiece) ----------------------
// ONE dataset shown across all three views (compact / expanded / hero), each in its
// SINGLE and its DUAL (diverging) form. The whole SetBarChart fold exists so these
// share ONE geometry — this is the story that catches drift at a glance. Single = one
// slot; dual = that slot + a lagging second slot (so the index-lock reads too).

const AV_ONE = [0.95, 0.9, 0.86, 0.8, 0.72]
const AV_L = { velocities: [0.95, 0.9, 0.86, 0.8, 0.72], label: 'Left' }
const AV_R = { velocities: [0.9, 0.83, 0.75, 0.66], label: 'Right' }

const AV_VIEWS: { view: 'compact' | 'expanded' | 'hero'; sH: number; dH: number; note: string }[] =
  [
    { view: 'compact', sH: 11.5, dH: 11.5, note: 'single fills · dual folds to rounded L/R pills' },
    { view: 'expanded', sH: 60, dH: 64, note: 'value-height bars' },
    { view: 'hero', sH: 180, dH: 200, note: 'wall treatment' },
  ]
// The hero reserves a slot-label gutter (34px); compact/expanded are gutter-less in production. Indent
// them here so every row's bars line up under the hero's for a clean comparison (matrix-only).
const AV_GUTTER = 34

function AVLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        color: '#8A8A8A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </Text>
  )
}

/**
 * All Views — the single × dual alignment matrix. Rows = the three views (compact / expanded /
 * hero); columns = single-slot vs diverging-dual. The dual `expanded` cell uses the lean `rail`
 * renderer (dual-expanded). This is the centerpiece: it proves the three views + their dual forms
 * all read from one shared geometry.
 */
export const AllViews: Story = {
  name: 'All Views · single × dual matrix',
  render: () => (
    <View style={{ padding: 24, backgroundColor: SURFACE_BG, gap: 26, width: 760 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ width: 92 }} />
        <View style={{ flex: 1 }}>
          <AVLabel text="Single slot" />
        </View>
        <View style={{ flex: 1 }}>
          <AVLabel text="Dual · diverging" />
        </View>
      </View>
      <Text style={{ color: '#5A5A5A', fontSize: 10, lineHeight: 15 }}>
        The SAME set across every row — compact is the flattened expanded (identical bar
        x-positions, only the heights change). Shown at actual size.
      </Text>
      {AV_VIEWS.map(({ view, sH, dH, note }) => (
        <View key={view} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ width: 92, gap: 3 }}>
            <AVLabel text={view} />
            <Text style={{ color: '#5A5A5A', fontSize: 9 }}>{note}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: view === 'hero' ? 0 : AV_GUTTER }}>
            <VelocityStrip
              velocities={AV_ONE}
              variant={view}
              height={sH}
              scale="peak"
              {...(view === 'hero' ? { label: 'Set' } : {})}
              {...(view === 'expanded' ? { showNumbers: false, showInfo: false } : {})}
            />
          </View>
          <View style={{ flex: 1, paddingLeft: view === 'hero' ? 0 : AV_GUTTER }}>
            <DualVelocityStrip
              left={AV_L}
              right={AV_R}
              variant={view === 'expanded' ? 'rail' : view}
              height={dH}
              scale="peak"
            />
          </View>
        </View>
      ))}
    </View>
  ),
}

// --- Compact-dual sizing study: does the diverging need 2×? ------------------
// At the flat RESTING scale bars are color-encoded, not height-encoded, so the diverging pair can
// share ONE 8px strip by splitting each rep column at the centre (L top-half / R bottom-half) — the
// north-star stacked-halves model with per-rep solid bars. The 2× (two full rows) is only forced for
// the value-height EXPANDED dual. This study renders both so the 4px-half legibility can be judged.

const CD_L = [0.95, 0.9, 0.86, 0.8, 0.72]
const CD_R = [0.9, 0.83, 0.75, 0.66] // lagging — 5th column empty

function CDcol({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, maxWidth: 26, gap: 1 }}>{children}</View>
}
function CDbar({ v, edge }: { v?: number; edge: 'top' | 'bottom' | 'full' }) {
  const radius =
    edge === 'full'
      ? { borderRadius: 2 }
      : edge === 'top'
        ? { borderTopLeftRadius: 2, borderTopRightRadius: 2 }
        : { borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }
  const h = edge === 'full' ? 8 : 4
  return (
    <View
      style={{
        height: h,
        backgroundColor: v == null ? '#2C2A28' : velColor(v),
        ...radius,
      }}
    />
  )
}
function CDrow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <AVLabel text={label} />
      <View style={{ flexDirection: 'row', gap: 3, width: 200 }}>{children}</View>
    </View>
  )
}

/**
 * Compact-dual sizing study — the single 8px strip, the diverging folded into the SAME 8px (L
 * top-half / R bottom-half per rep, 4px each), and the 2× two-row version, so the 4px-half
 * legibility can be judged against the "does it have to be 2×?" question.
 */
export const CompactDualSizingStudy: Story = {
  render: () => (
    <View style={{ padding: 24, backgroundColor: SURFACE_BG, gap: 22, width: 260 }}>
      <CDrow label="Single · 8px">
        {CD_L.map((v, i) => (
          <CDcol key={i}>
            <CDbar v={v} edge="full" />
          </CDcol>
        ))}
      </CDrow>
      <CDrow label="Dual · folded into 8px (4px halves)">
        {CD_L.map((v, i) => (
          <CDcol key={i}>
            <CDbar v={v} edge="top" />
            <CDbar v={CD_R[i]} edge="bottom" />
          </CDcol>
        ))}
      </CDrow>
      <CDrow label="Dual · 2× (two 8px rows)">
        {CD_L.map((v, i) => (
          <CDcol key={i}>
            <CDbar v={v} edge="full" />
            <View style={{ height: 5 }} />
            <CDbar v={CD_R[i]} edge="full" />
          </CDcol>
        ))}
      </CDrow>
    </View>
  ),
}

/**
 * The flat `compact` resting strip (SetBarChart in flat mode) — uniform short bars, no labels, same
 * geometry as expanded/hero. The resting glance used in the SetRow table + cards.
 */
export const Compact: Story = {
  args: { velocities: mixedSet, variant: 'compact', height: 28 },
  decorators: [
    (Story) => (
      <View style={{ width: 320, padding: 20, backgroundColor: SURFACE_BG }}>
        <Story />
      </View>
    ),
  ],
}

/** The flat `compact` strip fed a drop set — the chunk-notch separates the sub-loads even when flat. */
export const CompactDropSet: Story = {
  args: {
    variant: 'compact',
    height: 28,
    set: {
      type: 'drop',
      subloads: [
        [1.0, 0.95],
        [0.85, 0.8],
        [0.7, 0.62],
      ],
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 320, padding: 20, backgroundColor: SURFACE_BG }}>
        <Story />
      </View>
    ),
  ],
}

/** Framed chart with per-bar m/s labels + info row (numbers ON) — the rich readout. */
export const ExpandedWithNumbers: Story = {
  args: { velocities: mixedSet, variant: 'expanded', expanded: true },
  decorators: [
    (Story) => (
      <View style={{ width: 300, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
}

/** Bare velocity-height strip (numbers OFF, info OFF, fixed 24px) — the active-set spotlight. */
export const ExpandedBareSpotlight: Story = {
  args: {
    variant: 'expanded',
    showNumbers: false,
    showInfo: false,
    height: 24,
    scale: 'fixed',
    set: { type: 'straight', velocities: [0.95, 0.9, 0.86, 0.8, 0.72], planned: 10 },
  },
}

// --- Hero variant ------------------------------------------------------------
// The across-the-room, single-set wall treatment. Rendered on the north-star wall
// background so the dashed reference line + placeholders read the way they will live.

/**
 * Wall-background frame for the hero stories. The eyebrow label is ORGANISM chrome
 * (the north-star live page renders it), NOT part of the primitive — it sits here only
 * to show the component in the context it will live in. The `VelocityStrip` hero variant
 * itself renders no title.
 */
const heroDecorator: Decorator = (Story) => (
  <View style={{ width: 560, padding: 28, backgroundColor: SURFACE_BG }}>
    <Text
      style={{
        color: '#5A5A5A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
      }}
    >
      CONCENTRIC VELOCITY · THIS SET · (organism chrome — not the component)
    </Text>
    <Story />
  </View>
)

const heroMidSet = [0.82, 0.79, 0.81, 0.76]
const heroNearComplete = [0.82, 0.79, 0.81, 0.76, 0.74, 0.71, 0.68]
const heroFatigue = [0.96, 0.91, 0.83, 0.72, 0.61, 0.5]

/** Controls-driven hero: flip `velocities` / `targetReps` / `liveRepIndex` / `scale` / `height`. */
export const HeroPlayground: Story = {
  args: {
    velocities: heroMidSet,
    variant: 'hero',
    targetReps: 8,
    liveRepIndex: 3,
    scale: 'fixed',
    height: 220,
  },
  decorators: [heroDecorator],
}

/** Mid-set: 4 of 8 reps done, the newest bar popping, 4 dashed reps still to come. */
export const HeroMidSet: Story = {
  args: { velocities: heroMidSet, variant: 'hero', targetReps: 8, liveRepIndex: 3, scale: 'fixed' },
  decorators: [heroDecorator],
}

/** Near complete: 7 of 8, one placeholder left; the running-best line sits at rep 3. */
export const HeroNearComplete: Story = {
  args: {
    velocities: heroNearComplete,
    variant: 'hero',
    targetReps: 8,
    liveRepIndex: 6,
    scale: 'fixed',
  },
  decorators: [heroDecorator],
}

/** Fatigue decline: velocity falling rep over rep — the shape you read across the room. */
export const HeroFatigueDecline: Story = {
  args: {
    velocities: heroFatigue,
    variant: 'hero',
    targetReps: 8,
    liveRepIndex: 5,
    scale: 'fixed',
  },
  decorators: [heroDecorator],
}

/** Ends on the best rep: the running-best line lands on the last (live) bar's top. */
export const HeroEndsOnBest: Story = {
  args: {
    velocities: [0.7, 0.76, 0.83, 0.9],
    variant: 'hero',
    targetReps: 4,
    liveRepIndex: 3,
    scale: 'peak',
  },
  decorators: [heroDecorator],
}

/**
 * Set expansion — reps performed BEYOND `targetReps` (11 done vs 8 planned). Placeholders
 * are gone (target met) and the extra reps just render as more bars; `flex` bars narrow to
 * fit, so the chart absorbs the overflow with no clipping. The AMRAP "keep going" case.
 */
export const HeroExceedsTarget: Story = {
  args: {
    velocities: [0.9, 0.87, 0.84, 0.8, 0.77, 0.74, 0.71, 0.68, 0.64, 0.6, 0.55],
    variant: 'hero',
    targetReps: 8,
    liveRepIndex: 10,
    scale: 'fixed',
  },
  decorators: [heroDecorator],
}

/** Set complete: 8 of 8, no placeholders. */
export const HeroComplete: Story = {
  args: {
    velocities: [0.96, 0.91, 0.83, 0.79, 0.76, 0.72, 0.68, 0.61],
    variant: 'hero',
    targetReps: 8,
    scale: 'fixed',
  },
  decorators: [heroDecorator],
}

/** The same set at three container widths — the hero is width-fluid (flex bars, capped width, fixed height). */
export const HeroResponsive: Story = {
  render: () => (
    <View style={{ gap: 24, padding: 24, backgroundColor: SURFACE_BG }}>
      {[360, 560, 900].map((w) => (
        <View key={w} style={{ width: w }}>
          <Text style={{ color: '#5A5A5A', fontSize: 10, fontWeight: '700', marginBottom: 8 }}>
            {w}px
          </Text>
          <VelocityStrip
            velocities={heroFatigue}
            variant="hero"
            targetReps={8}
            liveRepIndex={5}
            scale="fixed"
            height={180}
          />
        </View>
      ))}
    </View>
  ),
}

/** A structured set descriptor (a drop set): the mini variant carries the set-type gap/color encoding. */
export const SetTypeMini: Story = {
  args: {
    variant: 'compact',
    set: {
      type: 'drop',
      subloads: [
        [1.0, 0.92],
        [0.85, 0.78],
        [0.7, 0.62],
      ],
    },
  },
}

function InteractiveVelocityStrip() {
  const [open, setOpen] = useState(false)
  // Tap-to-expand: `onToggle` + the controlled `expanded` boolean. Tapping the strip
  // toggles both ways (collapsed 3px ↔ chart). No `onRepPress` here — per-bar rep
  // presses would intercept bar taps and block collapse; that's a separate mode.
  return (
    <View style={{ width: 300, padding: 16 }}>
      <VelocityStrip velocities={moderateSet} expanded={open} onToggle={() => setOpen((v) => !v)} />
    </View>
  )
}

/** Tap to expand; tap again to collapse (3px ↔ chart, animated). */
export const Interactive: Story = {
  render: () => <InteractiveVelocityStrip />,
}

/** The four zone profiles across the treatments, so the color scale reads at a glance. */
export const Profiles: Story = {
  render: () => {
    const rows: [string, number[]][] = [
      ['Speed', fastSet],
      ['Power', moderateSet],
      ['Strength', slowSet],
      ['Mixed', mixedSet],
    ]
    return (
      <View style={{ gap: 20, padding: 16, width: 320 }}>
        {rows.map(([label, velocities]) => (
          <View key={label} style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
              {label}
            </Text>
            <VelocityStrip
              velocities={velocities}
              variant="expanded"
              showInfo={false}
              onToggle={() => {}}
            />
            <VelocityStrip
              variant="expanded"
              showNumbers={false}
              showInfo={false}
              height={24}
              scale="fixed"
              set={{ type: 'straight', velocities, planned: velocities.length }}
            />
            <VelocityStrip velocities={velocities} variant="compact" />
          </View>
        ))}
      </View>
    )
  },
}

// --- barColor="loss" (fatigue hero enhancement) ------------------------------
// The absolute zone scale pins a bar red once velocity drops below 0.5 m/s
// regardless of how the SET itself is trending. `barColor="loss"` recolors each
// bar by its own velocity loss from the set's best, so a fatiguing set reads
// green→red purely by drop-off — what the fatigue hero wants. Wiring the hero
// to pass this prop is a follow-up on the fatigue-hero branch; this only ships
// the prop + demo.

const fatigueDecline = [0.95, 0.86, 0.77, 0.68, 0.58, 0.4]

/** Hero wall treatment, loss-relative coloring: green→red by drop-off from this set's own best. */
export const LossColoringFatiguingSet: Story = {
  args: {
    velocities: fatigueDecline,
    variant: 'hero',
    targetReps: 8,
    barColor: 'loss',
    scale: 'fixed',
  },
  decorators: [heroDecorator],
}

/**
 * Same declining set, `zone` vs `loss` side by side. Under `zone` the first three
 * reps are all bunched yellow (they're all comfortably within the ≥0.75 m/s band,
 * masking that the set is already fatiguing) and only the very last rep — once it
 * finally crosses the 0.5 m/s floor — reads red. Under `loss` every rep's own
 * drop-off from this set's best is visible immediately: a clean green→gold→
 * orange→red progression that tracks the VL10/20/30 thresholds directly.
 */
export const LossVsZoneComparison: Story = {
  render: () => (
    <View style={{ gap: 20, padding: 20, width: 340, backgroundColor: SURFACE_BG }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
          barColor=&quot;zone&quot; — absolute velocity (bunches yellow, late red)
        </Text>
        <VelocityStrip velocities={fatigueDecline} variant="compact" barColor="zone" />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
          barColor=&quot;loss&quot; — relative to this set&apos;s own best (VL10/20/30 bands)
        </Text>
        <VelocityStrip velocities={fatigueDecline} variant="compact" barColor="loss" />
      </View>
    </View>
  ),
}

// --- Grow-from-bottom live entrance -------------------------------------------
// The newest `liveRepIndex` bar grows up from the baseline (0 → full height) as it
// enters, instead of the old drop-in/pop. A new set peak overshoots slightly past
// full height then settles — a small bounce that reads as "that one's a PR".

const growBtn = {
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 6,
  backgroundColor: '#1F2937',
} as const
const growBtnText = { color: '#E5E7EB', fontSize: 12, fontWeight: '700' as const }

function GrowFromBottomDemo() {
  const [reps, setReps] = useState<number[]>([0.7, 0.82])
  const addRep = (velocity: number) => setReps((r) => [...r, velocity])
  return (
    <View style={{ width: 420, padding: 20, gap: 14, backgroundColor: SURFACE_BG }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => addRep(0.6 + Math.random() * 0.15)} style={growBtn}>
          <Text style={growBtnText}>Add rep (grows from baseline)</Text>
        </Pressable>
        <Pressable onPress={() => addRep(0.95)} style={growBtn}>
          <Text style={growBtnText}>Add PR rep (grow + overshoot bounce)</Text>
        </Pressable>
        <Pressable onPress={() => setReps([0.7, 0.82])} style={growBtn}>
          <Text style={growBtnText}>Reset</Text>
        </Pressable>
      </View>
      <VelocityStrip
        velocities={reps}
        variant="expanded"
        liveRepIndex={reps.length - 1}
        scale="fixed"
      />
    </View>
  )
}

/** Click "Add rep" to watch the newest bar grow up from the baseline; "Add PR rep" shows the overshoot-and-settle bounce on a new set peak. */
export const LiveGrowFromBottom: Story = {
  render: () => <GrowFromBottomDemo />,
}

// --- Vertical flip (the dual-composition primitive) --------------------------
// `orientation="down"` mirrors the whole hero (bars grow DOWN from a top baseline,
// text upright). Stacking an `up` hero over a `down` hero sharing one axis IS the
// diverging dual — so the dual is two composed VelocityStrips, not bespoke code.

/** The same set rendered `up` then `down` — the two halves the diverging dual composes, meeting at a shared axis. */
export const OrientationUpDown: Story = {
  render: () => (
    <View style={{ padding: 24, backgroundColor: SURFACE_BG, width: 560 }}>
      <VelocityStrip
        velocities={heroFatigue}
        variant="hero"
        orientation="up"
        targetReps={8}
        liveRepIndex={5}
        scale="fixed"
        height={150}
      />
      <View style={{ height: 2, backgroundColor: '#4B5563' }} />
      <VelocityStrip
        velocities={heroFatigue}
        variant="hero"
        orientation="down"
        targetReps={8}
        liveRepIndex={5}
        scale="fixed"
        height={150}
      />
    </View>
  ),
}

// --- Surface-relative placeholders -------------------------------------------
// Planned/to-do reps (dashed hero stubs, grey mini/expanded slots) + the baseline
// now derive from the on-surface `tertiary` neutral via the Surface context, so an
// empty slot stays legible on EVERY plane instead of a fixed charcoal that washes
// out on the frame or over-contrasts on a raised card.

/**
 * The real concern: the grey PLANNED / TO-DO slots (a 4-of-8 straight set — 4 done reps
 * + 4 to-do) in the mini and bare-expanded strips, on each surface plane. The to-do slots
 * derive from the on-surface neutral so they stay legible on every plane instead of a fixed
 * charcoal that washes out on a raised card or vanishes on the frame.
 */
export const PlaceholderAcrossSurfaces: Story = {
  render: () => {
    const planes: SurfaceLevel[] = ['background', 'base', 'elevated', 'raised', 'overlay']
    const straight4of8 = {
      type: 'straight' as const,
      velocities: [0.9, 0.85, 0.8, 0.74],
      planned: 8,
    }
    return (
      <View style={{ gap: 12, padding: 20, backgroundColor: '#100D0A' }}>
        {planes.map((level) => (
          <Surface key={level} level={level} rounded>
            <View style={{ padding: 14, width: 340, gap: 8 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 9, fontWeight: '700' }}>
                {level.toUpperCase()}
              </Text>
              <VelocityStrip variant="compact" set={straight4of8} />
              <VelocityStrip
                variant="expanded"
                showNumbers={false}
                showInfo={false}
                height={24}
                scale="fixed"
                set={straight4of8}
              />
            </View>
          </Surface>
        ))}
      </View>
    )
  },
}

/**
 * Single hero WITH a stream/slot-name label ("Left Arm") down the left gutter — the same rotated
 * vertical edge label the diverging dual gives each wing, so a single hero and a dual read
 * consistently. The label font scales to the chart height so it fits without truncation.
 */
export const HeroWithSlotLabel: Story = {
  args: {
    velocities: heroFatigue,
    variant: 'hero',
    label: 'Left Arm',
    targetReps: 8,
    scale: 'fixed',
  },
  decorators: [heroDecorator],
}

/**
 * Standalone DROP-set hero — three sub-loads, each separated by the WIDE chunk-notch. The notch is
 * now PROPORTIONAL to bar width (≈¼ of a bar extra, ≈⅓ of a bar total), so against the dense 0.08
 * rep spacing the cluster breaks read clearly — you can tell the three loads apart at a glance.
 */
export const HeroDropClusters: Story = {
  args: {
    variant: 'hero',
    scale: 'fixed',
    set: {
      type: 'drop',
      subloads: [
        [0.95, 0.92, 0.88],
        [0.82, 0.78, 0.74],
        [0.68, 0.62, 0.55],
      ],
    },
  },
  decorators: [heroDecorator],
}

/**
 * Compact ↔ expanded IN PLACE — the SAME drop set as a flat `compact` strip (top) and the
 * value-height `expanded` spotlight (bottom), at the SAME width. Both compose SetBarChart, so the
 * bars sit in IDENTICAL x-positions / widths / gaps / chunk-notches — the toggle only changes bar
 * HEIGHTS (flat ↔ velocity), never the horizontal layout (no reflow).
 */
export const CompactExpandedInPlace: Story = {
  render: () => {
    const set = {
      type: 'drop' as const,
      subloads: [
        [1.0, 0.95],
        [0.85, 0.8],
        [0.7, 0.62],
      ],
    }
    return (
      <View style={{ width: 340, padding: 20, gap: 16, backgroundColor: SURFACE_BG }}>
        <Text style={{ color: '#8A8A8A', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
          COMPACT (flat)
        </Text>
        <VelocityStrip variant="compact" height={28} set={set} scale="fixed" />
        <Text style={{ color: '#8A8A8A', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
          EXPANDED (value-height spotlight)
        </Text>
        <VelocityStrip
          variant="expanded"
          showNumbers={false}
          showInfo={false}
          height={60}
          set={set}
          scale="fixed"
        />
      </View>
    )
  },
}

// --- Expand-progress interpolation frames ------------------------------------
// SetBarChart's `expandProgress` (0=flat compact → 1=value expanded) morphs each bar's HEIGHT in
// place; the x-geometry (widths / gaps / chunk-notches / positions) is FIXED. Three static frames
// at progress 0 / 0.5 / 1 — same drop set, same width — show the mid-morph: bars are half-way
// between flat and value at 0.5, columns unmoved.

const PROGRESS_VELOCITIES = [1.0, 0.95, 0.85, 0.8, 0.7, 0.62]

function progressColorFor(velocities: number[]): (v: number) => string {
  const best = Math.max(...velocities, 0)
  return (v: number) =>
    getVelocityLossColor(best > 0 ? Math.max(0, Math.round(((best - v) / best) * 100)) : 0)
}

function ProgressFrame({ label, value }: { label: string; value: number }) {
  const [progress] = useState(() => new Animated.Value(value))
  const slots: SetSlot[] = [
    { kind: 'rep', value: 1.0 },
    { kind: 'rep', value: 0.95 },
    { kind: 'rep', value: 0.85, leadingGap: 8 },
    { kind: 'rep', value: 0.8 },
    { kind: 'rep', value: 0.7, leadingGap: 8 },
    { kind: 'rep', value: 0.62 },
  ]
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#8A8A8A', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
        {label}
      </Text>
      <SetBarChart
        slots={slots}
        colorFor={progressColorFor(PROGRESS_VELOCITIES)}
        height={72}
        scale="fixed"
        expandProgress={progress}
        showValueLabels
        formatValue={formatVelocity}
        hideBaseline
      />
    </View>
  )
}

/**
 * `expandProgress` interpolation — three static frames (0 = flat/compact, 0.5 = mid-morph, 1 =
 * value/expanded) of the SAME set at the SAME width. Bars are half-height at 0.5; the columns /
 * gaps / chunk-notches never move, proving the collapse animates HEIGHTS in place (no reflow).
 */
export const ExpandProgressFrames: Story = {
  render: () => (
    <View style={{ width: 360, padding: 20, gap: 18, backgroundColor: SURFACE_BG }}>
      <ProgressFrame label="expandProgress = 0 (flat / compact)" value={0} />
      <ProgressFrame label="expandProgress = 0.5 (mid-morph)" value={0.5} />
      <ProgressFrame label="expandProgress = 1 (value / expanded)" value={1} />
    </View>
  ),
}
