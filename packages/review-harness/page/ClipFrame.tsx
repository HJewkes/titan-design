import { useState, type MouseEvent } from 'react'
import type { Annotation, ClipVariant } from '@titan-design/review-schema'
import { ClipControls, useClipPlayer } from './ClipControls.tsx'
import { PinOverlay, pointerPin, type PinInput } from './Frame.tsx'
import {
  LadderOverlay,
  ViewToggle,
  clipSizeCheck,
  trueSizeCaption,
  trueSizeClass,
  trueSizeHeight,
  useFrameView,
} from './TrueSize.tsx'

interface ClipFrameProps {
  variant: ClipVariant
  width: number
  annotate: boolean
  pins: Annotation[]
  onPin: (pin: PinInput) => void
}

/** The server serves each clip by variant key, never by path. */
function clipUrl(variant: ClipVariant): string {
  return `api/clip/${encodeURIComponent(variant.key)}`
}

/**
 * A recorded clip at the declared width, muted, under the same play, scrub and readout controls
 * as an arg motion, plus a loop toggle and the clip's keyframes. Pins sit over the video only
 * while annotating. A true-size frame (`frameReference`) is outlined, carries its ladder,
 * switches Fit and 1:1, and is checked against the video's own size once its metadata loads.
 */
export function ClipFrame({ variant, width, annotate, pins, onPin }: ClipFrameProps) {
  const reference = variant.frameReference
  const { ref, scale, view, setView } = useFrameView(width)
  const [broken, setBroken] = useState(false)
  const [wrongSize, setWrongSize] = useState<string | null>(null)
  const motion = variant.motion?.mechanism === 'clip' ? variant.motion : undefined
  const [videoProps, player] = useClipPlayer(motion)
  const checkSize = clipSizeCheck(reference, setWrongSize)

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    const shownHeight = e.currentTarget.getBoundingClientRect().height / scale
    onPin(pointerPin(e, scale, width, shownHeight))
  }

  return (
    <figure className={trueSizeClass('frame', reference && view)} data-width={width} ref={ref}>
      <figcaption>
        {reference ? (
          <>{trueSizeCaption(reference, scale)} · clip</>
        ) : (
          <>
            {width}px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''} · clip
          </>
        )}
        {player.loop ? ', loops' : ', plays once'}
        {reference && <ViewToggle view={view} onChange={setView} />}
      </figcaption>
      <div
        className={trueSizeClass('frame-box clip-box', reference && 'true-size')}
        style={{ width: width * scale, ...trueSizeHeight(reference, scale) }}
      >
        <video
          src={clipUrl(variant)}
          aria-label={`${variant.key} · ${variant.label} at ${width}px`}
          autoPlay={motion?.autoplay ?? true}
          {...videoProps}
          muted
          playsInline
          preload="auto"
          style={{ width: width * scale }}
          onError={() => setBroken(true)}
          onLoadedMetadata={(e) => {
            videoProps.onLoadedMetadata(e)
            checkSize(e)
          }}
        />
        <PinOverlay
          variantKey={variant.key}
          width={width}
          scale={scale}
          annotate={annotate}
          pins={pins}
          onClick={onOverlayClick}
        />
        {reference && <LadderOverlay rungs={reference.ladder} k={scale} />}
        {broken && (
          <div className="frame-dead" role="alert" data-testid={`dead-${variant.key}-${width}`}>
            <p>Clip failed to load: {variant.clip}</p>
          </div>
        )}
        {wrongSize && (
          <div className="frame-dead" role="alert" data-testid={`wrong-size-${variant.key}`}>
            <p>
              Clip {variant.clip} {wrongSize}
            </p>
          </div>
        )}
      </div>
      <ClipControls variantKey={variant.key} motion={motion} player={player} />
    </figure>
  )
}
