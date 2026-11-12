import { cn } from '../../../utils/cn'

export interface SelectionState<T> {
  isMulti: boolean
  value: T | null | undefined
  values: T[]
}

interface LabelledOption<T> {
  value: T
  label: string
}

export function toggleValue<T>(values: T[], val: T): T[] {
  return values.includes(val) ? values.filter((v) => v !== val) : [...values, val]
}

export function isValueSelected<T>(s: SelectionState<T>, val: T): boolean {
  if (s.isMulti) {
    return s.values.includes(val)
  }
  return s.value === val
}

export function hasSelection<T>(s: SelectionState<T>): boolean {
  return s.isMulti ? s.values.length > 0 : s.value !== null && s.value !== undefined
}

export function selectDisplayLabel<T>(
  s: SelectionState<T>,
  options: ReadonlyArray<LabelledOption<T>>,
  placeholder: string
): string {
  if (s.isMulti) {
    if (s.values.length === 0) return placeholder
    if (s.values.length === 1) {
      return options.find((o) => o.value === s.values[0])?.label || placeholder
    }
    return `${s.values.length} selected`
  }
  if (s.value === null || s.value === undefined) return placeholder
  return options.find((o) => o.value === s.value)?.label || placeholder
}

/** Control height of the Select trigger; the same steps as Input's size. */
export type SelectSize = 'sm' | 'md' | 'lg'

// Same control heights as Input's `sm | md | lg`, so a Select sits level with an Input in a row.
const triggerSizeClass: Record<SelectSize, string> = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-12 px-4',
}

export interface TriggerState {
  variant: 'default' | 'filled'
  size?: SelectSize
  isInvalid: boolean
  isDisabled: boolean
  isOpen: boolean
}

function triggerBorderClass({ variant, isInvalid }: TriggerState) {
  if (isInvalid) return 'border-border-input-error'
  return variant === 'filled' ? 'border-hairline-subtle' : 'border-border-input'
}

export function triggerClassName(state: TriggerState) {
  const { variant, size, isInvalid, isDisabled, isOpen } = state
  return cn(
    'flex-row items-center justify-between rounded-md border',
    size ? triggerSizeClass[size] : 'px-4 py-2.5',
    variant === 'filled' ? undefined : 'bg-surface-base',
    triggerBorderClass(state),
    !isDisabled && !isInvalid && 'web:hover:border-border-input-hover',
    isOpen && 'border-border-input-focus',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )
}

const labelSizeClass: Record<SelectSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function labelClassName(size: SelectSize | undefined, hasValue: boolean) {
  return cn(
    'flex-1',
    size && labelSizeClass[size],
    hasValue ? 'text-text-primary' : 'text-text-secondary'
  )
}
