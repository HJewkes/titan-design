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
    fixture: defaultFixture,
    accessibilityLabel: 'Tool calls',
    maxRows: 10,
    sort: 'descending',
    layout: 'inline',
    size: 'md',
    isLoading: false,
    isDisabled: false,
  },
  argTypes: {
    fixture: {
      control: 'select',
      options: fixtureOptions,
      mapping: fixtureMapping,
      description: 'Sample data; drives rows, max and sort. Edit `rows` to override.',
    },
    rows: { control: 'object' },
    sort: { control: 'select', options: ['descending', 'none'] },
    layout: { control: 'select', options: ['inline', 'stacked'] },
    size: { control: 'select', options: ['sm', 'md'] },
    maxRows: { control: 'number' },
    labelWidth: { control: 'number' },
    max: { control: 'number' },
    isLoading: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    color: { control: 'select', options: ['brand-primary', 'brand-secondary', 'status-info'] },
    formatValue: { control: false },
    formatSecondary: { control: false },
    formatOverflow: { control: false },
    formatRowLabel: { control: false },
    summarize: { control: false },
    onRowPress: { control: false },
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
          '[EmptyState](?path=/docs/components-atoms-emptystate--docs). ' +
          'No error state: the consumer renders the failure. Disabled applies only with `onRowPress`.',
      },
    },
  },
  render: function Render({ fixture, ...args }) {
    return (
      <BarList
        rows={fixture.rows}
        max={fixture.max}
        sort={fixture.sort}
        layout={fixture.layout}
        {...args}
      />
    )
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
