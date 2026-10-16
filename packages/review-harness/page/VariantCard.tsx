import type { Dispatch } from 'react'
import type { VariantDraft } from '../src/feedback.ts'
import { frameSizing } from '../src/sections.ts'
import {
  isAudioVariant,
  isClipVariant,
  isImageVariant,
  isStoryVariant,
  type Manifest,
  type Variant,
} from '@titan-design/review-schema'
import { AudioFrame } from './AudioFrame.tsx'
import { ClipFrame } from './ClipFrame.tsx'
import { Frame, type PinInput } from './Frame.tsx'
import { ImageFrame } from './ImageFrame.tsx'
import { MotionControls, useMotionPlayer } from './MotionControls.tsx'
import { ScaleFrame } from './ScaleFrame.tsx'
import type { LiveArgs } from './storyArgs.ts'
import { PinList } from './PinList.tsx'
import { VERDICTS, type Action } from './state.ts'
import { Stop } from './Stop.tsx'

interface VariantCardProps {
  manifest: Manifest
  variant: Variant
  draft: VariantDraft
  index: number
  active: boolean
  follow: boolean
  annotate: boolean
  focusPin: string | null
  dispatch: Dispatch<Action>
  onHitTesting: (sameOrigin: boolean) => void
}

function VerdictControl({ variant, draft, dispatch }: Omit<VariantCardProps, 'manifest'>) {
  return (
    <div className="choices" role="radiogroup" aria-label={`Verdict for ${variant.key}`}>
      {VERDICTS.map(({ key, verdict, label }) => (
        <button
          key={verdict}
          type="button"
          role="radio"
          tabIndex={-1}
          aria-checked={draft.verdict === verdict}
          className={`choice verdict-${verdict}`}
          onClick={() =>
            dispatch({
              type: 'verdict',
              key: variant.key,
              verdict: draft.verdict === verdict ? null : verdict,
            })
          }
        >
          <kbd>{key}</kbd> {label}
        </button>
      ))}
    </div>
  )
}

interface CardFramesProps extends VariantCardProps {
  onPin: (pin: PinInput) => void
  liveArgs?: LiveArgs
}

/** The widths a frame is drawn at: a true-size image or clip once, at its own frame width. */
function frameWidths(manifest: Manifest, variant: Variant): number[] {
  return variant.frameReference ? [variant.frameReference.frame.width] : manifest.widths
}

/**
 * A scale reference is one full-size frame, and so is a true-size image or clip; a sound has one
 * player; every other variant is drawn at each manifest width.
 */
function CardFrames(props: CardFramesProps) {
  const { manifest, variant, draft, onPin, liveArgs } = props
  const sizing = frameSizing(manifest, variant)
  const pins = draft.annotations
  if (isAudioVariant(variant))
    return (
      <div className="frames">
        <AudioFrame variant={variant} />
      </div>
    )
  if (isStoryVariant(variant) && variant.scale)
    return (
      <div className="frames">
        <ScaleFrame
          variant={{ ...variant, scale: variant.scale }}
          annotate={props.annotate}
          pins={pins}
          onPin={onPin}
          liveArgs={liveArgs}
        />
      </div>
    )
  return (
    <div className="frames">
      {frameWidths(manifest, variant).map((width) => {
        const shared = { width, annotate: props.annotate, pins, onPin }
        if (isClipVariant(variant)) return <ClipFrame key={width} {...shared} variant={variant} />
        if (isImageVariant(variant))
          return (
            <ImageFrame
              key={width}
              {...shared}
              variant={variant}
              height={sizing.height}
              maxHeight={sizing.maxHeight}
            />
          )
        return (
          isStoryVariant(variant) && (
            <Frame
              key={width}
              {...shared}
              variant={variant}
              height={sizing.height}
              maxHeight={sizing.maxHeight}
              onHitTesting={props.onHitTesting}
              liveArgs={liveArgs}
            />
          )
        )
      })}
    </div>
  )
}

export function VariantCard(props: VariantCardProps) {
  const { variant, draft, index, active, dispatch } = props
  const argMotion = variant.motion?.mechanism === 'arg' ? variant.motion : undefined
  const player = useMotionPlayer(argMotion)
  const onPin = (pin: PinInput) => {
    dispatch({ type: 'activate', index })
    dispatch({ type: 'addPin', key: variant.key, pin })
  }
  return (
    <Stop
      id={`variant-${variant.key}`}
      index={index}
      active={active}
      follow={props.follow}
      dispatch={dispatch}
      className="variant"
      testId={`variant-${variant.key}`}
    >
      <header className="variant-head">
        <h3>
          <span className="key">{variant.key}</span> {variant.label}
        </h3>
        <code>{variant.storyId ?? variant.image ?? variant.clip ?? variant.audio}</code>
      </header>
      {argMotion && <MotionControls variantKey={variant.key} motion={argMotion} player={player} />}
      <CardFrames {...props} onPin={onPin} liveArgs={player.args} />
      <VerdictControl {...props} />
      <textarea
        aria-label={`Comment on ${variant.key}`}
        placeholder="Comment (Enter moves on, Shift+Enter for a new line)"
        value={draft.comment}
        onChange={(e) =>
          dispatch({ type: 'variantComment', key: variant.key, comment: e.target.value })
        }
      />
      <PinList
        variantKey={variant.key}
        pins={draft.annotations}
        focusPin={props.focusPin}
        dispatch={dispatch}
      />
    </Stop>
  )
}
