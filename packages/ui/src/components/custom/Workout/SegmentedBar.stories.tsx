import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SegmentedBar } from './SegmentedBar'

/**
 * `SegmentedBar` — a horizontal track split into weighted, individually-fillable
 * segments. Each segment is a flex slot holding a left-aligned colour fill; `pulse`
 * segments breathe on a shared active-pulse loop and an optional `marker` drops a
 * vertical line at a fraction of the width. Colours are passed-in literal hex.
 */
const meta: Meta<typeof SegmentedBar> = {
  title: 'Workout/SegmentedBar',
  component: SegmentedBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A horizontal track split into weighted, individually-fillable ' +
          'segments (weight · fill · colour · pulse) with an optional marker line — the ' +
          'presentational primitive the per-set strips build on. ' +
          'Used-by ↑ [SetStrip](?path=/docs/workout-setstrip--docs).',
      },
    },
  },
  argTypes: {
    height: { control: { type: 'range', min: 2, max: 24, step: 1 } },
    gap: { control: { type: 'range', min: 0, max: 12, step: 1 } },
    radius: { control: { type: 'range', min: 0, max: 12, step: 1 } },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 240, padding: 16, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SegmentedBar>

export const EqualSegments: Story = {
  args: {
    height: 8,
    segments: [
      { color: '#D14343' },
      { color: '#FF7900' },
      { color: '#F9B415' },
      { color: '#2ED573' },
    ],
  },
}

export const Weighted: Story = {
  args: {
    height: 12,
    gap: 4,
    radius: 6,
    segments: [
      { color: '#2ED573', weight: 3 },
      { color: '#F9B415', weight: 2 },
      { color: '#D14343', weight: 1 },
    ],
  },
  parameters: {
    docs: { description: { story: 'Segments sized by `weight`, with a gap and rounded slots.' } },
  },
}

export const PartialFills: Story = {
  args: {
    height: 12,
    gap: 4,
    radius: 6,
    segments: [
      { color: '#2ED573', fill: 1 },
      { color: '#F9B415', fill: 0.6 },
      { color: '#01B5D1', fill: 0.3, pulse: true },
    ],
  },
  parameters: {
    docs: {
      description: { story: 'Each slot fills a fraction of its width; the last one pulses.' },
    },
  },
}

export const WithMarker: Story = {
  args: {
    height: 10,
    radius: 5,
    segments: [{ color: '#01B5D1', fill: 0.7 }],
    marker: { position: 0.5, color: '#FFFFFF' },
  },
  parameters: {
    docs: { description: { story: 'A single fill with a target marker at the halfway point.' } },
  },
}
