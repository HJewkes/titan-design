import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MesoStatusCard } from './MesoStatusCard'

const meta: Meta<typeof MesoStatusCard> = {
  title: 'Workout/MesoStatusCard',
  component: MesoStatusCard,
  tags: ['autodocs'],
  argTypes: {
    mesoName: {
      control: 'text',
      description: 'Mesocycle name shown in the header',
    },
    mesoSubtitle: {
      control: 'text',
      description: 'Context line, e.g. "Week 6 of 8 · Upper/Lower"',
    },
    statusBadge: {
      control: 'object',
      description: 'Header status pill { label, variant }',
    },
    metrics: {
      control: 'object',
      description: 'Prescription-vs-actual metrics, rendered as a 2x2 grid',
    },
    gauges: {
      control: 'object',
      description: 'Intensity / volume gauges (level 0-1, optional sublabel)',
    },
    coaching: {
      control: 'object',
      description: 'Optional coaching box with optional bold highlights',
    },
    nextTarget: {
      control: 'object',
      description: 'Optional next-session target box { icon, text }',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 380, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MesoStatusCard>

export const Default: Story = {
  args: {
    mesoName: 'Hypertrophy Block',
    mesoSubtitle: 'Week 6 of 8 · Upper/Lower',
    statusBadge: { label: 'On Track', variant: 'success' },
    metrics: [
      { label: 'Prescribed', value: '3×8 @ RPE 8' },
      { label: 'Actual', value: '3×8 @ 185 lbs' },
      { label: 'Volume', value: '+12% vs wk 1' },
      { label: 'e1RM', value: '232 lbs' },
    ],
    gauges: [
      { label: 'Intensity', level: 0.68, sublabel: 'Actual' },
      { label: 'Volume', level: 0.82, sublabel: 'vs MRV' },
    ],
    coaching: {
      text: 'Velocity is holding well — add load next session to keep intensity progressive.',
      highlights: ['add load'],
    },
    nextTarget: { icon: '→', text: 'Next: 190 lbs × 8 @ RPE 8.5' },
  },
}

export const Warning: Story = {
  args: {
    ...Default.args,
    mesoName: 'Intensification',
    mesoSubtitle: 'Week 7 of 8 · Push/Pull/Legs',
    statusBadge: { label: 'Watch Fatigue', variant: 'warning' },
    gauges: [
      { label: 'Intensity', level: 0.78, sublabel: 'Actual' },
      { label: 'Volume', level: 0.94, sublabel: 'vs MRV' },
    ],
    coaching: {
      text: 'Velocity loss is creeping up. Hold load and reduce one set to manage fatigue.',
      highlights: ['Hold load', 'reduce one set'],
    },
  },
}

export const Overreaching: Story = {
  args: {
    ...Default.args,
    mesoName: 'Peaking Block',
    mesoSubtitle: 'Week 8 of 8 · Upper/Lower',
    statusBadge: { label: 'Deload Soon', variant: 'error' },
    metrics: [
      { label: 'Prescribed', value: '4×5 @ RPE 9' },
      { label: 'Actual', value: '4×4 @ 205 lbs' },
      { label: 'Volume', value: '−8% vs wk 6' },
      { label: 'e1RM', value: '241 lbs' },
    ],
    gauges: [
      { label: 'Intensity', level: 0.92, sublabel: 'Actual' },
      { label: 'Volume', level: 0.45, sublabel: 'vs MRV' },
    ],
    coaching: {
      text: 'Bar speed has dropped sharply across sessions. Schedule a deload next week.',
      highlights: ['deload'],
    },
    nextTarget: { icon: '↓', text: 'Next: deload — 60% × 3×5' },
  },
}

export const Minimal: Story = {
  args: {
    mesoName: 'Base Phase',
    mesoSubtitle: 'Week 2 of 6 · Full Body',
    statusBadge: { label: 'On Track', variant: 'success' },
    metrics: [
      { label: 'Prescribed', value: '3×10 @ RPE 7' },
      { label: 'Actual', value: '3×10 @ 135 lbs' },
    ],
    gauges: [{ label: 'Intensity', level: 0.5 }],
  },
}
