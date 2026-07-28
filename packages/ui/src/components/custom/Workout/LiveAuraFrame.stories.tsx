import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { LiveAuraFrame } from './LiveAuraFrame'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** A representative live-workout hero so the full-surface flood reads against real content. */
function LiveHero({ caption }: { caption: string }) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
      <View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: t['text-tertiary'],
          }}
        >
          Cable Row · Set 4 / 5
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text
          style={{ fontSize: 96, fontWeight: '800', lineHeight: 100, color: t['text-primary'] }}
        >
          8
        </Text>
        <Text
          style={{
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: t['text-tertiary'],
          }}
        >
          reps
        </Text>
      </View>

      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {[
            ['0.42', 'm/s'],
            ['8.5', 'RPE'],
            ['−18%', 'vel loss'],
          ].map(([v, l]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: t['text-primary'] }}>{v}</Text>
              <Text
                style={{
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: t['text-tertiary'],
                }}
              >
                {l}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 12, color: t['text-secondary'], textAlign: 'center' }}>
          {caption}
        </Text>
      </View>
    </View>
  )
}

const PANEL = { width: 360, height: 620, borderRadius: 24, overflow: 'hidden' as const }

const meta: Meta<typeof LiveAuraFrame> = {
  title: 'Workout/LiveAuraFrame',
  component: LiveAuraFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-surface color-flood frame tied to a coaching category. Wraps content on a grey ' +
          'base and layers a radial wash — amber at threshold (VL20), red at stop (VL28+, pulsing) — ' +
          'derived from the semantic warning / error tokens via `alpha()`. Children pass through. ' +
          'Rendered here at live-screen size so the flood reads (it is meant to tint a whole panel, ' +
          'not a card).',
      },
    },
  },
  argTypes: {
    category: {
      control: 'select',
      options: ['productive', 'threshold', 'stop'],
      description: 'Coaching-category flood level',
    },
    pulse: { control: 'boolean', description: 'Pulse the flood on stop' },
  },
  decorators: [
    (Story) => (
      <View
        style={{
          minHeight: 700,
          backgroundColor: '#070707',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <Story />
      </View>
    ),
  ],
  render: (args) => (
    <LiveAuraFrame {...args} style={PANEL}>
      <LiveHero
        caption={
          args.category === 'stop'
            ? 'red flood — VL28+, stop the set'
            : args.category === 'threshold'
              ? 'amber flood — VL20 threshold reached'
              : 'no flood — productive, quiet background'
        }
      />
    </LiveAuraFrame>
  ),
}

export default meta
type Story = StoryObj<typeof LiveAuraFrame>

export const Productive: Story = { args: { category: 'productive' } }
export const Threshold: Story = { args: { category: 'threshold' } }
export const Stop: Story = { args: { category: 'stop' } }

/** All three flood levels side by side at live-screen size. */
export const AllStates: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
      <LiveAuraFrame category="productive" style={PANEL}>
        <LiveHero caption="no flood — productive" />
      </LiveAuraFrame>
      <LiveAuraFrame category="threshold" style={PANEL}>
        <LiveHero caption="amber flood — VL20 threshold" />
      </LiveAuraFrame>
      <LiveAuraFrame category="stop" pulse={false} style={PANEL}>
        <LiveHero caption="red flood — VL28+, stop" />
      </LiveAuraFrame>
    </View>
  ),
}
