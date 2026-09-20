import { useEffect, useMemo, useReducer, useState, type Dispatch } from 'react'
import { buildFeedback } from '../src/feedback.ts'
import { feedbackProblems } from '../src/round.ts'
import { roundLayout, type ResolvedSection } from '../src/sections.ts'
import type { Manifest, Question, Variant } from '../src/schema.ts'
import { QuestionBlock } from './QuestionBlock.tsx'
import { ReviewScreen } from './ReviewScreen.tsx'
import { browserStorage, clearDraft, saveDraft, type DraftStorage } from './draftStore.ts'
import {
  createReducer,
  orderedQuestions,
  restoredState,
  stopIndexes,
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
      {manifest.sections ? (
        <ol className="prompts">
          {manifest.sections.map((s) => (
            <li key={s.id}>
              <a href={`#section-${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="prompts">
          {orderedQuestions(manifest).map((q) => (
            <li key={q.id}>{q.prompt}</li>
          ))}
        </ol>
      )}
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

interface PartProps {
  manifest: Manifest
  state: ReviewState
  dispatch: Dispatch<Action>
  onHitTesting: (on: boolean) => void
  indexes: ReturnType<typeof stopIndexes>
}

function Variants({ variants, ...props }: PartProps & { variants: Variant[] }) {
  const { manifest, state, dispatch, indexes } = props
  return (
    <div
      className={state.singleColumn ? 'variants single' : 'variants'}
      data-annotating={state.annotate || undefined}
    >
      {variants.map((v) => (
        <VariantCard
          key={v.key}
          manifest={manifest}
          variant={v}
          draft={state.draft.variants[v.key]}
          index={indexes.variant(v.key)}
          active={state.active === indexes.variant(v.key)}
          follow={state.follow}
          annotate={state.annotate}
          focusPin={state.focusPin}
          dispatch={dispatch}
          onHitTesting={props.onHitTesting}
        />
      ))}
    </div>
  )
}

function Questions({ questions, ...props }: PartProps & { questions: Question[] }) {
  const { manifest, state, dispatch, indexes } = props
  return (
    <>
      {questions.map((q) => (
        <QuestionBlock
          key={q.id}
          manifest={manifest}
          question={q}
          draft={state.draft.answers[q.id]}
          index={indexes.question(q.id)}
          active={state.active === indexes.question(q.id)}
          follow={state.follow}
          dispatch={dispatch}
        />
      ))}
    </>
  )
}

/** The question(s) first, then the frames they are asked about. */
function SectionBlock({ section, ...props }: PartProps & { section: ResolvedSection }) {
  return (
    <section
      className="round-section"
      id={`section-${section.id}`}
      data-testid={`section-${section.id}`}
    >
      <header className="section-head">
        <h2>{section.title}</h2>
        {section.context && <p>{section.context}</p>}
        {section.seeAlso.length > 0 && (
          <p className="see-also">
            See also{' '}
            {section.seeAlso.map((v) => (
              <a key={v.key} href={`#variant-${v.key}`}>
                {v.key} · {v.label}
              </a>
            ))}
          </p>
        )}
      </header>
      <Questions {...props} questions={section.questions} />
      <Variants {...props} variants={section.variants} />
    </section>
  )
}

function Form(props: Omit<PartProps, 'indexes'>) {
  const { manifest, state, dispatch } = props
  const layout = roundLayout(manifest)
  const indexes = stopIndexes(manifest)
  const parts = { ...props, indexes }
  return (
    <main>
      {layout.sections.map((s) => (
        <SectionBlock key={s.id} {...parts} section={s} />
      ))}
      {layout.otherVariants.length > 0 &&
        (layout.sections.length === 0 ? (
          <Variants {...parts} variants={layout.otherVariants} />
        ) : (
          <section className="round-section" data-testid="other-frames">
            <header className="section-head">
              <h2>Other frames</h2>
            </header>
            <Variants {...parts} variants={layout.otherVariants} />
          </section>
        ))}
      {layout.sections.length > 0 && layout.overallQuestions.length > 0 && (
        <header className="section-head" data-testid="overall">
          <h2>Overall</h2>
        </header>
      )}
      <Questions {...parts} questions={layout.overallQuestions} />
      <GeneralBlock index={indexes.general} state={state} dispatch={dispatch} />
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

/** Keeps the unsent draft across a reload; a sent round leaves nothing behind. */
function useDraftBackup(storage: DraftStorage | null, manifestSha256: string, state: ReviewState) {
  const { draft, screen } = state
  useEffect(() => {
    if (screen === 'sent') clearDraft(storage, manifestSha256)
    else saveDraft(storage, manifestSha256, draft)
  }, [storage, manifestSha256, draft, screen])
}

export function App({ manifest, manifestSha256 }: AppProps) {
  const reducer = useMemo(() => createReducer(manifest), [manifest])
  const storage = useMemo(() => browserStorage(), [])
  const [state, dispatch] = useReducer(reducer, manifest, (m) =>
    restoredState(m, manifestSha256, storage)
  )
  useDraftBackup(storage, manifestSha256, state)
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
