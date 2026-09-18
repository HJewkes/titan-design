import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { exampleManifest } from '../src/example.ts'
import {
  FeedbackSchema,
  ManifestSchema,
  feedbackJsonSchema,
  manifestJsonSchema,
} from '../src/schema.ts'
import { validFeedback } from './fixtures.ts'

const base = () => exampleManifest('http://127.0.0.1:6100')
const issues = (input: unknown) => {
  const result = ManifestSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('round manifest', () => {
  it('accepts the --example manifest and defaults nothing it already sets', () => {
    const parsed = ManifestSchema.parse(base())
    expect(parsed.height).toBe(900)
    expect(parsed.variants.map((v) => v.key)).toEqual(['A', 'B', 'C'])
  })

  it('defaults the frame height when the manifest leaves it out', () => {
    const { height: _height, ...rest } = base()
    expect(ManifestSchema.parse(rest).height).toBe(900)
  })

  it('rejects duplicate variant keys, question ids and widths', () => {
    const m = base()
    m.variants.push({ ...m.variants[0] })
    m.questions.push({ ...m.questions[3] })
    m.widths = [360, 360]
    expect(issues(m)).toEqual(expect.arrayContaining(['variants', 'questions', 'widths']))
  })

  it('rejects an unknown question kind and a backwards scale', () => {
    const m = base() as { questions: unknown[] }
    m.questions = [
      { id: 'q1', kind: 'slider', prompt: 'x' },
      { id: 'q2', kind: 'scale', prompt: 'x', min: 5, max: 1 },
    ]
    expect(issues(m)).toEqual(['questions.0.kind', 'questions.1'])
  })

  it('rejects unknown top-level fields and a non-http storybook url', () => {
    expect(issues({ ...base(), extra: 1 })).toEqual([''])
    expect(issues({ ...base(), storybookUrl: 'file:///tmp' })).toEqual(['storybookUrl'])
  })
})

describe('feedback', () => {
  it('parses a complete submission', () => {
    expect(FeedbackSchema.parse(validFeedback())).toEqual(validFeedback())
  })

  it('rejects an unknown verdict and an out-of-range percentage', () => {
    const f = validFeedback() as unknown as {
      variants: { verdict: string; annotations: { xPct: number }[] }[]
    }
    f.variants[0].verdict = 'love it'
    f.variants[0].annotations[0].xPct = 1.5
    const result = FeedbackSchema.safeParse(f)
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => i.path.join('.'))).toEqual([
      'variants.0.verdict',
      'variants.0.annotations.0.xPct',
    ])
  })
})

describe('exported JSON Schema files', () => {
  const onDisk = (name: string) =>
    JSON.parse(readFileSync(new URL(`../schema/${name}`, import.meta.url), 'utf8'))

  it('match the zod schemas (run `pnpm schema` after changing them)', () => {
    expect(onDisk('round.schema.json')).toEqual(manifestJsonSchema())
    expect(onDisk('feedback.schema.json')).toEqual(feedbackJsonSchema())
  })
})
