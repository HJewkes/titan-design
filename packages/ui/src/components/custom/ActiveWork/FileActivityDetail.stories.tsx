import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileActivityDetail } from './FileActivityDetail'
import { FILE_HISTORY_FILES } from './file-history-fixture'

const meta: Meta<typeof FileActivityDetail> = {
  title: 'ActiveWork/FileActivityDetail',
  component: FileActivityDetail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**Card.** One file's full mined history: activity split, net char growth over " +
          'sessions, and the files it changes together with. Composes ' +
          '[Card](?path=/docs/components-card--docs), ' +
          '[Tile](?path=/docs/components-tile--docs), ' +
          '[Pill](?path=/docs/components-pill--docs), ' +
          '[DataRow](?path=/docs/components-datarow--docs), ' +
          '[DateTime](?path=/docs/components-datetime--docs), ' +
          '[SparkBars](?path=/docs/components-charts-sparkbars--docs), ' +
          '[FilePathLabel](?path=/docs/activework-filepathlabel--docs) and ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs).',
      },
    },
  },
  args: { file: FILE_HISTORY_FILES[0] },
}
export default meta
type Story = StoryObj<typeof FileActivityDetail>

export const Default: Story = {}

/** Net-negative growth: the readout and the sparkline both flip to the error token. */
export const NetShrink: Story = {
  args: { file: FILE_HISTORY_FILES[2] },
}

/** No co-changes mined — the section falls back to an explicit empty line. */
export const NoCoChanges: Story = {
  args: { file: FILE_HISTORY_FILES[3] },
}
