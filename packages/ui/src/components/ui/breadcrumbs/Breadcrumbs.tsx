import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface BreadcrumbsProps extends ViewProps {
  /** Custom separator */
  separator?: React.ReactNode
  /** Maximum items to show (with collapse) */
  maxItems?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Breadcrumbs navigation component.
 *
 * @example
 * <Breadcrumbs>
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/products">Products</BreadcrumbItem>
 *   <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
 * </Breadcrumbs>
 */
export function Breadcrumbs({
  separator = '/',
  maxItems,
  className,
  children,
  ...props
}: BreadcrumbsProps) {
  const items = React.Children.toArray(children)
  let displayItems = items

  // Handle max items with ellipsis
  if (maxItems && items.length > maxItems) {
    const firstItem = items[0]
    const lastItems = items.slice(-Math.floor(maxItems / 2))
    displayItems = [
      firstItem,
      <BreadcrumbEllipsis key="ellipsis" />,
      ...lastItems,
    ]
  }

  return (
    <View
      accessibilityRole="none"
      className={cn('flex-row items-center flex-wrap', className)}
      {...props}
    >
      {displayItems.map((child, index) => (
        <View key={index} className="flex-row items-center">
          {child}
          {index < displayItems.length - 1 && (
            <Text className="mx-2 text-text-tertiary text-sm">
              {separator}
            </Text>
          )}
        </View>
      ))}
    </View>
  )
}

export interface BreadcrumbItemProps {
  /** Navigation URL */
  href?: string
  /** Whether this is the current page */
  isCurrentPage?: boolean
  /** Press handler */
  onPress?: () => void
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Individual breadcrumb item.
 */
export function BreadcrumbItem({
  href,
  isCurrentPage = false,
  onPress,
  className,
  children,
}: BreadcrumbItemProps) {
  if (isCurrentPage) {
    return (
      <Text
        accessibilityRole="text"
        aria-current="page"
        className={cn('text-sm font-medium text-text-primary', className)}
      >
        {children}
      </Text>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityHint={href}
    >
      <Text
        className={cn(
          'text-sm text-text-secondary',
          'web:hover:text-text-primary web:hover:underline',
          'active:opacity-70',
          className
        )}
      >
        {children}
      </Text>
    </Pressable>
  )
}

/**
 * Ellipsis for collapsed breadcrumbs.
 */
function BreadcrumbEllipsis() {
  return (
    <Text className="text-sm text-text-tertiary">...</Text>
  )
}
