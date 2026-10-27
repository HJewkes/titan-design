/**
 * SchemaForm's model: which control each JSON Schema node gets, the row bounds an array keeps and
 * the blank value a new row starts from. A node the form has no control for (a tuple, a record, a
 * union) is `raw` and shows read-only rather than being guessed at.
 */

/** A JSON Schema node, as `zod`'s `toJSONSchema` or any draft 2020-12 emitter writes it. */
export type JsonSchema = Readonly<Record<string, unknown>>

/** A form value: one entry per property of the root object schema. */
export type SchemaFormValue = Record<string, unknown>

export type Control =
  | { kind: 'text'; minLength?: number; maxLength?: number }
  | { kind: 'select'; options: readonly string[] }
  | { kind: 'number'; integer: boolean }
  | { kind: 'boolean' }
  | { kind: 'object'; fields: readonly Field[] }
  | { kind: 'array'; item: Control; itemLabel: string; minItems: number; maxItems: number }
  | { kind: 'raw' }

export type ArrayControl = Extract<Control, { kind: 'array' }>

export interface Field {
  name: string
  label: string
  required: boolean
  control: Control
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' ? value : fallback

function textControl(schema: JsonSchema): Control {
  const { minLength, maxLength } = schema
  return {
    kind: 'text',
    ...(typeof minLength === 'number' ? { minLength } : {}),
    ...(typeof maxLength === 'number' ? { maxLength } : {}),
  }
}

/** The fields of an object schema, in property order; `title` labels a field when it has one. */
export function fieldsOf(schema: unknown): readonly Field[] | null {
  if (!isRecord(schema) || !isRecord(schema.properties)) return null
  const required = new Set(Array.isArray(schema.required) ? schema.required : [])
  return Object.entries(schema.properties).map(([name, node]) => ({
    name,
    label: isRecord(node) && typeof node.title === 'string' ? node.title : name,
    required: required.has(name),
    control: controlOf(node),
  }))
}

/** What one entry of an array is called: the item schema's `title`, else "Row" for objects and "Item" otherwise. */
function itemLabelOf(items: JsonSchema, item: Control): string {
  if (typeof items.title === 'string') return items.title
  return item.kind === 'object' ? 'Row' : 'Item'
}

function arrayControl(schema: JsonSchema): Control {
  if (!isRecord(schema.items) || 'prefixItems' in schema) return { kind: 'raw' }
  const item = controlOf(schema.items)
  return {
    kind: 'array',
    item,
    itemLabel: itemLabelOf(schema.items, item),
    minItems: numberOr(schema.minItems, 0),
    maxItems: numberOr(schema.maxItems, Number.POSITIVE_INFINITY),
  }
}

/** The control for one node: a string enum is a select, every other string a text field. */
export function controlOf(node: unknown): Control {
  if (!isRecord(node)) return { kind: 'raw' }
  if (Array.isArray(node.enum) && node.enum.every((option) => typeof option === 'string')) {
    return { kind: 'select', options: node.enum }
  }
  switch (node.type) {
    case 'string':
      return textControl(node)
    case 'number':
    case 'integer':
      return { kind: 'number', integer: node.type === 'integer' }
    case 'boolean':
      return { kind: 'boolean' }
    case 'object': {
      const fields = fieldsOf(node)
      return fields === null ? { kind: 'raw' } : { kind: 'object', fields }
    }
    case 'array':
      return arrayControl(node)
    default:
      return { kind: 'raw' }
  }
}

/** Every string `id` anywhere in a value, so a new row's id is unique across the form. */
export function idsIn(value: unknown): Set<string> {
  const ids = new Set<string>()
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) node.forEach(walk)
    else if (isRecord(node)) {
      if (typeof node.id === 'string') ids.add(node.id)
      Object.values(node).forEach(walk)
    }
  }
  walk(value)
  return ids
}

/** The first `<stem>-<n>` not taken: kebab case, so it passes a slug id pattern. */
export function uniqueId(taken: ReadonlySet<string>, stem = 'row'): string {
  let n = 1
  while (taken.has(`${stem}-${n}`)) n += 1
  return `${stem}-${n}`
}

/** A blank value for a control; an object gets its required fields only, and an `id` a fresh id. */
function blankOf(control: Control, taken: ReadonlySet<string>): unknown {
  switch (control.kind) {
    case 'text':
      return ''
    case 'select':
      return control.options[0] ?? ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return Object.fromEntries(
        control.fields
          .filter((field) => field.required)
          .map((field) => [
            field.name,
            field.name === 'id' && field.control.kind === 'text'
              ? uniqueId(taken)
              : blankOf(field.control, taken),
          ])
      )
    default:
      return null
  }
}

const rowId = (row: unknown): string | undefined =>
  isRecord(row) && typeof row.id === 'string' ? row.id : undefined

/** Whether a row holds an `id` the consumer locked. */
export const isLockedRow = (row: unknown, lockedIds: readonly string[]): boolean => {
  const id = rowId(row)
  return id !== undefined && lockedIds.includes(id)
}

export const canAddRow = (rows: readonly unknown[], control: ArrayControl): boolean =>
  rows.length < control.maxItems

/** A row stays when the list is at `minItems` or the row holds a locked id. */
export function canRemoveRow(
  rows: readonly unknown[],
  index: number,
  control: ArrayControl,
  lockedIds: readonly string[]
): boolean {
  return rows.length > control.minItems && !isLockedRow(rows[index], lockedIds)
}

export function addRow(
  rows: readonly unknown[],
  control: ArrayControl,
  taken: ReadonlySet<string>
): unknown[] {
  return canAddRow(rows, control) ? [...rows, blankOf(control.item, taken)] : [...rows]
}

export function removeRow(
  rows: readonly unknown[],
  index: number,
  control: ArrayControl,
  lockedIds: readonly string[]
): unknown[] {
  return canRemoveRow(rows, index, control, lockedIds)
    ? rows.filter((_, i) => i !== index)
    : [...rows]
}

export function moveRow(rows: readonly unknown[], from: number, to: number): unknown[] {
  if (to < 0 || to >= rows.length || from === to) return [...rows]
  const next = [...rows]
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row)
  return next
}

/** The bounds line an array shows: "2 of 1–4 rows", or "2, at least 1" when unbounded above. */
export function rowBounds(count: number, control: ArrayControl): string {
  return Number.isFinite(control.maxItems)
    ? `${count} of ${control.minItems}–${control.maxItems} rows`
    : `${count} rows, at least ${control.minItems}`
}
