import { useState, type MouseEvent } from 'react'
import type { Annotation, ClipVariant } from '@titan-design/review-schema'
import { PinOverlay, pointerPin, useFitScale, type PinInput } from './Frame.tsx'

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
 * A recorded clip at the declared width, muted, with the browser's own play, pause and scrub
 * controls. Pins sit over the video only while annotating, so the controls stay reachable.
 */
export function ClipFrame({ variant, width, annotate, pins, onPin }: ClipFrameProps) {
  const { ref, scale } = useFitScale(width)
  const [broken, setBroken] = useState(false)
  const motion = variant.motion?.mechanism === 'clip' ? variant.motion : undefined

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    const shownHeight = e.currentTarget.getBoundingClientRect().height / scale
    onPin(pointerPin(e, scale, width, shownHeight))
  }

  return (
    <figure className="frame" data-width={width} ref={ref}>
      <figcaption>
        {width}px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''} · clip
        {motion?.loop === false ? ', plays once' : ', loops'}
      </figcaption>
      <div className="frame-box clip-box" style={{ width: width * scale }}>
        <video
          src={clipUrl(variant)}
          aria-label={`${variant.key} · ${variant.label} at ${width}px`}
          autoPlay={motion?.autoplay ?? true}
          loop={motion?.loop ?? true}
          muted
          controls
          playsInline
          preload="auto"
          style={{ width: width * scale }}
          onError={() => setBroken(true)}
        />
        <PinOverlay
          variantKey={variant.key}
          width={width}
          scale={scale}
          annotate={annotate}
          pins={pins}
          onClick={onOverlayClick}
        />
        {broken && (
          <div className="frame-dead" role="alert" data-testid={`dead-${variant.key}-${width}`}>
            <p>Clip failed to load: {variant.clip}</p>
          </div>
        )}
      </div>
    </figure>
  )
}
