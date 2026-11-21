import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { DependencyMatrix } from './DependencyMatrix'
import { matrixFixtures } from './fixtures'
import type { DependencyMatrixProps } from './types'

const FIXTURE_NAMES = matrixFixtures.map((fixture) => fixture.name)

type Args = Omit<DependencyMatrixProps, 'items' | 'cells'> & { fixture: string }

function fixtureNamed(name: string) {
  return matrixFixtures.find((fixture) => fixture.name === name) ?? matrixFixtures[0]
}

const meta: Meta<Args> = {
  title: 'Components/Organisms/DependencyMatrix',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    fixture: 'Default',
    direction: 'row-depends-on-column',
    scale: 'sqrt',
    density: 'comfortable',
    showValues: true,
    maxItems: 60,
    width: 720,
    height: 480,
    isLoading: false,
    isDisabled: false,
    accessibilityLabel: 'Module dependencies',
  },
  argTypes: {
    fixture: { control: 'select', options: FIXTURE_NAMES },
    direction: {
      control: 'inline-radio',
      options: ['row-depends-on-column', 'column-depends-on-row'],
    },
    scale: { control: 'select', options: ['linear', 'sqrt', 'log'] },
    density: { control: 'inline-radio', options: ['comfortable', 'dense'] },
    showValues: { control: 'boolean' },
    maxItems: { control: { type: 'range', min: 2, max: 400, step: 1 } },
    width: { control: { type: 'range', min: 240, max: 1200, step: 20 } },
    height: { control: { type: 'range', min: 200, max: 900, step: 20 } },
    isLoading: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    onCellPress: { control: false },
    onHeaderPress: { control: false },
    onActiveCellChange: { control: false },
    formatCellLabel: { control: false },
    emptyState: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="p-inset-md">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** A square dependency matrix over one ordered item list, windowed on both axes, ' +
          'with the WAI-ARIA APG data grid keyboard model: one tab stop, arrows move a cell, Home and End ' +
          'stay in the row, Enter or Space presses. Intensity is one hue at four opacity steps; a cycle ' +
          'carries a mark and the word. Composes ' +
          '[Typography](?path=/docs/foundations-typography--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) for loading and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs) for no items. Use the `fixture` ' +
          'control for Hub, Cycle, Package level (group bands), Very large (386 items), No edges and Empty; ' +
          '`direction` flips the reading convention and the legend caption.',
      },
    },
  },
  render: function Render({ fixture, ...args }) {
    const { items, cells } = fixtureNamed(fixture)
    return <DependencyMatrix {...args} items={items} cells={cells} />
  },
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}
