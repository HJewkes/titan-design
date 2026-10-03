import React from 'react'
import { ScrollView, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../typography'

export type PageGutter = 'sm' | 'md'
export type PageMaxWidth = 'narrow' | 'wide' | 'full'

export interface PageProps extends Omit<ViewProps, 'children'> {
  /** Stacked above the body. Usually a PageHeader. Omitted: no header and no gap. */
  header?: React.ReactNode
  /** The body. */
  children?: React.ReactNode
  gutter?: PageGutter
  maxWidth?: PageMaxWidth
  /** false: the page fills the region and the view owns its own scroll. */
  isScrollable?: boolean
  className?: string
  /** The padded column. */
  contentClassName?: string
}

const gutterClasses: Record<PageGutter, string> = {
  sm: 'p-gutter-sm',
  md: 'p-gutter-md',
}

const maxWidthClasses: Record<PageMaxWidth, string> = {
  narrow: 'max-w-[760px]',
  wide: 'max-w-[1100px]',
  full: '',
}

export function Page({
  header,
  children,
  gutter = 'md',
  maxWidth = 'full',
  isScrollable = true,
  className,
  contentClassName,
  ...props
}: PageProps) {
  const column = (
    <View
      className={cn(
        'w-full gap-section-sm',
        gutterClasses[gutter],
        maxWidthClasses[maxWidth],
        !isScrollable && 'flex-1',
        contentClassName
      )}
    >
      {header}
      <View className={cn(!isScrollable && 'flex-1')}>{children}</View>
    </View>
  )

  return (
    <View role="main" className={cn('flex-1', className)} {...props}>
      {isScrollable ? <ScrollView testID="page-scroll">{column}</ScrollView> : column}
    </View>
  )
}

export interface PageHeaderProps extends Omit<ViewProps, 'children'> {
  title: string
  description?: string
  /** Actions, right-aligned on the title row. */
  trailing?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, trailing, className, ...props }: PageHeaderProps) {
  return (
    <View
      className={cn('flex-row items-start justify-between gap-inline-lg', className)}
      {...props}
    >
      <View className="flex-1 gap-stack-sm">
        <Typography variant="h5" aria-level={1}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="secondary">
            {description}
          </Typography>
        ) : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  )
}
