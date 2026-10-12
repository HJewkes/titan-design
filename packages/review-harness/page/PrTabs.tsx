import type { Dispatch, ReactNode } from 'react'
import { blockedShipGroup, draftShipBlocks, type ReviewDraft } from '../src/feedback.ts'
import {
  PR_TABS,
  PR_TAB_LABEL,
  baseImageKey,
  diffFrames,
  hasContext,
  shipQuestionOf,
  tabBadges,
  type PrTab,
  type TabBadges,
} from '../src/pr-tabs.ts'
import { frameSizing } from '../src/sections.ts'
import {
  isStoryVariant,
  type Manifest,
  type PrGroup,
  type PrGroupShipStatus,
  type Variant,
} from '@titan-design/review-schema'
import { Frame } from './Frame.tsx'
import { Markdown } from './Markdown.tsx'
import type { Action, ReviewState, stopIndexes } from './state.ts'

type Indexes = ReturnType<typeof stopIndexes>

interface PrPageProps {
  manifest: Manifest
  group: PrGroup
  state: ReviewState
  dispatch: Dispatch<Action>
  indexes: Indexes
  /** The Review tab's body: the group's sections, every question under its frames. */
  review: ReactNode
}

const short = (sha: string) => sha.slice(0, 7)
const noop = () => undefined
const counted = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function PrHeader({ group }: { group: PrGroup }) {
  return (
    <header className="pr-head" data-testid={`pr-head-${group.pr}`}>
      <h2>
        {group.pr}
        {group.title && <span className="pr-title"> {group.title}</span>}
      </h2>
      <p className="pr-meta">
        head <code title={group.headSha}>{short(group.headSha)}</code>
        {group.kind && <span className="pr-kind">{group.kind}</span>}
      </p>
    </header>
  )
}

interface BadgeProps {
  count: number
  one: string
  many: string
  tone: string
}

function Badge({ count, one, many, tone }: BadgeProps) {
  if (count === 0) return null
  const text = counted(count, one, many)
  return (
    <span className={`tab-badge tab-badge-${tone}`} aria-label={text}>
      {text}
    </span>
  )
}

function badgesFor(tab: PrTab, badges: TabBadges): ReactNode {
  if (tab === 'review')
    return (
      <>
        <Badge count={badges.open} one="open" many="open" tone="open" />
        <Badge count={badges.changes} one="change" many="changes" tone="changes" />
      </>
    )
  return tab === 'diff' ? (
    <Badge count={badges.frames} one="frame" many="frames" tone="count" />
  ) : null
}

function TabList({
  tab,
  badges,
  dispatch,
}: Pick<PrPageProps, 'dispatch'> & { tab: PrTab; badges: TabBadges }) {
  return (
    <div className="pr-tabs" role="tablist" aria-label="PR views">
      {PR_TABS.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          id={`tab-${t}`}
          aria-selected={tab === t}
          aria-controls={`tabpanel-${t}`}
          data-testid={`tab-${t}`}
          onClick={() => dispatch({ type: 'tab', tab: t })}
        >
          {PR_TAB_LABEL[t]} {badgesFor(t, badges)}
        </button>
      ))}
    </div>
  )
}

function QuestionLink({
  id,
  indexes,
  dispatch,
  children,
}: Pick<PrPageProps, 'indexes' | 'dispatch'> & { id: string; children: ReactNode }) {
  return (
    <a
      href={`#question-${id}`}
      onClick={(e) => {
        e.preventDefault()
        dispatch({ type: 'jump', index: indexes.question(id) })
      }}
    >
      {children}
    </a>
  )
}

function ShipStatusText({
  status,
  ...links
}: Pick<PrPageProps, 'indexes' | 'dispatch'> & { status?: PrGroupShipStatus }) {
  if (status?.blocked)
    return (
      <div className="ship-requests" data-testid="ship-requests">
        <p>
          <strong>Ship withheld.</strong>{' '}
          {counted(
            new Set(status.blockers.map((b) => b.questionId)).size,
            'open change request',
            'open change requests'
          )}
          :
        </p>
        <ul>
          {status.blockers.map((b) => (
            <li key={`${b.questionId}-${b.kind}`}>
              <QuestionLink {...links} id={b.questionId}>
                {b.message}
              </QuestionLink>
            </li>
          ))}
        </ul>
      </div>
    )
  const open = status?.unansweredQuestionIds.length ?? 0
  return (
    <p className="ship-ready" data-testid="ship-ready">
      <strong>Ship enabled.</strong> Nothing on this PR requests a change
      {open === 0
        ? '.'
        : `; ${counted(open, 'question is', 'questions are')} still open, which never blocks Ship.`}
    </p>
  )
}

/** Under every tab: the PR's Ship, and every open change request with a link to it. */
function ShipBar({ manifest, group, state, dispatch, indexes }: Omit<PrPageProps, 'review'>) {
  const question = shipQuestionOf(manifest, group)
  const status = draftShipBlocks(manifest, state.draft).find((g) => g.pr === group.pr)
  const picked = question ? state.draft.answers[question.id]?.pick : undefined
  return (
    <aside className="ship-bar" aria-label={`Ship ${group.pr}`} data-testid="ship-bar">
      <ShipStatusText status={status} indexes={indexes} dispatch={dispatch} />
      {question && (
        <div
          className="ship-choices"
          role="radiogroup"
          aria-label={`Ship ${group.pr} at ${short(group.headSha)}`}
        >
          {question.options.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={picked === o}
              className="choice"
              data-testid={`ship-bar-${o}`}
              disabled={shipDisabled(manifest, state.draft, question, o)}
              onClick={() => dispatch({ type: 'pick', id: question.id, option: o, many: false })}
            >
              {o}
            </button>
          ))}
          <QuestionLink id={question.id} indexes={indexes} dispatch={dispatch}>
            Comment on Ship
          </QuestionLink>
        </div>
      )}
    </aside>
  )
}

function shipDisabled(
  manifest: Manifest,
  draft: ReviewDraft,
  question: NonNullable<ReturnType<typeof shipQuestionOf>>,
  option: string
): boolean {
  return blockedShipGroup(manifest, draft, question, option) !== null
}

function FramePane({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="diff-pane">
      <figcaption>{title}</figcaption>
      {children}
    </figure>
  )
}

function Missing({ text }: { text: string }) {
  return <p className="diff-missing">{text}</p>
}

function HeadPane({ manifest, variant }: { manifest: Manifest; variant: Variant }) {
  if (variant.change === 'removed') return <Missing text="Removed at head" />
  if (!isStoryVariant(variant))
    return (
      <img src={`api/image/${encodeURIComponent(variant.key)}`} alt={`${variant.label} at head`} />
    )
  const sizing = frameSizing(manifest, variant)
  return (
    <Frame
      variant={variant}
      width={manifest.widths[0]}
      height={sizing.height}
      maxHeight={sizing.maxHeight}
      annotate={false}
      pins={[]}
      onPin={noop}
      onHitTesting={noop}
    />
  )
}

function BasePane({ variant }: { variant: Variant }) {
  if (variant.baseImage)
    return <img src={`api/image/${baseImageKey(variant.key)}`} alt={`${variant.label} at base`} />
  return (
    <Missing
      text={variant.change === 'new' ? 'New at head: not on base' : 'No base render in this round'}
    />
  )
}

function DiffRow({
  manifest,
  variant,
  indexes,
  dispatch,
}: Pick<PrPageProps, 'manifest' | 'indexes' | 'dispatch'> & { variant: Variant }) {
  return (
    <article className="diff-row" data-testid={`diff-${variant.key}`}>
      <header className="diff-row-head">
        <h3>
          <span className="key">{variant.key}</span> {variant.label}
        </h3>
        {variant.change && (
          <span className={`diff-change diff-change-${variant.change}`}>{variant.change}</span>
        )}
        <a
          href={`#variant-${variant.key}`}
          onClick={(e) => {
            e.preventDefault()
            dispatch({ type: 'jump', index: indexes.variant(variant.key) })
          }}
        >
          Its Review block
        </a>
      </header>
      <div className="diff-panes">
        <FramePane title="Base">
          <BasePane variant={variant} />
        </FramePane>
        <FramePane title="Head">
          <HeadPane manifest={manifest} variant={variant} />
        </FramePane>
      </div>
    </article>
  )
}

/** Read-only base beside head; every question is asked in Review, never here. */
function DiffTab(props: Pick<PrPageProps, 'manifest' | 'group' | 'indexes' | 'dispatch'>) {
  const frames = diffFrames(props.manifest, props.group)
  if (frames.length === 0)
    return <p className="tab-empty">This round has no base-vs-head frames for {props.group.pr}.</p>
  return (
    <>
      <p className="tab-note">Read-only. Answer in Review: each frame links to its block there.</p>
      {frames.map((v) => (
        <DiffRow key={v.key} {...props} variant={v} />
      ))}
    </>
  )
}

function ContextPart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="context-part">
      <h3>{label}</h3>
      {children}
    </section>
  )
}

function ContextTab({ group }: { group: PrGroup }) {
  if (!hasContext(group))
    return <p className="tab-empty">This round carries no context for {group.pr}.</p>
  const { description, task, codewatch, files } = group
  return (
    <>
      {description && (
        <ContextPart label="Description">
          <Markdown>{description}</Markdown>
        </ContextPart>
      )}
      {task && (
        <ContextPart label={`Task ${task.id}${task.title ? `: ${task.title}` : ''}`}>
          {task.doneWhen && (
            <>
              <p className="context-label">Done when</p>
              <Markdown>{task.doneWhen}</Markdown>
            </>
          )}
        </ContextPart>
      )}
      {codewatch && (
        <ContextPart label="Codewatch report">
          <Markdown>{codewatch}</Markdown>
        </ContextPart>
      )}
      {files?.length ? (
        <ContextPart label={`Files changed (${files.length})`}>
          <ul className="context-files">
            {files.map((f) => (
              <li key={f.path}>
                <code>{f.path}</code>
                {f.status && <span className="context-file-status"> {f.status}</span>}
              </li>
            ))}
          </ul>
        </ContextPart>
      ) : null}
    </>
  )
}

/** One PR group's page: header, tabs, the open tab's body, and the Ship bar under all of them. */
export function PrPage(props: PrPageProps) {
  const { manifest, group, state, dispatch } = props
  const status = draftShipBlocks(manifest, state.draft).find((g) => g.pr === group.pr)
  const tab = state.tab
  return (
    <div className="pr-page" data-testid={`pr-page-${group.pr}`}>
      <PrHeader group={group} />
      <TabList tab={tab} badges={tabBadges(manifest, group, status)} dispatch={dispatch} />
      <div
        role="tabpanel"
        id="tabpanel-review"
        aria-labelledby="tab-review"
        hidden={tab !== 'review'}
      >
        {props.review}
      </div>
      {tab === 'diff' && (
        <div
          role="tabpanel"
          id="tabpanel-diff"
          aria-labelledby="tab-diff"
          data-testid="tabpanel-diff"
        >
          <DiffTab {...props} />
        </div>
      )}
      {tab === 'context' && (
        <div
          role="tabpanel"
          id="tabpanel-context"
          aria-labelledby="tab-context"
          data-testid="tabpanel-context"
        >
          <ContextTab group={group} />
        </div>
      )}
      <ShipBar {...props} />
    </div>
  )
}
