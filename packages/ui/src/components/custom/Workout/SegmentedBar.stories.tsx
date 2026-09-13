import type { Meta, StoryObj } from '@storybook/react-vite'
import { SegmentedBar } from './SegmentedBar'
import { Surface } from '../../ui/surface'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/**
 * `SegmentedBar` — a horizontal track split into weighted, individually-fillable
 * segments. Each segment is a flex slot holding a left-aligned colour fill; `pulse`
 * segments breathe on a shared active-pulse loop and an optional `marker` drops a
 * vertical line at a fraction of the width. Colours are passed-in literal hex.
 */
const meta: Meta<typeof SegmentedBar> = {
  title: 'Custom/Workout/SegmentedBar',
  component: SegmentedBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A horizontal track split into weighted, individually-fillable ' +
          'segments (weight · fill · colour · pulse) with an optional marker line — the ' +
          'presentational primitive the per-set strips build on. ' +
          'Used-by ↑ [SetStrip](?path=/docs/custom-workout-setstrip--docs).',
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
      <Surface level="base" style={{ width: 240, padding: 16 }}>
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SegmentedBar>

export const EqualSegments: Story = {
  args: {
    height: 8,
    segments: [
      { color: primitiveRamps.red[600] },
      { color: t['brand-primary'] },
      { color: t['status-warning'] },
      { color: t['status-success'] },
    ],
  },
}

export const Weighted: Story = {
  args: {
    height: 12,
    gap: 4,
    radius: 2,
    segments: [
      { color: t['status-success'], weight: 3 },
      { color: t['status-warning'], weight: 2 },
      { color: primitiveRamps.red[600], weight: 1 },
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
    radius: 2,
    segments: [
      { color: t['status-success'], fill: 1 },
      { color: t['status-warning'], fill: 0.6 },
      { color: primitiveRamps.cyan[400], fill: 0.3, pulse: true },
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
    radius: 2,
    segments: [{ color: primitiveRamps.cyan[400], fill: 0.7 }],
    marker: { position: 0.5, color: primitiveColors.white },
  },
  parameters: {
    docs: { description: { story: 'A single fill with a target marker at the halfway point.' } },
  },
}
