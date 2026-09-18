import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { PinnedLiveStrip, type PinnedLiveStripProps } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S } from './pinnedLiveStrip-fixture'

const meta: Meta<PinnedLiveStripProps> = {
  title: 'Shell/Workout/PinnedLiveStrip',
  component: PinnedLiveStrip,
  tags: ['autodocs', 'status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism (VW-429).** Pinned atop every non-live page while a set or rest runs; the whole ' +
          'strip links back to live. Resize the canvas below 640px for the phone form. Zone colour is ' +
          'per-rep data from workout-analytics; fatigue shows as strip colour only. Composes ' +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Progress](?path=/docs/components-progress--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + SetBarChart + ChevronRightIcon.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100vh' }} className="p-gutter-sm">
        <View>
          <Story />
        </View>
      </Surface>
    ),
  ],
  argTypes: {
    state: { control: 'inline-radio', options: ['set', 'rest', 'idle'] },
    isFatigued: { control: 'boolean' },
    layout: { control: 'inline-radio', options: [undefined, 'wall', 'phone'] },
    reps: { control: 'object' },
  },
  args: S.set,
}
export default meta

type Story = StoryObj<PinnedLiveStripProps>

/** A set in progress. Switch `state` and `isFatigued` from the controls. */
export const Default: Story = {}

/** Resting: the countdown takes the hero and a time bar runs along the bottom. */
export const Rest: Story = { args: S.rest }
