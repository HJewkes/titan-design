import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { NavItem } from './NavItem'
import { ActivityIcon } from '../icons'

const meta: Meta<typeof NavItem> = {
  title: 'Shell/SideNav/NavItem',
  component: NavItem,
  tags: ['autodocs'],
  args: { label: 'Live', active: false, live: false },
  argTypes: {
    label: { control: 'text' },
    active: { control: 'boolean' },
    live: { control: 'boolean' },
    icon: { control: false },
    onPress: { action: 'press' },
  },
  decorators: [
    (Story) => (
      <View className="w-[60px] items-center bg-background-base py-2">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One category button — a glyph over an uppercase micro-label in a 46×46 target, ' +
          'spanning the full 60px rail so the active accent bar sits flush to the edge. Composes an ' +
          '[icon](?path=/docs/icons--docs) + [Typography](?path=/docs/custom-typography--docs). Toggle ' +
          '`active` / `live` to see the states.',
      },
    },
  },
  render: (args) => <NavItem {...args} icon={<ActivityIcon size={20} color="currentColor" />} />,
}
export default meta
type Story = StoryObj<typeof NavItem>

export const Default: Story = {}
export const Active: Story = { args: { active: true } }
export const LiveElsewhere: Story = {
  args: { live: true },
  parameters: {
    docs: {
      description: {
        story: 'Not the active view, but a set is running for this category → muted-green label.',
      },
    },
  },
}
