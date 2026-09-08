import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { FileActivityDetail } from './FileActivityDetail'
import { FILE_HISTORY_FILES } from './file-history-fixture'

const meta: Meta<typeof FileActivityDetail> = {
  title: 'Custom/ActiveWork/FileActivityDetail',
  component: FileActivityDetail,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen w-full max-w-[560px] p-6" testID="page-surface">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "**Card.** One file's full mined history: activity split, net char growth over " +
          'sessions, and the files it changes together with. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[Tile](?path=/docs/components-atoms-tile--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[DataRow](?path=/docs/components-molecules-datarow--docs), ' +
          '[DateTime](?path=/docs/custom-datetime--docs), ' +
          '[SparkBars](?path=/docs/custom-charts-sparkbars--docs), ' +
          '[FilePathLabel](?path=/docs/custom-activework-filepathlabel--docs) and ' +
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
