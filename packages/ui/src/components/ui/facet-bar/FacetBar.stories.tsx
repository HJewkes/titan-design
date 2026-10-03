import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { FacetBar } from './FacetBar'
import { facetBarFixtures } from './fixtures'

const fixtureNames = Object.keys(facetBarFixtures) as Array<keyof typeof facetBarFixtures>

const meta: Meta<typeof FacetBar> = {
  title: 'Components/Molecules/FacetBar',
  component: FacetBar,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    label: 'Record',
    options: facetBarFixtures.default.options,
    selectionMode: 'multiple',
    defaultValue: ['notes'],
    size: 'sm',
    color: 'primary',
    isDisabled: false,
    isLabelHidden: false,
  },
  argTypes: {
    fixture: {
      control: 'select',
      options: fixtureNames,
      mapping: facetBarFixtures,
    },
    options: { control: 'object' },
    selectionMode: { control: 'select', options: ['multiple', 'single'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'],
    },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    onValueChange: { control: false },
    formatCount: { control: false },
    value: { control: false },
  } as Meta<typeof FacetBar>['argTypes'],
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
          '**Molecule.** Composes [Chip](?path=/docs/components-atoms-chip--docs) and the label atom. ' +
          'A labelled group of toggle buttons (`aria-pressed`). No loading or error state: the consumer ' +
          'passes loaded options and renders its own failure. Empty options render nothing. Use the ' +
          '`fixture` control for the degenerate cases.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FacetBar>

export const Default: Story = {
  render: function Render({ fixture, ...args }: Record<string, unknown>) {
    const picked = fixture as (typeof facetBarFixtures)[keyof typeof facetBarFixtures] | undefined
    const props = { ...args, ...picked } as React.ComponentProps<typeof FacetBar>
    return <FacetBar key={String(picked?.label)} {...props} />
  },
}
