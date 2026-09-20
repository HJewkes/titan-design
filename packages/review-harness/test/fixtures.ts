import { exampleManifest } from '../src/example.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import { ManifestSchema, type Feedback, type Manifest, type ManifestInput } from '../src/schema.ts'

export const SHA = 'a'.repeat(64)

export function manifest(storybookUrl = 'http://127.0.0.1:6100'): Manifest {
  return ManifestSchema.parse(exampleManifest(storybookUrl))
}

/** The same round, grouped: one section over q1/q2 and frames A and B; C and q3/q4 loose. */
export function sectionedInput(storybookUrl = 'http://127.0.0.1:6100'): ManifestInput {
  return {
    ...exampleManifest(storybookUrl),
    sections: [
      {
        id: 'lead',
        title: 'Which card leads the page?',
        context: 'Same data in both.',
        questionIds: ['q1', 'q2'],
        variantKeys: ['A', 'B'],
      },
    ],
  }
}

export function sectioned(storybookUrl = 'http://127.0.0.1:6100'): Manifest {
  return ManifestSchema.parse(sectionedInput(storybookUrl))
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
