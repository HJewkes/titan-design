import type { Meta, StoryObj } from '@storybook/react-vite'
import { CoChangeChip } from './CoChangeChip'

const meta: Meta<typeof CoChangeChip> = {
  title: 'ActiveWork/CoChangeChip',
  component: CoChangeChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One symmetric "these two files change together" pair. Only basenames are ' +
          'shown — at chip size the directory is noise. Composes ' +
          '[Card](?path=/docs/components-card--docs), ' +
          '[Pill](?path=/docs/components-pill--docs) and ' +
          '[FilePathLabel](?path=/docs/activework-filepathlabel--docs). ' +
          'Used by [FileHistoryExplorer](?path=/docs/activework-filehistoryexplorer--docs).',
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
