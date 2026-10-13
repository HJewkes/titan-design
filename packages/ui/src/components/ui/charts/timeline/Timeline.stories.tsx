import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Timeline } from './Timeline'

const meta: Meta<typeof Timeline> = {
  title: 'Components/Organisms/Timeline',
  component: Timeline,
  decorators: [
    (Story) => (
      <View className="w-[640px] p-4">
        <Story />
      </View>
    ),
  ],
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    accessibilityLabel: 'Video chapters',
    items: [
      { id: 'intro', at: 0, label: 'Intro', tone: 'primary' },
      { id: 'problem', at: 45, label: 'The problem' },
      { id: 'scale', at: 140, label: 'Scales', tone: 'info' },
      { id: 'playhead', at: 260, label: 'Playhead', tone: 'success' },
      { id: 'pan', at: 380, label: 'Panning', tone: 'warning' },
      { id: 'outro', at: 480, label: 'Outro' },
    ],
    playhead: 0.25,
    window: [0, 1],
    orientation: 'horizontal',
    isLoading: false,
  },
  argTypes: {
    items: { control: 'object' },
    playhead: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    window: { control: 'object' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    isLoading: { control: 'boolean' },
    domain: { control: 'object' },
    emptyState: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** Events on one time axis with a playhead and a pan window, both driven by props: a ' +
          'beat author derives `playhead` and `window` from time, and the timeline itself never animates. ' +
          '`window` is the visible part of the domain as fractions, so `[0.5, 1]` shows the second half and ' +
          'drops the events before it. Composes [Typography](?path=/docs/foundations-typography--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) (`isLoading`) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs) (no `items`). No error state: ' +
          'a consumer that fails to load the events renders the failure, usually with `Alert`. No disabled ' +
          'state: it takes no input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Timeline>

export const Default: Story = {}
