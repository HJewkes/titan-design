import React, { useState, createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

interface MenuContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  closeMenu: () => void
}

const MenuContext = createContext<MenuContextType>({
  isOpen: false,
  setIsOpen: () => {},
  closeMenu: () => {},
})

export interface MenuProps extends ViewProps {
  /** Controlled open state */
  isOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Menu component for dropdown menus.
 *
 * @example
 * <Menu>
 *   <MenuTrigger>
 *     <Button><ButtonText>Options</ButtonText></Button>
 *   </MenuTrigger>
 *   <MenuList>
 *     <MenuItem onPress={() => {}}>Edit</MenuItem>
 *     <MenuItem onPress={() => {}}>Delete</MenuItem>
 *     <MenuDivider />
 *     <MenuItem onPress={() => {}} isDestructive>Remove</MenuItem>
 *   </MenuList>
 * </Menu>
 */
export function Menu({
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  children,
  ...props
}: MenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = controlledIsOpen ?? internalIsOpen

  const setIsOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(open)
    }
    onOpenChange?.(open)
  }

  const closeMenu = () => setIsOpen(false)

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen, closeMenu }}>
      <View className={cn('relative', className)} {...props}>
        {children}
      </View>
    </MenuContext.Provider>
  )
}

export interface MenuTriggerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Trigger element for the menu.
 */
export function MenuTrigger({ children, className }: MenuTriggerProps) {
  const { isOpen, setIsOpen } = useContext(MenuContext)

  return (
    <Pressable
      onPress={() => setIsOpen(!isOpen)}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className={className}
    >
      {children}
    </Pressable>
  )
}

export interface MenuListProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Container for menu items.
 */
export function MenuList({ children, className }: MenuListProps) {
  const { isOpen, setIsOpen } = useContext(MenuContext)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <Pressable
        onPress={() => setIsOpen(false)}
        className="fixed inset-0 z-40"
        style={{ position: 'absolute' }}
      />
      {/* Menu */}
      <View
        className={cn(
          'absolute z-50 top-full left-0 mt-1 min-w-[160px]',
          'bg-surface-elevated rounded-lg shadow-lg border border-hairline',
          'py-1 overflow-hidden',
          className
        )}
        accessibilityRole="menu"
      >
        {children}
      </View>
    </>
  )
}

export interface MenuItemProps {
  /** Press handler */
  onPress?: () => void
  /** Whether the item is disabled */
  isDisabled?: boolean
  /** Whether the item is destructive (shows in red) */
  isDestructive?: boolean
  /** Icon element */
  icon?: React.ReactNode
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Individual menu item.
 */
export function MenuItem({
  onPress,
  isDisabled = false,
  isDestructive = false,
  icon,
  className,
  children,
}: MenuItemProps) {
  const { closeMenu } = useContext(MenuContext)

  const handlePress = () => {
    if (isDisabled) return
    onPress?.()
    closeMenu()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="menuitem"
      accessibilityState={{ disabled: isDisabled }}
      className={cn(
        'flex-row items-center px-4 py-2',
        'web:hover:bg-interactive-hover active:bg-interactive-active',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <View className="mr-3">{icon}</View>}
      <Text className={cn('text-sm', isDestructive ? 'text-status-error' : 'text-text-primary')}>
        {children}
      </Text>
    </Pressable>
  )
}

export interface MenuDividerProps {
  className?: string
}

/**
 * Divider between menu items.
 */
export function MenuDivider({ className }: MenuDividerProps) {
  return <View className={cn('h-px bg-hairline my-1', className)} />
}

export interface MenuGroupProps {
  /** Group label */
  label?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Group of menu items with optional label.
 */
export function MenuGroup({ label, children, className }: MenuGroupProps) {
  return (
    <View className={className}>
      {label && (
        <Text className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase">
          {label}
        </Text>
      )}
      {children}
    </View>
  )
}
