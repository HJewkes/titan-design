import React, { createContext, useContext, useId } from 'react'
import { View, Text, Pressable, ScrollView, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import type { ControlledProps } from '../../../utils/controlled-props'
import { useControllableState } from '../../../hooks/useControllableState'

export type TabsVariant = 'line' | 'enclosed' | 'soft-rounded'
export type TabsOrientation = 'horizontal' | 'vertical'

interface TabsContextType {
  activeIndex: number
  setActiveIndex: (index: number) => void
  variant: TabsVariant
  orientation: TabsOrientation
  baseId: string
}

const TabsContext = createContext<TabsContextType>({
  activeIndex: 0,
  setActiveIndex: () => {},
  variant: 'line',
  orientation: 'horizontal',
  baseId: 'tabs',
})

const tabId = (baseId: string, index: number) => `${baseId}-tab-${index}`
const panelId = (baseId: string, index: number) => `${baseId}-panel-${index}`

function nextEnabledIndex(enabled: boolean[], from: number, step: 1 | -1): number {
  const count = enabled.length
  for (let i = 1; i <= count; i++) {
    const candidate = (from + step * i + count * i) % count
    if (enabled[candidate]) return candidate
  }
  return from
}

/** The active tab is its index: `value` / `defaultValue` / `onValueChange` from `ControlledProps`. */
export interface TabsProps extends ViewProps, ControlledProps<number> {
  /**
   * Initial active index when uncontrolled.
   * @deprecated Use `defaultValue`.
   */
  defaultIndex?: number
  /**
   * Controlled active index.
   * @deprecated Use `value`.
   */
  index?: number
  /**
   * Fires with the next active index.
   * @deprecated Use `onValueChange`; both fire on a change.
   */
  onChange?: (index: number) => void
  /** Visual variant */
  variant?: TabsVariant
  /** Tab orientation */
  orientation?: TabsOrientation
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Tabs component for tabbed navigation.
 *
 * @example
 * <Tabs defaultValue={0} onValueChange={(i) => console.log(i)}>
 *   <TabList>
 *     <Tab>Tab 1</Tab>
 *     <Tab>Tab 2</Tab>
 *     <Tab>Tab 3</Tab>
 *   </TabList>
 *   <TabPanels>
 *     <TabPanel>Content 1</TabPanel>
 *     <TabPanel>Content 2</TabPanel>
 *     <TabPanel>Content 3</TabPanel>
 *   </TabPanels>
 * </Tabs>
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  defaultIndex,
  index,
  onChange,
  variant = 'line',
  orientation = 'horizontal',
  className,
  children,
  ...props
}: TabsProps) {
  const baseId = useId()
  const [activeIndex, setActiveIndex] = useControllableState({
    value: value ?? index,
    defaultValue: defaultValue ?? defaultIndex ?? 0,
    onChange: (next: number) => {
      onValueChange?.(next)
      onChange?.(next)
    },
  })

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex, variant, orientation, baseId }}>
      <View
        className={cn(orientation === 'vertical' ? 'flex-row' : 'flex-col', className)}
        {...props}
      >
        {children}
      </View>
    </TabsContext.Provider>
  )
}

export interface TabListProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Container for Tab components.
 */
export function TabList({ children, className }: TabListProps) {
  const { variant, orientation, activeIndex, setActiveIndex, baseId } = useContext(TabsContext)

  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    const enabled = React.Children.toArray(children).map(
      (child) => !(React.isValidElement<TabProps>(child) && child.props.isDisabled)
    )
    const forwardKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    const backKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
    let target: number | undefined
    if (event.key === forwardKey) target = nextEnabledIndex(enabled, activeIndex, 1)
    else if (event.key === backKey) target = nextEnabledIndex(enabled, activeIndex, -1)
    else if (event.key === 'Home') target = enabled.indexOf(true)
    else if (event.key === 'End') target = enabled.lastIndexOf(true)
    if (target === undefined || target < 0) return
    event.preventDefault()
    setActiveIndex(target)
    if (typeof document !== 'undefined') document.getElementById(tabId(baseId, target))?.focus()
  }

  const variantStyles = {
    line: orientation === 'horizontal' ? 'border-b border-hairline' : 'border-r border-hairline',
    enclosed: 'bg-surface-raised rounded-lg p-1',
    'soft-rounded': 'bg-surface-raised rounded-full p-1',
  }

  const content = (
    <View
      accessibilityRole="tablist"
      aria-orientation={orientation}
      {...{ onKeyDown: handleKeyDown }}
      className={cn(
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        variantStyles[variant],
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<TabProps>, { index })
        }
        return child
      })}
    </View>
  )

  if (orientation === 'horizontal') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {content}
      </ScrollView>
    )
  }

  return content
}

export interface TabProps {
  /** Tab index (injected by TabList) */
  index?: number
  /** Whether the tab is disabled */
  isDisabled?: boolean
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Individual tab button.
 */
export function Tab({ index = 0, isDisabled = false, className, children }: TabProps) {
  const { activeIndex, setActiveIndex, variant, orientation, baseId } = useContext(TabsContext)
  const isActive = activeIndex === index

  const baseStyles = 'font-medium text-sm transition-colors'

  const variantStyles = {
    line: cn(
      'px-4 py-2',
      orientation === 'horizontal' ? '-mb-px border-b-2' : '-mr-px border-r-2',
      isActive
        ? 'border-brand-primary text-brand-primary'
        : 'border-transparent text-text-secondary web:hover:text-text-primary'
    ),
    // The active enclosed tab is an indicator, not a plane: tone alone marks it.
    enclosed: cn(
      'px-4 py-2 rounded-md',
      isActive
        ? 'bg-surface-elevated text-text-primary'
        : 'text-text-secondary web:hover:text-text-primary'
    ),
    'soft-rounded': cn(
      'px-4 py-2 rounded-full',
      isActive
        ? 'bg-brand-primary text-on-brand-primary'
        : 'text-text-secondary web:hover:text-text-primary'
    ),
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ disabled: isDisabled }}
      id={tabId(baseId, index)}
      aria-controls={panelId(baseId, index)}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={isDisabled}
      onPress={() => setActiveIndex(index)}
      className={cn(
        baseStyles,
        variantStyles[variant],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Text
        className={cn(
          'font-medium',
          isActive
            ? variant === 'soft-rounded'
              ? 'text-on-brand-primary'
              : 'text-text-primary'
            : 'text-text-secondary'
        )}
      >
        {children}
      </Text>
    </Pressable>
  )
}

export interface TabPanelsProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Container for TabPanel components.
 */
export function TabPanels({ children, className }: TabPanelsProps) {
  const { activeIndex } = useContext(TabsContext)

  return (
    <View className={cn('flex-1', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && index === activeIndex) {
          return React.cloneElement(child as React.ReactElement<TabPanelProps>, { index })
        }
        return null
      })}
    </View>
  )
}

export interface TabPanelProps {
  /** Panel index (injected by TabPanels) */
  index?: number
  children?: React.ReactNode
  className?: string
}

/**
 * Individual tab panel content.
 */
export function TabPanel({ index = 0, children, className }: TabPanelProps) {
  const { baseId } = useContext(TabsContext)
  return (
    <View
      role="tabpanel"
      id={panelId(baseId, index)}
      aria-labelledby={tabId(baseId, index)}
      className={cn('py-4', className)}
    >
      {children}
    </View>
  )
}
