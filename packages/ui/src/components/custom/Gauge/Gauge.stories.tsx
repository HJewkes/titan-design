import type { Meta, StoryObj } from '@storybook/react-vite'
import { Gauge } from './Gauge'

const meta: Meta<typeof Gauge> = {
  title: 'Components/DataViz/Gauge',
  component: Gauge,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: { type: 'range', min: 100, max: 320, step: 10 } },
  },
}
export default meta
type Story = StoryObj<typeof Gauge>

export const Healthy: Story = {
  args: { value: 88, unit: '%', label: 'Health', size: 180 },
}

export const Warning: Story = {
  args: { value: 68, unit: '%', label: 'Health', size: 180 },
}

export const Critical: Story = {
  args: { value: 34, unit: '%', label: 'Health', size: 180 },
}

/** A codewatch-style status readout — arbitrary domain, no unit. */
export const ArbitraryDomain: Story = {
  args: { value: 7.4, min: 0, max: 10, label: 'Maintainability', size: 200 },
}

/** Single-color override ignores the threshold bands. */
export const OverrideColor: Story = {
  args: { value: 55, unit: '%', label: 'Coverage', color: '#5B9BD5', size: 180 },
}

/** Value above max is clamped for the fill but shown verbatim. */
export const OverMax: Story = {
  args: { value: 120, unit: '%', label: 'Load', size: 180 },
}

export const Zero: Story = {
  args: { value: 0, unit: '%', label: 'Health', size: 180 },
}
