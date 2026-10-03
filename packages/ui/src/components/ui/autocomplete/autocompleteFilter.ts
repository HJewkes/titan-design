export interface AutocompleteOption<T = string> {
  value: T
  label: string
  description?: string
  isDisabled?: boolean
}

export type AutocompleteFilterFn<T> = (option: AutocompleteOption<T>, inputValue: string) => boolean

export const defaultFilterFn = <T>(option: AutocompleteOption<T>, inputValue: string) => {
  const searchLower = inputValue.toLowerCase()
  return (
    option.label.toLowerCase().includes(searchLower) ||
    (option.description?.toLowerCase().includes(searchLower) ?? false)
  )
}

/** Options that pass `filterFn`, or none until the input reaches `minChars`. */
export function filterOptions<T>(
  options: AutocompleteOption<T>[],
  inputValue: string,
  minChars: number,
  filterFn: AutocompleteFilterFn<T>
): AutocompleteOption<T>[] {
  if (inputValue.length < minChars) return []
  return options.filter((option) => filterFn(option, inputValue))
}

export interface DropdownContentInput {
  inputValue: string
  minChars: number
  isLoading: boolean
  isOpen: boolean
  matchCount: number
}

/** Which of the dropdown's message rows and option list show. */
export function dropdownContent({
  inputValue,
  minChars,
  isLoading,
  isOpen,
  matchCount,
}: DropdownContentInput) {
  const showMinCharsMessage = inputValue.length > 0 && inputValue.length < minChars
  const showNoResults = !isLoading && inputValue.length >= minChars && matchCount === 0
  const showOptions = isOpen && !showMinCharsMessage && matchCount > 0
  return { showMinCharsMessage, showNoResults, showOptions }
}
