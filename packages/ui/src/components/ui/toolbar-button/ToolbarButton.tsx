import React, { useState, useCallback, createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps, StyleSheet, Platform } from 'react-native'
import { cn } from '../../../utils/cn'
import { getHoverColors } from '../../../theme'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { resolveColor } from '../../../theme/resolve-color'

export type ToolbarButtonVariant = 'default' | 'raised'
export type ToolbarButtonSize = 'sm' | 'md' | 'lg'

interface ToolbarButtonContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const ToolbarButtonContext = createContext<ToolbarButtonContextType>({
  isOpen: false,
  setIsOpen: () => {},
})

export interface ToolbarButtonProps extends ViewProps {
  /** Button label */
  label: string
  /** Icon component */
  icon?: React.ReactNode
  /**
   * Whether the button is in active/selected state.
   * - `true`: pressed/active appearance (darker, white text, orange icon)
   * - `undefined`: pressed appearance (darker, white text/icon)
   * - `false`: raised/inactive appearance (lighter, gray text/icon)
   */
  isActive?: boolean
  /** Whether the button is disabled */
  isDisabled?: boolean
  /** Size of the button */
  size?: ToolbarButtonSize
  /** Visual variant */
  variant?: ToolbarButtonVariant
  /** Tooltip text (shown when label is hidden) */
  tooltip?: string
  /** Whether to show label (false = icon only) */
  showLabel?: boolean
  /** Press handler */
  onPress?: () => void
  /** Menu content (renders in popover) */
  menuContent?: React.ReactNode
  /** Additional className */
  className?: string
}

const SEMANTIC = getSemanticColors('dark')

// Base button colours. These were raw `#3C3C3C`/`#2C2C2C` literals — old cold
// charcoal steps that survived the grey migration only because they were plain
// strings rather than scale references.
const BUTTON_BG = greyRamp[800]
const MENU_BG = greyRamp[900]

// Inline depth is a HAIRLINE, not a shadow (TD-07.16). On a ~10% lightness
// surface a dual-opposing neumorphic shadow has no room below to read; alpha
// composites by the same amount over any plane, so the edge holds everywhere.
const EDGE = { borderWidth: 1, borderColor: SEMANTIC['hairline-default'] } as const
const EDGE_PRESSED = { borderWidth: 1, borderColor: SEMANTIC['hairline-strong'] } as const

// Calculate hover colors using color math
const hoverColors = getHoverColors(BUTTON_BG, 'medium')

// Size style maps
const sizeStyles: Record<ToolbarButtonSize, string> = {
  sm: 'px-2 py-1 min-h-[26px]',
  md: 'px-2.5 py-1 min-h-[30px]',
  lg: 'px-3 py-1.5 min-h-[36px]',
}

const textSizeStyles: Record<ToolbarButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

/**
 * ToolbarButton component for toolbar actions with toggle state support.
 *
 * Features:
 * - Neumorphic styling with inset shadows for pressed/raised 3D effect
 * - Active (pressed) state is the default visual appearance
 * - Set isActive={false} explicitly for the raised/inactive appearance
 * - Orange accent color on icon when isActive={true}
 * - Hover states that lighten background and remove shadows
 *
 * @example
 * // Toggle button - orange icon when active
 * <ToolbarButton
 *   label="Settings"
 *   icon={<SettingsIcon />}
 *   isActive={isSettingsOpen}
 *   onPress={() => setIsSettingsOpen(!isSettingsOpen)}
 * />
 *
 * @example
 * // Explicitly inactive (raised appearance)
 * <ToolbarButton
 *   label="Filter"
 *   icon={<FilterIcon />}
 *   isActive={false}
 * />
 */
export function ToolbarButton({
  label,
  icon,
  isActive,
  isDisabled = false,
  size = 'md',
  variant = 'raised',
  tooltip,
  showLabel = true,
  onPress,
  menuContent,
  className,
  children,
  ...props
}: ToolbarButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handlePress = useCallback(() => {
    if (isDisabled) return
    if (menuContent) {
      setIsOpen((prev) => !prev)
    }
    onPress?.()
  }, [isDisabled, menuContent, onPress])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Match original logic: active !== false means "active" (sunken) appearance
  const selected = isActive === undefined ? isOpen : isActive
  const showActive = isActive !== false

  // Determine icon color based on state
  const getIconColor = () => {
    if (isActive === true) return resolveColor('brand-primary')
    return showActive ? '#FFFFFF' : '#D1D1D1'
  }

  // Get shadow and background styles for neumorphic variant
  /**
   * Raised/pressed treatment. Depth comes from the FILL plus a hairline edge —
   * pressed sits darker with a stronger edge, raised sits lighter with a quieter
   * one. It used to come from a two-layer neumorphic shadow, which the surface
   * exploration ruled out for inline hierarchy: it needs a mid-tone background
   * for the dark half to have somewhere to fall, and these buttons sit at ~10%
   * lightness.
   */
  const getRaisedStyle = () => {
    if (isDisabled) {
      return styles.disabledBg
    }
    if (showActive) {
      return {
        backgroundColor: isHovered ? hoverColors.pressed : greyRamp[900],
        ...EDGE_PRESSED,
      }
    }
    return {
      backgroundColor: isHovered ? hoverColors.raised : BUTTON_BG,
      ...EDGE,
    }
  }

  return (
    <ToolbarButtonContext.Provider value={{ isOpen, setIsOpen }}>
      <View className="relative" {...props}>
        <Pressable
          onPress={handlePress}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityState={{ selected, disabled: isDisabled }}
          accessibilityLabel={label}
          accessibilityHint={tooltip}
          className={cn(
            // Base styles
            'flex-row items-center justify-center rounded',
            'web:transition-all web:duration-150 web:cursor-pointer',
            // Size
            sizeStyles[size],
            // Disabled
            isDisabled && 'opacity-40 web:cursor-default web:pointer-events-none',
            className
          )}
          style={[
            variant === 'raised' && getRaisedStyle(),
            variant === 'default' && {
              backgroundColor: showActive ? BUTTON_BG : greyRamp[600],
            },
          ]}
        >
          {icon && (
            <View className="w-5 h-5 items-center justify-center">
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<any>, {
                    size: 20,
                    width: 20,
                    height: 20,
                    color: getIconColor(),
                    style: {
                      color: getIconColor(),
                      width: 20,
                      height: 20,
                    },
                  })
                : icon}
            </View>
          )}
          {showLabel && (
            <Text
              className={cn(
                'font-bold',
                textSizeStyles[size],
                icon && 'ml-2',
                showActive ? 'text-white' : 'text-[#D1D1D1]'
              )}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
        </Pressable>

        {/* Popover Menu */}
        {menuContent && isOpen && (
          <>
            {/* Backdrop */}
            <Pressable onPress={handleClose} style={StyleSheet.absoluteFill} className="z-40" />
            {/* Menu Content */}
            <View
              className={cn(
                'absolute z-50 top-full left-0 mt-1',
                'rounded-lg shadow-lg border border-hairline',
                'min-w-[150px] overflow-hidden',
                `bg-[${MENU_BG}]`
              )}
            >
              {menuContent}
            </View>
          </>
        )}
      </View>
    </ToolbarButtonContext.Provider>
  )
}

// Styles that can't be easily expressed in Tailwind
const styles = StyleSheet.create({
  // Disabled - flat gray background, no shadows
  disabledBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: { boxShadow: 'none' } as any,
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
})

export interface ToolbarButtonGroupProps extends ViewProps {
  /** Orientation of the button group */
  orientation?: 'horizontal' | 'vertical'
  /** Gap between buttons */
  gap?: 'none' | 'sm' | 'md'
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const gapStyles: Record<string, string> = {
  none: 'gap-0',
  sm: 'gap-1',
  md: 'gap-2',
}

/**
 * Container for grouping toolbar buttons together.
 */
export function ToolbarButtonGroup({
  orientation = 'horizontal',
  gap = 'sm',
  className,
  children,
  ...props
}: ToolbarButtonGroupProps) {
  return (
    <View
      className={cn(
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        gapStyles[gap],
        'items-center',
        className
      )}
      accessibilityRole="toolbar"
      {...props}
    >
      {children}
    </View>
  )
}

/**
 * Hook to access toolbar button context (for custom menu content)
 */
export function useToolbarButton() {
  return useContext(ToolbarButtonContext)
}
