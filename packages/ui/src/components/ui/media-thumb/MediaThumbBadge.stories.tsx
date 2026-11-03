import type { Meta, StoryObj } from '@storybook/react-vite'
import { VolumeOffIcon } from '../../icons'
import { MediaThumbBadge } from './MediaThumbBadge'

const ICONS = { none: undefined, VolumeOffIcon }

const meta: Meta<typeof MediaThumbBadge> = {
  title: 'Components/Atoms/MediaThumbBadge',
  component: MediaThumbBadge,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { accessibilityLabel: 'Length 4:12', children: '4:12' },
  argTypes: {
    accessibilityLabel: { control: 'text' },
    children: { control: 'text' },
    icon: { control: 'select', options: Object.keys(ICONS), mapping: ICONS },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** The corner badge of [MediaThumb](?path=/docs/components-molecules-mediathumb--docs). ' +
          'Composes [Icons](?path=/docs/foundations-icons--docs) for its optional glyph. A ' +
          '`scrim-strong` ground with `on-scrim` ink, which holds AA over any frame. It is read by its ' +
          '`accessibilityLabel` ("Length 4:12", "No sound"), not by its glyph or digits. No loading, ' +
          'empty, error or disabled state: it is static text the thumb places, and the thumb owns ' +
          'those states.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MediaThumbBadge>

export const Default: Story = {}
