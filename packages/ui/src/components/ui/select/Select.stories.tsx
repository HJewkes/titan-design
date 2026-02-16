import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Select, type SelectOption } from './Select'

const basicOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'dragonfruit', label: 'Dragon Fruit' },
  { value: 'elderberry', label: 'Elderberry' },
]

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no value is selected',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    isInvalid: {
      control: 'boolean',
      description: 'Whether the select has an error state',
    },
    isMulti: {
      control: 'boolean',
      description: 'Enable multi-select mode',
    },
  },
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View style={{ width: 300 }}>
        <Select
          value={value}
          onChange={setValue}
          options={basicOptions}
          placeholder="Select a fruit..."
        />
      </View>
    )
  },
}

export const WithPlaceholder: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View style={{ width: 300 }}>
        <Select
          value={value}
          onChange={setValue}
          options={basicOptions}
          placeholder="Choose your favorite fruit..."
        />
      </View>
    )
  },
}

export const WithPreselectedValue: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('cherry')
    return (
      <View style={{ width: 300 }}>
        <Select
          value={value}
          onChange={setValue}
          options={basicOptions}
          placeholder="Select a fruit..."
        />
      </View>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <View style={{ gap: 12, width: 300 }}>
      <View style={{ gap: 4 }}>
        <Text className="text-sm text-text-secondary">Disabled with no value</Text>
        <Select
          value={null}
          onChange={() => {}}
          options={basicOptions}
          isDisabled
          placeholder="Select a fruit..."
        />
      </View>
      <View style={{ gap: 4 }}>
        <Text className="text-sm text-text-secondary">Disabled with value</Text>
        <Select
          value="banana"
          onChange={() => {}}
          options={basicOptions}
          isDisabled
        />
      </View>
    </View>
  ),
}

export const Invalid: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View style={{ width: 300, gap: 4 }}>
        <Select
          value={value}
          onChange={setValue}
          options={basicOptions}
          isInvalid
          placeholder="Select a fruit..."
        />
        <Text className="text-sm text-status-error">This field is required</Text>
      </View>
    )
  },
}

export const MultiSelect: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([])
    return (
      <View style={{ width: 300, gap: 8 }}>
        <Select
          isMulti
          values={values}
          onChangeMulti={setValues}
          options={basicOptions}
          placeholder="Select fruits..."
        />
        <Text className="text-sm text-text-secondary">
          Selected: {values.length > 0 ? values.join(', ') : 'none'}
        </Text>
      </View>
    )
  },
}

export const MultiSelectWithPreselected: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(['apple', 'cherry'])
    return (
      <View style={{ width: 300, gap: 8 }}>
        <Select
          isMulti
          values={values}
          onChangeMulti={setValues}
          options={basicOptions}
          placeholder="Select fruits..."
        />
        <Text className="text-sm text-text-secondary">
          Selected: {values.length > 0 ? values.join(', ') : 'none'}
        </Text>
      </View>
    )
  },
}

export const ManyOptions: Story = {
  render: () => {
    const manyOptions: SelectOption[] = Array.from({ length: 50 }, (_, i) => ({
      value: `option-${i + 1}`,
      label: `Option ${i + 1}`,
    }))
    const [value, setValue] = useState<string | null>(null)
    return (
      <View style={{ width: 300 }}>
        <Select
          value={value}
          onChange={setValue}
          options={manyOptions}
          placeholder="Select from many options..."
        />
      </View>
    )
  },
}

export const WithDisabledOptions: Story = {
  render: () => {
    const optionsWithDisabled: SelectOption[] = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', isDisabled: true },
      { value: 'cherry', label: 'Cherry' },
      { value: 'dragonfruit', label: 'Dragon Fruit', isDisabled: true },
      { value: 'elderberry', label: 'Elderberry' },
    ]
    const [value, setValue] = useState<string | null>(null)
    return (
      <View style={{ width: 300 }}>
        <Select
          value={value}
          onChange={setValue}
          options={optionsWithDisabled}
          placeholder="Some options are disabled..."
        />
      </View>
    )
  },
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('apple')
    return (
      <View style={{ width: 300, gap: 12 }}>
        <Select
          value={value}
          onChange={setValue}
          options={basicOptions}
          placeholder="Select a fruit..."
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {basicOptions.map((option) => (
            <View key={option.value} style={{ marginBottom: 4 }}>
              <Text
                className="text-sm text-brand-primary underline"
                onPress={() => setValue(option.value)}
              >
                Set {option.label}
              </Text>
            </View>
          ))}
          <Text
            className="text-sm text-status-error underline"
            onPress={() => setValue(null)}
          >
            Clear
          </Text>
        </View>
        <Text className="text-sm text-text-secondary">
          Current value: {value ?? 'null'}
        </Text>
      </View>
    )
  },
}

export const InFormLayout: Story = {
  render: () => {
    const [fruit, setFruit] = useState<string | null>(null)
    const [color, setColor] = useState<string | null>(null)
    const colorOptions: SelectOption[] = [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
      { value: 'yellow', label: 'Yellow' },
    ]
    return (
      <View style={{ width: 300, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-medium text-text-primary">Favorite Fruit</Text>
          <Select
            value={fruit}
            onChange={setFruit}
            options={basicOptions}
            placeholder="Select a fruit..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text className="text-sm font-medium text-text-primary">Favorite Color</Text>
          <Select
            value={color}
            onChange={setColor}
            options={colorOptions}
            placeholder="Select a color..."
          />
        </View>
      </View>
    )
  },
}
