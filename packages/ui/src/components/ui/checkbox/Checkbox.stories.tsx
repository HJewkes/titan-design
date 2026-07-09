import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Checkbox, CheckboxGroup } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Molecules/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    isChecked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    isIndeterminate: {
      control: 'boolean',
      description: 'Whether the checkbox is in indeterminate state',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    isInvalid: {
      control: 'boolean',
      description: 'Whether the checkbox is invalid',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Checkbox size',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below the label',
    },
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
    size: 'md',
  },
  render: (args) => <Checkbox {...args} />,
}

export const Checked: Story = {
  args: {
    isChecked: true,
    label: 'Checked checkbox',
    size: 'md',
  },
  render: (args) => <Checkbox {...args} />,
}

export const Indeterminate: Story = {
  args: {
    isChecked: true,
    isIndeterminate: true,
    label: 'Indeterminate state',
    size: 'md',
  },
  render: (args) => <Checkbox {...args} />,
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Checkbox isChecked size="sm" label="Small checkbox" />
      <Checkbox isChecked size="md" label="Medium checkbox" />
      <Checkbox isChecked size="lg" label="Large checkbox" />
    </View>
  ),
}

export const WithHelperText: Story = {
  args: {
    label: 'Subscribe to newsletter',
    helperText: 'You can unsubscribe at any time.',
    size: 'md',
  },
  render: (args) => <Checkbox {...args} />,
}

export const Disabled: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Checkbox isDisabled label="Disabled unchecked" />
      <Checkbox isDisabled isChecked label="Disabled checked" />
      <Checkbox isDisabled isIndeterminate isChecked label="Disabled indeterminate" />
    </View>
  ),
}

export const Invalid: Story = {
  args: {
    isInvalid: true,
    label: 'You must accept the terms',
    helperText: 'This field is required.',
    size: 'md',
  },
  render: (args) => <Checkbox {...args} />,
}

export const Group: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <CheckboxGroup label="Notifications" orientation="vertical">
        <Checkbox isChecked label="Email notifications" />
        <Checkbox label="Push notifications" />
        <Checkbox isChecked label="SMS notifications" />
      </CheckboxGroup>
      <CheckboxGroup label="Horizontal Group" orientation="horizontal">
        <Checkbox isChecked label="Option A" />
        <Checkbox label="Option B" />
        <Checkbox label="Option C" />
      </CheckboxGroup>
    </View>
  ),
}
