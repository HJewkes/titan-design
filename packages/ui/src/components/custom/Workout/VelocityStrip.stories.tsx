import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { VelocityStrip } from './VelocityStrip'

const meta: Meta<typeof VelocityStrip> = {
  title: 'Custom/Workout/VelocityStrip',
  component: VelocityStrip,
  tags: ['autodocs'],
  argTypes: {
    expanded: {
      control: 'boolean',
      description: 'Whether the strip is expanded into a bar chart',
    },
    variant: {
      control: 'select',
      options: ['full', 'mini'],
      description: 'Display variant',
    },
    showInfo: {
      control: 'boolean',
      description: 'Whether to show the info row (zone name + loss %) in expanded mode',
    },
  },
}

export default meta
type Story = StoryObj<typeof VelocityStrip>

const fastSet = [1.15, 1.12, 1.08, 1.05, 1.02]
const slowSet = [0.65, 0.58, 0.52, 0.48, 0.42]
const mixedSet = [1.1, 0.95, 0.82, 0.68, 0.55, 0.45]
const moderateSet = [0.88, 0.85, 0.82, 0.78, 0.76]

export const DefaultCollapsed: Story = {
  args: {
    velocities: moderateSet,
    onToggle: () => {},
  },
}

export const Expanded: Story = {
  args: {
    velocities: moderateSet,
    expanded: true,
    onToggle: () => {},
  },
}

export const ExpandedNoInfo: Story = {
  args: {
    velocities: moderateSet,
    expanded: true,
    showInfo: false,
    onToggle: () => {},
  },
}

export const FastEasySet: Story = {
  args: {
    velocities: fastSet,
    expanded: true,
    onToggle: () => {},
  },
}

export const SlowGrindingSet: Story = {
  args: {
    velocities: slowSet,
    expanded: true,
    onToggle: () => {},
  },
}

export const MixedVelocities: Story = {
  args: {
    velocities: mixedSet,
    expanded: true,
    onToggle: () => {},
  },
}

export const Mini: Story = {
  args: {
    velocities: mixedSet,
    variant: 'mini',
  },
}

export const Interactive: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false)
    return (
      <View style={{ width: 300, padding: 16 }}>
        <VelocityStrip
          velocities={moderateSet}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          onRepPress={(index, velocity) =>
            console.log(`Rep ${index + 1}: ${velocity}`)
          }
        />
      </View>
    )
  },
}

export const AllProfiles: Story = {
  render: () => (
    <View style={{ gap: 24, padding: 16 }}>
      <View style={{ gap: 8 }}>
        <VelocityStrip velocities={fastSet} expanded onToggle={() => {}} />
        <VelocityStrip
          velocities={moderateSet}
          expanded
          onToggle={() => {}}
        />
        <VelocityStrip velocities={slowSet} expanded onToggle={() => {}} />
        <VelocityStrip velocities={mixedSet} expanded onToggle={() => {}} />
      </View>
    </View>
  ),
}
