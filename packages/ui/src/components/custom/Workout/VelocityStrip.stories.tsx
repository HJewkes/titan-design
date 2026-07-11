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
          'Per-rep velocity strip. Three variants: `full` (tap-to-expand chart — flat 3px → 60px ' +
          'with labels + a mean/loss info row), `mini` (flat 3px static), and `compact` (a small ' +
          'fixed-height velocity-HEIGHT spotlight, ~24px, bar height ∝ velocity). Feed either ' +
          '`velocities` (a flat array) or a structured `set` descriptor (set-type aware). See the ' +
          '[set-type modalities](?path=/docs/workout-dataviz-velocitystrip-modalities--docs) sheet.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['full', 'mini', 'compact'],
      description: 'Display variant',
    },
    expanded: {
      control: 'boolean',
      description: 'full variant: expand into the bar chart',
    },
    showInfo: {
      control: 'boolean',
      description: 'full+expanded: show the info row (zone name + loss %)',
    },
    compactHeight: {
      control: { type: 'number', min: 12, max: 48, step: 2 },
      description: 'compact variant: bar-plot height in px (bars scale to this). Default 24.',
    },
    liveRepIndex: {
      control: 'number',
      description: 'full+expanded: index of the newest rep to animate (pop / new-peak bounce)',
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

/** Controls-driven: flip `variant` / `expanded` / `showInfo` / `compactHeight` in the panel. */
export const Playground: Story = {
  args: {
    velocities: moderateSet,
    variant: 'full',
    expanded: true,
    showInfo: true,
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

/** The compact velocity-HEIGHT spotlight (bar height ∝ velocity) — the live-set treatment. */
export const Compact: Story = {
  args: {
    variant: 'compact',
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

/** Tap to expand; tap a bar for its rep. */
export const Interactive: Story = {
  render: () => <InteractiveVelocityStrip />,
}

/** The four zone profiles across every variant, so the color scale reads at a glance. */
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
            <VelocityStrip velocities={velocities} expanded showInfo={false} onToggle={() => {}} />
            <VelocityStrip
              variant="compact"
              set={{ type: 'straight', velocities, planned: velocities.length }}
            />
            <VelocityStrip velocities={velocities} variant="mini" />
          </View>
        ))}
      </View>
    )
  },
}
