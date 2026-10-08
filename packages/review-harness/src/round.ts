import type { Answer, Feedback, Manifest, Question, StoryVariant } from './schema.ts'

// Storybook drops URL arg keys and values outside these (docs: writing-stories/args).
const URL_SAFE_VALUE = /^[A-Za-z0-9 _-]*$/
const URL_SAFE_NUMBER = /^-?[0-9]+(\.[0-9]+)?$/
const URL_SAFE_KEY = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/

type ArgMap = Record<string, string | number | boolean>

export function questionScope(question: Question, manifest: Manifest): 'variant' | 'round' {
  if (question.scope) return question.scope
  if (question.kind !== 'pick-one' && question.kind !== 'pick-many') return 'round'
  const keys = new Set(manifest.variants.map((v) => v.key))
  return question.options.some((o) => keys.has(o)) ? 'variant' : 'round'
}

function encodeValue(value: string | number | boolean): string {
  return typeof value === 'boolean' ? `!${value}` : String(value)
}

function encodeArgMap(map: ArgMap): string {
  return Object.entries(map)
    .map(([k, v]) => `${k}:${encodeValue(v)}`)
    .join(';')
}

export function storyUrl(base: string, variant: StoryVariant): string {
  const params = new URLSearchParams({
    id: variant.storyId,
    viewMode: 'story',
    shortcuts: 'false',
    singleStory: 'true',
  })
  if (variant.args) params.set('args', encodeArgMap(variant.args))
  if (variant.globals) params.set('globals', encodeArgMap(variant.globals))
  return `${base.replace(/\/$/, '')}/iframe.html?${params.toString()}`
}

function argMapProblems(where: string, map: ArgMap | undefined): string[] {
  return Object.entries(map ?? {}).flatMap(([key, value]) => {
    const problems: string[] = []
    if (!URL_SAFE_KEY.test(key)) problems.push(`${where} key "${key}"`)
    const text = String(value)
    const safe =
      typeof value !== 'string' || URL_SAFE_VALUE.test(text) || URL_SAFE_NUMBER.test(text)
    if (!safe) problems.push(`${where}.${key} = "${text}"`)
    return problems
  })
}

/** Args Storybook would silently strip from the URL; each such variant needs its own story. */
export function urlParamProblems(manifest: Manifest): string[] {
  return manifest.variants.flatMap((v) => [
    ...argMapProblems(`variant ${v.key} args`, v.args),
    ...argMapProblems(`variant ${v.key} globals`, v.globals),
  ])
}

function revisionProblems(question: Question, answer: Answer): string[] {
  if (!answer.revisionRequested) return []
  if (question.kind !== 'pick-one')
    return [`${question.id}: only a pick-one can request a revision`]
  if (!offersBuiltInRevision(question) && question.revisionOption === undefined)
    return [`${question.id}: this question offers no revision request`]
  if (answer.pick !== undefined) return [`${question.id}: a revision request is not a pick`]
  if (!(answer.comment ?? '').trim()) return [`${question.id}: a revision request needs a comment`]
  return []
}

function answerProblems(question: Question, given: Answer | undefined, skipped: boolean) {
  if (!given) return question.required && !skipped ? [`${question.id}: required`] : []
  const answer = normalizeAnswer(question, given)
  const problems = revisionProblems(question, answer)
  if (question.kind === 'pick-one' && answer.pick !== undefined) {
    if (!question.options.includes(answer.pick)) problems.push(`${question.id}: unknown option`)
  }
  if (question.kind === 'pick-many') {
    const unknown = (answer.picks ?? []).filter((p) => !question.options.includes(p))
    if (unknown.length) problems.push(`${question.id}: unknown options ${unknown}`)
  }
  if (question.kind === 'scale' && answer.value !== undefined) {
    if (answer.value < question.min || answer.value > question.max)
      problems.push(`${question.id}: value out of range`)
  }
  if (question.required && !skipped && !isAnswered(question, answer))
    problems.push(`${question.id}: required`)
  return problems
}

/** A required pick-one gets the built-in revision option unless the author listed their own. */
export function offersBuiltInRevision(question: Question): boolean {
  return question.kind === 'pick-one' && question.required === true && !question.revisionOption
}

/**
 * The one reading of whether a pick-one answer requests a revision: the round's own
 * `revisionOption` sent as a pick means the same as the built-in request. The page, the
 * validator and the stored feedback all read answers through here.
 */
export function normalizeAnswer(question: Question, answer: Answer): Answer {
  if (question.kind !== 'pick-one' || question.revisionOption === undefined) return answer
  if (answer.pick !== question.revisionOption) return answer
  const { pick: _pick, ...rest } = answer
  return { ...rest, revisionRequested: true, ...(rest.recommendation ? { agreed: false } : {}) }
}

/** Feedback as it is stored: every answer read through `normalizeAnswer`. */
export function normalizeFeedback(feedback: Feedback, manifest: Manifest): Feedback {
  const questions = new Map(manifest.questions.map((q) => [q.id, q]))
  return {
    ...feedback,
    answers: feedback.answers.map((a) => {
      const question = questions.get(a.questionId)
      return question ? normalizeAnswer(question, a) : a
    }),
  }
}

export function isAnswered(question: Question, given: Answer): boolean {
  const answer = normalizeAnswer(question, given)
  if (question.kind === 'pick-one')
    return answer.pick !== undefined || answer.revisionRequested === true
  if (question.kind === 'pick-many') return (answer.picks ?? []).length > 0
  if (question.kind === 'scale') return answer.value !== undefined
  return (answer.text ?? '').trim() !== ''
}

/** A partial submit must list exactly the questions it left unanswered, in manifest order. */
function unansweredProblems(feedback: Feedback, manifest: Manifest): string[] {
  const listed = feedback.unansweredQuestionIds
  if (!listed) return []
  const answers = new Map(feedback.answers.map((a) => [a.questionId, a]))
  const actual = manifest.questions
    .filter((q) => {
      const answer = answers.get(q.id)
      return !answer || !isAnswered(q, answer)
    })
    .map((q) => q.id)
  return listed.join(',') === actual.join(',')
    ? []
    : [
        `unansweredQuestionIds lists ${listed.join(', ')}; unanswered are ${actual.join(', ') || 'none'}`,
      ]
}

/** Feedback that parses can still disagree with its manifest; list every disagreement. */
export function feedbackProblems(feedback: Feedback, manifest: Manifest): string[] {
  const answers = new Map(feedback.answers.map((a) => [a.questionId, a]))
  const skipped = new Set(feedback.unansweredQuestionIds)
  const questionIds = new Set(manifest.questions.map((q) => q.id))
  const variantKeys = feedback.variants.map((v) => v.key).join(',')
  return [
    ...(feedback.unit !== manifest.unit || feedback.round !== manifest.round
      ? ['unit or round does not match the manifest']
      : []),
    ...(variantKeys !== manifest.variants.map((v) => v.key).join(',')
      ? ['variants do not match the manifest']
      : []),
    ...feedback.answers
      .filter((a) => !questionIds.has(a.questionId))
      .map((a) => `${a.questionId}: unknown`),
    ...manifest.questions.flatMap((q) => answerProblems(q, answers.get(q.id), skipped.has(q.id))),
    ...unansweredProblems(feedback, manifest),
  ]
}
