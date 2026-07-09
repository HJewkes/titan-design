import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SessionPacePanel } from './SessionPacePanel'

/**
 * 🚧 WIP / placeholder — `SessionPacePanel`: the rail-footer session-pace tile. Ported
 * from the `Lab/Explorations/Session Pace` specimen with hardcoded sample numbers. The
 * real time-model derivation (behind → trim · ahead → add · idle → next-session budget)
 * is VMCP-02.76. Mounts in `SessionRail`'s `footer` slot. Inline styles are provisional.
 */
const meta: Meta<typeof SessionPacePanel> = {
  title: 'Shell/SessionRail/SessionPacePanel',
  component: SessionPacePanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**🚧 WIP / placeholder.** **Organism** (shell S3). The rail-footer pace tile — ' +
          'behind → what to trim · ahead → what to add · idle → next-session budget. ' +
          'Presentational with sample numbers; the session time-model derivation is ' +
          'VMCP-02.76. Mounts in [SessionRail](?path=/docs/shell-sessionrail--docs)`s ' +
          '`footer` slot. Inline styles provisional.',
      },
    },
  },
  argTypes: {
    state: { control: 'select', options: ['behind', 'ahead', 'idle'] },
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#0A0A0A', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SessionPacePanel>

export const Behind: Story = {
  args: { state: 'behind' },
}

export const Ahead: Story = {
  args: { state: 'ahead' },
}

export const Idle: Story = {
  args: { state: 'idle' },
  parameters: {
    docs: {
      description: { story: 'Pre-session — the next-session budget, before any set streams.' },
    },
  },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32, flexWrap: 'wrap' }}>
      <SessionPacePanel state="behind" />
      <SessionPacePanel state="ahead" />
      <SessionPacePanel state="idle" />
    </View>
  ),
}
