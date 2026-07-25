import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DualVelocityStrip, VelocityStrip, type VelocitySet } from './VelocityStrip'

/**
 * Wall-background frame for the dual hero stories — the north-star live page context.
 * The eyebrow is ORGANISM chrome (the live page renders it), NOT part of the primitive;
 * it sits here only to show the diverging chart the way it will live on the wall.
 */
const wallDecorator: Decorator = (Story) => (
  <View style={{ width: 620, padding: 28, backgroundColor: '#0E0E0E' }}>
    <Text
      style={{
        color: '#5A5A5A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
      }}
    >
      CONCENTRIC VELOCITY · PER SLOT · THIS SET · (organism chrome — not the component)
    </Text>
    <Story />
  </View>
)

const meta: Meta<typeof DualVelocityStrip> = {
  title: 'Workout/DataViz/DualVelocityStrip',
  component: DualVelocityStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `hero` variant is literally **two composed [VelocityStrip](?path=/docs/workout-dataviz-velocitystrip--docs) ' +
          'heroes** — an `orientation="up"` hero over an `orientation="down"` (vertically-mirrored) ' +
          'hero, sharing ONE height scale (`scaleMax`) and meeting at one shared centre axis. Because ' +
          'it composes the single hero, every hero improvement — paper, VL20/VL30 loss bands, ' +
          'grow-from-bottom, the running-best reference, surface-relative placeholders, per-side loss ' +
          'coloring, **the set-type slot windows** — reaches the dual for free. The up-wing stream ' +
          'grows **UP** and the down-wing stream grows **DOWN**, so the asymmetry reads pre-attentively ' +
          'as the silhouette. A stronger arm reads **TALLER** (shared height scale) while each wing still ' +
          'colors by its OWN best. **Side is POSITION only, never hue.** Each side takes a ' +
          '`DualVelocityStream` (`velocities` OR a structured `set`, plus an optional `label`); a `set` ' +
          'passes straight into its wing, so its set-type **windows render** — the range cyan variable ' +
          'window, the AMRAP/myo "continue", the drop/myo chunk-notch gaps. The vertical edge label is ' +
          'DATA — each side renders its `label` slot name (e.g. "Left Arm"), not a hardcoded side. Two ' +
          'scales: `hero` (across-the-room wall) and `rail` (a lean compact dedicated renderer — same ' +
          'diverging form, no labels / reference lines / paper). Single-slot sets keep using ' +
          '`VelocityStrip variant="hero"`.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['hero', 'rail'],
      description: 'hero (wall: labels + reference lines) or rail (compact: neither)',
    },
    scale: {
      control: 'inline-radio',
      options: ['peak', 'fixed'],
      description:
        'bar scaling, shared across both wings: peak (pair max) or fixed (cross-set ceiling)',
    },
    targetReps: {
      control: 'number',
      description:
        'planned rep count — reps beyond a side’s done count draw as mirrored dashed stubs',
    },
    liveRepIndex: {
      control: 'number',
      description: 'index of the newest rep; that mirrored pair animates in (hero only)',
    },
    height: {
      control: { type: 'number', min: 60, max: 260, step: 4 },
      description: 'total plot height (px), split evenly into the up (L) and down (R) wings',
    },
    left: {
      control: 'object',
      description:
        'Up-wing stream — `{ velocities | set, label }`. Edit `label` here to change the slot name.',
    },
    right: {
      control: 'object',
      description:
        'Down-wing stream — `{ velocities | set, label }`. Edit `label` here to change the slot name.',
    },
    zones: { control: false, description: 'Velocity-zone bands (WA); default scale when absent' },
  },
}

export default meta
type Story = StoryObj<typeof DualVelocityStrip>

// A left-dominant / right-lagging pair — the asymmetry the diverging form exists to show.
// Slot names ("Left Arm" / "Right Arm") are EXAMPLE data supplied per side via `label`;
// they are not baked into the component — swap them freely in the controls.
const leftStrong = [0.92, 0.9, 0.88, 0.85, 0.82, 0.79]
const rightWeak = [0.83, 0.79, 0.74, 0.68, 0.61, 0.54]
const LEFT_SLOT = 'Left Arm'
const RIGHT_SLOT = 'Right Arm'

/** Controls-driven: flip `variant` / `scale` / `targetReps` / `liveRepIndex` / `height`; edit each stream's `label` + data. */
export const Playground: Story = {
  args: {
    left: { velocities: leftStrong, label: LEFT_SLOT },
    right: { velocities: rightWeak, label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'peak',
    targetReps: 6,
    height: 220,
  },
  decorators: [wallDecorator],
}

/** Both sides complete — the dominant / lagging silhouette at wall scale, named by slot. */
export const HeroBothDone: Story = {
  args: {
    left: { velocities: leftStrong, label: LEFT_SLOT },
    right: { velocities: rightWeak, label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'peak',
    targetReps: 6,
  },
  decorators: [wallDecorator],
}

/** In-progress / live: 4 of 8 done, the newest down-wing pair popping, 4 dashed reps still to come per side. */
export const HeroInProgress: Story = {
  args: {
    left: { velocities: [0.9, 0.88, 0.86, 0.84], label: LEFT_SLOT },
    right: { velocities: [0.82, 0.78, 0.73, 0.67], label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'fixed',
    targetReps: 8,
    liveRepIndex: 3,
  },
  decorators: [wallDecorator],
}

/** Planned but unstarted: no reps performed — both wings render as mirrored dashed todo stubs (slot names still shown). */
export const HeroPlanned: Story = {
  args: {
    left: { velocities: [], label: LEFT_SLOT },
    right: { velocities: [], label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'fixed',
    targetReps: 6,
  },
  decorators: [wallDecorator],
}

/** Compact rail scale — the same diverging form, no value labels or reference lines (slot names in a narrow gutter). */
export const Rail: Story = {
  args: {
    left: { velocities: leftStrong, label: LEFT_SLOT },
    right: { velocities: rightWeak, label: RIGHT_SLOT },
    variant: 'rail',
    targetReps: 6,
  },
  decorators: [
    (Story) => (
      <View style={{ width: 320, padding: 16, backgroundColor: '#141414' }}>
        <Story />
      </View>
    ),
  ],
}

/**
 * Set-type windows on the dual — a `range` set on BOTH sides (same structure: floor 6, max 8), the
 * right side one rep behind. The set-type windows render: the dashed floor + the cyan variable window
 * (`floor..max`), index-locked across the axis; the right's un-logged rep shows as an empty cell under
 * the left's. The dual colors per-side by loss — the windows are position, not hue.
 */
export const HeroSetTypes: Story = {
  args: {
    left: {
      set: { type: 'range', velocities: [0.9, 0.87, 0.84, 0.8], floor: 6, max: 8 },
      label: LEFT_SLOT,
    },
    right: {
      set: { type: 'range', velocities: [0.84, 0.79, 0.73], floor: 6, max: 8 },
      label: RIGHT_SLOT,
    },
    variant: 'hero',
    scale: 'fixed',
  },
  decorators: [wallDecorator],
}

/**
 * A `myo` (rest-pause) set on the up wing — activation + clusters — mirrored against a straight down-wing
 * set. The myo set renders one bar per performed rep (activation + all cluster reps), the WIDE chunk-notch
 * gaps that split each cluster, and — since `open` is set — the trailing cyan-outline "continue" window.
 * The mirrored up↔down alignment stays clean because the chunk gaps sit between rep columns.
 */
export const HeroMyoReps: Story = {
  args: {
    left: {
      set: {
        type: 'myo',
        activation: [0.95, 0.9, 0.85],
        clusters: [
          [0.78, 0.72],
          [0.68, 0.61],
        ],
        open: true,
      },
      label: LEFT_SLOT,
    },
    right: { velocities: [0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.66], label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'fixed',
  },
  decorators: [wallDecorator],
}

/** The same asymmetric pair at three container widths — the dual chart is width-fluid (flex columns, fixed height). */
export const HeroResponsive: Story = {
  render: () => (
    <View style={{ gap: 24, padding: 24, backgroundColor: '#0E0E0E' }}>
      {[380, 560, 900].map((w) => (
        <View key={w} style={{ width: w }}>
          <Text style={{ color: '#5A5A5A', fontSize: 10, fontWeight: '700', marginBottom: 8 }}>
            {w}px
          </Text>
          <DualVelocityStrip
            left={{ velocities: leftStrong, label: LEFT_SLOT }}
            right={{ velocities: rightWeak, label: RIGHT_SLOT }}
            variant="hero"
            scale="fixed"
            targetReps={6}
            liveRepIndex={5}
            height={200}
          />
        </View>
      ))}
    </View>
  ),
}

// --- Set-type board ---------------------------------------------------------
// One row per set type, each shown as BOTH the single hero (VelocityStrip) and the
// diverging dual (DualVelocityStrip). Per the symmetric index-lock model, BOTH sides of a dual
// row share the SAME set type + structure (same planned / floor / max / chunk positions); they
// differ ONLY in how many reps each side logged — the lagging (right) side's un-logged reps render
// as EMPTY cells aligned under the left's, so every column is index-locked across the axis.

interface BoardRow {
  type: string
  note: string
  single: VelocitySet
  left: VelocitySet
  right: VelocitySet
}

const BOARD: BoardRow[] = [
  {
    type: 'straight',
    note: 'done reps + solid to-do remainder to the planned count',
    single: { type: 'straight', velocities: [0.9, 0.86, 0.82, 0.78], planned: 6 },
    left: { type: 'straight', velocities: [0.9, 0.86, 0.82, 0.78], planned: 6 },
    right: { type: 'straight', velocities: [0.84, 0.79], planned: 6 },
  },
  {
    type: 'range',
    note: 'committed rep bars + solid floor + the cyan variable window (floor..max)',
    single: { type: 'range', velocities: [0.9, 0.86, 0.82, 0.8], floor: 6, max: 8 },
    left: { type: 'range', velocities: [0.9, 0.86, 0.82, 0.8], floor: 6, max: 8 },
    right: { type: 'range', velocities: [0.83, 0.78], floor: 6, max: 8 },
  },
  {
    type: 'amrap',
    note: 'performed reps + the trailing cyan-outline "continue" window',
    single: { type: 'amrap', velocities: [0.9, 0.85, 0.8, 0.75] },
    left: { type: 'amrap', velocities: [0.9, 0.85, 0.8, 0.75] },
    right: { type: 'amrap', velocities: [0.82, 0.76] },
  },
  {
    type: 'drop',
    note: 'one bar per rep with WIDE chunk-notch gaps splitting each sub-load',
    single: {
      type: 'drop',
      subloads: [
        [0.95, 0.9],
        [0.82, 0.76],
        [0.7, 0.64],
      ],
    },
    left: {
      type: 'drop',
      subloads: [
        [0.95, 0.9],
        [0.82, 0.76],
        [0.7, 0.64],
      ],
    },
    right: {
      type: 'drop',
      subloads: [[0.88, 0.83], [0.75, 0.68], [0.62]],
    },
  },
  {
    type: 'myo',
    note: 'activation + clusters, WIDE chunk-notch gaps + the open "continue"',
    single: {
      type: 'myo',
      activation: [0.9, 0.85, 0.8],
      clusters: [
        [0.74, 0.68],
        [0.64, 0.6],
      ],
      open: true,
    },
    left: {
      type: 'myo',
      activation: [0.9, 0.85, 0.8],
      clusters: [
        [0.74, 0.68],
        [0.64, 0.6],
      ],
      open: true,
    },
    right: {
      type: 'myo',
      activation: [0.84, 0.79, 0.74],
      clusters: [[0.68, 0.62], [0.58]],
      open: true,
    },
  },
  {
    type: 'cluster',
    note: 'fixed count grouped by WIDE intra-rest gaps + solid planned remainder',
    single: {
      type: 'cluster',
      velocities: [0.9, 0.86, 0.82, 0.78, 0.74],
      groupSize: 2,
      planned: 8,
    },
    left: { type: 'cluster', velocities: [0.9, 0.86, 0.82, 0.78, 0.74], groupSize: 2, planned: 8 },
    right: { type: 'cluster', velocities: [0.85, 0.8, 0.76], groupSize: 2, planned: 8 },
  },
]

function BoardBlock({ row }: { row: BoardRow }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <Text
          style={{
            color: '#EDEDED',
            fontSize: 13,
            fontWeight: '800',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {row.type}
        </Text>
        <Text style={{ color: '#8A8A8A', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
          {row.note}
        </Text>
      </View>
      <Text style={{ color: '#5A5A5A', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
        SINGLE HERO
      </Text>
      <VelocityStrip variant="hero" set={row.single} label="This Set" scale="fixed" height={120} />
      <Text style={{ color: '#5A5A5A', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
        DIVERGING DUAL · symmetric structure, right side logs fewer → aligned empties
      </Text>
      <DualVelocityStrip
        left={{ set: row.left, label: LEFT_SLOT }}
        right={{ set: row.right, label: RIGHT_SLOT }}
        variant="hero"
        scale="fixed"
        height={190}
      />
    </View>
  )
}

/**
 * Set-type board — every set type (straight / range / amrap / drop / myo / cluster) rendered as BOTH
 * the single hero and the diverging dual, sharing one bar language via SetBarChart. Both sides of each
 * dual row share ONE index-locked structure (same set params); the right side logs fewer reps, so its
 * un-logged reps render as empty cells aligned under the left's. Replaces the earlier ad-hoc grid.
 */
export const SetTypeCoverage: Story = {
  render: () => (
    <View style={{ gap: 30, padding: 28, width: 660, backgroundColor: '#0E0E0E' }}>
      {BOARD.map((row) => (
        <BoardBlock key={row.type} row={row} />
      ))}
    </View>
  ),
}

/**
 * Symmetric index-lock demo — left logs 5 reps, right logs 3, SAME structure. The dual renders 5
 * aligned columns; the right side's reps 3–4 render as EMPTY cells directly under the left's reps
 * 3–4 (index-locked, never shifted). The next rep a lagging side performs lands at its column.
 */
export const HeroSymmetricEmpties: Story = {
  args: {
    left: { velocities: [0.9, 0.88, 0.86, 0.84, 0.82], label: LEFT_SLOT },
    right: { velocities: [0.85, 0.8, 0.75], label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'fixed',
  },
  decorators: [wallDecorator],
}

/**
 * Small chart height (120px) — the responsive labels DEGRADE: the per-side slot names collapse to
 * initials ("Left"/"Right" → "L"/"R") and the VL20 / VL30 band labels drop entirely (the dashed
 * lines + washes stay). Single-word labels here so the collapse reads as clean L / R.
 */
export const HeroSmallHeightLabels: Story = {
  args: {
    left: { velocities: [0.96, 0.9, 0.83, 0.72], label: 'Left' },
    right: { velocities: [0.9, 0.82, 0.71, 0.6], label: 'Right' },
    variant: 'hero',
    scale: 'fixed',
    height: 120,
  },
  decorators: [wallDecorator],
}

/**
 * Very small height — graceful text degradation. Below the thresholds the VL20 / VL30 labels DROP
 * entirely (the dashed lines + washes stay) and the per-side slot names COLLAPSE to initials, so
 * single-word "Left" / "Right" read as "L" / "R" (a multi-word name would show its initials, e.g.
 * "L A"). No shrinking into an illegible smear.
 */
export const HeroTinyHeight: Story = {
  args: {
    left: { velocities: [0.96, 0.9, 0.83, 0.72], label: 'Left' },
    right: { velocities: [0.9, 0.82, 0.71, 0.6], label: 'Right' },
    variant: 'hero',
    scale: 'fixed',
    height: 72,
  },
  decorators: [wallDecorator],
}

/**
 * Dual COMPACT — the flat resting form of the diverging dual: two flat compact wings (uniform bars,
 * no value labels) sharing the same aligned structure, gutter, and centre axis as the hero. Going
 * from compact to hero only changes the bar HEIGHTS + adds labels — the columns stay put.
 */
export const CompactDual: Story = {
  args: {
    left: { velocities: [0.92, 0.9, 0.88, 0.85], label: 'Left Arm' },
    right: { velocities: [0.85, 0.8, 0.74], label: 'Right Arm' },
    variant: 'compact',
    scale: 'fixed',
  },
  decorators: [wallDecorator],
}
