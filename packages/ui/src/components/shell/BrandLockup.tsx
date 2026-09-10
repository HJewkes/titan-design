import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Typography } from '../custom/Typography'
import { brandPresets, type BrandKey } from './brands'

export interface BrandLockupProps extends ViewProps {
  /** Which app's identity to render. Defaults to `voltras`. */
  brand?: BrandKey
  /** Replace the preset's mark glyph. */
  mark?: ReactNode
  /** Replace the preset's wordmark. */
  wordmark?: string
  /** Replace the preset's accent — a semantic `text-*` token class for the mark. */
  accentClassName?: string
  /** The "/ subtitle" that follows the wordmark. Defaults to the brand's own. */
  subtitle?: string
  /** Show the subtitle. Hidden at tablet width and below (S1-Q4 responsive). */
  showSubtitle?: boolean
  className?: string
}

/**
 * Product identity lockup for the top bar: mark + wordmark + optional subtitle.
 * Generic over the app: pick a `brand` preset, or override `mark` / `wordmark` /
 * `accentClassName` / `subtitle` piecemeal for an app that has no preset yet.
 * Composes an icon primitive + Typography. S1 · BrandLockup.
 */
export function BrandLockup({
  brand = 'voltras',
  mark,
  wordmark,
  accentClassName,
  subtitle,
  showSubtitle = true,
  className,
  ...props
}: BrandLockupProps) {
  const preset = brandPresets[brand]
  const resolvedSubtitle = subtitle ?? preset.subtitle

  return (
    <View className={cn('flex-row items-center gap-[7px]', className)} {...props}>
      <View className={accentClassName ?? preset.accentClassName}>{mark ?? preset.mark}</View>
      <Typography
        variant="button"
        color="primary"
        className="text-[12px] font-extrabold tracking-[1.5px]"
      >
        {wordmark ?? preset.wordmark}
      </Typography>
      {showSubtitle && resolvedSubtitle ? (
        <Typography
          variant="button"
          color="tertiary"
          className="text-[10px] font-semibold tracking-[0.4px]"
        >
          / {resolvedSubtitle}
        </Typography>
      ) : null}
    </View>
  )
}
