import type { Meta, StoryObj } from '@storybook/react-vite'
import { SparkBars } from './SparkBars'

const meta: Meta<typeof SparkBars> = {
  title: 'Components/Charts/SparkBars',
  component: SparkBars,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A tiny bar-mark sparkline for a signed series — the counterpart to ' +
          '[Sparkline](?path=/docs/workout-sparkline--docs). Where a line reads a *trajectory*, ' +
          'bars read *discrete per-period magnitude*. Bars scale on absolute value so a negative ' +
          'period is as tall as an equally large positive one, with the sign carried by fill colour.',
      },
    },
  },
  args: {
    values: [120, 340, -80, 910, 420, 0, 1580, 260, -310, 740, 1120, 90],
    height: 22,
    barWidth: 3,
    gap: 2,
    maxBars: 24,
  },
}
export default meta
type Story = StoryObj<typeof SparkBars>

export const Default: Story = {}

/** All-positive — the plain growth case. */
export const AllPositive: Story = {
  args: { values: [40, 120, 260, 310, 480, 520, 900] },
}

/** All-negative — every bar takes the error token. */
export const AllNegative: Story = {
  args: { values: [-40, -120, -260, -310, -480] },
}

/** Taller field, as used in the file-history growth block. */
export const Tall: Story = {
  args: { height: 34, barWidth: 5, gap: 3 },
}

/** `maxBars` keeps only the most recent values — a sparkline is a glance, not an archive. */
export const Truncated: Story = {
  args: { values: Array.from({ length: 60 }, (_, i) => (i % 7) * 30 - 40), maxBars: 12 },
}

/** An empty series renders an empty field rather than collapsing the layout. */
export const Empty: Story = {
  args: { values: [] },
}
