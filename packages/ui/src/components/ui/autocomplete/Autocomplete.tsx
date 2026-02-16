import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, type ViewProps, type TextInputProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface AutocompleteOption<T = string> {
  value: T
  label: string
  description?: string
  isDisabled?: boolean
}

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

const defaultFilterFn = <T,>(option: AutocompleteOption<T>, inputValue: string) => {
  const searchLower = inputValue.toLowerCase()
  return (
    option.label.toLowerCase().includes(searchLower) ||
    (option.description?.toLowerCase().includes(searchLower) ?? false)
  )
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
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Get the label for the selected value
  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  )

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (inputValue.length < minChars) return []
    return options.filter((option) => filterFn(option, inputValue))
  }, [options, inputValue, minChars, filterFn])

  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text)
      setIsOpen(true)
      setHighlightedIndex(-1)
      onInputChange?.(text)
    },
    [onInputChange]
  )

  const handleSelectOption = useCallback(
    (option: AutocompleteOption<T>) => {
      if (option.isDisabled) return
      onChange?.(option.value)
      setInputValue(option.label)
      setIsOpen(false)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange?.(null)
    setInputValue('')
    setIsOpen(false)
  }, [onChange])

  const handleFocus = useCallback(() => {
    setIsOpen(true)
    // If there's a selected value, populate the input
    if (selectedOption && !inputValue) {
      setInputValue(selectedOption.label)
    }
  }, [selectedOption, inputValue])

  const handleBlur = useCallback(() => {
    // Delay to allow click on options
    setTimeout(() => {
      setIsOpen(false)
      // Reset input to selected value if nothing new selected
      if (selectedOption) {
        setInputValue(selectedOption.label)
      } else {
        setInputValue('')
      }
    }, 200)
  }, [selectedOption])

  const isInvalid = !!errorMessage
  const showMinCharsMessage = inputValue.length > 0 && inputValue.length < minChars
  const showNoResults = !isLoading && inputValue.length >= minChars && filteredOptions.length === 0
  const showOptions = isOpen && !showMinCharsMessage && filteredOptions.length > 0

  return (
    <View className={cn('w-full', className)} {...props}>
      {/* Label */}
      {label && (
        <Text className="text-sm font-medium text-text-primary mb-1">
          {label}
          {isRequired && <Text className="text-status-error ml-0.5">*</Text>}
        </Text>
      )}

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
            value={inputValue}
            onChangeText={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            editable={!isDisabled}
            className={cn(
              'flex-1 px-3 py-2 text-text-primary',
              'placeholder:text-text-tertiary'
            )}
            accessibilityLabel={label}
            {...inputProps}
          />

          {/* Clear button */}
          {isClearable && value && !isDisabled && (
            <Pressable
              onPress={handleClear}
              className="p-2"
              accessibilityLabel="Clear selection"
            >
              <Text className="text-text-tertiary">×</Text>
            </Pressable>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View className="p-2">
              <Text className="text-text-tertiary animate-spin">⟳</Text>
            </View>
          )}
        </View>

        {/* Dropdown */}
        {isOpen && (
          <View
            className={cn(
              'absolute z-50 top-full left-0 right-0 mt-1',
              'bg-surface-elevated rounded-md shadow-lg border border-border-default',
              'max-h-60 overflow-hidden'
            )}
          >
            <ScrollView className="py-1">
              {/* Min chars message */}
              {showMinCharsMessage && (
                <Text className="px-3 py-2 text-sm text-text-tertiary">
                  {minCharsText || `Type at least ${minChars} characters`}
                </Text>
              )}

              {/* Loading message */}
              {isLoading && (
                <Text className="px-3 py-2 text-sm text-text-tertiary">
                  {loadingText}
                </Text>
              )}

              {/* No results */}
              {showNoResults && (
                <Text className="px-3 py-2 text-sm text-text-tertiary">
                  {noOptionsText}
                </Text>
              )}

              {/* Options */}
              {showOptions &&
                filteredOptions.map((option, index) => {
                  const isHighlighted = index === highlightedIndex
                  const isSelected = option.value === value

                  if (renderOption) {
                    return (
                      <Pressable
                        key={String(option.value)}
                        onPress={() => handleSelectOption(option)}
                        disabled={option.isDisabled}
                      >
                        {renderOption(option, isHighlighted)}
                      </Pressable>
                    )
                  }

                  return (
                    <Pressable
                      key={String(option.value)}
                      onPress={() => handleSelectOption(option)}
                      disabled={option.isDisabled}
                      className={cn(
                        'px-3 py-2',
                        isHighlighted && 'bg-interactive-hover',
                        isSelected && 'bg-interactive-selected',
                        option.isDisabled && 'opacity-50',
                        !option.isDisabled && 'web:hover:bg-interactive-hover'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm',
                          isSelected ? 'text-brand-primary font-medium' : 'text-text-primary'
                        )}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text className="text-xs text-text-tertiary mt-0.5">
                          {option.description}
                        </Text>
                      )}
                    </Pressable>
                  )
                })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Helper/Error text */}
      {(helperText || errorMessage) && (
        <Text
          className={cn(
            'text-xs mt-1',
            isInvalid ? 'text-status-error' : 'text-text-tertiary'
          )}
        >
          {errorMessage || helperText}
        </Text>
      )}
    </View>
  )
}
