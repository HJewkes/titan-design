import type { Meta, StoryObj } from '@storybook/react-vite'
import { GapIndicator } from './GapIndicator'
import { SESSION_DEFAULT } from './session-fixture'

const RESUMED = SESSION_DEFAULT.gaps[1]?.endMs ?? null

const meta: Meta<typeof GapIndicator> = {
  title: 'Custom/Session/GapIndicator',
  component: GapIndicator,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { durationMs: 1_920_000, resumedAtMs: RESUMED, showDate: false, isUTC: true },
  argTypes: {
    durationMs: { control: 'number' },
    resumedAtMs: { control: 'number' },
    showDate: { control: 'boolean' },
    isUTC: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A hairline with the idle time between two turns, and the resume date ' +
          'after a day change. Composes [Divider](?path=/docs/components-atoms-divider--docs) + ' +
          '[Typography](?path=/docs/foundations-typography--docs) + ' +
          '[DateTime](?path=/docs/components-molecules-datetime--docs). No loading, empty, error ' +
          'or disabled state: the host renders one only where the data marks a gap, and a span ' +
          'that is not a duration prints the placeholder.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof GapIndicator>

export const Default: Story = {}
