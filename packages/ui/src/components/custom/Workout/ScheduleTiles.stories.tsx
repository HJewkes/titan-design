import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScheduleTiles } from './ScheduleTiles'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Deterministic reference: fix `now` and offset `when` from it so the `soon`
// accent (and the relative Until text) is stable across renders.
const NOW = Date.now()

const meta: Meta<typeof ScheduleTiles> = {
  title: 'Workout/ScheduleTiles',
  component: ScheduleTiles,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** An HStack of [Tile](?path=/docs/components-atoms-tile--docs); Until reuses [DateTime](?path=/docs/custom-datetime--docs) relative. Used-by ↑ SessionHeader.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ScheduleTiles>

export const TwoDaysOut: Story = {
  args: {
    now: NOW,
    when: NOW + 2 * DAY,
  },
}

export const SoonUnderADay: Story = {
  args: {
    now: NOW,
    when: NOW + 5 * HOUR,
  },
}
