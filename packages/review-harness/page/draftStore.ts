import { z } from 'zod'
import { emptyDraft, type ReviewDraft } from '../src/feedback.ts'
import { AnnotationSchema, VerdictSchema, type Manifest } from '../src/schema.ts'

/** The slice of `Storage` the draft needs, so tests and private windows can pass their own. */
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Far above any real draft; a larger stored value is treated as corrupt, not parsed. */
export const MAX_DRAFT_CHARS = 1_000_000

const DraftSchema = z.object({
  variants: z.record(
    z.string(),
    z.object({
      verdict: VerdictSchema,
      comment: z.string(),
      annotations: z.array(AnnotationSchema),
    })
  ),
  answers: z.record(
    z.string(),
    z.object({
      pick: z.string().optional(),
      picks: z.array(z.string()).optional(),
      value: z.number().optional(),
      text: z.string().optional(),
      comment: z.string(),
    })
  ),
  general: z.string(),
})

export function draftKey(manifestSha256: string): string {
  return `titan-review:draft:${manifestSha256}`
}

/** `localStorage`, or null where reading it throws (some private windows, blocked storage). */
export function browserStorage(): DraftStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function sameKeys(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const [ka, kb] = [Object.keys(a).sort(), Object.keys(b).sort()]
  return ka.length === kb.length && ka.every((k, i) => k === kb[i])
}

/** The saved draft for this exact manifest, or null when there is none or it cannot be trusted. */
export function loadDraft(
  storage: DraftStorage | null,
  manifest: Manifest,
  manifestSha256: string
): ReviewDraft | null {
  try {
    const raw = storage?.getItem(draftKey(manifestSha256))
    if (!raw || raw.length > MAX_DRAFT_CHARS) return null
    const parsed = DraftSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return null
    const empty = emptyDraft(manifest)
    const fits =
      sameKeys(parsed.data.variants, empty.variants) && sameKeys(parsed.data.answers, empty.answers)
    return fits ? parsed.data : null
  } catch {
    return null
  }
}

/** Best effort: a full or blocked storage loses the backup, never the page. */
export function saveDraft(
  storage: DraftStorage | null,
  manifestSha256: string,
  draft: ReviewDraft
): void {
  try {
    storage?.setItem(draftKey(manifestSha256), JSON.stringify(draft))
  } catch {
    /* quota or security error: the draft still lives in memory */
  }
}

export function clearDraft(storage: DraftStorage | null, manifestSha256: string): void {
  try {
    storage?.removeItem(draftKey(manifestSha256))
  } catch {
    /* nothing to clear if storage is unavailable */
  }
}
