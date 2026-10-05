import {
  useLayoutEffect,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { buildFeedback, pendingQuestionIds } from '../src/feedback.ts'
import { feedbackProblems } from '../src/round.ts'
import { roundLayout, type ResolvedSection } from '../src/sections.ts'
import type { Manifest, Question, StripKind, Variant } from '../src/schema.ts'
import { Markdown } from './Markdown.tsx'
import { QuestionBlock } from './QuestionBlock.tsx'
import { ReviewScreen } from './ReviewScreen.tsx'
import { browserStorage, clearDraft, saveDraft, type DraftStorage } from './draftStore.ts'
import {
  OTHER_PAGE,
  OVERALL_PAGE,
  createReducer,
  orderedQuestions,
  pageOf,
  pagesFor,
  restoredState,
  stopIndexes,
  type Action,
  type Page,
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

/** A link that pages to a stop instead of scrolling, since other sections are not rendered. */
function JumpLink({
  href,
  index,
  dispatch,
  children,
}: {
  href: string
  index: number
  dispatch: Dispatch<Action>
  children: ReactNode
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        dispatch({ type: 'jump', index })
      }}
    >
      {children}
    </a>
  )
}

function Header({
  manifest,
  state,
  dispatch,
  hitTesting,
}: {
  manifest: Manifest
  state: ReviewState
  dispatch: Dispatch<Action>
  hitTesting: boolean | null
}) {
  const pages = pagesFor(manifest)
  const current = pageOf(pages, state.active)
  return (
    <header className="page-head">
      <h1>
        {manifest.unit} <span>round {manifest.round}</span>
      </h1>
      {manifest.context && <Markdown>{manifest.context}</Markdown>}
      {manifest.sections && <Pager pages={pages} current={current} dispatch={dispatch} />}
      {manifest.sections ? (
        <ol className="prompts sections">
          {pages.map((p, i) => (
            <li key={p.id} aria-current={i === current ? 'step' : undefined}>
              <JumpLink href={`#section-${p.id}`} index={p.first} dispatch={dispatch}>
                {p.title}
              </JumpLink>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="prompts">
          {orderedQuestions(manifest).map((q) => (
            <li key={q.id}>
              <Markdown inline>{q.prompt}</Markdown>
            </li>
          ))}
        </ol>
      )}
      <p className="keys">
        <kbd>1</kbd>-<kbd>9</kbd> pick · <kbd>Tab</kbd> comment · <kbd>Enter</kbd> next ·{' '}
        <kbd>a</kbd> pins {state.annotate ? 'ON' : 'off'} · <kbd>l</kbd> layout ·{' '}
        {manifest.sections && (
          <>
            <kbd>[</kbd> <kbd>]</kbd> section ·{' '}
          </>
        )}
        <kbd>⌘ Enter</kbd> review and send
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
  if (variants.length === 0) return null
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
        {section.seeAlso.length > 0 && (
          <p className="see-also">
            See also{' '}
            {section.seeAlso.map((v) => (
              <JumpLink
                key={v.key}
                href={`#variant-${v.key}`}
                index={props.indexes.variant(v.key)}
                dispatch={props.dispatch}
              >
                {v.key} · {v.label}
              </JumpLink>
            ))}
          </p>
        )}
      </header>
      <SectionText part="deciding" label="Deciding" text={section.deciding} />
      <SectionText part="changed" label="Changed since last approved" text={section.changed} />
      <SectionText part="context" label="Context only, not under review" text={section.context} />
      <Questions {...props} questions={section.questions} />
      {section.kind && (
        <p className="strip-kind" data-testid={`strip-kind-${section.id}`}>
          {STRIP_KIND_LABEL[section.kind]}
        </p>
      )}
      <Variants {...props} variants={section.variants} />
    </section>
  )
}

const STRIP_KIND_LABEL: Record<StripKind, string> = {
  CHOICE: 'Choice: these frames differ only in what is being decided',
  STATES: 'States: one design in several states; nothing to choose between',
}

interface SectionTextProps {
  part: 'deciding' | 'changed' | 'context'
  label: string
  text?: string
}

/** One of a section's three texts, labelled so a decision never reads as background. */
function SectionText({ part, label, text }: SectionTextProps) {
  if (!text) return null
  return (
    <div className={`section-text section-${part}`} data-testid={`section-${part}`}>
      <p className="section-text-label">{label}</p>
      <Markdown>{text}</Markdown>
    </div>
  )
}

interface PagerProps {
  pages: Page[]
  current: number
  dispatch: Dispatch<Action>
  /** The pager closing a section, whose Next takes focus when the section opens. */
  end?: boolean
}

/** Previous and next section, with where the human is in the round. */
function Pager({ pages, current, dispatch, end = false }: PagerProps) {
  const step = (delta: number) => pages[current + delta]
  const nextRef = useFocusOnPageEntry(pages[current].id, end)
  const suffix = end ? '-end' : ''
  return (
    <nav
      className={end ? 'pager pager-end' : 'pager'}
      aria-label={end ? 'Section end' : 'Sections'}
      data-testid={`pager${suffix}`}
    >
      <button
        type="button"
        disabled={!step(-1)}
        onClick={() => dispatch({ type: 'jump', index: step(-1).first })}
      >
        <kbd>[</kbd> Previous
      </button>
      <span data-testid={`page-position${suffix}`}>
        Section {current + 1} of {pages.length}: {pages[current].title}
      </span>
      <button
        ref={nextRef}
        type="button"
        className={end && step(1) ? 'primary' : undefined}
        disabled={!step(1)}
        onClick={() => dispatch({ type: 'jump', index: step(1).first })}
      >
        Next <kbd>]</kbd>
      </button>
    </nav>
  )
}

/**
 * Moving on is the default once a page opens: focus goes to its closing Next (or, on the last
 * page, to Review answers), so finishing a section never looks like finishing the round.
 */
function useFocusOnPageEntry(pageId: string, enabled: boolean) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (enabled && !ref.current?.disabled) ref.current?.focus({ preventScroll: true })
  }, [pageId, enabled])
  return ref
}

/** A page change mounts new stops, which do not scroll themselves on mount; bring the active one up. */
function useScrollOnPageChange(pageId: string, isFirstStop: boolean) {
  const shown = useRef(pageId)
  useEffect(() => {
    if (shown.current === pageId) return
    shown.current = pageId
    if (isFirstStop) window.scrollTo({ top: 0 })
    else document.querySelector('.stop[data-active]')?.scrollIntoView({ block: 'start' })
  }, [pageId, isFirstStop])
}

type Layout = ReturnType<typeof roundLayout>

function OtherFrames({ layout, ...parts }: PartProps & { layout: Layout }) {
  if (layout.otherVariants.length === 0) return null
  if (layout.sections.length === 0) return <Variants {...parts} variants={layout.otherVariants} />
  return (
    <section className="round-section" data-testid="other-frames">
      <header className="section-head">
        <h2>Other frames</h2>
      </header>
      <Variants {...parts} variants={layout.otherVariants} />
    </section>
  )
}

function Overall({ layout, ...parts }: PartProps & { layout: Layout }) {
  return (
    <>
      {layout.sections.length > 0 && layout.overallQuestions.length > 0 && (
        <header className="section-head" data-testid="overall">
          <h2>Overall</h2>
        </header>
      )}
      <Questions {...parts} questions={layout.overallQuestions} />
      <GeneralBlock index={parts.indexes.general} state={parts.state} dispatch={parts.dispatch} />
    </>
  )
}

/** A sectioned round shows one page (section) at a time; an unsectioned one shows everything. */
export function Form(props: Omit<PartProps, 'indexes'>) {
  const { manifest, state, dispatch } = props
  const layout = roundLayout(manifest)
  const pages = pagesFor(manifest)
  const current = pageOf(pages, state.active)
  const page = pages[current]
  useScrollOnPageChange(page.id, state.active === page.first)
  const paged = layout.sections.length > 0
  const shows = (id: string) => !paged || page.id === id
  const parts = { ...props, indexes: stopIndexes(manifest), layout }
  const last = current === pages.length - 1
  const reviewRef = useFocusOnPageEntry(page.id, paged && last)
  return (
    <main>
      {layout.sections
        .filter((s) => shows(s.id))
        .map((s) => (
          <SectionBlock key={s.id} {...parts} section={s} />
        ))}
      {shows(OTHER_PAGE) && <OtherFrames {...parts} />}
      {shows(OVERALL_PAGE) && <Overall {...parts} />}
      {paged && <Pager pages={pages} current={current} dispatch={dispatch} end />}
      <button
        ref={reviewRef}
        type="button"
        className={!paged || last ? 'primary' : undefined}
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

function ContrastOverrideBanner({ reason }: { reason: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const banner = ref.current
    if (!banner) return
    const root = document.documentElement
    const publish = () =>
      root.style.setProperty('--contrast-banner-height', `${banner.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(banner)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--contrast-banner-height')
    }
  }, [])
  return (
    <p ref={ref} className="contrast-override" role="alert" data-testid="contrast-override">
      Contrast was not gated for this round: {reason}
    </p>
  )
}

export function App({ manifest, manifestSha256 }: AppProps) {
  const reducer = useMemo(() => createReducer(manifest), [manifest])
  const storage = useMemo(() => browserStorage(), [])
  const [state, dispatch] = useReducer(reducer, manifest, (m) =>
    restoredState(m, manifestSha256, storage)
  )
  useDraftBackup(storage, manifestSha256, state)
  const [hitTesting, setHitTesting] = useState<boolean | null>(null)
  const unanswered = pendingQuestionIds(manifest, state.draft)
  const partial = unanswered.length > 0
  const feedback = buildFeedback(manifest, manifestSha256, state.draft, new Date(), partial)
  const problems = feedbackProblems(feedback, manifest)
  const submit = async () => {
    if (state.screen !== 'review' || problems.length) return
    dispatch({ type: 'screen', screen: 'sending' })
    const errors = await postFeedback(
      buildFeedback(manifest, manifestSha256, state.draft, new Date(), partial)
    )
    dispatch({ type: 'screen', screen: errors.length ? 'review' : 'sent', errors })
  }
  // Cmd+Enter sends only a complete round; a partial one takes the explicit Send partial click.
  const submitByKey = () => (partial ? undefined : submit())
  useKeyboard({ manifest, state, dispatch, submit: submitByKey })
  if (state.screen === 'sent')
    return (
      <p className="sent" data-testid="sent">
        Sent. The agent has your answers; you can close this tab.
      </p>
    )
  return (
    <>
      {manifest.contrastOverride && (
        <ContrastOverrideBanner reason={manifest.contrastOverride.reason} />
      )}
      <Header manifest={manifest} state={state} dispatch={dispatch} hitTesting={hitTesting} />
      <div hidden={state.screen !== 'form'}>
        <Form manifest={manifest} state={state} dispatch={dispatch} onHitTesting={setHitTesting} />
      </div>
      {state.screen !== 'form' && (
        <ReviewScreen
          manifest={manifest}
          feedback={feedback}
          problems={[...problems, ...state.errors]}
          unanswered={unanswered}
          sending={state.screen === 'sending'}
          dispatch={dispatch}
          onSubmit={submit}
        />
      )}
    </>
  )
}
