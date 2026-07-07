import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SessionStatePill } from './SessionStatePill'

const meta: Meta<typeof SessionStatePill> = {
  title: 'Shell/Molecules/SessionStatePill',
  component: SessionStatePill,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** (= the ledger’s StatusPill). Composes ' +
          '[Indicator](?path=/docs/components-indicator--docs) (pulse: `ping` for live, vivid color) + ' +
          '[Typography](?path=/docs/custom-typography--docs) (`monoLabel`).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SessionStatePill>

export const AllStates: Story = {
  render: () => (
    <View className="flex-row gap-6">
      <SessionStatePill state="live" />
      <SessionStatePill state="rest" />
      <SessionStatePill state="idle" />
    </View>
  ),
}

export const Live: Story = { args: { state: 'live' } }
export const Rest: Story = { args: { state: 'rest' } }
export const Idle: Story = { args: { state: 'idle' } }
