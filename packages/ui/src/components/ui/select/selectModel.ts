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

export interface TriggerState {
  variant: 'default' | 'filled'
  isInvalid: boolean
  isDisabled: boolean
  isOpen: boolean
}

export function triggerClassName({ variant, isInvalid, isDisabled, isOpen }: TriggerState) {
  const isFilled = variant === 'filled'
  return cn(
    'flex-row items-center justify-between px-4 py-2.5 rounded-md border',
    isFilled ? undefined : 'bg-surface-base',
    isInvalid
      ? 'border-border-input-error'
      : isFilled
        ? 'border-hairline-subtle'
        : 'border-border-input',
    !isDisabled && !isInvalid && 'web:hover:border-border-input-hover',
    isOpen && 'border-border-input-focus',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )
}
