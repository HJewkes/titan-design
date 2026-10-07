import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { exampleManifest } from '../src/example.ts'
import {
  FeedbackSchema,
  ManifestSchema,
  feedbackJsonSchema,
  manifestJsonSchema,
} from '../src/schema.ts'
import { pagedImageInput, validFeedback } from './fixtures.ts'

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

  it('fits frames to their stories when the manifest leaves the height out', () => {
    const { height: _height, ...rest } = base()
    expect(ManifestSchema.parse(rest).height).toBe('auto')
  })

  it('caps a round without sections at 12 variants', () => {
    const { sections: _sections, ...unsectioned } = pagedImageInput(13)
    const result = ManifestSchema.safeParse(unsectioned)
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      expect.stringContaining('at most 12 variants'),
    ])
    const { sections: _s, ...twelve } = pagedImageInput(12)
    expect(issues(twelve)).toEqual([])
  })

  it('takes up to 80 variants when the round pages through sections', () => {
    expect(ManifestSchema.parse(pagedImageInput(60)).variants).toHaveLength(60)
    expect(issues(pagedImageInput(80))).toEqual([])
    expect(issues(pagedImageInput(81))).toEqual(['variants'])
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

  it('rejects a storybookUrl on a non-loopback host', () => {
    expect(issues({ ...base(), storybookUrl: 'http://evil.example.com:6006' })).toEqual([
      'storybookUrl',
    ])
  })

  it.each(['http://127.0.0.1:6100', 'http://localhost:6100', 'http://[::1]:6100'])(
    'accepts a loopback storybookUrl %s',
    (url) => {
      expect(issues({ ...base(), storybookUrl: url })).toEqual([])
    }
  )

  it.each(['../../x--y', 'a--../b'])(
    'rejects a storyId that is not shaped component--story: %s',
    (storyId) => {
      const m = base()
      m.variants[0].storyId = storyId
      expect(issues(m)).toEqual(['variants.0.storyId'])
    }
  )
})

describe('image variants', () => {
  const withC = (variant: Record<string, unknown>) => {
    const m = base() as { variants: Record<string, unknown>[] }
    m.variants[2] = { key: 'C', label: 'Wall screenshot', ...variant }
    return m
  }

  it.each(['wall.png', 'shots/wall-1920.PNG', 'a..b.png'])(
    'accepts an image path relative to the round file: %s',
    (image) => {
      expect(issues(withC({ image, height: 'auto' }))).toEqual([])
    }
  )

  it('rejects a variant with both a storyId and an image, and one with neither', () => {
    expect(issues(withC({ image: 'wall.png', storyId: 'lab-x--wall' }))).toEqual(['variants.2'])
    expect(issues(withC({}))).toEqual(['variants.2'])
  })

  it.each(['/tmp/wall.png', '../wall.png', 'shots/../../wall.png', 'C:\\wall.png', 'wall.jpg'])(
    'rejects an image path that is absolute, climbs out or is not a png: %s',
    (image) => {
      expect(issues(withC({ image }))).toEqual(['variants.2.image'])
    }
  )

  it('rejects args and globals on an image variant, since only a story URL carries them', () => {
    expect(
      issues(withC({ image: 'wall.png', args: { a: 1 }, globals: { theme: 'light' } }))
    ).toEqual(['variants.2.args', 'variants.2.globals'])
  })

  it('states the either-or rule in the exported JSON Schema too', () => {
    const items = (manifestJsonSchema() as { properties: { variants: { items: object } } })
      .properties.variants.items
    expect(items).toMatchObject({
      required: ['key', 'label'],
      oneOf: [{ required: ['storyId'] }, { required: ['image'] }],
    })
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

describe('a pick-one bound to a PR head (round@2 merge)', () => {
  const HEAD = 'a'.repeat(40)
  const merge = { repo: 'owner/name', pr: 7, headSha: HEAD, ship: ['Ship it'] }
  const bound = (patch: object, extra: object[] = [], top: object = {}) => {
    const input = JSON.parse(JSON.stringify(base()))
    const [first] = input.questions
    input.questions = [
      {
        ...first,
        options: ['Ship it', 'Rework it', 'none'],
        revisionOption: 'none',
        merge,
        ...patch,
      },
      ...extra,
    ]
    return { ...input, ...top }
  }
  const second = (id: string, patch: object) => ({
    id,
    kind: 'pick-one',
    prompt: 'Another part?',
    signsOff: 'the other part',
    options: ['Ship that', 'Not that'],
    merge: { ...merge, ship: ['Ship that'] },
    ...patch,
  })
  const messages = (input: unknown) => {
    const result = ManifestSchema.safeParse(input)
    return result.success ? [] : result.error.issues.map((i) => i.message)
  }

  it('a pick-one bound to a PR head with a ship option parses', () => {
    const parsed = ManifestSchema.parse(bound({}))
    expect(parsed.questions[0]).toMatchObject({ merge })
  })

  it('a short or non-hex headSha is refused', () => {
    for (const headSha of ['abc123', 'A'.repeat(40), 'g'.repeat(40)])
      expect(issues(bound({ merge: { ...merge, headSha } }))).toContain('questions.0.merge.headSha')
  })

  it('a ship set naming the revision option is refused', () => {
    expect(messages(bound({ merge: { ...merge, ship: ['Ship it', 'none'] } }))).toEqual([
      expect.stringMatching(/question q1: ship option "none" is its revisionOption/),
    ])
  })

  it('a ship option not among the options is refused', () => {
    expect(messages(bound({ merge: { ...merge, ship: ['Ship it', 'Elsewhere'] } }))).toEqual([
      expect.stringMatching(/question q1: ship option "Elsewhere" is not one of its options/),
    ])
  })

  it('an empty ship set or a stray merge field is refused', () => {
    expect(issues(bound({ merge: { ...merge, ship: [] } }))).toContain('questions.0.merge.ship')
    expect(issues(bound({ merge: { ...merge, extra: 1 } }))).toContain('questions.0.merge')
  })

  it('two questions binding one PR at different heads are refused', () => {
    const other = second('q9', { merge: { ...merge, headSha: 'b'.repeat(40), ship: ['Ship that'] } })
    expect(messages(bound({}, [other]))).toEqual([
      expect.stringMatching(/owner\/name#7 is bound at different heads/),
    ])
  })

  it('two questions binding one PR at the same head parse', () => {
    expect(() => ManifestSchema.parse(bound({}, [second('q9', {})]))).not.toThrow()
  })

  it('the same PR number in another repo may sit at another head', () => {
    const other = second('q9', {
      merge: { repo: 'owner/other', pr: 7, headSha: 'b'.repeat(40), ship: ['Ship that'] },
    })
    expect(() => ManifestSchema.parse(bound({}, [other]))).not.toThrow()
  })

  it('a build record parses, and a malformed one is refused', () => {
    const build = { mainSha: HEAD, mergeSha: 'c'.repeat(40) }
    expect(ManifestSchema.parse(bound({}, [], { build })).build).toEqual(build)
    expect(issues(bound({}, [], { build: { mainSha: 'abc', mergeSha: build.mergeSha } }))).toContain(
      'build.mainSha'
    )
  })

  it('a round with no bindings parses exactly as today', () => {
    const parsed = ManifestSchema.parse(base())
    expect(parsed).not.toHaveProperty('build')
    for (const q of parsed.questions) expect(q).not.toHaveProperty('merge')
    expect(ManifestSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed)
  })

  it('leaves the feedback schema untouched', () => {
    expect(JSON.stringify(feedbackJsonSchema())).not.toMatch(/headSha|"merge"|mergeSha/)
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
