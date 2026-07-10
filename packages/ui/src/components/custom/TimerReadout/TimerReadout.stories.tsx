import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { TimerReadout } from './TimerReadout'

/**
 * `TimerReadout` — a small textual timer (⏱ + mono, right-justified) built on the
 * `useTimer` hook. Only the live/current value goes green (status-live-muted) while
 * `running`; the ` / total` suffix stays dim tertiary.
 */
const meta: Meta<typeof TimerReadout> = {
  title: 'Custom/TimerReadout',
  component: TimerReadout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '**Atom.** A small textual timer on [useTimer]. Used-by ↑ SessionHeader.',
      },
    },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16, backgroundColor: '#131313', alignItems: 'flex-end', width: 200 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TimerReadout>

/** Live stopwatch (controlled), ticking → the elapsed value is green. */
export const Running: Story = {
  args: { mode: 'up', elapsedMs: 42 * 60000 + 18 * 1000, running: true },
}

/** Paused → the value drops to secondary (no live cue). */
export const Paused: Story = {
  args: { mode: 'up', elapsedMs: 42 * 60000 + 18 * 1000, running: false },
}

/** Countdown, running → shows remaining time, green while live. */
export const CountdownRunning: Story = {
  args: { mode: 'down', durationMs: 90 * 1000, elapsedMs: 27 * 1000, running: true },
}

/** With a ` / total` budget suffix (dim tertiary). */
export const WithTotal: Story = {
  args: {
    mode: 'up',
    elapsedMs: 42 * 60000 + 18 * 1000,
    durationMs: 60 * 60000,
    showTotal: true,
    running: true,
  },
}

/** Self-ticking stopwatch — the internal interval advances the value once per second. */
export const LiveAutoTick: Story = {
  args: { mode: 'up', autoTick: true, running: true },
}
