import React, { useState, createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface CollapseProps extends ViewProps {
  /** Whether the collapse is initially open */
  defaultIsOpen?: boolean
  /** Controlled open state */
  isOpen?: boolean
  /** Callback when state changes */
  onToggle?: (isOpen: boolean) => void
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

interface CollapseContextType {
  isOpen: boolean
  toggle: () => void
}

const CollapseContext = createContext<CollapseContextType>({
  isOpen: false,
  toggle: () => {},
})

/**
 * Collapsible content container.
 *
 * @example
 * <Collapse>
 *   <CollapseButton>
 *     <Text>Click to expand</Text>
 *   </CollapseButton>
 *   <CollapseContent>
 *     <Text>Hidden content</Text>
 *   </CollapseContent>
 * </Collapse>
 */
export function Collapse({
  defaultIsOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  className,
  children,
  ...props
}: CollapseProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultIsOpen)
  const isOpen = controlledIsOpen ?? internalIsOpen

  const toggle = () => {
    const newState = !isOpen
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newState)
    }
    onToggle?.(newState)
  }

  return (
    <CollapseContext.Provider value={{ isOpen, toggle }}>
      <View className={cn('w-full', className)} {...props}>
        {children}
      </View>
    </CollapseContext.Provider>
  )
}

export interface CollapseButtonProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Button to toggle collapse state.
 */
export function CollapseButton({ children, className }: CollapseButtonProps) {
  const { isOpen, toggle } = useContext(CollapseContext)

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className={cn(
        'flex-row items-center justify-between py-3 px-4',
        'web:hover:bg-interactive-hover active:bg-interactive-active rounded-lg',
        className
      )}
    >
      {children}
      <Text className={cn('text-text-secondary transition-transform', isOpen && 'rotate-180')}>
        ▼
      </Text>
    </Pressable>
  )
}

export interface CollapseContentProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Collapsible content area.
 */
export function CollapseContent({ children, className }: CollapseContentProps) {
  const { isOpen } = useContext(CollapseContext)

  if (!isOpen) return null

  return (
    <View className={cn('overflow-hidden', className)}>
      {children}
    </View>
  )
}

// Accordion component

export interface AccordionProps extends ViewProps {
  /** Allow multiple items to be open */
  allowMultiple?: boolean
  /** Default open item indices */
  defaultIndex?: number[]
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

interface AccordionContextType {
  openIndices: Set<number>
  toggleIndex: (index: number) => void
  allowMultiple: boolean
}

const AccordionContext = createContext<AccordionContextType>({
  openIndices: new Set(),
  toggleIndex: () => {},
  allowMultiple: false,
})

/**
 * Accordion component for multiple collapsible sections.
 *
 * @example
 * <Accordion>
 *   <AccordionItem>
 *     <AccordionButton>Section 1</AccordionButton>
 *     <AccordionPanel>Content 1</AccordionPanel>
 *   </AccordionItem>
 *   <AccordionItem>
 *     <AccordionButton>Section 2</AccordionButton>
 *     <AccordionPanel>Content 2</AccordionPanel>
 *   </AccordionItem>
 * </Accordion>
 */
export function Accordion({
  allowMultiple = false,
  defaultIndex = [],
  className,
  children,
  ...props
}: AccordionProps) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set(defaultIndex))

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <AccordionContext.Provider value={{ openIndices, toggleIndex, allowMultiple }}>
      <View className={cn('w-full divide-y divide-border-default', className)} {...props}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { index })
          }
          return child
        })}
      </View>
    </AccordionContext.Provider>
  )
}

export interface AccordionItemProps {
  index?: number
  children?: React.ReactNode
  className?: string
}

/**
 * Individual accordion item.
 */
export function AccordionItem({ index = 0, children, className }: AccordionItemProps) {
  const { openIndices, toggleIndex } = useContext(AccordionContext)
  const isOpen = openIndices.has(index)

  return (
    <View className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            onToggle: () => toggleIndex(index),
          })
        }
        return child
      })}
    </View>
  )
}

export interface AccordionButtonProps {
  isOpen?: boolean
  onToggle?: () => void
  children?: React.ReactNode
  className?: string
}

/**
 * Accordion item toggle button.
 */
export function AccordionButton({
  isOpen = false,
  onToggle,
  children,
  className,
}: AccordionButtonProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className={cn(
        'flex-row items-center justify-between py-4 px-1',
        'web:hover:bg-interactive-hover active:bg-interactive-active',
        className
      )}
    >
      <Text className="text-text-primary font-medium">{children}</Text>
      <Text className={cn('text-text-secondary transition-transform', isOpen && 'rotate-180')}>
        ▼
      </Text>
    </Pressable>
  )
}

export interface AccordionPanelProps {
  isOpen?: boolean
  children?: React.ReactNode
  className?: string
}

/**
 * Accordion item content panel.
 */
export function AccordionPanel({ isOpen = false, children, className }: AccordionPanelProps) {
  if (!isOpen) return null

  return (
    <View className={cn('pb-4 px-1', className)}>
      {children}
    </View>
  )
}
