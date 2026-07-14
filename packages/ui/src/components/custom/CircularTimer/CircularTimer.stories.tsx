import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { CircularTimer } from './CircularTimer'

const meta: Meta<typeof CircularTimer> = {
  title: 'Custom/CircularTimer',
  component: CircularTimer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A circular countdown / countup with an mm:ss readout in the center — the graphical ' +
          'sibling of `TimerReadout`. Batteries-included: owns `useTimer` (pass controlled ' +
          '`durationMs` + `elapsedMs`) and composes `CircularProgress` for the arc (`down` drains, ' +
          '`up` fills). On completion a `down` timer with a `doneLabel` fills fully in `doneColor` ' +
          'and reads the label (e.g. "GO"). Pass `controls` to render buttons below the ring, or ' +
          "`fill` to make it responsive to its container. `RestTimer`'s `ring` variant wraps this.",
      },
    },
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['down', 'up'] },
    size: { control: { type: 'number', min: 96, max: 280, step: 4 } },
    fill: { control: 'boolean' },
    doneLabel: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof CircularTimer>

const dark: Decorator = (Story) => (
  <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#0E0E0E' }}>
    <Story />
  </View>
)

/** Controls-driven: flip `mode` / `durationMs` / `elapsedMs` / `size` / `doneLabel`. */
export const Playground: Story = {
  args: { durationMs: 120000, elapsedMs: 47000, doneLabel: 'GO', size: 180 },
  decorators: [dark],
}

/** Countdown, midway — the ring drains from full. */
export const CountdownMidway: Story = {
  args: { mode: 'down', durationMs: 120000, elapsedMs: 60000, size: 180 },
  decorators: [dark],
}

/** Countup — the ring fills as time elapses. */
export const CountupMidway: Story = {
  args: { mode: 'up', durationMs: 120000, elapsedMs: 40000, size: 180 },
  decorators: [dark],
}

/** Completed countdown with a done label — full ring, flips to success, reads "GO". */
export const DoneWithLabel: Story = {
  args: { mode: 'down', durationMs: 120000, elapsedMs: 120000, doneLabel: 'GO', size: 180 },
  decorators: [dark],
}

const DemoButton = ({ label }: { label: string }) => (
  <Pressable
    style={{
      backgroundColor: 'rgba(255,255,255,0.06)',
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 8,
    }}
  >
    <Text style={{ color: '#DADADA', fontSize: 11, fontWeight: '600' }}>{label}</Text>
  </Pressable>
)

/** With controls rendered below the ring. */
export const WithControls: Story = {
  args: {
    durationMs: 120000,
    elapsedMs: 47000,
    size: 180,
    controls: (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <DemoButton label="+30s" />
        <DemoButton label="Skip" />
      </View>
    ),
  },
  decorators: [dark],
}
