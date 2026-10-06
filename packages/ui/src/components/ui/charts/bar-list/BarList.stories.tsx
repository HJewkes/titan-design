import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { BarList, type BarListProps } from './BarList'
import { barListFixtures, defaultFixture, type BarListFixture } from './fixtures'

type StoryArgs = BarListProps & { fixture: BarListFixture }

const fixtureOptions = barListFixtures.map((f) => f.name)
const fixtureMapping = Object.fromEntries(barListFixtures.map((f) => [f.name, f]))

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/BarList',
  component: BarList as unknown as Meta<StoryArgs>['component'],
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    fixture: defaultFixture.name as unknown as BarListFixture,
    accessibilityLabel: 'Tool calls',
    maxRows: 10,
    size: 'md',
    isLoading: false,
  },
  argTypes: {
    fixture: {
      control: 'select',
      options: fixtureOptions,
      mapping: fixtureMapping,
      description:
        'Sample data; drives rows, max, sort, layout and referenceMarker until a control sets them.',
    },
    rows: { control: 'object' },
    sort: { control: 'select', options: ['descending', 'none'] },
    layout: { control: 'select', options: ['inline', 'stacked'] },
    size: { control: 'select', options: ['sm', 'md'] },
    maxRows: { control: 'number' },
    max: { control: 'number' },
    referenceMarker: {
      control: 'object',
      // Typed so a URL can set the fields: `args=referenceMarker.value:150;referenceMarker.label:Cutoff`.
      type: { name: 'object', value: { value: { name: 'number' }, label: { name: 'string' } } },
      description:
        'One labelled line on the value axis. The `With marker` fixture sets a cutoff of 100.',
    },
    isLoading: { control: 'boolean' },
    formatValue: { control: false },
    formatSecondary: { control: false },
    emptyState: { control: false },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 360 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A ranked horizontal bar list: label, proportional bar, value and an optional ' +
          'secondary value, with a top-N cap that folds the rest into one overflow row. Composes ' +
          '[Typography](?path=/docs/foundations-typography--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs). ' +
          'An optional `referenceMarker` draws a labelled line on the value axis and is read out with the list. ' +
          'Bars are silver and a flagged row is red, in the silver/red scheme of ' +
          '[Foundations/Color/Silver-Red Scheme](?path=/docs/foundations-color-silver-red-scheme--docs). ' +
          'No error state: the consumer renders the failure. No disabled state: rows are not interactive.',
      },
    },
  },
  render: function Render({ fixture: selected, ...args }) {
    // Storybook maps the key to the fixture; composeStories (the smoke test) passes the key through.
    const fixture = typeof selected === 'string' ? fixtureMapping[selected] : selected
    return (
      <BarList
        {...args}
        rows={args.rows ?? fixture.rows}
        max={args.max ?? fixture.max}
        sort={args.sort ?? fixture.sort}
        layout={args.layout ?? fixture.layout}
        referenceMarker={args.referenceMarker ?? fixture.referenceMarker}
      />
    )
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
