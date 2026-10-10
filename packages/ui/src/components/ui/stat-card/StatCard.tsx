// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

import { cn } from '../../../utils/cn'
import { Card, type CardProps } from '../card'
import { Typography } from '../typography'

export type StatCardCaptionPlacement = 'beside' | 'below'
export type StatCardInset = 'md' | 'lg'

export interface StatCardProps extends Omit<CardProps, 'children'> {
  /** The top row. Usually a `<StatCardHeader>`. */
  header: ReactNode
  /** The lead figure. Omitted, the body follows the header at the figure-to-body gap. */
  figure?: ReactNode
  /** One line about the figure. `beside` sits right on the figure's row and wraps under it. */
  caption?: ReactNode
  /** Where the caption sits against the figure (default `beside`). */
  captionPlacement?: StatCardCaptionPlacement
  /** Tracks, charts, lists. Pinned to the card's bottom so cards in one grid row end level. */
  body?: ReactNode
  /** The template's inset rung (default `lg`). */
  inset?: StatCardInset
  /** Fires with the content box: the width the body has to spend (the inset is outside it). */
  onContentLayout?: ViewProps['onLayout']
}

const INSET: Record<StatCardInset, string> = {
  md: 'p-inset-md',
  lg: 'p-inset-lg',
}

/**
 * Paint order, top first. Every RNW View is its own stacking context, so a tip
 * opening downward from the header or the figure row needs its row raised over
 * every later sibling, whatever the tip's own z-index says.
 */
const Z = { top: 10, header: 20, figure: 10 } as const

/** The figure and its caption: one wrapping row, or the caption stacked under the figure. */
function FigureRow(props: {
  figure?: ReactNode
  caption?: ReactNode
  placement: StatCardCaptionPlacement
  testID: string
}) {
  if (props.figure === undefined && props.caption === undefined) return null
  if (props.caption === undefined) {
    return (
      <View style={{ zIndex: Z.figure }} testID={props.testID}>
        {props.figure}
      </View>
    )
  }
  if (props.placement === 'below') {
    return (
      <View style={{ zIndex: Z.figure }} className="gap-stack-sm" testID={props.testID}>
        {props.figure}
        {props.caption}
      </View>
    )
  }
  return (
    <View
      style={{ zIndex: Z.figure }}
      className="flex-row flex-wrap items-end justify-between gap-x-inline-md gap-y-stack-sm"
      testID={props.testID}
    >
      {props.figure}
      {props.caption}
    </View>
  )
}

/**
 * The stat card template: a header row, a lead figure with one caption, and a
 * body pinned to the bottom. The template owns every gap between those slots,
 * the inset, and the paint order, so a family of cards sets none of them by hand.
 *
 * Header and figure touch (gap 0): the figure trims its own line-box air
 * (`leading-none`). The body sits `gap-stack-md` under the figure, or under the
 * header when there is no figure, and `marginTop: auto` pins it to the bottom so
 * two cards stretched to one grid row's height end level.
 *
 * The card does not clip, so a tip can escape it; nothing in the template reaches
 * the rounded edge. A caller's `style` still applies after that.
 *
 * Loading passes through to `Card isLoading`, which draws its own padded skeleton.
 * Empty is the consumer's figure. No error or disabled state: the card holds no
 * data of its own and does not press.
 */
export function StatCard({
  header,
  figure,
  caption,
  captionPlacement = 'beside',
  body,
  inset = 'lg',
  onContentLayout,
  isLoading = false,
  className,
  style,
  testID,
  ...props
}: StatCardProps) {
  const part = (name: string) => (testID ? `${testID}-stat-card-${name}` : `stat-card-${name}`)
  return (
    <Card
      className={cn(!isLoading && INSET[inset], className)}
      style={[{ overflow: 'visible' }, style]}
      isLoading={isLoading}
      testID={testID}
      {...props}
    >
      <View className="flex-1 gap-stack-md" onLayout={onContentLayout}>
        <View style={{ zIndex: Z.top }}>
          <View style={{ zIndex: Z.header }} testID={part('header')}>
            {header}
          </View>
          <FigureRow
            figure={figure}
            caption={caption}
            placement={captionPlacement}
            testID={part('figure')}
          />
        </View>
        {body !== undefined && (
          <View className="mt-auto" testID={part('body')}>
            {body}
          </View>
        )}
      </View>
    </Card>
  )
}

export interface StatCardHeaderProps {
  /** A string renders as the overline eyebrow; a node renders as given. */
  title: ReactNode
  /** Marks at the right: tags, status pills, priority. Wraps under the title when narrow. */
  trailing?: ReactNode
  testID?: string
}

/** A stat card's top row: the title left, its marks right, wrapping under the title when narrow. */
export function StatCardHeader({ title, trailing, testID }: StatCardHeaderProps) {
  return (
    <View
      className="flex-row flex-wrap items-center justify-between gap-x-inline-md gap-y-stack-sm"
      testID={testID}
    >
      {typeof title === 'string' ? (
        <Typography variant="overline" color="secondary">
          {title}
        </Typography>
      ) : (
        title
      )}
      {trailing !== undefined && (
        <View className="flex-row items-center gap-inline-sm">{trailing}</View>
      )}
    </View>
  )
}
