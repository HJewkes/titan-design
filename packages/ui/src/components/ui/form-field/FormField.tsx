import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface FormFieldProps extends ViewProps {
  /** Label text */
  label?: string
  /** Whether the field is required */
  isRequired?: boolean
  /** Helper text shown below the input */
  helperText?: string
  /** Error message (replaces helper text when present) */
  errorMessage?: string
  /** Whether the field is disabled */
  isDisabled?: boolean
  /** Whether the field is read-only */
  isReadOnly?: boolean
  /** Help tooltip content */
  helpContent?: React.ReactNode
  /** Size of the label */
  labelSize?: 'sm' | 'md' | 'lg'
  /** Direction of the layout */
  orientation?: 'vertical' | 'horizontal'
  /** Label width (for horizontal layout) */
  labelWidth?: number | string
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const labelSizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

/**
 * FormField component for wrapping form inputs with label, help text, and error states.
 *
 * @example
 * // Basic usage
 * <FormField label="Email" isRequired>
 *   <Input placeholder="Enter your email" />
 * </FormField>
 *
 * @example
 * // With error
 * <FormField
 *   label="Password"
 *   isRequired
 *   errorMessage="Password must be at least 8 characters"
 * >
 *   <Input type="password" />
 * </FormField>
 *
 * @example
 * // Horizontal layout
 * <FormField label="Name" orientation="horizontal" labelWidth={100}>
 *   <Input />
 * </FormField>
 */
export function FormField({
  label,
  isRequired = false,
  helperText,
  errorMessage,
  isDisabled = false,
  isReadOnly = false,
  helpContent,
  labelSize = 'sm',
  orientation = 'vertical',
  labelWidth,
  className,
  children,
  ...props
}: FormFieldProps) {
  const isInvalid = !!errorMessage
  const isHorizontal = orientation === 'horizontal'

  // Generate unique IDs for accessibility
  const fieldId = React.useId()
  const helperId = `${fieldId}-helper`
  const errorId = `${fieldId}-error`

  return (
    <View
      className={cn(
        'w-full',
        isHorizontal && 'flex-row items-start',
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {/* Label Section */}
      {label && (
        <View
          className={cn(
            'flex-row items-center',
            isHorizontal ? 'pt-2' : 'mb-1.5'
          )}
          style={isHorizontal && labelWidth ? { width: labelWidth as number } : undefined}
        >
          <Text
            className={cn(
              'font-medium text-text-primary',
              labelSizeStyles[labelSize]
            )}
          >
            {label}
            {isRequired && (
              <Text className="text-status-error ml-0.5">*</Text>
            )}
          </Text>

          {helpContent && (
            <View className="ml-1">
              {/* Inline help indicator - could use HelpTip here */}
              <Text className="text-text-tertiary text-xs">ℹ</Text>
            </View>
          )}
        </View>
      )}

      {/* Input Section */}
      <View className={cn(isHorizontal && 'flex-1')}>
        {/* Clone children to pass accessibility props */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childProps = child.props as Record<string, any>
            return React.cloneElement(child as React.ReactElement<any>, {
              accessibilityHint: errorMessage || helperText || childProps.accessibilityHint,
              accessibilityState: {
                ...childProps.accessibilityState,
                disabled: isDisabled || childProps.accessibilityState?.disabled,
                ...(isInvalid ? { invalid: true } : {}),
              },
              isDisabled: isDisabled || childProps.isDisabled,
              isReadOnly: isReadOnly || childProps.isReadOnly,
              isInvalid: isInvalid || childProps.isInvalid,
            })
          }
          return child
        })}

        {/* Helper/Error Text */}
        {(helperText || errorMessage) && (
          <Text
            id={isInvalid ? errorId : helperId}
            className={cn(
              'text-xs mt-1.5',
              isInvalid ? 'text-status-error' : 'text-text-tertiary'
            )}
          >
            {errorMessage || helperText}
          </Text>
        )}
      </View>
    </View>
  )
}

export interface FormSectionProps extends ViewProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * FormSection component for grouping related form fields.
 *
 * @example
 * <FormSection title="Personal Information" description="Enter your basic details">
 *   <FormField label="Name">
 *     <Input />
 *   </FormField>
 *   <FormField label="Email">
 *     <Input />
 *   </FormField>
 * </FormSection>
 */
export function FormSection({
  title,
  description,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <View
      className={cn('w-full', className)}
      accessibilityRole={'group' as any}
      accessibilityLabel={title}
      {...props}
    >
      {(title || description) && (
        <View className="mb-4">
          {title && (
            <Text className="text-lg font-semibold text-text-primary">
              {title}
            </Text>
          )}
          {description && (
            <Text className="text-sm text-text-secondary mt-1">
              {description}
            </Text>
          )}
        </View>
      )}

      <View className="gap-4">
        {children}
      </View>
    </View>
  )
}

export interface FormActionsProps extends ViewProps {
  /** Alignment of actions */
  align?: 'left' | 'center' | 'right' | 'between'
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const alignStyles = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
}

/**
 * FormActions component for form action buttons.
 *
 * @example
 * <FormActions align="right">
 *   <Button variant="ghost">Cancel</Button>
 *   <Button>Submit</Button>
 * </FormActions>
 */
export function FormActions({
  align = 'right',
  className,
  children,
  ...props
}: FormActionsProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 pt-4',
        'border-t border-border mt-4',
        alignStyles[align],
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
}

export interface FormRowProps extends ViewProps {
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg'
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

/**
 * FormRow component for laying out multiple form fields horizontally.
 *
 * @example
 * <FormRow>
 *   <FormField label="First Name" className="flex-1">
 *     <Input />
 *   </FormField>
 *   <FormField label="Last Name" className="flex-1">
 *     <Input />
 *   </FormField>
 * </FormRow>
 */
export function FormRow({
  gap = 'md',
  className,
  children,
  ...props
}: FormRowProps) {
  return (
    <View
      className={cn('flex-row items-start', gapStyles[gap], className)}
      {...props}
    >
      {children}
    </View>
  )
}
