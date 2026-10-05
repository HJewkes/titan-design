import { exampleManifest } from '../src/example.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import {
  MANIFEST_SCHEMA_ID,
  ManifestSchema,
  type Feedback,
  type Manifest,
  type ManifestInput,
} from '../src/schema.ts'

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

/**
 * A Gate 2 batch in one round: 60 image frames, main and PR head in light and dark, in three
 * sections of 28, 28 and 4, with one question per section and a sign-off under Overall.
 */
export function pagedImageInput(count = 60): ManifestInput {
  const keys = Array.from({ length: count }, (_, i) => `F${String(i + 1).padStart(2, '0')}`)
  const groups = [keys.slice(0, 28), keys.slice(28, 56), keys.slice(56)]
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-343-paged',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1440],
    variants: keys.map((key, i) => ({
      key,
      image: `frames/${key}.png`,
      label: `${i % 2 ? 'PR head' : 'main'} ${i % 4 < 2 ? 'dark' : 'light'} ${key}`,
    })),
    questions: [
      ...groups.map((_, i) => ({
        id: `batch-${i + 1}`,
        kind: 'text' as const,
        prompt: `Batch ${i + 1}?`,
      })),
      {
        id: 'sign-off',
        kind: 'pick-one',
        prompt: 'Gate 2',
        options: ['Pass', 'Fail'],
        required: true,
      },
    ],
    sections: groups.map((variantKeys, i) => ({
      id: `batch-${i + 1}`,
      title: `Batch ${i + 1}`,
      questionIds: [`batch-${i + 1}`],
      variantKeys,
    })),
  }
}

/** The three section texts the review contract requires, for tests that are not about them. */
export const SECTION_TEXTS = {
  deciding: 'Whether these frames are right.',
  changed: 'New in this round.',
  context: 'Nothing else is under review.',
}

/** The same round under the review contract: its frames in one strip, its questions loose. */
export function underContract(
  input: ManifestInput,
  kind: 'CHOICE' | 'STATES' = 'STATES'
): ManifestInput {
  return {
    ...input,
    questions: input.questions.map((q) =>
      q.kind === 'pick-one' ? { ...q, signsOff: `the answer to ${q.id}` } : q
    ),
    sections: [
      {
        id: 'frames',
        title: 'Frames',
        ...SECTION_TEXTS,
        kind,
        variantKeys: input.variants.map((v) => v.key),
      },
    ],
  }
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
