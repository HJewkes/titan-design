import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Autocomplete, AutocompleteOption } from './Autocomplete'

const meta: Meta<typeof Autocomplete> = {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  argTypes: {
    isDisabled: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
    isClearable: {
      control: 'boolean',
    },
    minChars: {
      control: { type: 'number', min: 0, max: 5 },
    },
  },
}

export default meta
type Story = StoryObj<typeof Autocomplete>

const fruitOptions: AutocompleteOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
]

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value={value}
          onChange={setValue}
          placeholder="Search fruits..."
        />
        <Text className="text-sm text-text-secondary mt-2">
          Selected: {value || 'None'}
        </Text>
      </View>
    )
  },
}

export const WithLabel: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value={value}
          onChange={setValue}
          label="Select a fruit"
          placeholder="Type to search..."
          helperText="Choose your favorite fruit"
        />
      </View>
    )
  },
}

const userOptions: AutocompleteOption[] = [
  { value: 'user1', label: 'John Doe', description: 'john@example.com' },
  { value: 'user2', label: 'Jane Smith', description: 'jane@example.com' },
  { value: 'user3', label: 'Bob Johnson', description: 'bob@example.com' },
  { value: 'user4', label: 'Alice Williams', description: 'alice@example.com' },
  { value: 'user5', label: 'Charlie Brown', description: 'charlie@example.com' },
]

export const WithDescriptions: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-80">
        <Autocomplete
          options={userOptions}
          value={value}
          onChange={setValue}
          label="Assign to"
          placeholder="Search users..."
        />
      </View>
    )
  },
}

export const MinimumCharacters: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value={value}
          onChange={setValue}
          label="Search (min 2 chars)"
          placeholder="Type at least 2 characters..."
          minChars={2}
        />
      </View>
    )
  },
}

export const WithError: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value={value}
          onChange={setValue}
          label="Select fruit"
          placeholder="Search..."
          isRequired
          errorMessage="Please select a fruit"
        />
      </View>
    )
  },
}

export const Disabled: Story = {
  render: function Render() {
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value="apple"
          label="Disabled field"
          isDisabled
        />
      </View>
    )
  },
}

export const Loading: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-64">
        <Autocomplete
          options={[]}
          value={value}
          onChange={setValue}
          label="Loading state"
          placeholder="Search..."
          isLoading
        />
      </View>
    )
  },
}

export const DisabledOptions: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    const optionsWithDisabled: AutocompleteOption[] = [
      { value: 'free', label: 'Free Plan' },
      { value: 'pro', label: 'Pro Plan' },
      { value: 'enterprise', label: 'Enterprise Plan', isDisabled: true, description: 'Contact sales' },
    ]
    return (
      <View className="w-64">
        <Autocomplete
          options={optionsWithDisabled}
          value={value}
          onChange={setValue}
          label="Select plan"
          placeholder="Choose a plan..."
        />
      </View>
    )
  },
}

export const CustomNoResultsText: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value={value}
          onChange={setValue}
          placeholder="Search..."
          noOptionsText="🔍 No fruits match your search"
          minCharsText="🍎 Type to find fruits"
        />
      </View>
    )
  },
}

export const NonClearable: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('apple')
    return (
      <View className="w-64">
        <Autocomplete
          options={fruitOptions}
          value={value}
          onChange={setValue}
          label="Cannot clear selection"
          isClearable={false}
        />
      </View>
    )
  },
}

export const FormExample: Story = {
  render: function Render() {
    const [country, setCountry] = useState<string | null>(null)
    const [city, setCity] = useState<string | null>(null)

    const countryOptions: AutocompleteOption[] = [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
    ]

    const cityOptions: Record<string, AutocompleteOption[]> = {
      us: [
        { value: 'nyc', label: 'New York' },
        { value: 'la', label: 'Los Angeles' },
        { value: 'chi', label: 'Chicago' },
      ],
      uk: [
        { value: 'lon', label: 'London' },
        { value: 'man', label: 'Manchester' },
        { value: 'bir', label: 'Birmingham' },
      ],
      ca: [
        { value: 'tor', label: 'Toronto' },
        { value: 'van', label: 'Vancouver' },
        { value: 'mon', label: 'Montreal' },
      ],
      au: [
        { value: 'syd', label: 'Sydney' },
        { value: 'mel', label: 'Melbourne' },
        { value: 'bri', label: 'Brisbane' },
      ],
    }

    return (
      <View className="gap-4 w-80 p-4 bg-surface-base rounded-lg">
        <Text className="text-lg font-semibold text-text-primary">Location</Text>

        <Autocomplete
          options={countryOptions}
          value={country}
          onChange={(val) => {
            setCountry(val)
            setCity(null) // Reset city when country changes
          }}
          label="Country"
          placeholder="Select country..."
          isRequired
        />

        <Autocomplete
          options={country ? cityOptions[country] || [] : []}
          value={city}
          onChange={setCity}
          label="City"
          placeholder={country ? 'Select city...' : 'Select country first'}
          isDisabled={!country}
          isRequired
        />

        <View className="pt-2 border-t border-border-default">
          <Text className="text-sm text-text-secondary">
            Selected: {country ? `${countryOptions.find(c => c.value === country)?.label}` : '-'}
            {city ? `, ${cityOptions[country!]?.find(c => c.value === city)?.label}` : ''}
          </Text>
        </View>
      </View>
    )
  },
}
