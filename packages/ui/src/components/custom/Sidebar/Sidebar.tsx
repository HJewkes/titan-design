import React, { createContext, useContext } from 'react'
import { View, Text, Pressable, ScrollView, type ViewProps, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'

interface SidebarContextType {
  isCollapsed: boolean
  activeItem?: string
  onItemSelect?: (id: string) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
})

export interface SidebarProps extends ViewProps {
  /** Whether sidebar is collapsed (icon-only mode) */
  isCollapsed?: boolean
  /** Currently active item ID */
  activeItem?: string
  /** Callback when an item is selected */
  onItemSelect?: (id: string) => void
  /** Width when expanded */
  width?: number
  /** Width when collapsed */
  collapsedWidth?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Sidebar navigation component.
 *
 * @example
 * <Sidebar activeItem={activeNav} onItemSelect={setActiveNav}>
 *   <SidebarHeader>
 *     <Logo />
 *   </SidebarHeader>
 *   <SidebarContent>
 *     <SidebarSection title="Main">
 *       <SidebarItem id="home" icon={HomeIcon} label="Home" />
 *       <SidebarItem id="dashboard" icon={DashboardIcon} label="Dashboard" />
 *     </SidebarSection>
 *   </SidebarContent>
 *   <SidebarFooter>
 *     <SidebarItem id="settings" icon={SettingsIcon} label="Settings" />
 *   </SidebarFooter>
 * </Sidebar>
 */
export function Sidebar({
  isCollapsed = false,
  activeItem,
  onItemSelect,
  width = 256,
  collapsedWidth = 64,
  className,
  children,
  ...props
}: SidebarProps) {
  const currentWidth = isCollapsed ? collapsedWidth : width

  return (
    <SidebarContext.Provider value={{ isCollapsed, activeItem, onItemSelect }}>
      <View
        style={{ width: currentWidth }}
        className={cn(
          'h-full flex-col bg-surface-base border-r border-border-default transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </View>
    </SidebarContext.Provider>
  )
}

export interface SidebarHeaderProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Header section of sidebar (typically contains logo).
 */
export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <View className={cn('px-4 py-4 border-b border-border-subtle', className)}>
      {children}
    </View>
  )
}

export interface SidebarContentProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Scrollable content area of sidebar.
 */
export function SidebarContent({ children, className }: SidebarContentProps) {
  return (
    <ScrollView
      className={cn('flex-1', className)}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

export interface SidebarFooterProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Footer section of sidebar.
 */
export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <View className={cn('px-2 py-4 border-t border-border-subtle', className)}>
      {children}
    </View>
  )
}

export interface SidebarSectionProps {
  /** Section title */
  title?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Section grouping for sidebar items.
 */
export function SidebarSection({ title, children, className }: SidebarSectionProps) {
  const { isCollapsed } = useContext(SidebarContext)

  return (
    <View className={cn('px-2 py-2', className)}>
      {title && !isCollapsed && (
        <Text className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {title}
        </Text>
      )}
      <View className="gap-0.5">
        {children}
      </View>
    </View>
  )
}

export interface SidebarItemProps extends Omit<PressableProps, 'children'> {
  /** Unique identifier for the item */
  id: string
  /** Icon component */
  icon?: React.ComponentType<{ size?: number; className?: string }>
  /** Label text */
  label: string
  /** Badge content (e.g., notification count) */
  badge?: React.ReactNode
  /** Whether this item has nested items */
  hasChildren?: boolean
  /** Whether nested items are expanded */
  isExpanded?: boolean
  /** Additional className */
  className?: string
}

/**
 * Individual navigation item in sidebar.
 */
export function SidebarItem({
  id,
  icon: Icon,
  label,
  badge,
  hasChildren,
  isExpanded,
  className,
  onPress,
  ...props
}: SidebarItemProps) {
  const { isCollapsed, activeItem, onItemSelect } = useContext(SidebarContext)
  const isActive = activeItem === id

  const handlePress = (e: any) => {
    onItemSelect?.(id)
    onPress?.(e)
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      onPress={handlePress}
      className={cn(
        'flex-row items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
        isActive
          ? 'bg-brand-primary-subtle text-brand-primary'
          : 'text-text-secondary web:hover:bg-interactive-hover active:bg-interactive-active',
        isCollapsed && 'justify-center px-2',
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          size={20}
          className={cn(
            isActive ? 'text-brand-primary' : 'text-text-secondary'
          )}
        />
      )}
      {!isCollapsed && (
        <>
          <Text
            numberOfLines={1}
            className={cn(
              'flex-1 text-sm font-medium',
              isActive ? 'text-brand-primary' : 'text-text-primary'
            )}
          >
            {label}
          </Text>
          {badge && (
            <View className="ml-auto">
              {badge}
            </View>
          )}
          {hasChildren && (
            <Text className="text-text-tertiary ml-1">
              {isExpanded ? '▼' : '▶'}
            </Text>
          )}
        </>
      )}
    </Pressable>
  )
}

export interface SidebarDividerProps {
  className?: string
}

/**
 * Divider between sidebar sections.
 */
export function SidebarDivider({ className }: SidebarDividerProps) {
  return (
    <View className={cn('h-px mx-4 my-2 bg-border-subtle', className)} />
  )
}
