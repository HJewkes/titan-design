/**
 * Story canvases that frame a specimen the way an app frames it (TD-967, TD-970).
 *
 * Apps put a view's content on the `base` plane inside a `Page` (console AppShell, wall
 * dashboard pages) and put most data components inside a raised panel. These helpers compose
 * those same pieces, so a story's outer frame follows the theme toggle and spaces specimens on
 * the section scale instead of a raw grey and an ad-hoc gap.
 *
 * Not a `.stories` file on purpose: it exports no stories, so token lint applies to it.
 */
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Page, type PageGutter, type PageMaxWidth } from '../../components/ui/page'
import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/ui/typography'
import { cn } from '../../utils/cn'

/** Props for `StoryPage`. */
export interface StoryPageProps {
  children?: ReactNode
  /** Stacked above the body at `section-sm`, as on a real `Page`. */
  header?: ReactNode
  gutter?: PageGutter
  maxWidth?: PageMaxWidth
  /** Merged onto the `base` plane. */
  className?: string
  /** Merged onto the page's padded column. */
  contentClassName?: string
  testID?: string
}

/** The page canvas: the `base` plane with the real `Page` gutter inside it. */
export function StoryPage({
  children,
  header,
  gutter = 'md',
  maxWidth = 'full',
  className,
  contentClassName,
  testID = 'story-page',
}: StoryPageProps) {
  return (
    <Surface level="base" testID={testID} className={cn('w-full', className)}>
      <Page
        header={header}
        gutter={gutter}
        maxWidth={maxWidth}
        isScrollable={false}
        contentClassName={contentClassName}
      >
        {children}
      </Page>
    </Surface>
  )
}

/** Props for `StoryPanel`. */
export interface StoryPanelProps {
  children?: ReactNode
  className?: string
  testID?: string
}

/** The panel canvas: one raised step above its plane, as the app's panel cards are. */
export function StoryPanel({ children, className, testID = 'story-panel' }: StoryPanelProps) {
  return (
    <Surface raise={1} rounded testID={testID} className={cn('p-inset-md gap-stack-md', className)}>
      {children}
    </Surface>
  )
}

/** Space between unrelated specimens: a step of the section scale. */
export type StorySpecimensGap = 'sm' | 'md' | 'lg'

const specimensGapClasses: Record<StorySpecimensGap, string> = {
  sm: 'gap-section-sm',
  md: 'gap-section-md',
  lg: 'gap-section-lg',
}

/** Props for `StorySpecimens`. */
export interface StorySpecimensProps {
  children?: ReactNode
  /** Defaults to `sm` (24), the gap the app puts between sections of a page. */
  gap?: StorySpecimensGap
  /** `row` lays unrelated variants side by side, wrapping. */
  direction?: 'column' | 'row'
  className?: string
  testID?: string
}

/** The rhythm between unrelated specimens on a canvas. */
export function StorySpecimens({
  children,
  gap = 'sm',
  direction = 'column',
  className,
  testID = 'story-specimens',
}: StorySpecimensProps) {
  return (
    <View
      testID={testID}
      className={cn(
        direction === 'row' && 'flex-row flex-wrap items-start',
        specimensGapClasses[gap],
        className
      )}
    >
      {children}
    </View>
  )
}

/** Props for `StorySpecimen`. */
export interface StorySpecimenProps {
  /** A string renders as an eyebrow; a node renders as given. */
  label?: ReactNode
  children?: ReactNode
  className?: string
  testID?: string
}

/** One specimen with its label `stack-sm` above it. */
export function StorySpecimen({
  label,
  children,
  className,
  testID = 'story-specimen',
}: StorySpecimenProps) {
  const heading =
    typeof label === 'string' ? (
      <Typography variant="overline" color="secondary">
        {label}
      </Typography>
    ) : (
      label
    )
  return (
    <View testID={testID} className={cn('gap-stack-sm', className)}>
      {heading}
      {children}
    </View>
  )
}
