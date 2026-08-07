import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileActivityRow } from './FileActivityRow'
import { FILE_HISTORY_FILES } from './file-history-fixture'

const meta: Meta<typeof FileActivityRow> = {
  title: 'ActiveWork/FileActivityRow',
  component: FileActivityRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Row.** One file in the ranked "hottest files" list: path, total touches, the ' +
          'read/write/edit split, and a sparkline of per-session growth. Composes ' +
          '[FilePathLabel](?path=/docs/activework-filepathlabel--docs) and ' +
          '[SparkBars](?path=/docs/components-charts-sparkbars--docs). ' +
          'Used by [FileHistoryExplorer](?path=/docs/activework-filehistoryexplorer--docs).',
      },
    },
  },
  args: { file: FILE_HISTORY_FILES[0], selected: false },
  // The row is a listbox `option`, which is only valid inside a listbox.
  decorators: [
    (Story) => (
      <div role="listbox" aria-label="Hottest files" style={{ width: 404 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof FileActivityRow>

export const Default: Story = {}

export const Selected: Story = {
  args: { selected: true },
}

/** A net-shrinking file — negative sparkline bars take the error token. */
export const NetShrink: Story = {
  args: { file: FILE_HISTORY_FILES[2] },
}
