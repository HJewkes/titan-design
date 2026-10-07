import { useState, type MouseEvent } from 'react'
import type { Annotation, FrameHeight, ImageVariant } from '../src/schema.ts'
import { isAuto } from '../src/sections.ts'
import { PinOverlay, pointerPin, useFitScale, type PinInput } from './Frame.tsx'

interface ImageFrameProps {
  variant: ImageVariant
  width: number
  height: FrameHeight
  maxHeight: number
  annotate: boolean
  pins: Annotation[]
  onPin: (pin: PinInput) => void
}

/** The server serves each image by variant key, never by path. */
function imageUrl(variant: ImageVariant): string {
  return `api/image/${encodeURIComponent(variant.key)}`
}

/**
 * A static PNG drawn at the declared width. An `auto` frame is as tall as the image at that
 * width up to the cap; a number fixes the frame. Past either, the image scrolls in its frame.
 */
export function ImageFrame(props: ImageFrameProps) {
  const { variant, width } = props
  const { ref, scale } = useFitScale(width)
  const [broken, setBroken] = useState(false)
  const box = isAuto(props.height)
    ? { maxHeight: props.maxHeight * scale }
    : { height: props.height * scale }

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    const shownHeight = e.currentTarget.getBoundingClientRect().height / scale
    props.onPin(pointerPin(e, scale, width, shownHeight))
  }

  return (
    <figure className="frame" data-width={width} ref={ref}>
      <figcaption>
        {width}px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''} · image
      </figcaption>
      <div className="frame-box image-box" style={{ width: width * scale, ...box }}>
        <div className="image-content">
          <img
            src={imageUrl(variant)}
            alt={`${variant.key} · ${variant.label} at ${width}px`}
            loading="lazy"
            style={{ width: width * scale }}
            onError={() => setBroken(true)}
          />
          <PinOverlay
            variantKey={variant.key}
            width={width}
            scale={scale}
            annotate={props.annotate}
            pins={props.pins}
            onClick={onOverlayClick}
          />
        </div>
        {broken && (
          <div className="frame-dead" role="alert" data-testid={`dead-${variant.key}-${width}`}>
            <p>Image failed to load: {variant.image}</p>
          </div>
        )}
      </div>
    </figure>
  )
}
