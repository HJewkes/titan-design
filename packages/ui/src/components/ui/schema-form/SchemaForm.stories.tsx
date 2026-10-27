import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SchemaForm } from './SchemaForm'
import { compareSchema, compareValue, emptySchema } from './fixtures'
import type { SchemaFormValue } from './schemaFormModel'

const meta: Meta<typeof SchemaForm> = {
  title: 'Components/Organisms/SchemaForm',
  component: SchemaForm,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    schema: compareSchema,
    value: compareValue,
    errors: { 'rows.1.left': 'Too short' },
    lockedIds: ['speed'],
    lockedIdHint: 'This id is locked',
    isDisabled: false,
  },
  argTypes: {
    schema: {
      control: 'select',
      options: ['compare', 'empty'],
      mapping: { compare: compareSchema, empty: emptySchema },
    },
    value: { control: 'object' },
    errors: { control: 'object' },
    lockedIds: { control: 'object' },
    lockedIdHint: { control: 'text' },
    isDisabled: { control: 'boolean' },
    onChange: { control: false },
    emptyState: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[640px] p-inset-md">
        <Story />
      </View>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**Organism.** Composes [Input](?path=/docs/components-molecules-input--docs), ' +
          '[Select](?path=/docs/components-molecules-select--docs), ' +
          '[Checkbox](?path=/docs/components-molecules-checkbox--docs), ' +
          '[Button](?path=/docs/components-molecules-button--docs), ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). ' +
          'A controlled form rendered from an object JSON Schema: a string with a `maxLength` counter, ' +
          'a string enum as a select, number, boolean, nested object, and an array whose rows add, remove ' +
          'and reorder inside `minItems`/`maxItems`. A tuple, record or union shows its value read-only. ' +
          '`errors` places a message at a dotted path and links it with `aria-describedby`; `lockedIds` ' +
          'freezes an object `id` and keeps its row. Empty: the `empty` schema renders `emptyState`. ' +
          'No loading state: the consumer passes a schema and value that are already loaded.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SchemaForm>

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<SchemaFormValue>(args.value)
    useEffect(() => setValue(args.value), [args.value])
    return <SchemaForm {...args} value={value} onChange={setValue} />
  },
}
