import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
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
          'Per-rep velocity strip. Two variants: `mini` (a flat 3px static strip) and `expanded` ' +
          '(the velocity-HEIGHT bar chart, rounded tops). The `expanded` chrome is prop-driven — ' +
          'with `showNumbers`/`showInfo` on it is the framed chart (raised surface, per-bar m/s ' +
          'labels, mean/loss info row, interactive tap-to-expand); with both off it is a bare strip, ' +
          'the active-set spotlight. `height` sets the plot height; `scale` is `peak` (to the set max) ' +
          'or `fixed` (a fixed ceiling, cross-set-comparable). Feed either `velocities` or a `set` ' +
          'descriptor (set-type aware — see the ' +
          '[modalities](?path=/docs/workout-dataviz-velocitystrip-modalities--docs) sheet).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['mini', 'expanded'],
      description: 'Display variant',
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
      control: { type: 'number', min: 12, max: 96, step: 2 },
      description: 'expanded plot height in px (bars scale to this). Default 60.',
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
  const [expanded, setExpanded] = useState(false)
  return (
    <View style={{ width: 300, padding: 16 }}>
      <VelocityStrip
        velocities={moderateSet}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        onRepPress={(index, velocity) => console.log(`Rep ${index + 1}: ${velocity}`)}
      />
    </View>
  )
}

/** Tap to expand (3px ↔ chart); tap a bar for its rep. */
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
