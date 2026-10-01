import type { Dispatch } from 'react'
import type { VariantDraft } from '../src/feedback.ts'
import { frameSizing, questionsForVariant } from '../src/sections.ts'
import {
  isImageVariant,
  isStoryVariant,
  type Manifest,
  type Variant,
  type Verdict,
} from '../src/schema.ts'
import { Frame, type PinInput } from './Frame.tsx'
import { ImageFrame } from './ImageFrame.tsx'
import { PinList } from './PinList.tsx'
import type { Action } from './state.ts'
import { Stop } from './Stop.tsx'

const VERDICTS: { key: string; verdict: Exclude<Verdict, null>; label: string }[] = [
  { key: '1', verdict: 'chosen', label: 'Chosen' },
  { key: '2', verdict: 'rejected', label: 'Rejected' },
  { key: '3', verdict: 'maybe', label: 'Maybe' },
]

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

/** What this frame is being asked about, kept on screen while the frame is. */
function answersLine(manifest: Manifest, variantKey: string): string {
  const ids = questionsForVariant(manifest, variantKey)
  const prompts = ids
    .map((id) => manifest.questions.find((q) => q.id === id)?.prompt)
    .filter((p): p is string => !!p)
  return prompts.length ? `Answers: ${prompts.join(' · ')}` : ''
}

export function VariantCard(props: VariantCardProps) {
  const { manifest, variant, draft, index, active, dispatch } = props
  const answers = answersLine(manifest, variant.key)
  const sizing = frameSizing(manifest, variant)
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
        <code>{variant.storyId ?? variant.image}</code>
        {answers && <p className="variant-question">{answers}</p>}
      </header>
      <div className="frames">
        {manifest.widths.map((width) => {
          const shared = { width, height: sizing.height, annotate: props.annotate }
          const pins = draft.annotations
          if (isImageVariant(variant))
            return (
              <ImageFrame
                key={width}
                {...shared}
                variant={variant}
                maxHeight={sizing.maxHeight}
                pins={pins}
                onPin={onPin}
              />
            )
          return (
            isStoryVariant(variant) && (
              <Frame
                key={width}
                {...shared}
                variant={variant}
                maxHeight={sizing.maxHeight}
                pins={pins}
                onPin={onPin}
                onHitTesting={props.onHitTesting}
              />
            )
          )
        })}
      </div>
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
