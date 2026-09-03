import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileHistoryExplorer } from './FileHistoryExplorer'
import {
  FILE_HISTORY_CO_EDGES,
  FILE_HISTORY_FILES,
  FILE_HISTORY_STATS,
} from './file-history-fixture'

const meta: Meta<typeof FileHistoryExplorer> = {
  title: 'ActiveWork/FileHistoryExplorer',
  component: FileHistoryExplorer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** A file browser ranked by mined activity instead of alphabetised by name: ' +
          'a KPI strip, a two-pane hottest-files list ⇄ detail, and the repo’s strongest ' +
          'co-change pairs. The co-change view is the part a plain file tree cannot show. Composes ' +
          '[Card](?path=/docs/components-card--docs), ' +
          '[Tile](?path=/docs/components-tile--docs), ' +
          '[Divider](?path=/docs/components-divider--docs), ' +
          '[FileActivityRow](?path=/docs/activework-fileactivityrow--docs), ' +
          '[FileActivityDetail](?path=/docs/activework-fileactivitydetail--docs), ' +
          '[CoChangeChip](?path=/docs/activework-cochangechip--docs), and ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs). ' +
          'Presentational only — the caller supplies every prop.',
      },
    },
  },
  args: {
    stats: FILE_HISTORY_STATS,
    files: FILE_HISTORY_FILES,
    coEdges: FILE_HISTORY_CO_EDGES,
    provenance:
      'deterministically mined from Claude Code session transcripts · ranked by total touches',
  },
}
export default meta
type Story = StoryObj<typeof FileHistoryExplorer>

export const Default: Story = {}

/** Selection is internal by default — pressing a row moves the detail pane. */
export const NetShrinkSelected: Story = {
  args: { selectedPath: 'src/utils/fs-atomic.ts' },
  parameters: {
    docs: {
      description: {
        story:
          'A file that net-*shrank*: negative sparkline bars render in the error token and the ' +
          'net-change readout flips colour.',
      },
    },
  },
}

/** No co-change edges mined yet — the bottom strip drops out entirely. */
export const NoCoChanges: Story = {
  args: { coEdges: [] },
}

/** A single file: the ranked list is still a list, and the detail pane fills. */
export const SingleFile: Story = {
  args: {
    files: FILE_HISTORY_FILES.slice(3),
    coEdges: [],
    stats: [
      { label: 'Files', value: '1' },
      { label: 'File events', value: '55' },
      { label: 'Sessions', value: '8' },
      { label: 'Transcripts', value: '11' },
    ],
  },
}
