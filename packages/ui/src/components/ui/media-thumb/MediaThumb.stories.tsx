import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { VolumeOffIcon } from '../../icons'
import { mediaThumbSources, type MediaThumbSourceName } from './fixtures'
import { MediaThumb, type MediaThumbFit } from './MediaThumb'
import { MediaThumbBadge } from './MediaThumbBadge'

interface StoryArgs {
  source: MediaThumbSourceName
  aspect: number
  fit: MediaThumbFit
  length: string
  isMuted: boolean
  topStartLabel: string
  isLoading: boolean
  width: number
}

const ASPECTS = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '9:16': 9 / 16 }

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/MediaThumb',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    source: 'landscape',
    aspect: ASPECTS['16:9'],
    fit: 'cover',
    length: '4:12',
    isMuted: true,
    topStartLabel: '',
    isLoading: false,
    width: 320,
  },
  argTypes: {
    source: { control: 'select', options: Object.keys(mediaThumbSources) },
    aspect: { control: 'select', options: Object.values(ASPECTS) },
    fit: { control: 'inline-radio', options: ['cover', 'contain-blur'] },
    length: { control: 'text' },
    isMuted: { control: 'boolean' },
    topStartLabel: { control: 'text' },
    isLoading: { control: 'boolean' },
    width: { control: { type: 'range', min: 160, max: 640, step: 8 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes [Skeleton](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[Icons](?path=/docs/foundations-icons--docs) (`PlayIcon`, `VolumeOffIcon`). A poster frame ' +
          'at a fixed `aspect` (16:9 by default) with three corner slots (`topStart`, `bottomStart`, ' +
          '`bottomEnd`) for `MediaThumbBadge`s. `fit="cover"` crops; `contain-blur` letterboxes a ' +
          'portrait frame on a blurred copy of itself (set `source` to `portrait`). Each badge is read ' +
          'by its `accessibilityLabel` ("Length 4:12", "No sound"), on a `scrim-strong` ground with ' +
          '`on-scrim` ink. States: `isLoading` shows a Skeleton; with no `source`, or a `source` that ' +
          'fails to load (`broken`), the thumb shows a plane with a play glyph. No disabled state: the ' +
          'thumb is not interactive, and the pressable card around it carries `isDisabled`.',
      },
    },
  },
  render: function Render({
    source,
    aspect,
    fit,
    length,
    isMuted,
    topStartLabel,
    isLoading,
    width,
  }) {
    return (
      <View style={{ width, maxWidth: '100%' }}>
        <MediaThumb
          source={mediaThumbSources[source]}
          aspect={aspect}
          fit={fit}
          isLoading={isLoading}
          accessibilityLabel="Poster frame"
          topStart={
            topStartLabel ? (
              <MediaThumbBadge accessibilityLabel={topStartLabel}>{topStartLabel}</MediaThumbBadge>
            ) : undefined
          }
          bottomStart={
            isMuted ? (
              <MediaThumbBadge accessibilityLabel="No sound" icon={VolumeOffIcon} />
            ) : undefined
          }
          bottomEnd={
            length ? (
              <MediaThumbBadge accessibilityLabel={`Length ${length}`}>{length}</MediaThumbBadge>
            ) : undefined
          }
        />
      </View>
    )
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
