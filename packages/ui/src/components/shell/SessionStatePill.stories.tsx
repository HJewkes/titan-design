import type { Meta, StoryObj } from '@storybook/react-vite'
import { SessionStatePill } from './SessionStatePill'

const meta: Meta<typeof SessionStatePill> = {
  title: 'Shell/TopBar/SessionStatePill',
  component: SessionStatePill,
  tags: ['autodocs'],
  args: { state: 'live' },
  argTypes: {
    state: { control: 'select', options: ['live', 'rest', 'idle'] },
    label: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** (= the ledger’s reusable StatusPill — also used by the Live-view header). Composes ' +
          '[Indicator](?path=/docs/components-indicator--docs) (pulse `ping` + vivid color for live) + ' +
          '[Typography](?path=/docs/custom-typography--docs) (`monoLabel`). Use the `state` control to switch.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SessionStatePill>

export const Default: Story = {}
