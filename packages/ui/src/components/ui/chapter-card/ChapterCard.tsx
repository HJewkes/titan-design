import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { Eyebrow } from '../eyebrow'
import { Surface } from '../surface'
import { Typography } from '../typography'
import { CHAPTER_CARD_REST, chapterCardFrame } from './chapter-card-motion'

/** Props of {@link ChapterCard}. */
export interface ChapterCardProps extends Omit<ViewProps, 'children'> {
  /** The chapter's number, shown zero-padded to two digits. */
  index: number
  title: string
  /** A short line above the title. */
  kicker?: ReactNode
  /** Progress through the card's life, 0..1. Omit for the static card. */
  progress?: number
  className?: string
}

const padIndex = (index: number) => String(index).padStart(2, '0')

/**
 * ChapterCard: a chapter title card, its number, an optional kicker and the title. `progress`
 * runs it in and out (rise and fade in over the first 20%, lift and fade out over the last 17%);
 * with reduced motion, or without `progress`, it holds still and fully visible.
 *
 * @example
 * <ChapterCard index={2} kicker="Chapter" title="Wiring the playhead" progress={0.5} />
 */
export function ChapterCard({
  index,
  title,
  kicker,
  progress,
  className,
  style,
  ...props
}: ChapterCardProps) {
  const isReducedMotion = usePrefersReducedMotion()
  const frame =
    progress === undefined || isReducedMotion ? CHAPTER_CARD_REST : chapterCardFrame(progress)
  const isHidden = frame.opacity === 0

  return (
    <View
      style={[{ opacity: frame.opacity, transform: [{ translateY: frame.translateY }] }, style]}
      aria-hidden={isHidden || undefined}
      testID="chapter-card"
      className={cn('self-start', className)}
      {...props}
    >
      <Surface raise={1} className="gap-stack-sm p-inset-lg">
        <View className="flex-row items-baseline gap-inline-sm">
          <Typography variant="monoLabel" color="secondary">
            {padIndex(index)}
          </Typography>
          {kicker !== undefined && <Eyebrow>{kicker}</Eyebrow>}
        </View>
        <Typography variant="h4">{title}</Typography>
      </Surface>
    </View>
  )
}
