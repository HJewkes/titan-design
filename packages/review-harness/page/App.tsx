import { useMemo, useReducer, useState, type Dispatch } from 'react'
import { buildFeedback } from '../src/feedback.ts'
import { feedbackProblems } from '../src/round.ts'
import type { Manifest } from '../src/schema.ts'
import { QuestionBlock } from './QuestionBlock.tsx'
import { ReviewScreen } from './ReviewScreen.tsx'
import {
  createReducer,
  initialState,
  orderedQuestions,
  type Action,
  type ReviewState,
} from './state.ts'
import { Stop } from './Stop.tsx'
import { useKeyboard } from './useKeyboard.ts'
import { VariantCard } from './VariantCard.tsx'

interface AppProps {
  manifest: Manifest
  manifestSha256: string
}

async function postFeedback(body: unknown): Promise<string[]> {
  const res = await fetch('api/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  if (!res) return ['the titan-review process is gone; rerun it']
  if (res.ok) return []
  return (
    ((await res.json().catch(() => ({}))) as { errors?: string[] }).errors ?? [`HTTP ${res.status}`]
  )
}

function Header({
  manifest,
  state,
  hitTesting,
}: {
  manifest: Manifest
  state: ReviewState
  hitTesting: boolean | null
}) {
  return (
    <header className="page-head">
      <h1>
        {manifest.unit} <span>round {manifest.round}</span>
      </h1>
      {manifest.context && <p>{manifest.context}</p>}
      <ol className="prompts">
        {orderedQuestions(manifest).map((q) => (
          <li key={q.id}>{q.prompt}</li>
        ))}
      </ol>
      <p className="keys">
        <kbd>1</kbd>-<kbd>9</kbd> pick · <kbd>Tab</kbd> comment · <kbd>Enter</kbd> next ·{' '}
        <kbd>a</kbd> pins {state.annotate ? 'ON' : 'off'} · <kbd>l</kbd> layout · <kbd>⌘ Enter</kbd>{' '}
        review and send
        {hitTesting !== null && (
          <span data-testid="hit-testing">
            {' '}
            · element hit-testing {hitTesting ? 'on' : 'off (coordinates only)'}
          </span>
        )}
      </p>
    </header>
  )
}

function GeneralBlock({
  index,
  state,
  dispatch,
}: {
  index: number
  state: ReviewState
  dispatch: Dispatch<Action>
}) {
  return (
    <Stop
      index={index}
      active={state.active === index}
      follow={state.follow}
      dispatch={dispatch}
      className="question"
      testId="general"
    >
      <h3>Anything else for the next round?</h3>
      <textarea
        aria-label="General notes"
        placeholder="General notes (Enter opens the final check)"
        value={state.draft.general}
        onChange={(e) => dispatch({ type: 'general', text: e.target.value })}
      />
    </Stop>
  )
}

function Form({
  manifest,
  state,
  dispatch,
  onHitTesting,
}: {
  manifest: Manifest
  state: ReviewState
  dispatch: Dispatch<Action>
  onHitTesting: (on: boolean) => void
}) {
  const questions = orderedQuestions(manifest)
  const n = manifest.variants.length
  return (
    <main>
      <div
        className={state.singleColumn ? 'variants single' : 'variants'}
        data-annotating={state.annotate || undefined}
      >
        {manifest.variants.map((v, i) => (
          <VariantCard
            key={v.key}
            manifest={manifest}
            variant={v}
            draft={state.draft.variants[v.key]}
            index={i}
            active={state.active === i}
            follow={state.follow}
            annotate={state.annotate}
            focusPin={state.focusPin}
            dispatch={dispatch}
            onHitTesting={onHitTesting}
          />
        ))}
      </div>
      {questions.map((q, i) => (
        <QuestionBlock
          key={q.id}
          manifest={manifest}
          question={q}
          draft={state.draft.answers[q.id]}
          index={n + i}
          active={state.active === n + i}
          follow={state.follow}
          dispatch={dispatch}
        />
      ))}
      <GeneralBlock index={n + questions.length} state={state} dispatch={dispatch} />
      <button
        type="button"
        className="primary"
        onClick={() => dispatch({ type: 'screen', screen: 'review' })}
      >
        Review answers <kbd>⌘ Enter</kbd>
      </button>
    </main>
  )
}

export function App({ manifest, manifestSha256 }: AppProps) {
  const reducer = useMemo(() => createReducer(manifest), [manifest])
  const [state, dispatch] = useReducer(reducer, manifest, initialState)
  const [hitTesting, setHitTesting] = useState<boolean | null>(null)
  const feedback = buildFeedback(manifest, manifestSha256, state.draft, new Date())
  const problems = feedbackProblems(feedback, manifest)
  const submit = async () => {
    if (state.screen !== 'review' || problems.length) return
    dispatch({ type: 'screen', screen: 'sending' })
    const errors = await postFeedback(
      buildFeedback(manifest, manifestSha256, state.draft, new Date())
    )
    dispatch({ type: 'screen', screen: errors.length ? 'review' : 'sent', errors })
  }
  useKeyboard({ manifest, state, dispatch, submit })
  if (state.screen === 'sent')
    return (
      <p className="sent" data-testid="sent">
        Sent. The agent has your answers; you can close this tab.
      </p>
    )
  return (
    <>
      <Header manifest={manifest} state={state} hitTesting={hitTesting} />
      <div hidden={state.screen !== 'form'}>
        <Form manifest={manifest} state={state} dispatch={dispatch} onHitTesting={setHitTesting} />
      </div>
      {state.screen !== 'form' && (
        <ReviewScreen
          manifest={manifest}
          feedback={feedback}
          problems={[...problems, ...state.errors]}
          sending={state.screen === 'sending'}
          dispatch={dispatch}
          onSubmit={submit}
        />
      )}
    </>
  )
}
