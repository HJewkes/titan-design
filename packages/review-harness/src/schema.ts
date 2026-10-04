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

/** A round shows every frame on one page, so it stays small; sections page through more. */
export const MAX_VARIANTS = 12
export const MAX_SECTIONED_VARIANTS = 80

/** A frame height in CSS px, or "auto" to size the frame to its story's content. */
const frameHeight = z.union([z.number().int().min(120).max(4000), z.literal(AUTO_HEIGHT)])

// Relative to the round file, never absolute and never through `..`; load time checks the rest.
const imagePath = z
  .string()
  .regex(
    /^(?![/\\]|[A-Za-z]:)(?!(.*[/\\])?\.\.([/\\]|$)).+\.[Pp][Nn][Gg]$/,
    'a .png path relative to the round file, without .. segments'
  )

/** A frame is a Storybook story or a static PNG: exactly one of `storyId` and `image`. */
export const VariantSchema = z
  .object({
    key: id,
    storyId: storyId.optional(),
    image: imagePath.optional(),
    label: z.string().min(1),
    args: z.record(z.string(), argValue).optional(),
    globals: z.record(z.string(), argValue).optional(),
    height: frameHeight.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.storyId === undefined) === (v.image === undefined))
      ctx.addIssue({ code: 'custom', message: 'a variant has either storyId or image, not both' })
    if (v.image === undefined) return
    for (const field of ['args', 'globals'] as const)
      if (v[field] !== undefined)
        ctx.addIssue({ code: 'custom', path: [field], message: `${field} need a storyId variant` })
  })

const questionBase = {
  id,
  prompt: z.string().min(1),
  required: z.boolean().optional(),
  scope: scope.optional(),
}

/** Which variant each option stands for, so one click answers and picks the variant. */
const optionVariants = z.record(z.string(), id).optional()

/** Our answer to a question, hidden from the owner until they answer it themselves. */
export const RecommendationSchema = z
  .object({
    answer: z.union([z.string(), z.array(z.string()).min(1), z.number()]),
    rationale: z.string().min(1),
    confidence: z.number().min(0).max(1),
    /** The recommender: an agent name or "design-coord". */
    by: z.string().min(1),
  })
  .strict()
const recommendation = RecommendationSchema.optional()

/** When the page shows a recommendation: once its question is answered, or from the start. */
export const RECOMMENDATION_MODES = ['after-answer', 'shown'] as const

const PickOneSchema = z
  .object({
    ...questionBase,
    kind: z.literal('pick-one'),
    options: z.array(z.string()).min(2),
    optionVariants,
    recommendation,
  })
  .strict()
const PickManySchema = z
  .object({
    ...questionBase,
    kind: z.literal('pick-many'),
    options: z.array(z.string()).min(1),
    optionVariants,
    recommendation,
  })
  .strict()
const ScaleSchema = z
  .object({
    ...questionBase,
    kind: z.literal('scale'),
    min: z.number().int(),
    max: z.number().int(),
    recommendation,
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

export const THEME_MODES = ['light', 'dark'] as const
const themeMode = z.enum(THEME_MODES)
const CHECK_KINDS = ['text', 'large-text', 'non-text'] as const
const checkKind = z.enum(CHECK_KINDS)
const NAMES_ELEMENT =
  'a known defect names one element: its data-testid, or the full selector build printed'

/** Where a known miss is fixed: the primitive or token task that owns it, or the component. */
export const DEFECT_ROUTE = /^([A-Z][A-Z0-9]*-[0-9]+[a-z]?|component)$/

/** A contrast miss the round ships knowingly. It is reported with its route, never hidden. */
export const KnownDefectSchema = z
  .object({
    variant: id.optional(),
    mode: z.enum(THEME_MODES, { error: 'a known defect names its mode: light or dark' }),
    kind: z.enum(CHECK_KINDS, {
      error: 'a known defect names its kind: text, large-text or non-text',
    }),
    /** The failing element's own data-testid, or the full selector build printed, exactly. */
    element: z.string({ error: NAMES_ELEMENT }).min(1, NAMES_ELEMENT),
    /** When set, the miss is excused only at or below this ratio, so a worse regression blocks. */
    maxRatio: z.number().min(1).max(21).optional(),
    route: z.string().regex(DEFECT_ROUTE, 'a task id such as TD-490, or "component"'),
    reason: z.string().min(1),
  })
  .strict()

/** An image variant's ratio, measured by the round builder because the DOM cannot be. */
const ImageMeasurementSchema = z
  .object({
    variant: id,
    mode: themeMode,
    kind: checkKind,
    element: z.string().min(1),
    ratio: z.number().min(1).max(21),
    /** How it was measured (a tool, a colour picker on the PNG); the record of the number. */
    source: z.string().min(1),
  })
  .strict()

const UnmeasuredSchema = z
  .object({ variant: id, mode: themeMode, reason: z.string().min(1) })
  .strict()

/** The contrast gate's declarations for the frames of a section, or of the whole round. */
export const ContrastDeclarationsSchema = z
  .object({
    knownDefects: z.array(KnownDefectSchema).default([]),
    measured: z.array(ImageMeasurementSchema).default([]),
    unmeasured: z.array(UnmeasuredSchema).default([]),
  })
  .strict()

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
    contrast: ContrastDeclarationsSchema.optional(),
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

type Declarations = z.output<typeof ContrastDeclarationsSchema>

function declaredVariants(decl: Declarations): { field: string; variant: string }[] {
  return [
    ...decl.knownDefects.flatMap((d) =>
      d.variant ? [{ field: 'knownDefects', variant: d.variant }] : []
    ),
    ...decl.measured.map((d) => ({ field: 'measured', variant: d.variant })),
    ...decl.unmeasured.map((d) => ({ field: 'unmeasured', variant: d.variant })),
  ]
}

/** A declaration names a frame of its own section (or any frame, at round level). */
function contrastProblems(m: {
  variants: { key: string; image?: string }[]
  contrast?: Declarations
  sections?: { id: string; variantKeys: string[]; contrast?: Declarations }[]
}): string[] {
  const images = new Set(m.variants.filter((v) => v.image !== undefined).map((v) => v.key))
  const scopes = [
    { where: 'contrast', keys: new Set(m.variants.map((v) => v.key)), decl: m.contrast },
    ...(m.sections ?? []).map((s) => ({
      where: `section ${s.id} contrast`,
      keys: new Set(s.variantKeys),
      decl: s.contrast,
    })),
  ]
  return scopes.flatMap(({ where, keys, decl }) =>
    (decl ? declaredVariants(decl) : []).flatMap(({ field, variant }) => {
      if (!keys.has(variant)) return [`${where}.${field}: ${variant} is not a frame here`]
      if (field !== 'knownDefects' && !images.has(variant))
        return [`${where}.${field}: ${variant} is a story; only an image variant is ${field}`]
      return []
    })
  )
}

type Recommendable = Exclude<z.output<typeof QuestionSchema>, { kind: 'text' }>

function recommendationProblem(q: Recommendable, answer: Recommendation['answer']) {
  if (q.kind === 'scale')
    return Number.isInteger(answer) && Number(answer) >= q.min && Number(answer) <= q.max
      ? null
      : 'is not on its scale'
  const picks = Array.isArray(answer) ? answer : [answer]
  if (Array.isArray(answer) !== (q.kind === 'pick-many'))
    return q.kind === 'pick-many' ? 'is not a list of its options' : 'is not one of its options'
  if (!picks.every((p) => typeof p === 'string' && q.options.includes(p)))
    return 'is not among its options'
  return new Set(picks).size === picks.length ? null : 'repeats an option'
}

function recommendationProblems(m: { questions: z.output<typeof QuestionSchema>[] }): string[] {
  return m.questions.flatMap((q) => {
    const problem =
      q.kind !== 'text' && q.recommendation && recommendationProblem(q, q.recommendation.answer)
    return problem ? [`question ${q.id}: the recommended answer ${problem}`] : []
  })
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
    variants: z.array(VariantSchema).min(1).max(MAX_SECTIONED_VARIANTS),
    questions: z.array(QuestionSchema),
    sections: z.array(SectionSchema).min(1).optional(),
    recommendations: z.enum(RECOMMENDATION_MODES).default('after-answer'),
    /** Declarations that hold for every frame; a section's own hold for its frames. */
    contrast: ContrastDeclarationsSchema.optional(),
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
    if (!m.sections && m.variants.length > MAX_VARIANTS)
      ctx.addIssue({
        code: 'custom',
        path: ['variants'],
        message: `a round without sections holds at most ${MAX_VARIANTS} variants; group more into sections`,
      })
    for (const message of sectionProblems(m))
      ctx.addIssue({ code: 'custom', path: ['sections'], message })
    for (const message of [...optionVariantProblems(m), ...recommendationProblems(m)])
      ctx.addIssue({ code: 'custom', path: ['questions'], message })
    for (const message of contrastProblems(m))
      ctx.addIssue({ code: 'custom', path: ['contrast'], message })
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
    /** The manifest's recommendation for this question, echoed so a report needs no manifest. */
    recommendation: RecommendationSchema.optional(),
    /** Whether the owner's answer equals the recommendation's (pick-many: the same set). */
    agreed: z.boolean().optional(),
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
    /** Echoes the frame's source: `storyId` for a story variant, `image` for an image one. */
    storyId: z.string().optional(),
    image: z.string().optional(),
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
export type StoryVariant = Variant & { storyId: string }
export type ImageVariant = Variant & { image: string }
export type Question = Manifest['questions'][number]
export type Section = z.output<typeof SectionSchema>
export type FrameHeight = number | typeof AUTO_HEIGHT
export type Feedback = z.infer<typeof FeedbackSchema>
export type Answer = Feedback['answers'][number]
export type VariantFeedback = Feedback['variants'][number]
export type Annotation = z.infer<typeof AnnotationSchema>
export type Verdict = z.infer<typeof VerdictSchema>
export type Recommendation = z.infer<typeof RecommendationSchema>
export type ThemeMode = (typeof THEME_MODES)[number]
export type KnownDefect = z.infer<typeof KnownDefectSchema>
export type ContrastDeclarations = z.output<typeof ContrastDeclarationsSchema>

export function isStoryVariant(variant: Variant): variant is StoryVariant {
  return variant.storyId !== undefined
}

export function isImageVariant(variant: Variant): variant is ImageVariant {
  return variant.image !== undefined
}

// zod can't express the object-level loopback superRefine as JSON Schema; a pattern
// on the field is the closest honest approximation for schema consumers.
const LOOPBACK_URL_PATTERN = '^https?://(127\\.0\\.0\\.1|localhost|\\[::1\\])(:[0-9]+)?(/.*)?$'

// The variant superRefine (exactly one source; args only on stories), as JSON Schema.
const VARIANT_SOURCE = {
  oneOf: [
    { required: ['storyId'] },
    { required: ['image'], not: { anyOf: [{ required: ['args'] }, { required: ['globals'] }] } },
  ],
}

// The manifest superRefine's unsectioned cap, as JSON Schema.
const UNSECTIONED_CAP = {
  if: { not: { required: ['sections'] } },
  then: { properties: { variants: { maxItems: MAX_VARIANTS } } },
}

export function manifestJsonSchema(): unknown {
  const schema = z.toJSONSchema(ManifestSchema, {
    io: 'input',
    unrepresentable: 'any',
  }) as unknown as {
    properties: {
      storybookUrl: Record<string, unknown>
      variants: { items: Record<string, unknown> }
    }
  }
  schema.properties.storybookUrl.pattern = LOOPBACK_URL_PATTERN
  Object.assign(schema.properties.variants.items, VARIANT_SOURCE)
  return Object.assign(schema, UNSECTIONED_CAP)
}

export function feedbackJsonSchema(): unknown {
  return z.toJSONSchema(FeedbackSchema, { unrepresentable: 'any' })
}
