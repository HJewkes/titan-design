import { createContext, useContext } from 'react'
import type { Control } from './schemaFormModel'

/** Errors keyed by dotted path under the root value, such as `title` or `rows.1.left`. */
export type SchemaFormErrors = Readonly<Record<string, string | readonly string[]>>

/** What every field below the root shares, so it is not threaded through each level. */
export interface FormContext {
  lockedIds: readonly string[]
  lockedIdHint: string
  taken: ReadonlySet<string>
  errors: SchemaFormErrors
  isDisabled: boolean
  domId: string
  testID: string
}

export const SchemaFormContext = createContext<FormContext | null>(null)

export function useForm(): FormContext {
  const context = useContext(SchemaFormContext)
  if (context === null) throw new Error('SchemaForm fields render only inside SchemaForm')
  return context
}

export interface NodeProps {
  path: string
  label: string
  control: Control
  value: unknown
  onChange: (value: unknown) => void
  isRequired?: boolean
  /** Set on a locked object's `id` field, so it reads but never changes. */
  isReadOnly?: boolean
}

export const pathKey = (path: string): string => path.replace(/\./g, '-')

export const testIdOf = (form: FormContext, path: string): string =>
  `${form.testID}-${pathKey(path)}`

function errorAt(form: FormContext, path: string): string | undefined {
  const error = form.errors[path]
  if (error === undefined) return undefined
  return typeof error === 'string' ? error : error.join('; ')
}

/** What every leaf control shares: its error, its invalid state and the id its message carries. */
export function useLeaf(path: string, extraInvalid = false) {
  const form = useForm()
  const error = errorAt(form, path)
  const isInvalid = extraInvalid || error !== undefined
  return { form, error, isInvalid, messageId: `${form.domId}-${pathKey(path)}-msg` }
}

/** Names the message only while one renders, so `aria-describedby` never points at a missing id. */
export const describedBy = (
  messageId: string,
  message: string | undefined,
  isInvalid: boolean
) => ({
  ...(message === undefined ? {} : { 'aria-describedby': messageId }),
  'aria-invalid': isInvalid,
})
