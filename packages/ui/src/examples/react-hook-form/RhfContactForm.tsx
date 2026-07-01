import { View } from 'react-native'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Button, ButtonText } from '../../components/ui/button'
import { type SelectOption } from '../../components/ui/select'
import {
  ControlledInput,
  ControlledSelect,
  ControlledCheckbox,
  ControlledRadioGroup,
} from './ControlledFields'

export interface ContactFormValues {
  fullName: string
  role: string
  plan: string
  acceptedTerms: boolean
}

const roleOptions: SelectOption[] = [
  { value: 'engineer', label: 'Engineer' },
  { value: 'designer', label: 'Designer' },
  { value: 'manager', label: 'Manager' },
]

const planOptions: SelectOption[] = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
]

const defaultValues: ContactFormValues = {
  fullName: '',
  role: '',
  plan: '',
  acceptedTerms: false,
}

export interface RhfContactFormProps {
  /** Called with validated form values on a successful submit. */
  onSubmit?: SubmitHandler<ContactFormValues>
}

/**
 * End-to-end example wiring the styled form primitives to react-hook-form.
 *
 * Demonstrates the `Controller` idiom across `FormField`, `Input`, `Select`,
 * `Checkbox`, and `Radio` — a single `useForm` instance owns state, validation,
 * and submission. No component API is modified.
 */
export function RhfContactForm({ onSubmit }: RhfContactFormProps) {
  const { control, handleSubmit } = useForm<ContactFormValues>({
    defaultValues,
  })

  const handleValid: SubmitHandler<ContactFormValues> = (values) => {
    onSubmit?.(values)
  }

  return (
    <View className="gap-4" style={{ maxWidth: 360 }}>
      <ControlledInput
        control={control}
        name="fullName"
        label="Full name"
        isRequired
        placeholder="Ada Lovelace"
        rules={{ required: 'Full name is required' }}
      />

      <ControlledSelect
        control={control}
        name="role"
        label="Role"
        isRequired
        options={roleOptions}
        placeholder="Select a role..."
        rules={{ required: 'Please choose a role' }}
      />

      <ControlledRadioGroup
        control={control}
        name="plan"
        label="Plan"
        options={planOptions}
        rules={{ required: 'Please pick a plan' }}
      />

      <ControlledCheckbox
        control={control}
        name="acceptedTerms"
        label="I accept the terms and conditions"
        rules={{ required: 'You must accept the terms' }}
      />

      <Button onPress={handleSubmit(handleValid)}>
        <ButtonText>Submit</ButtonText>
      </Button>
    </View>
  )
}
