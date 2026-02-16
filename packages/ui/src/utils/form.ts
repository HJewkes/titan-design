/**
 * Form utility functions for consistent form field handling
 */

import React from 'react'

export interface FieldState {
  /** Whether the field has been touched */
  touched: boolean
  /** Whether the field has an error */
  hasError: boolean
  /** Error message if any */
  errorMessage?: string
  /** Whether the field is required */
  isRequired?: boolean
}

export interface FieldWrapperProps {
  /** Field label */
  label?: string
  /** Helper text */
  helperText?: string
  /** Error message */
  errorMessage?: string
  /** Whether the field is required */
  isRequired?: boolean
  /** Whether the field is disabled */
  isDisabled?: boolean
  /** Whether to show error state */
  isInvalid?: boolean
}

/**
 * Get validation state props from field state
 */
export function getFieldValidationProps(state: FieldState): {
  isInvalid: boolean
  errorMessage?: string
} {
  return {
    isInvalid: state.touched && state.hasError,
    errorMessage: state.touched && state.hasError ? state.errorMessage : undefined,
  }
}

/**
 * Create a field ID from label text
 */
export function createFieldId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Get aria attributes for form field
 */
export function getFieldAriaProps(props: FieldWrapperProps & { id: string }): {
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-describedby'?: string
} {
  const describedBy: string[] = []

  if (props.helperText) {
    describedBy.push(`${props.id}-helper`)
  }

  if (props.isInvalid && props.errorMessage) {
    describedBy.push(`${props.id}-error`)
  }

  return {
    'aria-invalid': props.isInvalid || undefined,
    'aria-required': props.isRequired || undefined,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

/**
 * Check if value is empty (null, undefined, or empty string)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (value: unknown) => {
    if (isEmpty(value)) {
      return 'This field is required'
    }
    return undefined
  },

  email: (value: string) => {
    if (value && !isValidEmail(value)) {
      return 'Please enter a valid email address'
    }
    return undefined
  },

  minLength: (min: number) => (value: string) => {
    if (value && !hasMinLength(value, min)) {
      return `Must be at least ${min} characters`
    }
    return undefined
  },

  maxLength: (max: number) => (value: string) => {
    if (value && !hasMaxLength(value, max)) {
      return `Must be no more than ${max} characters`
    }
    return undefined
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (value && !regex.test(value)) {
      return message
    }
    return undefined
  },

  match: (otherValue: string, fieldName: string) => (value: string) => {
    if (value !== otherValue) {
      return `Must match ${fieldName}`
    }
    return undefined
  },
}

/**
 * Compose multiple validation functions
 */
export function composeValidators(
  ...validators: Array<(value: any) => string | undefined>
) {
  return (value: any): string | undefined => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return undefined
  }
}

/**
 * Type for form values
 */
export type FormValues = Record<string, unknown>

/**
 * Type for form errors
 */
export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>>

/**
 * Type for form touched state
 */
export type FormTouched<T extends FormValues> = Partial<Record<keyof T, boolean>>
