import { useState, type MouseEvent } from 'react'
import type { Annotation, FrameHeight, ImageVariant } from '@titan-design/review-schema'
import { isAuto } from '../src/sections.ts'
import { PinOverlay, pointerPin, type PinInput } from './Frame.tsx'
import {
  LadderOverlay,
  ViewToggle,
  trueSizeCaption,
  trueSizeClass,
  trueSizeHeight,
  useFrameView,
} from './TrueSize.tsx'

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

function boxHeight(props: ImageFrameProps, scale: number) {
  const reference = props.variant.frameReference
  if (reference) return trueSizeHeight(reference, scale)
  return isAuto(props.height)
    ? { maxHeight: props.maxHeight * scale }
    : { height: props.height * scale }
}

/**
 * A static PNG drawn at the declared width. An `auto` frame is as tall as the image at that
 * width up to the cap; a number fixes the frame. Past either, the image scrolls in its frame.
 * A true-size frame (`frameReference`) is outlined, carries its ladder and switches Fit and 1:1.
 */
export function ImageFrame(props: ImageFrameProps) {
  const { variant, width } = props
  const reference = variant.frameReference
  const { ref, scale, view, setView } = useFrameView(width)
  const [broken, setBroken] = useState(false)
  const box = boxHeight(props, scale)

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    const shownHeight = e.currentTarget.getBoundingClientRect().height / scale
    props.onPin(pointerPin(e, scale, width, shownHeight))
  }

  return (
    <figure className={trueSizeClass('frame', reference && view)} data-width={width} ref={ref}>
      <figcaption>
        {reference ? (
          <>
            {trueSizeCaption(reference, scale)} · image
            <ViewToggle view={view} onChange={setView} />
          </>
        ) : (
          <>
            {width}px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''} · image
          </>
        )}
      </figcaption>
      <div
        className={trueSizeClass('frame-box image-box', reference && 'true-size')}
        style={{ width: width * scale, ...box }}
      >
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
        {reference && <LadderOverlay rungs={reference.ladder} k={scale} />}
        {broken && (
          <div className="frame-dead" role="alert" data-testid={`dead-${variant.key}-${width}`}>
            <p>Image failed to load: {variant.image}</p>
          </div>
        )}
      </div>
    </figure>
  )
}
