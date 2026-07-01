import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { RhfContactForm, type ContactFormValues } from './RhfContactForm'

/**
 * Examples showing how a consumer drives the styled form primitives
 * (`FormField`, `Input`, `Select`, `Checkbox`, `Radio`) with
 * [react-hook-form](https://react-hook-form.com/) using the canonical
 * `Controller` render-prop idiom. See `ControlledFields.tsx` for the adapters.
 */
const meta: Meta<typeof RhfContactForm> = {
  title: 'Examples/React Hook Form',
  component: RhfContactForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'react-hook-form owns value + validation state and hands it to the ' +
          'already-styled controlled components via `Controller`. No component ' +
          'API is modified — this is pure integration wiring.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof RhfContactForm>

/** A complete form: type, select, pick a plan, accept terms, then submit. */
export const ContactForm: Story = {
  render: function Render() {
    const [submitted, setSubmitted] = React.useState<ContactFormValues | null>(null)
    return (
      <View style={{ gap: 16 }}>
        <RhfContactForm onSubmit={setSubmitted} />
        {submitted && (
          <Text className="text-sm text-text-secondary">
            Submitted: {JSON.stringify(submitted)}
          </Text>
        )}
      </View>
    )
  },
}

/** Submitting empty surfaces per-field validation errors from RHF rules. */
export const ValidationErrors: Story = {
  render: () => <RhfContactForm />,
}
