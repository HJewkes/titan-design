import type { Meta, StoryObj } from '@storybook/react-vite'
import { Gauge } from './Gauge'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const meta: Meta<typeof Gauge> = {
  title: 'Components/Atoms/Gauge',
  component: Gauge,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A domain-free segmented dial: a value read against optional threshold bands, with ' +
          'a centred readout. Composes no other component: segments are `View`s and the readout is a ' +
          '`Text`, with theme colours through `useSurfaceMode` and `getSemanticColors`.\n\n' +
          'Empty: a `null` or non-finite `value` draws the unfilled track and a dash readout (pick ' +
          '`null` in the `value` control); `emptyState` replaces the dash. No loading state: the ' +
          'consumer passes a value that is already loaded. No error state: the consumer renders a ' +
          'failure with `Alert`. No disabled state: the gauge is a read-out with nothing to press.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'select',
      options: [0, 34, 55, 68, 88, 100, 120, null],
      labels: { null: 'null (no value)' },
    },
    emptyState: { control: false },
    size: { control: { type: 'range', min: 100, max: 320, step: 10 } },
  },
}
export default meta
type Story = StoryObj<typeof Gauge>

export const Default: Story = {
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
  args: { value: 55, unit: '%', label: 'Coverage', color: t['data-7'], size: 180 },
}

/** Value above max is clamped for the fill but shown verbatim. */
export const OverMax: Story = {
  args: { value: 120, unit: '%', label: 'Load', size: 180 },
}

export const Zero: Story = {
  args: { value: 0, unit: '%', label: 'Health', size: 180 },
}
