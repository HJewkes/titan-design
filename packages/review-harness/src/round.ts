import type { Feedback, Manifest, Question, Variant } from './schema.ts'

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

export function storyUrl(base: string, variant: Variant): string {
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

function answerProblems(question: Question, answer: Feedback['answers'][number] | undefined) {
  if (!answer) return question.required ? [`${question.id}: required`] : []
  const problems: string[] = []
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
  if (question.required && !isAnswered(question, answer)) problems.push(`${question.id}: required`)
  return problems
}

export function isAnswered(question: Question, answer: Feedback['answers'][number]): boolean {
  if (question.kind === 'pick-one') return answer.pick !== undefined
  if (question.kind === 'pick-many') return (answer.picks ?? []).length > 0
  if (question.kind === 'scale') return answer.value !== undefined
  return (answer.text ?? '').trim() !== ''
}

/** Feedback that parses can still disagree with its manifest; list every disagreement. */
export function feedbackProblems(feedback: Feedback, manifest: Manifest): string[] {
  const answers = new Map(feedback.answers.map((a) => [a.questionId, a]))
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
    ...manifest.questions.flatMap((q) => answerProblems(q, answers.get(q.id))),
  ]
}
