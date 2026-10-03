import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { DualPinnedLiveStrip, type DualPinnedLiveStripProps } from './DualPinnedLiveStrip'
import { DUAL_STRIP_SCENARIOS as S } from './dualPinnedLiveStrip-fixture'

// Stands in for the consumer's navigation, so the stories show the strip as the link it is in the app.
const goLive = () => undefined

// A forced phone layout shows at a phone's width, not stretched across a desktop canvas.
const PHONE_FRAME = { width: '100%', maxWidth: 390 } as const

const meta: Meta<DualPinnedLiveStripProps> = {
  title: 'Shell/Workout/DualPinnedLiveStrip',
  component: DualPinnedLiveStrip,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism (VW-439).** The [PinnedLiveStrip](?path=/docs/shell-workout-pinnedlivestrip--docs) ' +
          'for a two-Voltra session. Exercise, set and rest are drawn once; each side draws its reps, ' +
          'last-rep velocity and bars in a lane, Left above Right, beside one diverging chart. The wall ' +
          'names each side and its load; below 640px the phone marks the sides by position. Rest is one ' +
          'countdown beside the finished set. A fatigued side (`left`/`right` `isFatigued`) reddens the ' +
          'strip and its name; a dropped side (`isConnected: false`) stays with its wing faded. Composes ' +
          "PinnedLiveStrip's plane, title, tag, rest bar and link + " +
          '[DualVelocityStrip](?path=/docs/custom-workout-dataviz-dualvelocitystrip--docs) (`dual-expanded`) + ' +
          '[Typography](?path=/docs/foundations-typography--docs).',
      },
    },
  },
  decorators: [
    (Story, { args }) => (
      <Surface level="base" style={{ minHeight: '100vh' }} className="p-gutter-sm">
        <View style={args.layout === 'phone' ? PHONE_FRAME : undefined}>
          <Story />
        </View>
      </Surface>
    ),
  ],
  argTypes: {
    state: { control: 'inline-radio', options: ['set', 'rest', 'idle'] },
    layout: { control: 'inline-radio', options: [undefined, 'wall', 'phone'] },
    left: { control: 'object' },
    right: { control: 'object' },
    onPress: { control: false },
  },
  args: { ...S.set, onPress: goLive },
}
export default meta

type Story = StoryObj<DualPinnedLiveStripProps>

/** A set in progress, the right side a rep behind. Edit `left` / `right` for fatigue or a drop. */
export const Default: Story = {}

/** Resting: one countdown beside the finished set's chart, and a time bar along the bottom. */
export const Rest: Story = { args: { ...S.rest, onPress: goLive } }
