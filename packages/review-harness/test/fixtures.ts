import { exampleManifest } from '../src/example.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import { ManifestSchema, type Feedback, type Manifest } from '../src/schema.ts'

export const SHA = 'a'.repeat(64)

export function manifest(storybookUrl = 'http://127.0.0.1:6100'): Manifest {
  return ManifestSchema.parse(exampleManifest(storybookUrl))
}

/** A complete, valid submission: A chosen with one pin, q1 answered. */
export function validFeedback(m: Manifest = manifest(), sha = SHA): Feedback {
  const draft = emptyDraft(m)
  draft.variants.A = {
    verdict: 'chosen',
    comment: 'Keep the pill',
    annotations: [
      { id: 'A-1', width: 360, x: 180, y: 90, xPct: 0.5, yPct: 0.1, note: 'too tight' },
    ],
  }
  draft.answers.q1 = { pick: 'A', comment: '' }
  return buildFeedback(m, sha, draft, new Date('2026-09-18T23:41:07Z'))
}
