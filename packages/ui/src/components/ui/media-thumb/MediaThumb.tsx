import { useState, type ReactNode } from 'react'
import { Image, View, type ImageSourcePropType, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { PlayIcon } from '../../icons'
import { Skeleton } from '../skeleton'

export type MediaThumbFit = 'cover' | 'contain-blur'

export interface MediaThumbProps extends Omit<ViewProps, 'children'> {
  /** The poster frame. Omitted, or failing to load, the thumb shows a plane with a play glyph. */
  source?: ImageSourcePropType
  /** Width over height. Defaults to 16:9. */
  aspect?: number
  /**
   * `cover` crops the frame to fill the box. `contain-blur` shows the whole frame, letterboxed on a
   * blurred, darkened copy of itself, for a portrait source in a landscape box.
   */
  fit?: MediaThumbFit
  /** Corner slot, usually a status badge. */
  topStart?: ReactNode
  /** Corner slot, usually a `MediaThumbBadge` such as "No sound". */
  bottomStart?: ReactNode
  /** Corner slot, usually the length `MediaThumbBadge`. */
  bottomEnd?: ReactNode
  /** Names the frame as an image. Omitted, the frame is decorative and the badges still read. */
  accessibilityLabel?: string
  /** Shows a Skeleton in place of the frame and hides the badges. */
  isLoading?: boolean
  className?: string
}

const BACKDROP_BLUR = 14
// Overscan hides the blur's soft, see-through edge.
const BACKDROP_SCALE = 1.15

function NoSourcePlane({ accessibilityLabel }: { accessibilityLabel?: string }) {
  const a11y = accessibilityLabel ? { accessibilityRole: 'image' as const, accessibilityLabel } : {}
  return (
    <View
      {...a11y}
      testID="media-thumb-no-source"
      className="absolute inset-0 items-center justify-center bg-surface-base text-text-secondary"
    >
      <PlayIcon size={32} />
    </View>
  )
}

interface FrameProps {
  source: ImageSourcePropType
  fit: MediaThumbFit
  accessibilityLabel?: string
  onError: () => void
}

function Frame({ source, fit, accessibilityLabel, onError }: FrameProps) {
  const a11y = accessibilityLabel
    ? { accessibilityRole: 'image' as const, accessibilityLabel }
    : { accessible: false, 'aria-hidden': true }
  if (fit === 'cover') {
    return (
      <Image
        {...a11y}
        source={source}
        resizeMode="cover"
        onError={onError}
        className="absolute inset-0 h-full w-full"
      />
    )
  }
  return (
    <>
      <Image
        aria-hidden
        accessible={false}
        source={source}
        resizeMode="cover"
        blurRadius={BACKDROP_BLUR}
        className="absolute inset-0 h-full w-full"
        style={{ transform: [{ scale: BACKDROP_SCALE }] }}
      />
      <View className="absolute inset-0 bg-scrim-default" />
      <Image
        {...a11y}
        source={source}
        resizeMode="contain"
        onError={onError}
        className="absolute inset-0 h-full w-full"
      />
    </>
  )
}

function Corner({ className, children }: { className: string; children: ReactNode }) {
  if (children == null) return null
  return <View className={cn('absolute', className)}>{children}</View>
}

/**
 * A media poster frame at a fixed aspect ratio, with three corner badge slots. It knows nothing of
 * what the media is: a video card composes it and fills the slots.
 */
export function MediaThumb({
  source,
  aspect = 16 / 9,
  fit = 'cover',
  topStart,
  bottomStart,
  bottomEnd,
  accessibilityLabel,
  isLoading = false,
  className,
  style,
  ...props
}: MediaThumbProps) {
  const [failedSource, setFailedSource] = useState<ImageSourcePropType | undefined>(undefined)
  const showFrame = source !== undefined && source !== failedSource

  return (
    <View
      className={cn('relative w-full overflow-hidden rounded-lg bg-surface-base', className)}
      style={[{ aspectRatio: aspect }, style]}
      {...props}
    >
      {isLoading ? (
        <Skeleton variant="rect" width="100%" height="100%" accessibilityLabel="Loading media" />
      ) : (
        <>
          {showFrame ? (
            <Frame
              source={source}
              fit={fit}
              accessibilityLabel={accessibilityLabel}
              onError={() => setFailedSource(source)}
            />
          ) : (
            <NoSourcePlane accessibilityLabel={accessibilityLabel} />
          )}
          <Corner className="left-inset-sm top-inset-sm">{topStart}</Corner>
          <Corner className="bottom-inset-sm left-inset-sm">{bottomStart}</Corner>
          <Corner className="bottom-inset-sm right-inset-sm">{bottomEnd}</Corner>
        </>
      )}
    </View>
  )
}
