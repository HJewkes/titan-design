import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  FileActivityRow,
  FILE_EVENT_COLOR_CATEGORICAL,
  FILE_EVENT_COLOR_SEMANTIC,
} from './FileActivityRow'
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

/** A net-shrinking file — negative sparkline bars take `result-degrade`. */
export const NetShrink: Story = {
  args: { file: FILE_HISTORY_FILES[2] },
}

/**
 * Palette option A (current default) — reads/writes/edits coloured by
 * *importance*: quiet tertiary, brand for the consequential writes, info blue
 * between. Borrows a status token for non-status data.
 */
export const PaletteSemantic: Story = {
  args: { eventColors: FILE_EVENT_COLOR_SEMANTIC },
}

/**
 * Palette option B — the same three as *peer categories*, taken in order from the
 * canonical CVD-safe palette (TOKENS.md §2). Systematic and colourblind-safe, but
 * it drops the importance ordering, and its red sits next to `result-degrade` red
 * in the same row.
 */
export const PaletteCategorical: Story = {
  args: { eventColors: FILE_EVENT_COLOR_CATEGORICAL },
}
