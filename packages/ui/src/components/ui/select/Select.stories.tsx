import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Input } from '../input'
import { Typography } from '../typography'
import { Select, type SelectOption } from './Select'

const basicOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'dragonfruit', label: 'Dragon Fruit' },
  { value: 'elderberry', label: 'Elderberry' },
]

const meta: Meta<typeof Select> = {
  title: 'Components/Molecules/Select',
  component: Select,
  tags: ['autodocs', 'status:candidate', '!status:review'],
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
    variant: {
      control: 'select',
      options: ['default', 'filled'],
      description: "Use 'filled' on dark or elevated surfaces",
    },
    size: {
      control: 'select',
      options: [undefined, 'sm', 'md', 'lg'],
      description: "Control height; 'md' matches Input's default height",
    },
  },
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: function Render() {
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

export const Filled: Story = {
  args: {
    variant: 'filled',
    size: 'md',
    placeholder: 'Select a fruit...',
    accessibilityLabel: 'Fruit',
  },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>(null)
    return (
      <View style={{ width: 300 }}>
        <Select {...args} value={value} onChange={setValue} options={basicOptions} />
      </View>
    )
  },
}

export const WithPlaceholder: Story = {
  render: function Render() {
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
  render: function Render() {
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
        <Select value="banana" onChange={() => {}} options={basicOptions} isDisabled />
      </View>
    </View>
  ),
}

export const Invalid: Story = {
  render: function Render() {
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
        <Text className="text-sm text-text-error">This field is required</Text>
      </View>
    )
  },
}

export const MultiSelect: Story = {
  render: function Render() {
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
  render: function Render() {
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
  render: function Render() {
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
  render: function Render() {
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
  render: function Render() {
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
          <Text className="text-sm text-text-error underline" onPress={() => setValue(null)}>
            Clear
          </Text>
        </View>
        <Text className="text-sm text-text-secondary">Current value: {value ?? 'null'}</Text>
      </View>
    )
  },
}

export const InFormLayout: Story = {
  render: function Render() {
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

type FamilyField = 'input' | 'textarea' | 'select'
type FamilyState = 'enabled' | 'focus' | 'filled' | 'error' | 'disabled'

const FAMILY_FIELDS: FamilyField[] = ['input', 'textarea', 'select']
const FAMILY_STATES: FamilyState[] = ['enabled', 'focus', 'filled', 'error', 'disabled']
const FAMILY_FIELD_LABEL: Record<FamilyField, string> = {
  input: 'Input',
  textarea: 'TextArea',
  select: 'Select',
}

interface FamilyCellProps {
  field: FamilyField
  state: FamilyState
  isFocusTarget: boolean
}

function FamilyCell({ field, state, isFocusTarget }: FamilyCellProps) {
  const selectRef = useRef<View>(null)
  // Only one element holds focus at a time, so the focus row focuses the chosen column. The
  // Select exposes no focus handle, so the story reaches its trigger in the (web) DOM.
  useEffect(() => {
    if (field !== 'select' || !isFocusTarget) return
    const host = selectRef.current as unknown as HTMLElement | null
    host?.querySelector<HTMLElement>('[role="combobox"]')?.focus()
  }, [field, isFocusTarget])

  const label = `${FAMILY_FIELD_LABEL[field]} ${state}`
  const shared = { isInvalid: state === 'error', isDisabled: state === 'disabled' }
  if (field === 'select') {
    return (
      <View ref={selectRef} className="flex-1">
        <Select
          {...shared}
          variant="filled"
          size="md"
          accessibilityLabel={label}
          placeholder="Select a fruit..."
          value={state === 'filled' ? 'banana' : null}
          options={basicOptions}
        />
      </View>
    )
  }
  return (
    <View className="flex-1">
      <Input
        {...shared}
        variant="filled"
        size="md"
        multiline={field === 'textarea'}
        numberOfLines={2}
        accessibilityLabel={label}
        placeholder={field === 'textarea' ? 'Add a note...' : 'Enter a name...'}
        defaultValue={state === 'filled' ? 'Banana' : undefined}
        autoFocus={isFocusTarget}
      />
    </View>
  )
}

interface FieldFamilyGridProps {
  /** The column whose field takes focus in the focus row. */
  focused: FamilyField
}

function FieldFamilyGrid({ focused }: FieldFamilyGridProps) {
  return (
    <View className="gap-stack-md" style={{ width: 720 }}>
      <View className="flex-row gap-inline-md">
        <View style={{ width: 72 }} />
        {FAMILY_FIELDS.map((field) => (
          <Typography key={field} variant="monoLabel" color="secondary" className="flex-1">
            {FAMILY_FIELD_LABEL[field]}
          </Typography>
        ))}
      </View>
      {FAMILY_STATES.map((state) => (
        <View key={state} className="flex-row items-start gap-inline-md">
          <Typography variant="monoLabel" color="secondary" style={{ width: 72 }}>
            {state}
          </Typography>
          {FAMILY_FIELDS.map((field) => (
            <FamilyCell
              key={field}
              field={field}
              state={state}
              isFocusTarget={state === 'focus' && field === focused}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

/**
 * The filled (inset well) Input, TextArea and Select in every state, on one raised panel.
 * They share one edge per state; disabled keeps the well and dims it. Flip the toolbar theme
 * for light. The focus row focuses one column at a time; pick it with the `focused` control.
 */
export const FieldFamily: StoryObj<typeof FieldFamilyGrid> = {
  args: { focused: 'select' },
  argTypes: { focused: { control: 'inline-radio', options: FAMILY_FIELDS } },
  parameters: { canvas: 'panel', layout: 'fullscreen' },
  render: (args) => <FieldFamilyGrid {...args} />,
}
