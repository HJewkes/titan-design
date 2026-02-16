import React, { useState, createContext, useContext } from 'react'
import { View, Text, Pressable, ScrollView, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface SelectOption<T = string> {
  value: T
  label: string
  isDisabled?: boolean
}

interface SelectContextType<T = string> {
  value: T | T[] | null
  isMulti: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  selectValue: (val: T) => void
  isSelected: (val: T) => boolean
}

const SelectContext = createContext<SelectContextType<any>>({
  value: null,
  isMulti: false,
  isOpen: false,
  setIsOpen: () => {},
  selectValue: () => {},
  isSelected: () => false,
})

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
  /** Additional className */
  className?: string
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
  placeholder = 'Select...',
  isDisabled = false,
  isInvalid = false,
  options,
  className,
  ...props
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const selectValue = (val: T) => {
    if (isMulti) {
      const newValues = values.includes(val)
        ? values.filter((v) => v !== val)
        : [...values, val]
      onChangeMulti?.(newValues)
    } else {
      onChange?.(val)
      setIsOpen(false)
    }
  }

  const isSelected = (val: T) => {
    if (isMulti) {
      return values.includes(val)
    }
    return value === val
  }

  const getDisplayValue = () => {
    if (isMulti) {
      if (values.length === 0) return placeholder
      if (values.length === 1) {
        return options.find((o) => o.value === values[0])?.label || placeholder
      }
      return `${values.length} selected`
    }
    if (value === null || value === undefined) return placeholder
    return options.find((o) => o.value === value)?.label || placeholder
  }

  const clearValue = () => {
    if (isMulti) {
      onChangeMulti?.([])
    } else {
      onChange?.(null)
    }
  }

  const hasValue = isMulti ? values.length > 0 : value !== null && value !== undefined

  return (
    <SelectContext.Provider value={{ value, isMulti, isOpen, setIsOpen, selectValue, isSelected }}>
      <View className={cn('relative w-full', className)} {...props}>
        {/* Trigger */}
        <Pressable
          onPress={() => !isDisabled && setIsOpen(!isOpen)}
          disabled={isDisabled}
          accessibilityRole="combobox"
          accessibilityState={{ expanded: isOpen, disabled: isDisabled }}
          className={cn(
            'flex-row items-center justify-between px-4 py-2.5 rounded-md border',
            'bg-surface-base',
            isInvalid ? 'border-border-input-error' : 'border-border-input',
            !isDisabled && !isInvalid && 'web:hover:border-border-input-hover',
            isOpen && 'border-border-input-focus',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Text
            className={cn(
              'flex-1',
              hasValue ? 'text-text-primary' : 'text-text-tertiary'
            )}
          >
            {getDisplayValue()}
          </Text>
          <View className="flex-row items-center gap-2">
            {hasValue && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.()
                  clearValue()
                }}
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
          <>
            <Pressable
              onPress={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
              style={{ position: 'absolute' }}
            />
            <View
              className={cn(
                'absolute z-50 top-full left-0 right-0 mt-1',
                'bg-surface-elevated rounded-md shadow-lg border border-border-default',
                'max-h-60 overflow-hidden'
              )}
            >
              <ScrollView className="py-1">
                {options.map((option) => (
                  <SelectOption key={option.value} option={option} />
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </SelectContext.Provider>
  )
}

interface SelectOptionComponentProps<T> {
  option: SelectOption<T>
}

function SelectOption<T>({ option }: SelectOptionComponentProps<T>) {
  const { selectValue, isSelected, isMulti } = useContext(SelectContext)
  const selected = isSelected(option.value)

  return (
    <Pressable
      onPress={() => !option.isDisabled && selectValue(option.value)}
      disabled={option.isDisabled}
      accessibilityRole={isMulti ? 'checkbox' : ('option' as any)}
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
            selected ? 'bg-brand-primary border-brand-primary' : 'border-border-strong'
          )}
        >
          {selected && <Text className="text-white text-xs text-center">✓</Text>}
        </View>
      )}
      <Text className={cn('text-sm', selected && !isMulti ? 'text-brand-primary font-medium' : 'text-text-primary')}>
        {option.label}
      </Text>
    </Pressable>
  )
}
