import React, { useState, useCallback, useMemo, createContext, useContext } from 'react'
import {
  View,
  Text,
  Pressable,
  type ViewProps,
  type ViewStyle,
  StyleSheet,
  Platform,
} from 'react-native'
import { cn } from '../../../utils/cn'
import { useHitTarget } from '../../../hooks/useHitTarget'
import type { HitTargetLimit, HitTargetOutset } from '../../../utils/hit-target'
import { getHoverColors } from '../../../theme'
import { greyRamp, primitiveColors } from '../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import { resolveColor } from '../../../theme/resolve-color'
import { getPressedRecessShadow } from '../../../theme/elevation'
import { liftStyle } from '../../../theme/lift'
import { alpha } from '../../../utils/colors'
import { useSurfaceMode } from '../surface'
import { ToolbarButtonIcon, ToolbarButtonMenu } from './ToolbarButtonParts'

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

// Set by ToolbarButtonGroup so a button's hit box stops at its neighbour's face (TD-10).
const ToolbarButtonGroupContext = createContext<HitTargetLimit | undefined>(undefined)

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

// Base button colours.
const BUTTON_BG = greyRamp[800]

// Calculate hover colors using color math
const hoverColors = getHoverColors(BUTTON_BG, 'medium')

// Size style maps. Every face is under the 44pt floor, so each carries a hit box (TD-10).
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
 * - Depth from the fill plus the lift (raised) or the inset recess (active)
 * - Active (pressed) state is the default visual appearance
 * - Set isActive={false} explicitly for the raised/inactive appearance
 * - Orange accent color on icon when isActive={true}
 * - Hover states that lighten the background
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
  const mode = useSurfaceMode()
  const hitTarget = useHitTarget({ limit: useContext(ToolbarButtonGroupContext) })

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
  const iconTint = iconColor(isActive)

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
          hitSlop={hitTarget.hitSlop}
          onLayout={hitTarget.onLayout}
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
            variant === 'raised' && raisedStyle({ isDisabled, showActive, isHovered, mode }),
            variant === 'default' && {
              backgroundColor: showActive ? BUTTON_BG : greyRamp[600],
            },
          ]}
        >
          {hitTarget.layerProps && <View {...hitTarget.layerProps} />}
          {icon && <ToolbarButtonIcon icon={icon} color={iconTint} />}
          {showLabel && (
            <Text
              className={cn(
                'font-bold',
                textSizeStyles[size],
                icon && 'ml-2',
                showActive ? 'text-on-control-active' : 'text-on-control-idle'
              )}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
        </Pressable>

        {/* Popover Menu */}
        {menuContent && isOpen && (
          <ToolbarButtonMenu onClose={handleClose}>{menuContent}</ToolbarButtonMenu>
        )}
      </View>
    </ToolbarButtonContext.Provider>
  )
}

// Determine icon color based on state
function iconColor(isActive: boolean | undefined): string {
  if (isActive === true) return resolveColor('brand-primary')
  return isActive !== false ? resolveColor('on-control-active') : resolveColor('on-control-idle')
}

/**
 * Raised/pressed treatment on the depth model: the raised face is a plane one
 * step above the toolbar and wears the lift, the active face is pressed into
 * it and wears the recess. The hairline ring both used to carry is an edge,
 * not depth, and is gone with the rest of the rings on this pass.
 */
function raisedStyle(p: {
  isDisabled: boolean
  showActive: boolean
  isHovered: boolean
  mode: ThemeMode
}): ViewStyle {
  if (p.isDisabled) return styles.disabledBg
  if (p.showActive) {
    const fill = p.isHovered ? hoverColors.pressed : greyRamp[900]
    return { backgroundColor: fill, ...getPressedRecessShadow(fill, p.mode) }
  }
  return {
    backgroundColor: p.isHovered ? hoverColors.raised : BUTTON_BG,
    ...liftStyle(1, p.mode),
  }
}

// Styles that can't be easily expressed in Tailwind
const styles = StyleSheet.create({
  // Disabled - flat gray background, no shadows
  disabledBg: {
    backgroundColor: alpha(primitiveColors.white, 0.12),
    ...Platform.select({
      web: { boxShadow: 'none' },
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

// The px each gap class resolves to: how far a hit box may grow toward a neighbour.
const gapOutsets: Record<string, HitTargetOutset> = {
  none: 0,
  sm: 4,
  md: 8,
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
  const outset = gapOutsets[gap]
  const hitTargetLimit = useMemo(() => ({ axis: orientation, outset }), [orientation, outset])

  return (
    <ToolbarButtonGroupContext.Provider value={hitTargetLimit}>
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
    </ToolbarButtonGroupContext.Provider>
  )
}

/**
 * Hook to access toolbar button context (for custom menu content)
 */
export function useToolbarButton() {
  return useContext(ToolbarButtonContext)
}
