import React, { createContext, useContext, useId, useMemo } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Button, ButtonText } from '../button'
import { Checkbox } from '../checkbox'
import { EmptyState } from '../empty-state'
import { Input } from '../input'
import { Select } from '../select'
import { HStack, VStack } from '../stack'
import { Typography } from '../typography'
import {
  addRow,
  canAddRow,
  canRemoveRow,
  fieldsOf,
  idsIn,
  isLockedRow,
  isRecord,
  moveRow,
  removeRow,
  rowBounds,
  type ArrayControl,
  type Control,
  type Field,
  type JsonSchema,
  type SchemaFormValue,
} from './schemaFormModel'

export type { JsonSchema, SchemaFormValue } from './schemaFormModel'

/** Errors keyed by dotted path under the root value, such as `title` or `rows.1.left`. */
export type SchemaFormErrors = Readonly<Record<string, string | readonly string[]>>

/** Props for {@link SchemaForm}. */
export interface SchemaFormProps {
  /** An object JSON Schema; each of its `properties` renders as one field. */
  schema: JsonSchema
  /** The current value. The form is controlled: every edit hands `onChange` a new root object. */
  value: SchemaFormValue
  /** Called with the whole next value on every edit. */
  onChange: (value: SchemaFormValue) => void
  /** Per-field errors by dotted path; an array's own path carries its row-count error. */
  errors?: SchemaFormErrors
  /** Ids that must not change: an object whose `id` is listed shows it read-only, and its row cannot be removed. */
  lockedIds?: readonly string[]
  /** Helper text under a locked id. */
  lockedIdHint?: string
  /** Disables every control, including the row buttons. */
  isDisabled?: boolean
  /** Shown when the schema has no properties. Defaults to an `EmptyState`. */
  emptyState?: React.ReactNode
  /** Root test id; each field's is `<testID>-<path with dots as dashes>`. */
  testID?: string
  /** Additional className for the root stack. */
  className?: string
}

interface FormContext {
  lockedIds: readonly string[]
  lockedIdHint: string
  taken: ReadonlySet<string>
  errors: SchemaFormErrors
  isDisabled: boolean
  domId: string
  testID: string
}

const SchemaFormContext = createContext<FormContext | null>(null)

function useForm(): FormContext {
  const context = useContext(SchemaFormContext)
  if (context === null) throw new Error('SchemaForm fields render only inside SchemaForm')
  return context
}

interface NodeProps {
  path: string
  label: string
  control: Control
  value: unknown
  onChange: (value: unknown) => void
  isRequired?: boolean
  /** Set on a locked object's `id` field, so it reads but never changes. */
  isReadOnly?: boolean
}

const pathKey = (path: string): string => path.replace(/\./g, '-')

function errorAt(form: FormContext, path: string): string | undefined {
  const error = form.errors[path]
  if (error === undefined) return undefined
  return typeof error === 'string' ? error : error.join('; ')
}

/** The id a field's message carries, so the control can name it in `aria-describedby`. */
const messageIdOf = (form: FormContext, path: string): string =>
  `${form.domId}-${pathKey(path)}-msg`

/**
 * A form rendered from a JSON Schema: strings (with a `maxLength` counter), string enums as a
 * select, numbers, booleans, nested objects and arrays whose rows add, remove and reorder inside
 * `minItems` / `maxItems`. A node it has no control for (a tuple, a record, a union) shows its
 * value read-only.
 *
 * @example
 * <SchemaForm schema={schema} value={value} onChange={setValue} errors={{ title: 'Too long' }} />
 */
export function SchemaForm({
  schema,
  value,
  onChange,
  errors = {},
  lockedIds = [],
  lockedIdHint = 'This id is locked',
  isDisabled = false,
  emptyState,
  testID = 'schema-form',
  className,
}: SchemaFormProps) {
  const domId = useId()
  const fields = useMemo(() => fieldsOf(schema) ?? [], [schema])
  const taken = useMemo(() => idsIn(value), [value])
  const context: FormContext = { lockedIds, lockedIdHint, taken, errors, isDisabled, domId, testID }
  return (
    <SchemaFormContext.Provider value={context}>
      <VStack gap={4} className={cn('w-full min-w-0', className)} testID={testID}>
        {fields.length === 0
          ? (emptyState ?? (
              <EmptyState title="Nothing to edit" description="The schema has no fields." />
            ))
          : fields.map((field) => (
              <FieldNode
                key={field.name}
                field={field}
                path={field.name}
                parent={value}
                onParentChange={onChange}
              />
            ))}
      </VStack>
    </SchemaFormContext.Provider>
  )
}

interface FieldNodeProps {
  field: Field
  path: string
  parent: Record<string, unknown>
  onParentChange: (value: Record<string, unknown>) => void
  isReadOnly?: boolean
}

function FieldNode({ field, path, parent, onParentChange, isReadOnly }: FieldNodeProps) {
  return (
    <SchemaNode
      path={path}
      label={field.label}
      control={field.control}
      value={parent[field.name]}
      onChange={(next) => onParentChange({ ...parent, [field.name]: next })}
      isRequired={field.required}
      isReadOnly={isReadOnly}
    />
  )
}

function SchemaNode(props: NodeProps) {
  switch (props.control.kind) {
    case 'text':
      return <TextField {...props} control={props.control} />
    case 'number':
      return <NumberField {...props} />
    case 'select':
      return <SelectField {...props} options={props.control.options} />
    case 'boolean':
      return <BooleanField {...props} />
    case 'object':
      return <ObjectField {...props} fields={props.control.fields} />
    case 'array':
      return <ArrayField {...props} control={props.control} />
    default:
      return <RawField {...props} />
  }
}

interface FieldMessageProps {
  id: string
  text: string | undefined
  isError: boolean
}

function FieldMessage({ id, text, isError }: FieldMessageProps) {
  if (text === undefined) return null
  return (
    <Typography id={id} variant="caption" color={isError ? 'error' : 'secondary'}>
      {text}
    </Typography>
  )
}

/** What every leaf control shares: its error, its invalid state and the id its message carries. */
function useLeaf(path: string, extraInvalid = false) {
  const form = useForm()
  const error = errorAt(form, path)
  const isInvalid = extraInvalid || error !== undefined
  return { form, error, isInvalid, messageId: messageIdOf(form, path) }
}

/** Names the message only while one renders, so `aria-describedby` never points at a missing id. */
const describedBy = (messageId: string, message: string | undefined, isInvalid: boolean) => ({
  ...(message === undefined ? {} : { 'aria-describedby': messageId }),
  'aria-invalid': isInvalid,
})

function textMessage(
  counter: string | undefined,
  error: string | undefined,
  hint: string | undefined
) {
  if (error !== undefined) return counter === undefined ? error : `${counter} · ${error}`
  return hint ?? counter
}

function TextField({
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
  const hint = isReadOnly ? form.lockedIdHint : undefined
  const message = textMessage(counter, error, hint)
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
        testID={`${form.testID}-${pathKey(path)}`}
      />
      <FieldMessage id={messageId} text={message} isError={isInvalid} />
    </VStack>
  )
}

/** Text still being typed ("1.", "-") stays text, so the consumer's check names it rather than the form eating it. */
const parseNumber = (text: string): unknown =>
  text.trim() !== '' && Number.isFinite(Number(text)) ? Number(text) : text

function NumberField({ path, label, value, onChange, isRequired }: NodeProps) {
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
        testID={`${form.testID}-${pathKey(path)}`}
      />
      <FieldMessage id={messageId} text={error} isError />
    </VStack>
  )
}

function SelectField({
  path,
  label,
  value,
  onChange,
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
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <Select<string>
        accessibilityLabel={label}
        value={typeof value === 'string' ? value : null}
        options={options.map((option) => ({ value: option, label: option }))}
        onChange={(next) => next !== null && onChange(next)}
        isDisabled={form.isDisabled}
        isInvalid={isInvalid}
        className="w-full max-w-full"
        testID={`${form.testID}-${pathKey(path)}`}
      />
      <FieldMessage id={messageId} text={error} isError />
    </VStack>
  )
}

function BooleanField({ path, label, value, onChange }: NodeProps) {
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
        testID={`${form.testID}-${pathKey(path)}`}
      />
      <FieldMessage id={messageId} text={error} isError />
    </VStack>
  )
}

function ObjectField({
  path,
  label,
  value,
  onChange,
  fields,
}: NodeProps & { fields: readonly Field[] }) {
  const form = useForm()
  const object = isRecord(value) ? value : {}
  const isIdLocked = isLockedRow(object, form.lockedIds)
  return (
    <VStack
      gap={3}
      role="group"
      aria-label={label}
      className="w-full min-w-0"
      testID={`${form.testID}-${pathKey(path)}`}
    >
      <Typography variant="subtitle2">{label}</Typography>
      {fields.map((field) => (
        <FieldNode
          key={field.name}
          field={field}
          path={`${path}.${field.name}`}
          parent={object}
          onParentChange={onChange}
          isReadOnly={field.name === 'id' && isIdLocked}
        />
      ))}
    </VStack>
  )
}

function ArrayField({
  path,
  label,
  control,
  value,
  onChange,
}: NodeProps & { control: ArrayControl }) {
  const { form, error, messageId } = useLeaf(path)
  const rows = Array.isArray(value) ? value : []
  const key = `${form.testID}-${pathKey(path)}`
  const { 'aria-describedby': groupDescribedBy } = describedBy(messageId, error, false)
  return (
    <VStack
      gap={2}
      role="group"
      aria-label={label}
      aria-describedby={groupDescribedBy}
      className="w-full min-w-0"
      testID={key}
    >
      <HStack gap={2} wrap align="center" className="max-w-full">
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="caption" color="secondary">
          {rowBounds(rows.length, control)}
        </Typography>
      </HStack>
      <FieldMessage id={messageId} text={error} isError />
      {rows.map((row, index) => (
        <ArrayRow
          key={index}
          path={`${path}.${index}`}
          label={label}
          index={index}
          rows={rows}
          control={control}
          onChange={onChange}
        />
      ))}
      <Button
        size="sm"
        variant="outline"
        onPress={() => onChange(addRow(rows, control, form.taken))}
        isDisabled={form.isDisabled || !canAddRow(rows, control)}
        accessibilityLabel={`Add ${label} row`}
        className="max-w-full self-start"
        testID={`${key}-add`}
      >
        <ButtonText>Add row</ButtonText>
      </Button>
    </VStack>
  )
}

interface ArrayRowProps {
  path: string
  label: string
  index: number
  rows: readonly unknown[]
  control: ArrayControl
  onChange: (rows: unknown[]) => void
}

function ArrayRow({ path, label, index, rows, control, onChange }: ArrayRowProps) {
  const rowLabel = `${label} row ${index + 1}`
  const setRow = (next: unknown) => onChange(rows.map((each, i) => (i === index ? next : each)))
  return (
    <VStack gap={2} className="w-full min-w-0 rounded-md border border-hairline p-inset-sm">
      <SchemaNode
        path={path}
        label={rowLabel}
        control={control.item}
        value={rows[index]}
        onChange={setRow}
      />
      <RowButtons
        path={path}
        rowLabel={rowLabel}
        index={index}
        rows={rows}
        control={control}
        onChange={onChange}
      />
    </VStack>
  )
}

type RowButtonsProps = Omit<ArrayRowProps, 'label'> & { rowLabel: string }

function RowButtons({ path, rowLabel, index, rows, control, onChange }: RowButtonsProps) {
  const form = useForm()
  const key = `${form.testID}-${pathKey(path)}`
  const canRemove = canRemoveRow(rows, index, control, form.lockedIds)
  const buttons = [
    {
      name: 'Up',
      label: `Move ${rowLabel} up`,
      isEnabled: index > 0,
      next: () => moveRow(rows, index, index - 1),
    },
    {
      name: 'Down',
      label: `Move ${rowLabel} down`,
      isEnabled: index < rows.length - 1,
      next: () => moveRow(rows, index, index + 1),
    },
    {
      name: 'Remove',
      label: `Remove ${rowLabel}`,
      isEnabled: canRemove,
      next: () => removeRow(rows, index, control, form.lockedIds),
    },
  ]
  return (
    <HStack gap={2} wrap className="max-w-full">
      {buttons.map((button) => (
        <Button
          key={button.name}
          size="sm"
          variant="ghost"
          color={button.name === 'Remove' ? 'error' : 'primary'}
          onPress={() => onChange(button.next())}
          isDisabled={form.isDisabled || !button.isEnabled}
          accessibilityLabel={button.label}
          className="max-w-full"
          testID={`${key}-${button.name.toLowerCase()}`}
        >
          <ButtonText>{button.name}</ButtonText>
        </Button>
      ))}
    </HStack>
  )
}

/** A node the form has no control for shows its value; the consumer edits it elsewhere. */
function RawField({ path, label, value }: NodeProps) {
  const form = useForm()
  return (
    <View className="w-full min-w-0 gap-1" testID={`${form.testID}-${pathKey(path)}`}>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <Typography variant="mono" className="break-all">
        {value === undefined ? '—' : JSON.stringify(value)}
      </Typography>
    </View>
  )
}
