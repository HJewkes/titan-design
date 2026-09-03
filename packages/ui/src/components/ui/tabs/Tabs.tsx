import React, { createContext, useContext, useState } from 'react'
import { View, Text, Pressable, ScrollView, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type TabsVariant = 'line' | 'enclosed' | 'soft-rounded'
export type TabsOrientation = 'horizontal' | 'vertical'

interface TabsContextType {
  activeIndex: number
  setActiveIndex: (index: number) => void
  variant: TabsVariant
  orientation: TabsOrientation
}

const TabsContext = createContext<TabsContextType>({
  activeIndex: 0,
  setActiveIndex: () => {},
  variant: 'line',
  orientation: 'horizontal',
})

export interface TabsProps extends ViewProps {
  /** Currently active tab index */
  defaultIndex?: number
  /** Controlled active index */
  index?: number
  /** Callback when tab changes */
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
 * <Tabs defaultIndex={0} onChange={(i) => console.log(i)}>
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
  defaultIndex = 0,
  index,
  onChange,
  variant = 'line',
  orientation = 'horizontal',
  className,
  children,
  ...props
}: TabsProps) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex)
  const activeIndex = index ?? internalIndex

  const setActiveIndex = (newIndex: number) => {
    if (index === undefined) {
      setInternalIndex(newIndex)
    }
    onChange?.(newIndex)
  }

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex, variant, orientation }}>
      <View
        className={cn(
          orientation === 'vertical' ? 'flex-row' : 'flex-col',
          className
        )}
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
  const { variant, orientation } = useContext(TabsContext)

  const variantStyles = {
    line: orientation === 'horizontal'
      ? 'border-b border-hairline'
      : 'border-r border-hairline',
    enclosed: 'bg-surface-raised rounded-lg p-1',
    'soft-rounded': 'bg-surface-raised rounded-full p-1',
  }

  const content = (
    <View
      className={cn(
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        variantStyles[variant],
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { index })
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
export function Tab({
  index = 0,
  isDisabled = false,
  className,
  children,
}: TabProps) {
  const { activeIndex, setActiveIndex, variant, orientation } = useContext(TabsContext)
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
    enclosed: cn(
      'px-4 py-2 rounded-md',
      isActive
        ? 'bg-surface-elevated text-text-primary shadow-sm'
        : 'text-text-secondary web:hover:text-text-primary'
    ),
    'soft-rounded': cn(
      'px-4 py-2 rounded-full',
      isActive
        ? 'bg-brand-primary text-white'
        : 'text-text-secondary web:hover:text-text-primary'
    ),
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
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
              ? 'text-white'
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
          return child
        }
        return null
      })}
    </View>
  )
}

export interface TabPanelProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Individual tab panel content.
 */
export function TabPanel({ children, className }: TabPanelProps) {
  return (
    <View className={cn('py-4', className)}>
      {children}
    </View>
  )
}
