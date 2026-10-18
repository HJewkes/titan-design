import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DataRow } from '../data-row'
import { MapCard } from './MapCard'
import { MAP_CARD_KEEP_OUT } from './map-card-placement'

const viewport = { width: 960, height: 540 }

const content = (
  <View>
    <DataRow label="Requests" value="1,204" className="px-0 py-inset-xs" />
    <DataRow label="Errors" value="3" className="px-0 py-inset-xs" />
    <DataRow label="Median" value="42ms" className="px-0 py-inset-xs" />
  </View>
)

const meta: Meta<typeof MapCard> = {
  title: 'Components/Molecules/MapCard',
  component: MapCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    anchor: { x: 300, y: 260 },
    viewport,
    size: { width: 280, height: 136 },
    enter: 1,
    exit: 0,
    side: 'auto',
    title: 'Gateway',
    accessibilityLabel: 'Gateway',
    children: content,
  },
  argTypes: {
    anchor: { control: 'object' },
    size: { control: 'object' },
    enter: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    exit: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    side: { control: 'select', options: ['auto', 'left', 'right'] },
    keepOutFraction: { control: { type: 'range', min: 0.5, max: 1, step: 0.01 } },
    title: { control: 'text' },
    viewport: { control: false },
    children: { control: false },
    className: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="relative bg-background-base" style={viewport}>
        <View
          testID="map-card-keep-out"
          className="absolute left-0 right-0 bottom-0 bg-surface-base"
          style={{ top: MAP_CARD_KEEP_OUT * viewport.height }}
        />
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A pop-out card beside a point on the arch map, joined to it by a leader line. ' +
          'It sits right of the anchor and flips left near the right edge, and stays above the 83% ' +
          'caption keep-out (the shaded band). `enter` draws the leader, then fades the card in; `exit` ' +
          'fades both out; with reduced motion it is either fully shown or gone. Its content is a slot ' +
          '(rows here; FileCard, StatCard and SchemaCard plug in the same way). ' +
          'Composes [Surface](?path=/docs/components-atoms-surface--docs) at elevation 3 and ' +
          '[Typography](?path=/docs/foundations-typography--docs). The anchor is a screen point: the ' +
          'map projects a node through the camera before passing it in. No loading, empty, error or ' +
          'disabled state: the map shows a card only once its content is resolved, and it takes no input.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof MapCard>

export const Default: Story = {}
