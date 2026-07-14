import { useState } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VelocityStrip } from './VelocityStrip'

const meta: Meta<typeof VelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip',
  component: VelocityStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Per-rep velocity strip. Three variants: `mini` (a flat 3px static strip), `expanded` ' +
          '(the velocity-HEIGHT bar chart, rounded tops), and `hero` (the across-the-room, single-set ' +
          'wall treatment — tall bars, per-bar value labels, a dashed running-best reference line, and ' +
          'dashed placeholders for the reps still to come via `targetReps`). The `expanded` chrome is ' +
          'prop-driven — with `showNumbers`/`showInfo` on it is the framed chart (raised surface, per-bar ' +
          'm/s labels, mean/loss info row, interactive tap-to-expand); with both off it is a bare strip, ' +
          'the active-set spotlight. `height` sets the plot height; `scale` is `peak` (to the set max) ' +
          'or `fixed` (a fixed ceiling, cross-set-comparable — recommended for the live `hero` so bar ' +
          'heights never reflow as reps land). Feed either `velocities` or a `set` ' +
          'descriptor (set-type aware — see the ' +
          '[modalities](?path=/docs/workout-dataviz-velocitystrip-modalities--docs) sheet).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['mini', 'expanded', 'hero'],
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

/** The flat 3px static strip — the collapsed glance used in cards and rails. */
export const Mini: Story = {
  args: { velocities: mixedSet, variant: 'mini' },
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
  <View style={{ width: 560, padding: 28, backgroundColor: '#0E0E0E' }}>
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
    <View style={{ gap: 24, padding: 24, backgroundColor: '#0E0E0E' }}>
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
    variant: 'mini',
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
            <VelocityStrip velocities={velocities} variant="mini" />
          </View>
        ))}
      </View>
    )
  },
}
