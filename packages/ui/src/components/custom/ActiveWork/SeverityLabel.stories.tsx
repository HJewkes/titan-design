import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SeverityLabel, SEVERITY_ORDER } from './SeverityLabel'

/**
 * **SeverityLabel** — a task's severity as a coloured dot plus its label.
 * Composes `Indicator`; the family's single owner of the severity vocabulary
 * (type, order, rank, dot and bar colours).
 */
const meta: Meta<typeof SeverityLabel> = {
  title: 'Custom/ActiveWork/SeverityLabel',
  component: SeverityLabel,
  args: { severity: 'high' },
  argTypes: {
    severity: { control: 'select', options: [...SEVERITY_ORDER, undefined] },
    dotOnly: { control: 'boolean' },
  },
  parameters: {
    docs: { description: { component: 'Composes **Indicator** · **Typography**.' } },
  },
}
export default meta

type Story = StoryObj<typeof SeverityLabel>

export const Default: Story = {}

/** All four severities, worst-first — the canonical `SEVERITY_ORDER`. */
export const AllSeverities: Story = {
  render: () => (
    <View className="gap-2">
      {SEVERITY_ORDER.map((severity) => (
        <SeverityLabel key={severity} severity={severity} />
      ))}
    </View>
  ),
}

/** Dot only, for a legend key or a very tight column. */
export const DotOnly: Story = {
  args: { dotOnly: true },
}

/**
 * Unset severity renders an em-dash rather than nothing, so a table column keeps
 * its alignment instead of collapsing.
 */
export const Unset: Story = {
  args: { severity: undefined },
}
