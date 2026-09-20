import { emptyDraft, type ReviewDraft } from '../src/feedback.ts'
import { linksForVariant, optionVariants, orderedQuestions, roundLayout } from '../src/sections.ts'
import type { Annotation, Manifest, Verdict } from '../src/schema.ts'
import { loadDraft, type DraftStorage } from './draftStore.ts'

export { orderedQuestions }

export type Stop =
  | { kind: 'variant'; key: string }
  | { kind: 'question'; id: string }
  | { kind: 'general' }

export type Screen = 'form' | 'review' | 'sending' | 'sent'

export interface ReviewState {
  draft: ReviewDraft
  active: number
  /** The active stop was reached by keyboard navigation, so the page follows it. */
  follow: boolean
  annotate: boolean
  singleColumn: boolean
  screen: Screen
  errors: string[]
  focusPin: string | null
}

export type Action =
  | { type: 'activate'; index: number }
  | { type: 'advance' }
  | { type: 'verdict'; key: string; verdict: Verdict }
  | { type: 'variantComment'; key: string; comment: string }
  | { type: 'addPin'; key: string; pin: Omit<Annotation, 'id' | 'note'> }
  | { type: 'pinNote'; key: string; id: string; note: string }
  | { type: 'removePin'; key: string; id: string }
  | { type: 'pick'; id: string; option: string; many: boolean }
  | { type: 'value'; id: string; value: number }
  | { type: 'text'; id: string; text: string }
  | { type: 'answerComment'; id: string; comment: string }
  | { type: 'general'; text: string }
  | { type: 'toggleAnnotate' }
  | { type: 'toggleColumns' }
  | { type: 'screen'; screen: Screen; errors?: string[] }

export const VERDICT_KEYS: Record<string, Verdict> = {
  '1': 'chosen',
  '2': 'rejected',
  '3': 'maybe',
  '0': null,
}

/** Every stop in the order the page renders it: per section, its questions then its frames. */
export function stopsFor(manifest: Manifest): Stop[] {
  const layout = roundLayout(manifest)
  return [
    ...layout.sections.flatMap((s): Stop[] => [
      ...s.questions.map((q): Stop => ({ kind: 'question', id: q.id })),
      ...s.variants.map((v): Stop => ({ kind: 'variant', key: v.key })),
    ]),
    ...layout.otherVariants.map((v): Stop => ({ kind: 'variant', key: v.key })),
    ...layout.overallQuestions.map((q): Stop => ({ kind: 'question', id: q.id })),
    { kind: 'general' },
  ]
}

/** Where each stop sits in that order, so every block knows its own index. */
export function stopIndexes(manifest: Manifest) {
  const stops = stopsFor(manifest)
  const at = (match: (s: Stop) => boolean) => stops.findIndex(match)
  return {
    variant: (key: string) => at((s) => s.kind === 'variant' && s.key === key),
    question: (id: string) => at((s) => s.kind === 'question' && s.id === id),
    general: stops.length - 1,
  }
}

export function initialState(manifest: Manifest): ReviewState {
  return {
    draft: emptyDraft(manifest),
    active: 0,
    follow: true,
    annotate: false,
    singleColumn: false,
    screen: 'form',
    errors: [],
    focusPin: null,
  }
}

/** The fresh state, carrying the unsent draft a reload of this same manifest left behind. */
export function restoredState(
  manifest: Manifest,
  manifestSha256: string,
  storage: DraftStorage | null
): ReviewState {
  const state = initialState(manifest)
  const draft = loadDraft(storage, manifest, manifestSha256)
  return draft ? { ...state, draft } : state
}

function nextPinId(key: string, pins: Annotation[]): string {
  const taken = pins.map((p) => Number(p.id.split('-').pop()) || 0)
  return `${key}-${Math.max(0, ...taken) + 1}`
}

function updateVariant(
  draft: ReviewDraft,
  key: string,
  change: (v: ReviewDraft['variants'][string]) => Partial<ReviewDraft['variants'][string]>
): ReviewDraft {
  const current = draft.variants[key]
  return { ...draft, variants: { ...draft.variants, [key]: { ...current, ...change(current) } } }
}

function updateAnswer(
  draft: ReviewDraft,
  id: string,
  change: (a: ReviewDraft['answers'][string]) => Partial<ReviewDraft['answers'][string]>
): ReviewDraft {
  const current = draft.answers[id]
  return { ...draft, answers: { ...draft.answers, [id]: { ...current, ...change(current) } } }
}

function togglePick(picks: string[] | undefined, option: string): string[] {
  const list = picks ?? []
  return list.includes(option) ? list.filter((p) => p !== option) : [...list, option]
}

function reduceVariant(draft: ReviewDraft, action: Action): ReviewDraft {
  switch (action.type) {
    case 'verdict':
      return updateVariant(draft, action.key, () => ({ verdict: action.verdict }))
    case 'variantComment':
      return updateVariant(draft, action.key, () => ({ comment: action.comment }))
    case 'pinNote':
      return updateVariant(draft, action.key, (v) => ({
        annotations: v.annotations.map((p) =>
          p.id === action.id ? { ...p, note: action.note } : p
        ),
      }))
    case 'removePin':
      return updateVariant(draft, action.key, (v) => ({
        annotations: v.annotations.filter((p) => p.id !== action.id),
      }))
    default:
      return draft
  }
}

function setVerdict(draft: ReviewDraft, key: string, verdict: Verdict): ReviewDraft {
  return draft.variants[key] ? updateVariant(draft, key, () => ({ verdict })) : draft
}

/** A pick on a mapped question also sets its frame's verdict; the others stop being chosen. */
function linkPick(
  manifest: Manifest,
  draft: ReviewDraft,
  action: Extract<Action, { type: 'pick' }>
): ReviewDraft {
  const question = manifest.questions.find((q) => q.id === action.id)
  const map = question ? optionVariants(manifest, question) : new Map<string, string>()
  const key = map.get(action.option)
  if (!key) return draft
  const answer = draft.answers[action.id] ?? { comment: '' }
  const on = action.many
    ? (answer.picks ?? []).includes(action.option)
    : answer.pick === action.option
  const cleared = action.many
    ? draft
    : [...map].reduce(
        (d, [option, other]) =>
          option !== action.option && d.variants[other]?.verdict === 'chosen'
            ? setVerdict(d, other, null)
            : d,
        draft
      )
  if (on) return setVerdict(cleared, key, 'chosen')
  return cleared.variants[key]?.verdict === 'chosen' ? setVerdict(cleared, key, null) : cleared
}

/** Choosing a frame answers the question it stands for; un-choosing clears that pick. */
function linkVerdict(
  manifest: Manifest,
  draft: ReviewDraft,
  action: Extract<Action, { type: 'verdict' }>
): ReviewDraft {
  return linksForVariant(manifest, action.key).reduce((d, { question, option }) => {
    const many = question.kind === 'pick-many'
    const answer = d.answers[question.id] ?? { comment: '' }
    if (action.verdict === 'chosen')
      return many
        ? updateAnswer(d, question.id, (a) => ({
            picks: (a.picks ?? []).includes(option) ? a.picks : [...(a.picks ?? []), option],
          }))
        : updateAnswer(d, question.id, () => ({ pick: option }))
    if (many)
      return updateAnswer(d, question.id, (a) => ({
        picks: (a.picks ?? []).filter((p) => p !== option),
      }))
    return answer.pick === option ? updateAnswer(d, question.id, () => ({ pick: undefined })) : d
  }, draft)
}

function reduceAnswer(draft: ReviewDraft, action: Action): ReviewDraft {
  switch (action.type) {
    case 'pick':
      return updateAnswer(draft, action.id, (a) =>
        action.many
          ? { picks: togglePick(a.picks, action.option) }
          : { pick: a.pick === action.option ? undefined : action.option }
      )
    case 'value':
      return updateAnswer(draft, action.id, () => ({ value: action.value }))
    case 'text':
      return updateAnswer(draft, action.id, () => ({ text: action.text }))
    case 'answerComment':
      return updateAnswer(draft, action.id, () => ({ comment: action.comment }))
    case 'general':
      return { ...draft, general: action.text }
    default:
      return reduceVariant(draft, action)
  }
}

function addPin(state: ReviewState, action: Extract<Action, { type: 'addPin' }>): ReviewState {
  const pins = state.draft.variants[action.key].annotations
  const pin: Annotation = { ...action.pin, id: nextPinId(action.key, pins), note: '' }
  const draft = updateVariant(state.draft, action.key, () => ({ annotations: [...pins, pin] }))
  return { ...state, draft, focusPin: pin.id }
}

/** Keeps a pick and the verdict of the frame it stands for in step, in one action. */
function reduceLinked(manifest: Manifest, draft: ReviewDraft, action: Action): ReviewDraft {
  const next = reduceAnswer(draft, action)
  if (action.type === 'pick') return linkPick(manifest, next, action)
  if (action.type === 'verdict') return linkVerdict(manifest, next, action)
  return next
}

export function createReducer(manifest: Manifest) {
  const stopCount = stopsFor(manifest).length
  return function reduce(state: ReviewState, action: Action): ReviewState {
    switch (action.type) {
      case 'activate':
        return { ...state, active: action.index, follow: false, focusPin: null }
      case 'advance':
        return state.active + 1 < stopCount
          ? { ...state, active: state.active + 1, follow: true, focusPin: null }
          : { ...state, screen: 'review', errors: [] }
      case 'addPin':
        return addPin(state, action)
      case 'toggleAnnotate':
        return { ...state, annotate: !state.annotate }
      case 'toggleColumns':
        return { ...state, singleColumn: !state.singleColumn }
      case 'screen':
        return { ...state, screen: action.screen, errors: action.errors ?? [] }
      default:
        return { ...state, draft: reduceLinked(manifest, state.draft, action) }
    }
  }
}

/** What a number key means at the active stop: a verdict, an option, or a scale value. */
export function numberKeyAction(manifest: Manifest, stop: Stop, digit: string): Action | null {
  if (stop.kind === 'variant')
    return digit in VERDICT_KEYS
      ? { type: 'verdict', key: stop.key, verdict: VERDICT_KEYS[digit] }
      : null
  if (stop.kind !== 'question') return null
  const question = manifest.questions.find((q) => q.id === stop.id)
  const n = Number(digit)
  if (question?.kind === 'scale')
    return n >= question.min && n <= question.max
      ? { type: 'value', id: question.id, value: n }
      : null
  if (question?.kind !== 'pick-one' && question?.kind !== 'pick-many') return null
  const option = question.options[n - 1]
  return option === undefined
    ? null
    : { type: 'pick', id: question.id, option, many: question.kind === 'pick-many' }
}
