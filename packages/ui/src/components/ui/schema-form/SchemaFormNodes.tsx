import { Button, ButtonText } from '../button'
import { HStack, VStack } from '../stack'
import { Typography } from '../typography'
import { describedBy, testIdOf, useForm, useLeaf, type NodeProps } from './schemaFormContext'
import {
  addRow,
  canAddRow,
  canRemoveRow,
  isLockedRow,
  isRecord,
  moveRow,
  removeRow,
  rowBounds,
  type ArrayControl,
  type Field,
} from './schemaFormModel'
import {
  BooleanField,
  FieldMessage,
  NumberField,
  RawField,
  SelectField,
  TextField,
} from './SchemaFormLeaves'

interface FieldNodeProps {
  field: Field
  path: string
  parent: Record<string, unknown>
  onParentChange: (value: Record<string, unknown>) => void
  isReadOnly?: boolean
}

/** One property of an object: each edit replaces the property whole on a new parent object. */
export function FieldNode({ field, path, parent, onParentChange, isReadOnly }: FieldNodeProps) {
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
      testID={testIdOf(form, path)}
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
  const { 'aria-describedby': groupDescribedBy } = describedBy(messageId, error, false)
  return (
    <VStack
      gap={2}
      role="group"
      aria-label={label}
      aria-describedby={groupDescribedBy}
      className="w-full min-w-0"
      testID={testIdOf(form, path)}
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
        accessibilityLabel={`Add ${control.itemLabel.toLowerCase()} to ${label}`}
        className="max-w-full self-start"
        testID={`${testIdOf(form, path)}-add`}
      >
        <ButtonText>{`Add ${control.itemLabel.toLowerCase()}`}</ButtonText>
      </Button>
    </VStack>
  )
}

interface ArrayRowProps {
  path: string
  index: number
  rows: readonly unknown[]
  control: ArrayControl
  onChange: (rows: unknown[]) => void
}

/** A row is named by its item label alone ("Row 2"); the array's own group already names the list. */
function ArrayRow({ path, index, rows, control, onChange }: ArrayRowProps) {
  const rowLabel = `${control.itemLabel} ${index + 1}`
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

type RowButtonsProps = ArrayRowProps & { rowLabel: string }

function RowButtons({ path, rowLabel, index, rows, control, onChange }: RowButtonsProps) {
  const form = useForm()
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
          testID={`${testIdOf(form, path)}-${button.name.toLowerCase()}`}
        >
          <ButtonText>{button.name}</ButtonText>
        </Button>
      ))}
    </HStack>
  )
}
