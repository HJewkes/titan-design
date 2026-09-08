import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { CoChangeChip } from './CoChangeChip'

const meta: Meta<typeof CoChangeChip> = {
  title: 'Custom/ActiveWork/CoChangeChip',
  component: CoChangeChip,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6" testID="page-surface">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Molecule.** One symmetric "these two files change together" pair. Only basenames are ' +
          'shown — at chip size the directory is noise. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs) and ' +
          '[FilePathLabel](?path=/docs/custom-activework-filepathlabel--docs). ' +
          'Used by [FileHistoryExplorer](?path=/docs/custom-activework-filehistoryexplorer--docs).',
      },
    },
  },
  args: {
    a: 'src/commands/open.ts',
    b: 'src/commands/_open-helpers.ts',
    count: 19,
  },
}
export default meta
type Story = StoryObj<typeof CoChangeChip>

export const Default: Story = {}

/** A weak pair — the count pill is the only thing distinguishing it. */
export const WeakPair: Story = {
  args: { a: 'src/utils/fs-atomic.ts', b: 'src/utils/flock.ts', count: 2 },
}
