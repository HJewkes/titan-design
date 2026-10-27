import React, { useId, useMemo } from 'react'
import { cn } from '../../../utils/cn'
import { EmptyState } from '../empty-state'
import { VStack } from '../stack'
import { SchemaFormContext, type FormContext, type SchemaFormErrors } from './schemaFormContext'
import { fieldsOf, idsIn, type JsonSchema, type SchemaFormValue } from './schemaFormModel'
import { FieldNode } from './SchemaFormNodes'

export type { SchemaFormErrors } from './schemaFormContext'
export type { JsonSchema, SchemaFormValue } from './schemaFormModel'

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
