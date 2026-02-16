import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    isChecked: {
      control: 'boolean',
      description: 'Whether the switch is on',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Switch size',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the label relative to the switch',
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  args: {
    label: 'Enable notifications',
    size: 'md',
  },
  render: (args) => <Switch {...args} />,
}

export const On: Story = {
  args: {
    isChecked: true,
    label: 'Switch is on',
    size: 'md',
  },
  render: (args) => <Switch {...args} />,
}

export const Off: Story = {
  args: {
    isChecked: false,
    label: 'Switch is off',
    size: 'md',
  },
  render: (args) => <Switch {...args} />,
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Switch isChecked size="sm" label="Small" />
      <Switch isChecked size="md" label="Medium" />
      <Switch isChecked size="lg" label="Large" />
    </View>
  ),
}

export const LabelLeft: Story = {
  args: {
    isChecked: true,
    label: 'Label on the left',
    labelPosition: 'left',
    size: 'md',
  },
  render: (args) => <Switch {...args} />,
}

export const LabelRight: Story = {
  args: {
    isChecked: true,
    label: 'Label on the right',
    labelPosition: 'right',
    size: 'md',
  },
  render: (args) => <Switch {...args} />,
}

export const Disabled: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Switch isDisabled label="Disabled off" />
      <Switch isDisabled isChecked label="Disabled on" />
    </View>
  ),
}

export const WithoutLabel: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <Switch size="sm" />
      <Switch isChecked size="md" />
      <Switch size="lg" />
    </View>
  ),
}
