import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilePathLabel } from './FilePathLabel'

const meta: Meta<typeof FilePathLabel> = {
  title: 'ActiveWork/FilePathLabel',
  component: FilePathLabel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A file path with the directory dimmed and the basename bright — in a list ' +
          'of paths the basename is the identifier and the directory is disambiguation, so they get ' +
          'different weight rather than one flat string. Composes ' +
          "[Typography](?path=/docs/components-typography--docs)'s `mono` variant.",
      },
    },
  },
  args: { path: 'src/commands/_open-helpers.ts', size: 'md', baseOnly: false },
}
export default meta
type Story = StoryObj<typeof FilePathLabel>

export const Default: Story = {}

/** A bare filename has no directory to dim. */
export const NoDirectory: Story = {
  args: { path: 'README.md' },
}

/** `baseOnly` drops the directory — used at chip size where the prefix is noise. */
export const BaseOnly: Story = {
  args: { baseOnly: true },
}

/** The dense variant, as used inside CoChangeChip and the co-change list. */
export const Small: Story = {
  args: { size: 'sm' },
}
