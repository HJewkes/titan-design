import { useState, createContext, useContext } from 'react'
import { View, Text, Pressable, ScrollView, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { SelectPopover } from './SelectPopover'
import { hasSelection, isValueSelected, selectDisplayLabel, toggleValue } from './selectModel'

export interface SelectOption<T = string> {
  value: T
  label: string
  isDisabled?: boolean
}

// Method signatures check their parameters bivariantly, so a `Select<T>` provider fits the shared
// `unknown` context and every `SelectOption<T>` can pass its own `T` back.
interface SelectContextType<T = string> {
  value: T | T[] | null
  isMulti: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  selectValue(val: T): void
  isSelected(val: T): boolean
}

const SelectContext = createContext<SelectContextType<unknown>>({
  value: null,
  isMulti: false,
  isOpen: false,
  setIsOpen: () => {},
  selectValue: () => {},
  isSelected: () => false,
})

// The provider is a `Select<T>` and the consumer a `SelectOption<T>` of the same `T`; the shared
// context object cannot carry that, so the cast lives here, once.
function useSelectContext<T>() {
  return useContext(SelectContext) as SelectContextType<T>
}

/** Control height of the Select trigger; the same steps as Input's size. */
export type SelectSize = 'sm' | 'md' | 'lg'

// Same control heights as Input's `sm | md | lg`, so a Select sits level with an Input in a row.
const sizeStyles: Record<SelectSize, { trigger: string; text: string }> = {
  sm: { trigger: 'h-8 px-3', text: 'text-sm' },
  md: { trigger: 'h-10 px-4', text: 'text-base' },
  lg: { trigger: 'h-12 px-4', text: 'text-lg' },
}

export interface SelectProps<T = string> extends ViewProps {
  /** Selected value (single mode) */
  value?: T | null
  /** Selected values (multi mode) */
  values?: T[]
  /** Callback when value changes (single mode) */
  onChange?: (value: T | null) => void
  /** Callback when values change (multi mode) */
  onChangeMulti?: (values: T[]) => void
  /** Enable multi-select */
  isMulti?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Whether the select is disabled */
  isDisabled?: boolean
  /** Whether the select has an error */
  isInvalid?: boolean
  /** Options to display */
  options: SelectOption<T>[]
  /** Visual variant — use 'filled' on dark/elevated surfaces */
  variant?: 'default' | 'filled'
  /** Whether a selected value shows a clear button. Set false when the value is a meaningful "all". */
  isClearable?: boolean
  /** Control height, matching Input's sizes. Omitted, the trigger keeps its padded height. */
  size?: SelectSize
  /** Additional className */
  className?: string
}

interface TriggerStyleState {
  variant: NonNullable<SelectProps['variant']>
  size?: SelectSize
  isInvalid: boolean
  isDisabled: boolean
  isOpen: boolean
}

function triggerBorderClass({ variant, isInvalid }: TriggerStyleState) {
  if (isInvalid) return 'border-border-input-error'
  return variant === 'filled' ? 'border-hairline-subtle' : 'border-border-input'
}

function triggerClassName(state: TriggerStyleState) {
  const { variant, size, isInvalid, isDisabled, isOpen } = state
  return cn(
    'flex-row items-center justify-between rounded-md border',
    size ? sizeStyles[size].trigger : 'px-4 py-2.5',
    // Light re-points the scrim: 0.30 black over white leaves text-secondary at 3.33:1,
    // 0.10 keeps the placeholder above 4.5:1 on every light plane the field sits on.
    variant === 'filled' ? 'bg-scrim-subtle [.light_&]:bg-scrim-press' : 'bg-surface-base',
    triggerBorderClass(state),
    !isDisabled && !isInvalid && 'web:hover:border-border-input-hover',
    isOpen && 'border-border-input-focus',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )
}

function labelClassName(size: SelectSize | undefined, hasValue: boolean) {
  return cn(
    'flex-1',
    size && sizeStyles[size].text,
    hasValue ? 'text-text-primary' : 'text-text-secondary'
  )
}

/**
 * Select component for single or multi-selection.
 *
 * @example
 * // Single select
 * <Select
 *   value={value}
 *   onChange={setValue}
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 * />
 *
 * // Multi select
 * <Select
 *   isMulti
 *   values={values}
 *   onChangeMulti={setValues}
 *   options={options}
 * />
 */
export function Select<T extends string = string>({
  value,
  values = [],
  onChange,
  onChangeMulti,
  isMulti = false,
  accessibilityLabel,
  placeholder = 'Select...',
  isDisabled = false,
  isInvalid = false,
  options,
  variant = 'default',
  size,
  isClearable = true,
  className,
  ...props
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const selection = { isMulti, value, values }

  const selectValue = (val: T) => {
    if (isMulti) {
      onChangeMulti?.(toggleValue(values, val))
    } else {
      onChange?.(val)
      setIsOpen(false)
    }
  }

  const isSelected = (val: T) => isValueSelected(selection, val)
  const displayValue = selectDisplayLabel(selection, options, placeholder)

  const clearValue = () => {
    if (isMulti) {
      onChangeMulti?.([])
    } else {
      onChange?.(null)
    }
  }

  const hasValue = hasSelection(selection)

  return (
    <SelectContext.Provider value={{ value, isMulti, isOpen, setIsOpen, selectValue, isSelected }}>
      <View className={cn('relative w-full', className)} {...props}>
        {/* Trigger */}
        <Pressable
          onPress={() => !isDisabled && setIsOpen(!isOpen)}
          disabled={isDisabled}
          accessibilityRole="combobox"
          accessibilityLabel={accessibilityLabel}
          aria-expanded={isOpen}
          accessibilityState={{ expanded: isOpen, disabled: isDisabled }}
          className={triggerClassName({ variant, size, isInvalid, isDisabled, isOpen })}
        >
          <Text className={labelClassName(size, hasValue)}>{displayValue}</Text>
          <View className="flex-row items-center gap-2">
            {hasValue && isClearable && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.()
                  clearValue()
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  accessibilityLabel ? `Clear ${accessibilityLabel}` : 'Clear selection'
                }
                className="p-1"
              >
                <Text className="text-text-secondary text-xs">×</Text>
              </Pressable>
            )}
            <Text className={cn('text-text-secondary', isOpen && 'rotate-180')}>▼</Text>
          </View>
        </Pressable>

        {/* Dropdown */}
        {isOpen && (
          <SelectPopover onClose={() => setIsOpen(false)}>
            <ScrollView className="py-1">
              {options.map((option) => (
                <SelectOption key={option.value} option={option} />
              ))}
            </ScrollView>
          </SelectPopover>
        )}
      </View>
    </SelectContext.Provider>
  )
}

interface SelectOptionComponentProps<T> {
  option: SelectOption<T>
}

function SelectOption<T>({ option }: SelectOptionComponentProps<T>) {
  const { selectValue, isSelected, isMulti } = useSelectContext<T>()
  const selected = isSelected(option.value)

  return (
    <Pressable
      onPress={() => !option.isDisabled && selectValue(option.value)}
      disabled={option.isDisabled}
      role={isMulti ? 'checkbox' : 'option'}
      accessibilityState={{ selected, disabled: option.isDisabled }}
      className={cn(
        'flex-row items-center px-4 py-2',
        'web:hover:bg-interactive-hover active:bg-interactive-active',
        selected && 'bg-interactive-selected',
        option.isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isMulti && (
        <View
          className={cn(
            'w-4 h-4 mr-3 rounded border',
            selected ? 'bg-brand-primary border-brand-primary' : 'border-hairline-strong'
          )}
        >
          {selected && <Text className="text-on-brand-primary text-xs text-center">✓</Text>}
        </View>
      )}
      <Text
        className={cn(
          'text-sm',
          selected && !isMulti ? 'text-brand-primary font-medium' : 'text-text-primary'
        )}
      >
        {option.label}
      </Text>
    </Pressable>
  )
}
