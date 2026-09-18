import type { Dispatch } from 'react'
import type { VariantDraft } from '../src/feedback.ts'
import type { Manifest, Variant, Verdict } from '../src/schema.ts'
import { Frame } from './Frame.tsx'
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

export function VariantCard(props: VariantCardProps) {
  const { manifest, variant, draft, index, active, dispatch } = props
  return (
    <Stop
      index={index}
      active={active}
      dispatch={dispatch}
      className="variant"
      testId={`variant-${variant.key}`}
    >
      <header className="variant-head">
        <h3>
          <span className="key">{variant.key}</span> {variant.label}
        </h3>
        <code>{variant.storyId}</code>
      </header>
      <div className="frames">
        {manifest.widths.map((width) => (
          <Frame
            key={width}
            variant={variant}
            width={width}
            height={manifest.height}
            annotate={props.annotate}
            pins={draft.annotations}
            onHitTesting={props.onHitTesting}
            onPin={(pin) => {
              dispatch({ type: 'activate', index })
              dispatch({ type: 'addPin', key: variant.key, pin })
            }}
          />
        ))}
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
