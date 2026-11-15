import React, { useState, useCallback, useMemo, createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { useHitTarget } from '../../../hooks/useHitTarget'
import type { HitTargetLimit, HitTargetOutset } from '../../../utils/hit-target'
import { resolveColor } from '../../../theme/resolve-color'
import { faceStyle, useToolbarFaces } from './toolbarFaces'
import {
  ToolbarButtonDescription,
  ToolbarButtonIcon,
  ToolbarButtonMenu,
  useTooltipDescriptionId,
} from './ToolbarButtonParts'

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
  /** Tooltip text, exposed as the button's accessible description */
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
 * - Faces from the elevation system, relative to the enclosing Surface: the raised
 *   face is one plane up with the lift, the active face one plane down with the recess
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
  const tooltipId = useTooltipDescriptionId(tooltip)
  const faces = useToolbarFaces()
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
          aria-describedby={tooltipId}
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
          style={faceStyle({ faces, variant, isDisabled, showActive, isHovered })}
        >
          <ToolbarButtonDescription id={tooltipId} text={tooltip} />
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
