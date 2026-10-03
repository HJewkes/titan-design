import { useState, useCallback, useMemo } from 'react'
import type { AutocompleteOption } from './Autocomplete'
import { filterOptions, type AutocompleteFilterFn } from './autocompleteFilter'

export interface AutocompleteStateInput<T> {
  options: AutocompleteOption<T>[]
  value?: T | null
  onChange?: (value: T | null) => void
  onInputChange?: (inputValue: string) => void
  minChars: number
  filterFn: AutocompleteFilterFn<T>
}

/** Input text, open state and highlight, with the handlers that drive them. */
export function useAutocompleteState<T>({
  options,
  value,
  onChange,
  onInputChange,
  minChars,
  filterFn,
}: AutocompleteStateInput<T>) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value])

  const filteredOptions = useMemo(
    () => filterOptions(options, inputValue, minChars, filterFn),
    [options, inputValue, minChars, filterFn]
  )

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

  return {
    inputValue,
    isOpen,
    highlightedIndex,
    filteredOptions,
    handleInputChange,
    handleSelectOption,
    handleClear,
    handleFocus,
    handleBlur,
  }
}
