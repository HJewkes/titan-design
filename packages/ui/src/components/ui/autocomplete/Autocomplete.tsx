import React from 'react'
import { View, TextInput, type ViewProps, type TextInputProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { defaultFilterFn, dropdownContent, type AutocompleteOption } from './autocompleteFilter'
import {
  AutocompleteClearButton,
  AutocompleteDropdown,
  AutocompleteHelper,
  AutocompleteLabel,
  AutocompleteMessage,
  AutocompleteOptionRow,
  AutocompleteSpinner,
} from './AutocompleteParts'
import { useAutocompleteState } from './useAutocompleteState'

export type { AutocompleteOption }

export interface AutocompleteProps<T = string> extends ViewProps {
  /** Available options */
  options: AutocompleteOption<T>[]
  /** Current selected value */
  value?: T | null
  /** Callback when value changes */
  onChange?: (value: T | null) => void
  /** Callback when input text changes (for async loading) */
  onInputChange?: (inputValue: string) => void
  /** Minimum characters before showing options */
  minChars?: number
  /** Placeholder text */
  placeholder?: string
  /** Label text */
  label?: string
  /** Helper text */
  helperText?: string
  /** Error message */
  errorMessage?: string
  /** Whether the field is required */
  isRequired?: boolean
  /** Whether the field is disabled */
  isDisabled?: boolean
  /** Whether the field is loading */
  isLoading?: boolean
  /** Whether to allow clearing the value */
  isClearable?: boolean
  /** Custom filter function */
  filterFn?: (option: AutocompleteOption<T>, inputValue: string) => boolean
  /** Custom render function for options */
  renderOption?: (option: AutocompleteOption<T>, isHighlighted: boolean) => React.ReactNode
  /** Text to show when no options match */
  noOptionsText?: string
  /** Text to show when loading */
  loadingText?: string
  /** Text to show when min chars not met */
  minCharsText?: string
  /** Additional className */
  className?: string
  /** Input props */
  inputProps?: Partial<TextInputProps>
}

/** A selected value of 0 is still a selection, so `!!value` alone would hide the clear button. */
function hasSelection(value: unknown): boolean {
  return value === 0 || !!value
}

/**
 * Autocomplete component for searchable dropdown selection.
 *
 * @example
 * // Basic usage
 * <Autocomplete
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Search..."
 * />
 *
 * @example
 * // With descriptions
 * <Autocomplete
 *   options={[
 *     { value: 'user1', label: 'John Doe', description: 'john@example.com' },
 *     { value: 'user2', label: 'Jane Smith', description: 'jane@example.com' },
 *   ]}
 *   label="Select User"
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 * />
 */
export function Autocomplete<T extends string = string>({
  options,
  value,
  onChange,
  onInputChange,
  minChars = 0,
  placeholder = 'Search...',
  label,
  helperText,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  filterFn = defaultFilterFn,
  renderOption,
  noOptionsText = 'No options found',
  loadingText = 'Loading...',
  minCharsText,
  className,
  inputProps,
  ...props
}: AutocompleteProps<T>) {
  const state = useAutocompleteState({
    options,
    value,
    onChange,
    onInputChange,
    minChars,
    filterFn,
  })

  const isInvalid = !!errorMessage
  const { showMinCharsMessage, showNoResults, showOptions } = dropdownContent({
    inputValue: state.inputValue,
    minChars,
    isLoading,
    isOpen: state.isOpen,
    matchCount: state.filteredOptions.length,
  })

  return (
    <View className={cn('w-full', className)} {...props}>
      {/* Label */}
      {!!label && <AutocompleteLabel label={label} isRequired={isRequired} />}

      {/* Input Container */}
      <View className="relative">
        <View
          className={cn(
            'flex-row items-center border rounded-md',
            'bg-surface-input',
            isInvalid ? 'border-border-input-error' : 'border-border-input',
            !isDisabled && !isInvalid && 'focus-within:border-border-input-focus',
            isDisabled && 'opacity-50'
          )}
        >
          <TextInput
            value={state.inputValue}
            onChangeText={state.handleInputChange}
            onFocus={state.handleFocus}
            onBlur={state.handleBlur}
            placeholder={placeholder}
            editable={!isDisabled}
            className={cn('flex-1 px-3 py-2 text-text-primary', 'placeholder:text-text-tertiary')}
            accessibilityLabel={label}
            {...inputProps}
          />

          {/* Clear button */}
          {!!isClearable && hasSelection(value) && !isDisabled && (
            <AutocompleteClearButton onClear={state.handleClear} />
          )}

          {/* Loading indicator */}
          {!!isLoading && <AutocompleteSpinner />}
        </View>

        {/* Dropdown */}
        {!!state.isOpen && (
          <AutocompleteDropdown>
            {!!showMinCharsMessage && (
              <AutocompleteMessage>
                {minCharsText || `Type at least ${minChars} characters`}
              </AutocompleteMessage>
            )}
            {!!isLoading && <AutocompleteMessage>{loadingText}</AutocompleteMessage>}
            {!!showNoResults && <AutocompleteMessage>{noOptionsText}</AutocompleteMessage>}
            {!!showOptions &&
              state.filteredOptions.map((option, index) => (
                <AutocompleteOptionRow
                  key={String(option.value)}
                  option={option}
                  isHighlighted={index === state.highlightedIndex}
                  isSelected={option.value === value}
                  renderOption={renderOption}
                  onSelect={state.handleSelectOption}
                />
              ))}
          </AutocompleteDropdown>
        )}
      </View>

      {/* Helper/Error text */}
      {!!(helperText || errorMessage) && (
        <AutocompleteHelper text={errorMessage || helperText} isInvalid={isInvalid} />
      )}
    </View>
  )
}
