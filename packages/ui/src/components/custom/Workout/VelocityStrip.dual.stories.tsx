import type { Meta, StoryObj } from '@storybook/react-vite'
import { DualVelocityStrip } from './VelocityStrip'
import {
  LEFT_SLOT,
  RIGHT_SLOT,
  REP_SET,
  REP_SET_LAGGING,
  IN_PROGRESS_SET,
  IN_PROGRESS_LAGGING,
  dualOf,
  wallDecorator,
} from './velocity-story-kit'

/**
 * `DualVelocityStrip` — the strip when the exercise used TWO Voltras.
 *
 * Dual is **not a fourth view**, so its scenario coverage lives in the
 * per-view groups, where every scenario renders single ABOVE dual on one
 * dataset:
 * [Compact](?path=/docs/workout-dataviz-velocitystrip-compact--docs) ·
 * [Expanded](?path=/docs/workout-dataviz-velocitystrip-expanded--docs) ·
 * [Hero](?path=/docs/workout-dataviz-velocitystrip-hero--docs).
 *
 * This group exists for the two things a pairing cannot carry: the exported
 * **API** (`DualVelocityStripProps`, in the args table below) and the layout
 * **extremes** — heights at which the labels have to degrade, and mismatched
 * rep counts that must stay index-locked.
 *
 * The `hero` variant is literally two composed `VelocityStrip` heroes — an
 * `orientation="up"` hero over a mirrored `orientation="down"` one, sharing ONE
 * height scale and meeting at one centre axis — so every hero improvement
 * reaches the dual for free. The up wing grows UP and the down wing grows DOWN,
 * so asymmetry reads pre-attentively as the silhouette: a stronger side reads
 * TALLER, while each wing still colours by its OWN best. **Side is POSITION
 * only, never hue.** Each side takes a `DualVelocityStream` (`velocities` OR a
 * structured `set`, plus an optional `label`); the vertical edge label is DATA,
 * not a hardcoded side. Single-slot sets keep using `VelocityStrip`.
 */
const meta: Meta<typeof DualVelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip/Dual',
  component: DualVelocityStrip,
  tags: ['autodocs'],
  decorators: [wallDecorator],
  argTypes: {
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
    variant: {
      control: 'inline-radio',
      options: ['hero', 'compact', 'rail'],
      description:
        'hero (wall: labels + reference lines), compact (flat resting fold), or rail (lean, neither)',
    },
    scale: {
      control: 'inline-radio',
      options: ['peak', 'fixed'],
      description:
        'bar scaling, shared across both wings: peak (pair max) or fixed (cross-set ceiling)',
    },
    barColor: {
      control: 'inline-radio',
      options: ['zone', 'loss'],
      description: 'per-wing loss (default) or the shared absolute zone scale; never encodes side',
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
    zones: { control: false, description: 'Velocity-zone bands (WA); default scale when absent' },
  },
}
export default meta
type Story = StoryObj<typeof DualVelocityStrip>

// ── The API surface ─────────────────────────────────────────────────────────

/** Controls-driven: flip `variant` / `scale` / `barColor` / `targetReps` / `height`, edit each stream's `label` + data. */
export const Playground: Story = {
  args: {
    left: dualOf(REP_SET, LEFT_SLOT),
    right: dualOf(REP_SET_LAGGING, RIGHT_SLOT),
    variant: 'hero',
    scale: 'peak',
    height: 200,
  },
}

// ── The two canonical states ────────────────────────────────────────────────
// Deliberately minimal — the scenario pairs in the view groups carry breadth.

/** Both sides done, the lagging side one rep short — the everyday finished dual set. */
export const Default: Story = {
  args: {
    left: dualOf(REP_SET, LEFT_SLOT),
    right: dualOf(REP_SET_LAGGING, RIGHT_SLOT),
    variant: 'hero',
    scale: 'fixed',
    height: 200,
  },
}

/**
 * Mid-set and live: 4 of 8 planned on the up wing, 3 on the down, newest rep
 * animating in. The remainder draws as mirrored dashed stubs on both wings, so
 * the columns are reserved and the set never reflows as reps land — which is
 * also why a live dual should run `scale="fixed"`.
 */
export const InProgress: Story = {
  args: {
    left: dualOf(IN_PROGRESS_SET, LEFT_SLOT),
    right: dualOf(IN_PROGRESS_LAGGING, RIGHT_SLOT),
    variant: 'hero',
    scale: 'fixed',
    targetReps: 8,
    liveRepIndex: 3,
    height: 200,
  },
}

// ── Layout extremes ─────────────────────────────────────────────────────────
// Recovered from the pre-reorg DualVelocityStrip stories. Unit tests cover the
// behaviour; these cover the SURFACE — label placement and collision at full
// width is a class of bug the tests have already missed once (TD-07.10).

/**
 * Symmetric index-lock — the up wing logs 5 reps, the down wing 3, same
 * structure. The dual renders 5 aligned columns and the down side's reps 4–5
 * render as EMPTY cells directly under the up side's (index-locked, never
 * shifted). The next rep a lagging side performs lands at its own column.
 */
export const SymmetricEmpties: Story = {
  args: {
    left: dualOf([0.9, 0.88, 0.86, 0.84, 0.82], LEFT_SLOT),
    right: dualOf([0.85, 0.8, 0.75], RIGHT_SLOT),
    variant: 'hero',
    scale: 'fixed',
  },
}

/**
 * Small height (120px) — each wing gets ~59px rather than the full hero
 * sentinel, and the responsive text DEGRADES: the per-side slot names collapse
 * to initials ("Left"/"Right" → "L"/"R") and the VL20 / VL30 band labels drop
 * entirely, while the dashed lines + washes stay.
 */
export const SmallHeightLabels: Story = {
  args: {
    left: dualOf([0.96, 0.9, 0.83, 0.72], LEFT_SLOT),
    right: dualOf([0.9, 0.82, 0.71, 0.6], RIGHT_SLOT),
    variant: 'hero',
    scale: 'fixed',
    height: 120,
  },
}

/**
 * Very small height (72px) — the floor of graceful degradation. Below the
 * thresholds the VL20 / VL30 labels are gone and the slot names are down to
 * initials (a multi-word name would show its initials, e.g. "L A"). No
 * shrinking into an illegible smear.
 */
export const TinyHeight: Story = {
  args: {
    left: dualOf([0.96, 0.9, 0.83, 0.72], LEFT_SLOT),
    right: dualOf([0.9, 0.82, 0.71, 0.6], RIGHT_SLOT),
    variant: 'hero',
    scale: 'fixed',
    height: 72,
  },
}
