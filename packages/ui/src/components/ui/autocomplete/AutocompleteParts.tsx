import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { cn } from '../../../utils/cn'
import { Surface } from '../surface'
import type { AutocompleteOption } from './autocompleteFilter'

export function AutocompleteLabel({ label, isRequired }: { label: string; isRequired: boolean }) {
  return (
    <Text className="text-sm font-medium text-text-primary mb-1">
      {label}
      {isRequired && <Text className="text-text-error ml-0.5">*</Text>}
    </Text>
  )
}

export function AutocompleteClearButton({ onClear }: { onClear: () => void }) {
  return (
    <Pressable onPress={onClear} className="p-2" accessibilityLabel="Clear selection">
      <Text className="text-text-tertiary">×</Text>
    </Pressable>
  )
}

export function AutocompleteSpinner() {
  return (
    <View className="p-2">
      <Text className="text-text-tertiary animate-spin">⟳</Text>
    </View>
  )
}

export function AutocompleteDropdown({ children }: { children: React.ReactNode }) {
  return (
    <Surface
      elevation={4}
      rounded={false}
      className={cn(
        'absolute z-50 top-full left-0 right-0 mt-1',
        'rounded-md max-h-60 overflow-hidden'
      )}
    >
      <ScrollView className="py-1">{children}</ScrollView>
    </Surface>
  )
}

export function AutocompleteMessage({ children }: { children: React.ReactNode }) {
  return <Text className="px-3 py-2 text-sm text-text-tertiary">{children}</Text>
}

interface AutocompleteOptionRowProps<T> {
  option: AutocompleteOption<T>
  isHighlighted: boolean
  isSelected: boolean
  renderOption?: (option: AutocompleteOption<T>, isHighlighted: boolean) => React.ReactNode
  onSelect: (option: AutocompleteOption<T>) => void
}

export function AutocompleteOptionRow<T>({
  option,
  isHighlighted,
  isSelected,
  renderOption,
  onSelect,
}: AutocompleteOptionRowProps<T>) {
  if (renderOption) {
    return (
      <Pressable onPress={() => onSelect(option)} disabled={option.isDisabled}>
        {renderOption(option, isHighlighted)}
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={() => onSelect(option)}
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
        <Text className="text-xs text-text-tertiary mt-0.5">{option.description}</Text>
      )}
    </Pressable>
  )
}

export function AutocompleteHelper({ text, isInvalid }: { text?: string; isInvalid: boolean }) {
  return (
    <Text className={cn('text-xs mt-1', isInvalid ? 'text-text-error' : 'text-text-tertiary')}>
      {text}
    </Text>
  )
}
