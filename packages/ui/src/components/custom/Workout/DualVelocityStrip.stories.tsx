// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DualVelocityStrip } from './VelocityStrip'
import { greyRamp, primitiveColors } from '../../../theme/tokens/primitives'

const PAGE_BG = greyRamp[975]
const PANEL_BG = greyRamp[950]
const LIST_BG = greyRamp[925]

/** Bilateral cable chest press, LEFT dominant / RIGHT lagging, 6 of 8 reps done. */
const LEFT = [0.54, 0.52, 0.5, 0.48, 0.46, 0.44]
const RIGHT = [0.49, 0.47, 0.45, 0.42, 0.4, 0.38]

const meta: Meta<typeof DualVelocityStrip> = {
  title: 'Workout/DataViz/DualVelocityStrip',
  component: DualVelocityStrip,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dual-voltra (bilateral) DIVERGING per-rep velocity chart. LEFT reps grow UP, ' +
          'RIGHT reps grow DOWN from one shared centre axis — one mirrored pair per rep index — ' +
          'so a left-dominant / right-lagging set reads pre-attentively as an asymmetric ' +
          'silhouette. Reuses VelocityStrip’s slot vocabulary (rep / todo / variable / ' +
          'continue), its velocity-zone colors, hero geometry, and the live-rep pop. Color is ' +
          'ALWAYS the velocity zone; SIDE is encoded by position only, never hue. `variant="hero"` ' +
          'is the wall scale (value labels + per-side running-best reference lines); `variant="rail"` ' +
          'is the compact rail-expanded scale. Single-voltra sets keep using VelocityStrip.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['hero', 'rail'] },
    targetReps: { control: 'number' },
    liveRepIndex: { control: 'number' },
    height: { control: { type: 'number', min: 48, max: 320, step: 4 } },
    scale: { control: 'inline-radio', options: ['peak', 'fixed'] },
  },
}
export default meta
type Story = StoryObj<typeof DualVelocityStrip>

function Panel({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <View style={{ width, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 12 }}>
      {children}
    </View>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 24 }}>
      {children}
    </View>
  )
}

/** HERO — the across-the-room bilateral live chart, L up / R down from the centre axis. */
export const Hero: Story = {
  args: { variant: 'hero', targetReps: 8, liveRepIndex: 5, height: 280, scale: 'peak' },
  render: (args) => (
    <Page>
      <Panel width={760}>
        <Text
          style={{
            color: primitiveColors.white,
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 15,
            fontWeight: '700',
          }}
        >
          Hero — dual diverging velocity
        </Text>
        <DualVelocityStrip {...args} left={{ velocities: LEFT }} right={{ velocities: RIGHT }} />
      </Panel>
    </Page>
  ),
}

/** RAIL — the same diverging language at the compact rail-expanded scale (no labels/refs). */
export const RailExpanded: Story = {
  args: { variant: 'rail', targetReps: 8, height: 84 },
  render: (args) => (
    <Page>
      <Panel width={320}>
        <Text
          style={{
            color: primitiveColors.white,
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          Rail expanded — same language, smaller
        </Text>
        <View style={{ backgroundColor: LIST_BG, borderRadius: 8, padding: 12 }}>
          <DualVelocityStrip {...args} left={{ velocities: LEFT }} right={{ velocities: RIGHT }} />
        </View>
      </Panel>
    </Page>
  ),
}

/** A range set on both sides — shows the cyan variable-window slots mirrored past the floor. */
export const RangeSet: Story = {
  args: { variant: 'hero', height: 260, scale: 'peak' },
  render: (args) => (
    <Page>
      <Panel width={760}>
        <Text
          style={{
            color: primitiveColors.white,
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 15,
            fontWeight: '700',
          }}
        >
          Range set — variable window mirrored both sides
        </Text>
        <DualVelocityStrip
          {...args}
          left={{ set: { type: 'range', velocities: LEFT.slice(0, 5), floor: 6, max: 10 } }}
          right={{ set: { type: 'range', velocities: RIGHT.slice(0, 5), floor: 6, max: 10 } }}
        />
      </Panel>
    </Page>
  ),
}
