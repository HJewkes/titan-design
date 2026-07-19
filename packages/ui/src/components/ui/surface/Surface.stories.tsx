import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Surface } from './Surface'
import { useOnSurfaceColor, type SurfaceLevel } from './SurfaceContext'
import type { ElevationLevel } from '../../../theme/elevation'

const meta: Meta<typeof Surface> = {
  title: 'Components/Atoms/Surface',
  component: Surface,
  tags: ['autodocs'],
  argTypes: {
    elevation: {
      control: { type: 'range', min: -2, max: 5, step: 1 },
      description: 'Elevation level (-2 to 5)',
    },
    level: {
      control: 'select',
      options: ['background', 'base', 'elevated', 'raised', 'overlay'],
      description: 'Named charcoal plane (flat background from a semantic token)',
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Color theme (also seeds the on-surface colour context)',
    },
    glowColor: {
      control: 'color',
      description: 'Optional glow color (hex)',
    },
    glowIntensity: {
      control: 'select',
      options: ['subtle', 'medium', 'strong'],
      description: 'Glow intensity level',
    },
  },
}

export default meta
type Story = StoryObj<typeof Surface>

export const Default: Story = {
  args: {
    elevation: 2,
    theme: 'dark',
  },
  render: (args) => (
    <Surface {...args} style={{ padding: 24 }}>
      <Text style={{ color: '#fff' }}>Default Surface</Text>
    </Surface>
  ),
}

export const ElevationLevels: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      {([-2, -1, 0, 1, 2, 3, 4, 5] as ElevationLevel[]).map((level) => (
        <Surface key={level} elevation={level} style={{ padding: 16 }}>
          <Text style={{ color: '#fff' }}>Elevation {level}</Text>
        </Surface>
      ))}
    </View>
  ),
}

export const WithGlow: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      <Surface elevation={2} glowColor="#FF7900" glowIntensity="subtle" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Subtle Orange Glow</Text>
      </Surface>
      <Surface elevation={2} glowColor="#FF7900" glowIntensity="medium" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Medium Orange Glow</Text>
      </Surface>
      <Surface elevation={2} glowColor="#FF7900" glowIntensity="strong" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Strong Orange Glow</Text>
      </Surface>
      <Surface elevation={2} glowColor="#22C55E" glowIntensity="medium" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Green Glow (Success)</Text>
      </Surface>
      <Surface elevation={2} glowColor="#EF4444" glowIntensity="medium" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Red Glow (Error)</Text>
      </Surface>
    </View>
  ),
}

// The named-plane model: flat, full-bleed charcoal planes straight from the
// semantic surface tokens — reaching the darker nav/page shades the numeric
// lighten model can't. These back the shell / rail / stage.
export const NamedPlanes: Story = {
  render: () => (
    <View style={{ gap: 12, padding: 24 }}>
      {(['background', 'base', 'elevated', 'raised', 'overlay'] as SurfaceLevel[]).map((level) => (
        <Surface key={level} level={level} style={{ padding: 16 }}>
          <Text style={{ color: '#fff' }}>level=&quot;{level}&quot;</Text>
        </Surface>
      ))}
    </View>
  ),
}

// On-surface colour context: descendant text reads its colour from the Surface
// via `useOnSurfaceColor` — no hard-coded hex, so it never renders black when the
// tree mounts as raw RN in the standalone wall SPA.
function OnSurfaceLabels() {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: useOnSurfaceColor('primary'), fontSize: 16, fontWeight: '700' }}>
        Primary on this surface
      </Text>
      <Text style={{ color: useOnSurfaceColor('secondary') }}>Secondary on this surface</Text>
      <Text style={{ color: useOnSurfaceColor('tertiary') }}>Tertiary on this surface</Text>
    </View>
  )
}

export const OnSurfaceText: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      <Surface level="background" style={{ padding: 16 }}>
        <OnSurfaceLabels />
      </Surface>
      <Surface theme="light" level="base" style={{ padding: 16 }}>
        <OnSurfaceLabels />
      </Surface>
    </View>
  ),
}

export const LightTheme: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24, backgroundColor: '#F3F4F6' }}>
      {([0, 1, 2, 3, 4, 5] as ElevationLevel[]).map((level) => (
        <Surface key={level} elevation={level} theme="light" style={{ padding: 16 }}>
          <Text style={{ color: '#111' }}>Light Elevation {level}</Text>
        </Surface>
      ))}
    </View>
  ),
}
