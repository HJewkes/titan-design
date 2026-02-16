import React, { useState } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type HelpTipSize = 'sm' | 'md' | 'lg'
export type HelpTipPlacement = 'top' | 'bottom' | 'left' | 'right'
export type HelpTipIcon = 'help' | 'info' | 'warning'

export interface HelpTipProps extends ViewProps {
  /** Tooltip content */
  content: React.ReactNode
  /** Size of the icon */
  size?: HelpTipSize
  /** Placement of the tooltip */
  placement?: HelpTipPlacement
  /** Icon type */
  icon?: HelpTipIcon
  /** Icon color */
  color?: 'default' | 'primary' | 'secondary' | 'muted'
  /** Whether the tooltip is always visible (controlled) */
  isOpen?: boolean
  /** Whether to show an arrow */
  hasArrow?: boolean
  /** Max width of the tooltip */
  maxWidth?: number
  /** Additional className for the icon */
  iconClassName?: string
  /** Additional className for the tooltip */
  tooltipClassName?: string
}

const sizeStyles: Record<HelpTipSize, { icon: string; text: string }> = {
  sm: { icon: 'w-3.5 h-3.5 text-xs', text: 'text-xs' },
  md: { icon: 'w-4 h-4 text-sm', text: 'text-sm' },
  lg: { icon: 'w-5 h-5 text-base', text: 'text-base' },
}

const colorStyles: Record<string, string> = {
  default: 'text-text-tertiary',
  primary: 'text-brand-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-tertiary opacity-60',
}

const iconMap: Record<HelpTipIcon, string> = {
  help: '?',
  info: 'ℹ',
  warning: '⚠',
}

const placementStyles: Record<HelpTipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<HelpTipPlacement, string> = {
  top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-surface-elevated border-x-transparent border-b-transparent',
  bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-surface-elevated border-x-transparent border-t-transparent',
  left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-surface-elevated border-y-transparent border-r-transparent',
  right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-surface-elevated border-y-transparent border-l-transparent',
}

/**
 * HelpTip component for displaying contextual help information.
 *
 * A small icon (typically a question mark or info icon) that shows
 * a tooltip with helpful information when hovered or pressed.
 *
 * @example
 * // Basic usage
 * <HelpTip content="This field is required for form submission." />
 *
 * @example
 * // With custom icon and placement
 * <HelpTip
 *   content="API rate limits apply to this endpoint."
 *   icon="warning"
 *   placement="right"
 *   color="primary"
 * />
 *
 * @example
 * // Inline with label
 * <View className="flex-row items-center gap-1">
 *   <Text>Email Address</Text>
 *   <HelpTip content="We'll never share your email with anyone." size="sm" />
 * </View>
 */
export function HelpTip({
  content,
  size = 'md',
  placement = 'top',
  icon = 'help',
  color = 'default',
  isOpen: controlledIsOpen,
  hasArrow = true,
  maxWidth = 250,
  iconClassName,
  tooltipClassName,
  className,
  ...props
}: HelpTipProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = controlledIsOpen ?? internalIsOpen

  const { icon: iconSize, text: textSize } = sizeStyles[size]

  const handlePress = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen((prev) => !prev)
    }
  }

  const handleHoverIn = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(true)
    }
  }

  const handleHoverOut = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(false)
    }
  }

  return (
    <View className={cn('relative inline-flex', className)} {...props}>
      {/* Icon button */}
      <Pressable
        onPress={handlePress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        accessibilityRole="button"
        accessibilityLabel="Show help information"
        accessibilityHint={typeof content === 'string' ? content : undefined}
        className={cn(
          'items-center justify-center rounded-full',
          'border border-current',
          colorStyles[color],
          iconSize,
          'web:hover:opacity-80 web:cursor-help',
          iconClassName
        )}
      >
        <Text className={cn('font-semibold', iconSize, colorStyles[color])}>
          {iconMap[icon]}
        </Text>
      </Pressable>

      {/* Tooltip */}
      {isOpen && (
        <View
          className={cn(
            'absolute z-50',
            'bg-surface-elevated rounded-lg shadow-lg',
            'border border-border-default',
            'px-3 py-2',
            placementStyles[placement],
            tooltipClassName
          )}
          style={{ maxWidth }}
        >
          {typeof content === 'string' ? (
            <Text className={cn('text-text-primary', textSize)}>
              {content}
            </Text>
          ) : (
            content
          )}

          {/* Arrow */}
          {hasArrow && (
            <View
              className={cn(
                'absolute w-0 h-0',
                'border-4',
                arrowStyles[placement]
              )}
            />
          )}
        </View>
      )}
    </View>
  )
}

export interface LabelWithHelpProps extends ViewProps {
  /** Label text */
  label: string
  /** Help content */
  helpContent: React.ReactNode
  /** Whether the field is required */
  isRequired?: boolean
  /** Size of the help icon */
  helpSize?: HelpTipSize
  /** Additional className */
  className?: string
}

/**
 * Convenience component combining a label with a help tip.
 *
 * @example
 * <LabelWithHelp
 *   label="API Key"
 *   helpContent="Your API key can be found in the developer settings."
 *   isRequired
 * />
 */
export function LabelWithHelp({
  label,
  helpContent,
  isRequired = false,
  helpSize = 'sm',
  className,
  ...props
}: LabelWithHelpProps) {
  return (
    <View className={cn('flex-row items-center gap-1', className)} {...props}>
      <Text className="text-sm font-medium text-text-primary">
        {label}
        {isRequired && <Text className="text-status-error ml-0.5">*</Text>}
      </Text>
      <HelpTip content={helpContent} size={helpSize} />
    </View>
  )
}
