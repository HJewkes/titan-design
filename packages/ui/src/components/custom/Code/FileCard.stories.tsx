import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MapCard } from '../../ui/map-card'
import { FileCard } from './FileCard'
import { fileCardFixture } from './fixtures'

const viewport = { width: 720, height: 420 }

const meta: Meta<typeof FileCard> = {
  title: 'Custom/Code/FileCard',
  component: FileCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: fileCardFixture,
  argTypes: {
    path: { control: 'text' },
    loc: { control: 'number' },
    fanIn: { control: 'number' },
    fanOut: { control: 'number' },
    metrics: { control: 'object' },
    status: { control: 'select', options: [undefined, 'added', 'removed', 'renamed'] },
    className: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="relative bg-background-base" style={viewport}>
        <MapCard
          anchor={{ x: 220, y: 220 }}
          viewport={viewport}
          size={{ width: 340, height: 290 }}
          accessibilityLabel="File"
        >
          <Story />
        </MapCard>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One file’s facts, shown here as the content of a ' +
          '[MapCard](?path=/docs/components-molecules-mapcard--docs) on the arch map. The path heads it ' +
          'with its change status; the rows follow codewatch’s node panel order (lines, functions, ' +
          'complexity, nesting, fan-in, fan-out, instability), then any other metric in the order given. ' +
          'The fixture passes its metrics out of order to show the reordering. Composes ' +
          '[FilePathLabel](?path=/docs/components-molecules-filepathlabel--docs), ' +
          '[DataRow](?path=/docs/components-molecules-datarow--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). A missing value reads as a dash; ' +
          'with no metrics it shows the path alone. No loading, error or disabled state: its data is ' +
          'precomputed, and it takes no input.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof FileCard>

export const Default: Story = {}
