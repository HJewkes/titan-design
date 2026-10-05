import React, { useCallback, useState } from 'react'
import {
  Platform,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import { getElevationShadow } from '../../../theme/elevation'
import { cn } from '../../../utils/cn'
import { Typography } from '../typography'
import { surfaceBackground, useSurface } from '../surface'

export type PageGutter = 'sm' | 'md'
export type PageMaxWidth = 'narrow' | 'wide' | 'full'

export interface PageProps extends Omit<ViewProps, 'children'> {
  /** Stacked above the body. Usually a PageHeader. Omitted: no header and no gap. */
  header?: React.ReactNode
  /** The body. */
  children?: React.ReactNode
  /** `md` widens from 640px and a consumer `p-*` in `contentClassName` loses to it there; pass `sm` for a fixed narrow gutter. */
  gutter?: PageGutter
  /** Caps the content column, gutters excluded. A capped column centres once the region is wider. */
  maxWidth?: PageMaxWidth
  /** false: the page fills the region and the view owns its own scroll. */
  isScrollable?: boolean
  /** true: the header sits in a ruled band that stays put while the body scrolls under it. */
  isHeaderPinned?: boolean
  /** true: a pinned header casts an elevation shadow once content has scrolled under it. */
  hasScrollShadow?: boolean
  className?: string
  /** The padded outer column. */
  contentClassName?: string
}

const gutterClasses: Record<PageGutter, string> = {
  sm: 'p-gutter-sm',
  md: 'p-gutter-sm sm:p-gutter-md',
}

// Below the pinned rule: 12. Above it: 24 once the screen is wide enough, 16 before.
const pinnedBodyTop = 'pt-inset-md sm:pt-inset-md'
const pinnedBandBottom = 'pb-gutter-sm sm:pb-section-sm'

const maxWidthClasses: Record<PageMaxWidth, string> = {
  narrow: 'max-w-[760px]',
  wide: 'max-w-[1100px]',
  full: '',
}

const SCROLL_SHADOW_LEVEL = 2
// Explicit, so the shadow is replaced rather than left behind when the content scrolls back to the top.
const NO_SHADOW = Platform.select<ViewStyle>({ web: { boxShadow: 'none' } as ViewStyle })

function useScrolledUnder(enabled: boolean) {
  const [isScrolled, setIsScrolled] = useState(false)
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (enabled) setIsScrolled(event.nativeEvent.contentOffset.y > 0)
    },
    [enabled]
  )
  return { isScrolled: enabled && isScrolled, onScroll }
}

interface PageHeaderBandProps {
  gutter: PageGutter
  isElevated: boolean
  innerClassName: string
  children: React.ReactNode
}

function PageHeaderBand({ gutter, isElevated, innerClassName, children }: PageHeaderBandProps) {
  const { mode, level } = useSurface()
  return (
    <View
      testID="page-header-band"
      className={cn(
        'w-full border-b border-hairline-strong relative z-10',
        gutterClasses[gutter],
        pinnedBandBottom
      )}
      style={[
        { backgroundColor: surfaceBackground(level, mode) },
        isElevated ? getElevationShadow(SCROLL_SHADOW_LEVEL, mode) : NO_SHADOW,
      ]}
    >
      <View className={innerClassName}>{children}</View>
    </View>
  )
}

export function Page({
  header,
  children,
  gutter = 'md',
  maxWidth = 'full',
  isScrollable = true,
  isHeaderPinned = false,
  hasScrollShadow = false,
  className,
  contentClassName,
  ...props
}: PageProps) {
  const fill = !isScrollable && 'flex-1'
  const inner = cn('w-full', maxWidthClasses[maxWidth], maxWidth !== 'full' && 'self-center')
  const pinned = isHeaderPinned && Boolean(header)
  const { isScrolled, onScroll } = useScrolledUnder(pinned && hasScrollShadow)
  const column = (
    <View
      className={cn(
        'w-full',
        gutterClasses[gutter],
        pinned && pinnedBodyTop,
        fill,
        contentClassName
      )}
    >
      <View className={cn(inner, 'gap-section-sm', fill)}>
        {pinned ? null : header}
        <View className={cn(fill)}>{children}</View>
      </View>
    </View>
  )
  // The band is the scroller's first child and its sticky header (web and native), so it shares
  // the scroller's box: no reserved scrollbar gutter, and none shown on a page that does not scroll.
  const band = pinned ? (
    <PageHeaderBand gutter={gutter} isElevated={isScrolled} innerClassName={inner}>
      {header}
    </PageHeaderBand>
  ) : null

  return (
    <View role="main" className={cn('flex-1', className)} {...props}>
      {isScrollable ? (
        <ScrollView
          testID="page-scroll"
          onScroll={onScroll}
          scrollEventThrottle={16}
          stickyHeaderIndices={band ? [0] : undefined}
        >
          {band}
          {column}
        </ScrollView>
      ) : (
        <>
          {band}
          {column}
        </>
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
      className={cn(
        'flex-row items-start justify-between gap-inline-md sm:gap-inline-lg -mt-1.5',
        className
      )}
      {...props}
    >
      <View className="flex-1 min-w-0 gap-stack-sm">
        <Typography variant="h5" aria-level={1} className="text-lg sm:text-xl leading-tight">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="secondary">
            {description}
          </Typography>
        ) : null}
      </View>
      {trailing ? <View className="shrink-0">{trailing}</View> : null}
    </View>
  )
}
