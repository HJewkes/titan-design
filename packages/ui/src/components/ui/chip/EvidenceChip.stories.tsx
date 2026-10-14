import type { Meta, StoryObj } from '@storybook/react-vite'
import { EvidenceChip, type EvidenceChipProps } from './EvidenceChip'
import { EVIDENCE_KINDS } from './evidence'
import { beatFixture } from './__fixtures__/evidence-chips'

type StoryArgs = EvidenceChipProps & {
  /** 0 renders the app `size`; any other value renders at video scale, 40 px per 1080 px of frame. */
  frameHeight: number
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/EvidenceChip',
  component: EvidenceChip,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    kind: 'verified',
    text: beatFixture('a7-9-machine').chips[0].text,
    size: 'md',
    frameHeight: 0,
    maxChars: 60,
  },
  argTypes: {
    kind: { control: 'select', options: [...EVIDENCE_KINDS] },
    text: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    frameHeight: { control: { type: 'select' }, options: [0, 720, 1080, 1440, 2160] },
    maxChars: { control: { type: 'number', min: 10, max: 160 } },
    fontPx: { control: false },
  },
  render: ({ frameHeight, ...args }) => (
    <EvidenceChip {...args} fontPx={frameHeight ? (40 * frameHeight) / 1080 : undefined} />
  ),
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule**. A [Pill](?path=/docs/components-atoms-pill--docs) preset: a subtle tone capsule names ' +
          'the evidence kind, then the citation in [Typography](?path=/docs/foundations-typography--docs) ' +
          '`mono`. Over `maxChars` the middle is elided and the pin and `path:L` stay whole. Set `frameHeight` ' +
          'to see the video scale.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
