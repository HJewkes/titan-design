import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { LiveAuraFrame } from './LiveAuraFrame'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function AuraContent({ caption }: { caption: string }) {
  return (
    <View style={{ padding: 18 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: t['text-tertiary'],
        }}
      >
        Cable Row · Set 4/5
      </Text>
      <Text style={{ marginTop: 8, fontSize: 12, color: t['text-secondary'] }}>{caption}</Text>
    </View>
  )
}

const meta: Meta<typeof LiveAuraFrame> = {
  title: 'Workout/LiveAuraFrame',
  component: LiveAuraFrame,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Full-surface color-flood frame tied to a coaching category. Wraps content on a charcoal ' +
          'base and layers a radial wash — amber at threshold (VL20), red at stop (VL28+, pulsing) — ' +
          'derived from the semantic warning / error tokens via `alpha()`. Children pass through.',
      },
    },
  },
  argTypes: {
    category: {
      control: 'select',
      options: ['productive', 'threshold', 'stop'],
      description: 'Coaching-category flood level',
    },
    pulse: {
      control: 'boolean',
      description: 'Pulse the flood on stop',
    },
  },
  render: (args) => (
    <LiveAuraFrame {...args} style={{ width: 420 }}>
      <AuraContent
        caption={
          args.category === 'stop'
            ? 'aura: red — VL28+, pulses'
            : args.category === 'threshold'
              ? 'aura: amber — VL20 threshold reached'
              : 'aura: none — productive, quiet background'
        }
      />
    </LiveAuraFrame>
  ),
}

export default meta
type Story = StoryObj<typeof LiveAuraFrame>

export const Productive: Story = {
  args: { category: 'productive' },
}

export const Threshold: Story = {
  args: { category: 'threshold' },
}

export const Stop: Story = {
  args: { category: 'stop' },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 14 }}>
      <LiveAuraFrame category="productive" style={{ width: 420 }}>
        <AuraContent caption="aura: none — productive, quiet background" />
      </LiveAuraFrame>
      <LiveAuraFrame category="threshold" style={{ width: 420 }}>
        <AuraContent caption="aura: amber — VL20 threshold reached" />
      </LiveAuraFrame>
      <LiveAuraFrame category="stop" pulse={false} style={{ width: 420 }}>
        <AuraContent caption="aura: red — VL28+, stop the set" />
      </LiveAuraFrame>
    </View>
  ),
}
