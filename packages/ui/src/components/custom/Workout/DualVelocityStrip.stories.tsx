import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DualVelocityStrip } from './VelocityStrip'

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
      CONCENTRIC VELOCITY · L / R VOLTRA · THIS SET · (organism chrome — not the component)
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
          '**Composes** the [VelocityStrip](?path=/docs/workout-dataviz-velocitystrip--docs) machinery ' +
          '(slot model, zone colour scale, hero geometry, and the shared live-rep pop) into the ' +
          'two-device diverging wall chart. LEFT voltra reps grow **UP** and RIGHT reps grow **DOWN** ' +
          'from one shared centre axis — one mirrored pair per rep index — so the L/R asymmetry reads ' +
          'pre-attentively as the silhouette. **Side is POSITION only, never hue**: both wings colour ' +
          'reps by velocity zone. Each side takes a `DualVelocityStream` (`velocities` OR a structured ' +
          '`set`), the same shapes `VelocityStrip` accepts. Two scales: `hero` (across-the-room wall — ' +
          'tall wings, per-rep m/s labels, a dashed running-best reference line per side) and `rail` ' +
          '(compact rail-expanded — same diverging form, no labels or reference lines). Single-voltra ' +
          'sets keep using `VelocityStrip variant="hero"`.',
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
 * Set-type variants — the up wing runs a `range` (committed reps → a cyan variable window) while the down
 * wing runs an `amrap` (done reps → a trailing cyan "continue"). Both draw through the shared slot vocabulary.
 */
export const HeroSetTypes: Story = {
  args: {
    left: {
      set: { type: 'range', velocities: [0.9, 0.87, 0.84, 0.8], floor: 6, max: 8 },
      label: LEFT_SLOT,
    },
    right: { set: { type: 'amrap', velocities: [0.82, 0.78, 0.73, 0.67, 0.6] }, label: RIGHT_SLOT },
    variant: 'hero',
    scale: 'fixed',
  },
  decorators: [wallDecorator],
}

/**
 * A `myo` (rest-pause) set on the up wing — activation + clusters + (`open`) a trailing cyan continue —
 * mirrored against a straight down-wing set. Every activation/cluster rep and the continue draw through the
 * shared slot vocabulary; note the dual aligns by rep index, so the wide-notch chunk GAPS the single
 * strip draws are intentionally dropped here (per-side gaps would break the mirrored up↔down alignment).
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
