import { z } from 'zod'

export const MANIFEST_SCHEMA_ID = 'titan-review/round@1'
export const FEEDBACK_SCHEMA_ID = 'titan-review/feedback@1'

const id = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/, 'letters, digits, _ and - only')
const argValue = z.union([z.string(), z.number(), z.boolean()])
const scope = z.enum(['variant', 'round'])

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

/** True only for http(s) URLs whose host is the local machine (any port). */
export function isLoopbackUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return (protocol === 'http:' || protocol === 'https:') && LOOPBACK_HOSTS.has(hostname)
  } catch {
    return false
  }
}

// Storybook story ids are always `<component>--<story>` (Storybook docs: toId).
const storyId = z.string().regex(/^[a-z0-9-]+--[a-z0-9-]+$/, 'storybook id shape: component--story')

// Skips the loopback check when the url itself already failed z.url(), so an invalid
// url reports once, not twice.
const storybookUrl = z.url({ protocol: /^https?$/ }).check((ctx) => {
  if (ctx.issues.length === 0 && !isLoopbackUrl(ctx.value))
    ctx.issues.push({
      code: 'custom',
      message: `only loopback Storybook hosts (127.0.0.1, localhost, [::1]) are allowed: ${ctx.value}`,
      input: ctx.value,
    })
})

export const AUTO_HEIGHT = 'auto'

/** A frame height in CSS px, or "auto" to size the frame to its story's content. */
const frameHeight = z.union([z.number().int().min(120).max(4000), z.literal(AUTO_HEIGHT)])

export const VariantSchema = z
  .object({
    key: id,
    storyId,
    label: z.string().min(1),
    args: z.record(z.string(), argValue).optional(),
    globals: z.record(z.string(), argValue).optional(),
    height: frameHeight.optional(),
  })
  .strict()

const questionBase = {
  id,
  prompt: z.string().min(1),
  required: z.boolean().optional(),
  scope: scope.optional(),
}

/** Which variant each option stands for, so one click answers and picks the variant. */
const optionVariants = z.record(z.string(), id).optional()

const PickOneSchema = z
  .object({
    ...questionBase,
    kind: z.literal('pick-one'),
    options: z.array(z.string()).min(2),
    optionVariants,
  })
  .strict()
const PickManySchema = z
  .object({
    ...questionBase,
    kind: z.literal('pick-many'),
    options: z.array(z.string()).min(1),
    optionVariants,
  })
  .strict()
const ScaleSchema = z
  .object({
    ...questionBase,
    kind: z.literal('scale'),
    min: z.number().int(),
    max: z.number().int(),
  })
  .strict()
  .refine((q) => q.min < q.max, { message: 'scale min must be below max' })
const TextSchema = z.object({ ...questionBase, kind: z.literal('text') }).strict()

export const QuestionSchema = z.discriminatedUnion('kind', [
  PickOneSchema,
  PickManySchema,
  ScaleSchema,
  TextSchema,
])

/** One group of frames with the question(s) those frames answer, in reading order. */
export const SectionSchema = z
  .object({
    id,
    title: z.string().min(1),
    context: z.string().optional(),
    questionIds: z.array(id).default([]),
    variantKeys: z.array(id).default([]),
    /** Frames shown elsewhere that also bear on this section; rendered as a link, not a copy. */
    seeAlso: z.array(id).default([]),
    height: frameHeight.optional(),
  })
  .strict()

function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i)
}

function sectionProblems(m: {
  variants: { key: string }[]
  questions: { id: string }[]
  sections?: { id: string; variantKeys: string[]; questionIds: string[]; seeAlso: string[] }[]
}): string[] {
  if (!m.sections) return []
  const keys = new Set(m.variants.map((v) => v.key))
  const ids = new Set(m.questions.map((q) => q.id))
  const unknown = m.sections.flatMap((s) => [
    ...s.variantKeys
      .filter((k) => !keys.has(k))
      .map((k) => `section ${s.id}: unknown variant ${k}`),
    ...s.seeAlso.filter((k) => !keys.has(k)).map((k) => `section ${s.id}: unknown variant ${k}`),
    ...s.questionIds
      .filter((q) => !ids.has(q))
      .map((q) => `section ${s.id}: unknown question ${q}`),
  ])
  const claimedTwice = [
    ...duplicates(m.sections.flatMap((s) => s.variantKeys)).map(
      (k) => `variant ${k} is in two sections`
    ),
    ...duplicates(m.sections.flatMap((s) => s.questionIds)).map(
      (q) => `question ${q} is in two sections`
    ),
  ]
  const dupeIds = duplicates(m.sections.map((s) => s.id)).map((s) => `duplicate section id ${s}`)
  return [...unknown, ...claimedTwice, ...dupeIds]
}

function optionVariantProblems(m: {
  variants: { key: string }[]
  questions: { id: string; options?: string[]; optionVariants?: Record<string, string> }[]
}): string[] {
  const keys = new Set(m.variants.map((v) => v.key))
  return m.questions.flatMap((q) =>
    Object.entries(q.optionVariants ?? {}).flatMap(([option, key]) => [
      ...(q.options?.includes(option)
        ? []
        : [`question ${q.id}: "${option}" is not one of its options`]),
      ...(keys.has(key)
        ? []
        : [`question ${q.id}: optionVariants points at unknown variant ${key}`]),
    ])
  )
}

export const ManifestSchema = z
  .object({
    schema: z.literal(MANIFEST_SCHEMA_ID),
    unit: z.string().min(1),
    round: z.number().int().min(1),
    storybookUrl,
    context: z.string().optional(),
    widths: z.array(z.number().int().min(200).max(3840)).min(1),
    height: frameHeight.default(AUTO_HEIGHT),
    /** The ceiling an auto-sized frame stops at; taller stories scroll inside the frame. */
    maxHeight: z.number().int().min(120).max(4000).default(1200),
    variants: z.array(VariantSchema).min(1).max(12),
    questions: z.array(QuestionSchema),
    sections: z.array(SectionSchema).min(1).optional(),
  })
  .strict()
  .superRefine((m, ctx) => {
    const report = (path: string, dupes: (string | number)[]) => {
      if (dupes.length)
        ctx.addIssue({ code: 'custom', path: [path], message: `duplicate: ${dupes}` })
    }
    report('variants', duplicates(m.variants.map((v) => v.key)))
    report('questions', duplicates(m.questions.map((q) => q.id)))
    report('widths', duplicates(m.widths.map(String)))
    for (const message of sectionProblems(m))
      ctx.addIssue({ code: 'custom', path: ['sections'], message })
    for (const message of optionVariantProblems(m))
      ctx.addIssue({ code: 'custom', path: ['questions'], message })
  })

/** A comment the human left on a frame that a section pointed at this question. */
const variantCommentSchema = z.object({ key: z.string(), comment: z.string() }).strict()

const answerSchema = z
  .object({
    questionId: z.string(),
    pick: z.string().optional(),
    picks: z.array(z.string()).optional(),
    value: z.number().optional(),
    text: z.string().optional(),
    comment: z.string().optional(),
    variantComments: z.array(variantCommentSchema).optional(),
  })
  .strict()

const targetSchema = z
  .object({
    testId: z.string().optional(),
    role: z.string().optional(),
    text: z.string().optional(),
  })
  .strict()

export const AnnotationSchema = z
  .object({
    id: z.string(),
    width: z.number().int(),
    x: z.number(),
    y: z.number(),
    xPct: z.number().min(0).max(1),
    yPct: z.number().min(0).max(1),
    target: targetSchema.optional(),
    note: z.string(),
  })
  .strict()

export const VerdictSchema = z.enum(['chosen', 'rejected', 'maybe']).nullable()

const variantFeedbackSchema = z
  .object({
    key: z.string(),
    storyId: z.string(),
    verdict: VerdictSchema,
    comment: z.string(),
    annotations: z.array(AnnotationSchema),
    /** The questions whose section showed this frame, so a comment on it has an address. */
    relatedQuestionIds: z.array(z.string()).optional(),
  })
  .strict()

export const FeedbackSchema = z
  .object({
    schema: z.literal(FEEDBACK_SCHEMA_ID),
    unit: z.string(),
    round: z.number().int(),
    manifestSha256: z.string().regex(/^[0-9a-f]{64}$/),
    submittedAt: z.iso.datetime(),
    answers: z.array(answerSchema),
    variants: z.array(variantFeedbackSchema),
    general: z.string(),
  })
  .strict()

export type ManifestInput = z.input<typeof ManifestSchema>
export type Manifest = z.output<typeof ManifestSchema>
export type Variant = Manifest['variants'][number]
export type Question = Manifest['questions'][number]
export type Section = z.output<typeof SectionSchema>
export type FrameHeight = number | typeof AUTO_HEIGHT
export type Feedback = z.infer<typeof FeedbackSchema>
export type Answer = Feedback['answers'][number]
export type VariantFeedback = Feedback['variants'][number]
export type Annotation = z.infer<typeof AnnotationSchema>
export type Verdict = z.infer<typeof VerdictSchema>

// zod can't express the object-level loopback superRefine as JSON Schema; a pattern
// on the field is the closest honest approximation for schema consumers.
const LOOPBACK_URL_PATTERN = '^https?://(127\\.0\\.0\\.1|localhost|\\[::1\\])(:[0-9]+)?(/.*)?$'

export function manifestJsonSchema(): unknown {
  const schema = z.toJSONSchema(ManifestSchema, {
    io: 'input',
    unrepresentable: 'any',
  }) as unknown as {
    properties: { storybookUrl: Record<string, unknown> }
  }
  schema.properties.storybookUrl.pattern = LOOPBACK_URL_PATTERN
  return schema
}

export function feedbackJsonSchema(): unknown {
  return z.toJSONSchema(FeedbackSchema, { unrepresentable: 'any' })
}
