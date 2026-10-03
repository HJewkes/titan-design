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
  /** Caps the content column, gutters excluded. A capped column centres once the region is wider. */
  maxWidth?: PageMaxWidth
  /** false: the page fills the region and the view owns its own scroll. */
  isScrollable?: boolean
  /** true: the header sits in a ruled band above the scroller instead of scrolling with the body. */
  isHeaderPinned?: boolean
  className?: string
  /** The padded outer column. */
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

// Web only: reserves the classic scrollbar's width so the band and the body share one horizontal box.
const SCROLLBAR_GUTTER = 'web:[scrollbar-gutter:stable]'

export function Page({
  header,
  children,
  gutter = 'md',
  maxWidth = 'full',
  isScrollable = true,
  isHeaderPinned = false,
  className,
  contentClassName,
  ...props
}: PageProps) {
  const fill = !isScrollable && 'flex-1'
  const inner = cn('w-full', maxWidthClasses[maxWidth], maxWidth !== 'full' && 'self-center')
  const pinned = isHeaderPinned && Boolean(header)
  const column = (
    <View className={cn('w-full', gutterClasses[gutter], fill, contentClassName)}>
      <View className={cn(inner, 'gap-section-sm', fill)}>
        {pinned ? null : header}
        <View className={cn(fill)}>{children}</View>
      </View>
    </View>
  )

  return (
    <View role="main" className={cn('flex-1', className)} {...props}>
      {pinned ? (
        <View
          testID="page-header-band"
          className={cn(
            'w-full border-b border-hairline-strong',
            gutterClasses[gutter],
            SCROLLBAR_GUTTER,
            'web:overflow-y-hidden'
          )}
        >
          <View className={inner}>{header}</View>
        </View>
      ) : null}
      {isScrollable ? (
        <ScrollView testID="page-scroll" className={cn(pinned && SCROLLBAR_GUTTER)}>
          {column}
        </ScrollView>
      ) : (
        column
      )}
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
      className={cn('flex-row items-start justify-between gap-inline-lg -mt-1.5', className)}
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
