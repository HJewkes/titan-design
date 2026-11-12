import { Text } from 'react-native'
import { Checkbox } from '../checkbox'
import { Input } from '../input'
import { Select } from '../select'
import { VStack } from '../stack'
import { Typography } from '../typography'
import { describedBy, testIdOf, useLeaf, type NodeProps } from './schemaFormContext'
import type { Control } from './schemaFormModel'

interface FieldMessageProps {
  id: string
  text: string | undefined
  isError: boolean
}

export function FieldMessage({ id, text, isError }: FieldMessageProps) {
  if (text === undefined) return null
  return (
    <Typography id={id} variant="caption" color={isError ? 'error' : 'secondary'}>
      {text}
    </Typography>
  )
}

function textMessage(
  counter: string | undefined,
  error: string | undefined,
  hint: string | undefined
) {
  if (error !== undefined) return counter === undefined ? error : `${counter} · ${error}`
  return hint ?? counter
}

export function TextField({
  path,
  label,
  control,
  value,
  onChange,
  isRequired,
  isReadOnly,
}: NodeProps & { control: Extract<Control, { kind: 'text' }> }) {
  const text = typeof value === 'string' ? value : ''
  const isOver = control.maxLength !== undefined && text.length > control.maxLength
  const counter =
    control.maxLength === undefined ? undefined : `${text.length}/${control.maxLength}`
  const { form, error, messageId, isInvalid } = useLeaf(path, isOver)
  const message = textMessage(counter, error, isReadOnly ? form.lockedIdHint : undefined)
  return (
    <VStack gap={1} className="w-full min-w-0">
      <Input
        label={label}
        value={text}
        onChangeText={onChange}
        isRequired={isRequired}
        isReadOnly={isReadOnly === true}
        isDisabled={form.isDisabled}
        isInvalid={isInvalid}
        {...describedBy(messageId, message, isInvalid)}
        className="w-full min-w-0"
        testID={testIdOf(form, path)}
      />
      <FieldMessage id={messageId} text={message} isError={isInvalid} />
    </VStack>
  )
}

/** Text still being typed ("1.", "-") stays text, so the consumer's check names it rather than the form eating it. */
const parseNumber = (text: string): unknown =>
  text.trim() !== '' && Number.isFinite(Number(text)) ? Number(text) : text

export function NumberField({ path, label, value, onChange, isRequired }: NodeProps) {
  const { form, error, messageId, isInvalid } = useLeaf(path)
  return (
    <VStack gap={1} className="w-full min-w-0">
      <Input
        label={label}
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={(text: string) => onChange(parseNumber(text))}
        keyboardType="numeric"
        isRequired={isRequired}
        isDisabled={form.isDisabled}
        isInvalid={isInvalid}
        {...describedBy(messageId, error, isInvalid)}
        className="w-full min-w-0"
        testID={testIdOf(form, path)}
      />
      <FieldMessage id={messageId} text={error} isError />
    </VStack>
  )
}

/** The label Input draws for itself, for the controls that do not draw one (Select). */
function FieldLabel({ label, isRequired }: { label: string; isRequired?: boolean }) {
  return (
    <Text className="font-heading text-sm font-medium text-text-primary">
      {label}
      {isRequired ? <Text className="text-text-error ml-0.5">*</Text> : null}
    </Text>
  )
}

export function SelectField({
  path,
  label,
  value,
  onChange,
  isRequired,
  options,
}: NodeProps & { options: readonly string[] }) {
  const { form, error, messageId, isInvalid } = useLeaf(path)
  const { 'aria-describedby': groupDescribedBy } = describedBy(messageId, error, isInvalid)
  return (
    <VStack
      gap={1}
      role="group"
      aria-label={label}
      aria-describedby={groupDescribedBy}
      className="w-full min-w-0"
    >
      <FieldLabel label={label} isRequired={isRequired} />
      <Select<string>
        accessibilityLabel={label}
        value={typeof value === 'string' ? value : null}
        options={options.map((option) => ({ value: option, label: option }))}
        onChange={(next) => next !== null && onChange(next)}
        isDisabled={form.isDisabled}
        isInvalid={isInvalid}
        className="w-full max-w-full"
        testID={testIdOf(form, path)}
      />
      <FieldMessage id={messageId} text={error} isError />
    </VStack>
  )
}

export function BooleanField({ path, label, value, onChange }: NodeProps) {
  const { form, error, messageId, isInvalid } = useLeaf(path)
  return (
    <VStack gap={1} className="w-full min-w-0">
      <Checkbox
        label={label}
        isChecked={value === true}
        onCheckedChange={(checked: boolean) => onChange(checked)}
        isDisabled={form.isDisabled}
        isInvalid={isInvalid}
        {...describedBy(messageId, error, isInvalid)}
        testID={testIdOf(form, path)}
      />
      <FieldMessage id={messageId} text={error} isError />
    </VStack>
  )
}

const RAW_HINT = 'Read-only: this form cannot edit this value'

/**
 * A node the form has no control for (a tuple, a record, a union) shows its value in a labelled
 * read-only field, so it reads as a field that cannot be edited here, not as loose text.
 */
export function RawField({ path, label, value, isRequired }: NodeProps) {
  const { form, error, messageId, isInvalid } = useLeaf(path)
  const message = error ?? RAW_HINT
  return (
    <VStack gap={1} className="w-full min-w-0">
      <Input
        label={label}
        value={value === undefined ? '' : JSON.stringify(value)}
        isReadOnly
        isRequired={isRequired}
        isInvalid={isInvalid}
        {...describedBy(messageId, message, isInvalid)}
        className="w-full min-w-0"
        inputClassName="font-mono"
        testID={testIdOf(form, path)}
      />
      <FieldMessage id={messageId} text={message} isError={isInvalid} />
    </VStack>
  )
}
