import { View, Text } from 'react-native'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Select, type SelectOption } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { RadioGroup, Radio } from '../../components/ui/radio'

/**
 * Reusable react-hook-form adapters for the styled form primitives.
 *
 * Each adapter follows the canonical RHF `Controller` render-prop idiom: the
 * library owns the value/validation state and hands it to the already-styled
 * controlled component through `field` + `fieldState`. None of the components'
 * public APIs are touched — this is pure wiring a consumer would write.
 */
interface BaseControlledProps<T extends FieldValues> {
  /** The `control` object returned by `useForm`. */
  control: Control<T>
  /** The field name — type-checked against the form's value shape. */
  name: FieldPath<T>
  /** RHF validation rules (required, pattern, validate, ...). */
  rules?: Omit<
    RegisterOptions<T, FieldPath<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  /** Visible field label. */
  label?: string
  /** Marks the field as required in the UI. */
  isRequired?: boolean
}

export interface ControlledInputProps<T extends FieldValues> extends BaseControlledProps<T> {
  placeholder?: string
}

/** `FormField` + `Input` driven by RHF. Surfaces validation via `errorMessage`. */
export function ControlledInput<T extends FieldValues>({
  control,
  name,
  rules,
  label,
  isRequired,
  placeholder,
}: ControlledInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormField label={label} isRequired={isRequired} errorMessage={fieldState.error?.message}>
          <Input
            value={(field.value as string | undefined) ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
          />
        </FormField>
      )}
    />
  )
}

export interface ControlledSelectProps<T extends FieldValues> extends BaseControlledProps<T> {
  options: SelectOption[]
  placeholder?: string
}

/** `FormField` + `Select` (single-select) driven by RHF. */
export function ControlledSelect<T extends FieldValues>({
  control,
  name,
  rules,
  label,
  isRequired,
  options,
  placeholder,
}: ControlledSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormField label={label} isRequired={isRequired} errorMessage={fieldState.error?.message}>
          <Select
            value={(field.value as string | null | undefined) ?? null}
            onChange={field.onChange}
            options={options}
            placeholder={placeholder}
          />
        </FormField>
      )}
    />
  )
}

/** `Checkbox` (boolean) driven by RHF, with an inline error message. */
export function ControlledCheckbox<T extends FieldValues>({
  control,
  name,
  rules,
  label,
}: BaseControlledProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <View className="gap-1">
          <Checkbox
            label={label}
            isChecked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            isInvalid={!!fieldState.error}
          />
          {fieldState.error && (
            <Text className="text-xs text-status-error">{fieldState.error.message}</Text>
          )}
        </View>
      )}
    />
  )
}

export interface ControlledRadioGroupProps<T extends FieldValues> extends BaseControlledProps<T> {
  options: SelectOption[]
}

/** `RadioGroup` + `Radio` options driven by RHF, with an inline error message. */
export function ControlledRadioGroup<T extends FieldValues>({
  control,
  name,
  rules,
  label,
  options,
}: ControlledRadioGroupProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <View className="gap-1">
          <RadioGroup
            label={label}
            value={(field.value as string | null | undefined) ?? null}
            onChange={field.onChange}
          >
            {options.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
          {fieldState.error && (
            <Text className="text-xs text-status-error">{fieldState.error.message}</Text>
          )}
        </View>
      )}
    />
  )
}
