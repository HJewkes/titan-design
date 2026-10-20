import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ChipGroup } from './ChipGroup'
import { chipGroupFixtures, type ChipGroupFixture } from './fixtures'

const fixtureNames = Object.keys(chipGroupFixtures) as Array<keyof typeof chipGroupFixtures>

const meta: Meta<typeof ChipGroup> = {
  title: 'Components/Molecules/ChipGroup',
  component: ChipGroup,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    label: chipGroupFixtures.default.label,
    items: chipGroupFixtures.default.items,
    defaultValue: chipGroupFixtures.default.defaultValue,
    overflow: 'scroll',
    size: 'md',
    color: 'primary',
    isDisabled: false,
    isLoading: false,
  },
  argTypes: {
    fixture: {
      control: 'select',
      options: fixtureNames,
      mapping: chipGroupFixtures,
    },
    items: { control: 'object' },
    overflow: { control: 'select', options: ['wrap', 'scroll'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'],
    },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    onValueChange: { control: false },
    formatCount: { control: false },
    value: { control: false },
  } as Meta<typeof ChipGroup>['argTypes'],
  // A 315px column, the phone width the scrolling row is designed for.
  decorators: [
    (Story) => (
      <View style={{ width: 315 }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes [Chip](?path=/docs/components-atoms-chip--docs) and ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs). A single-select filter row: a ' +
          '`radiogroup` whose chips are radios (`aria-checked`, and `aria-current` on the selected ' +
          'one). Arrow keys, Home and End move the selection; only the selected chip is a Tab stop. ' +
          '`overflow="scroll"` keeps one row, pins the first chip and scrolls the selected chip into ' +
          'view with the next one peeking; `wrap` flows onto more rows. Every chip carries a 44px hit ' +
          'box that stops at its neighbour (TD-10). `isLoading` shows Skeleton capsules. Empty items ' +
          'render nothing; the caller shows EmptyState. No error state: the caller passes loaded ' +
          'items and renders its own failure. Use the `fixture` control for the degenerate cases.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ChipGroup>

export const Default: Story = {
  render: function Render(args) {
    const { fixture, ...rest } = args as unknown as { fixture?: ChipGroupFixture } & Record<
      string,
      unknown
    >
    const props = { ...rest, ...fixture } as unknown as React.ComponentProps<typeof ChipGroup>
    // defaultValue is read once, so a new fixture remounts the group.
    const key = JSON.stringify([props.defaultValue, props.items.length, props.overflow])
    return <ChipGroup key={key} {...props} />
  },
}
