import { describe, expect, it } from 'vitest'
import { exampleManifest } from '../src/example.ts'
import {
  FeedbackSchema,
  ManifestSchema,
  feedbackJsonSchema,
  manifestJsonSchema,
} from '@titan-design/review-schema'
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

  it('takes any number of variants when the round pages through sections', () => {
    expect(ManifestSchema.parse(pagedImageInput(60)).variants).toHaveLength(60)
    expect(issues(pagedImageInput(81))).toEqual([])
    expect(issues(pagedImageInput(160))).toEqual([])
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

describe('a PR page and its ship/no-ship question (round@2 merge, page)', () => {
  const HEAD = 'a'.repeat(40)
  const KEY = 'owner/name#7'
  const merge = { repo: 'owner/name', pr: 7, headSha: HEAD, ship: ['Ship'] }
  const design = (id = 'd1', patch: object = {}) => ({
    id,
    kind: 'text',
    prompt: 'Anything to change?',
    page: KEY,
    ...patch,
  })
  const shipQ = (id = 'q-ship', patch: object = {}) => ({
    id,
    kind: 'pick-one',
    prompt: 'Ship owner/name#7 at aaaaaaaaaaaa?',
    signsOff: 'the toolbar layout',
    options: ['Ship', "Don't ship"],
    required: true,
    page: KEY,
    merge,
    ...patch,
  })
  const round = (questions: object[], top: object = {}) => ({
    ...JSON.parse(JSON.stringify(base())),
    questions,
    ...top,
  })
  const messages = (input: unknown) => {
    const result = ManifestSchema.safeParse(input)
    return result.success ? [] : result.error.issues.map((i) => i.message)
  }

  it("a PR page with design questions and one required Ship/Don't ship question parses", () => {
    const parsed = ManifestSchema.parse(round([design(), shipQ()]))
    expect(parsed.questions.map((q) => q.page)).toEqual([KEY, KEY])
    expect(parsed.questions[1]).toMatchObject({ merge })
  })

  it('a pick-one bound to a PR head with a ship option parses', () => {
    expect(() => ManifestSchema.parse(round([shipQ()]))).not.toThrow()
  })

  it('a short or non-hex headSha is refused', () => {
    for (const headSha of ['abc123', 'A'.repeat(40), 'g'.repeat(40)])
      expect(issues(round([shipQ('q-ship', { merge: { ...merge, headSha } })]))).toContain(
        'questions.0.merge.headSha'
      )
  })

  it('a merge-bound question that is not required is refused', () => {
    expect(messages(round([shipQ('q-ship', { required: undefined })]))).toEqual([
      'question q-ship: a merge-bound question must be required',
    ])
  })

  it("options that are not exactly Ship and Don't ship are refused", () => {
    for (const options of [
      ["Don't ship", 'Ship'],
      ['Ship', "Don't ship", 'Later'],
      ['Ship', 'No'],
    ])
      expect(messages(round([shipQ('q-ship', { options })]))).toEqual([
        expect.stringMatching(/question q-ship: .*options must be exactly/),
      ])
  })

  it('a ship set that is not exactly ["Ship"] is refused', () => {
    for (const ship of [['Ship', "Don't ship"], ["Don't ship"]])
      expect(messages(round([shipQ('q-ship', { merge: { ...merge, ship } })]))).toContain(
        'question q-ship: a merge-bound question\'s ship set must be exactly ["Ship"]'
      )
  })

  it('a ship set naming the revision option is refused', () => {
    expect(messages(round([shipQ('q-ship', { revisionOption: 'Ship' })]))).toEqual([
      'question q-ship: ship option "Ship" is its revisionOption',
    ])
  })

  it('a ship option not among the options is refused', () => {
    expect(
      messages(round([shipQ('q-ship', { merge: { ...merge, ship: ['Elsewhere'] } })]))
    ).toEqual(
      expect.arrayContaining(['question q-ship: ship option "Elsewhere" is not one of its options'])
    )
  })

  it('an empty ship set or a stray merge field is refused', () => {
    expect(issues(round([shipQ('q-ship', { merge: { ...merge, ship: [] } })]))).toContain(
      'questions.0.merge.ship'
    )
    expect(issues(round([shipQ('q-ship', { merge: { ...merge, extra: 1 } })]))).toContain(
      'questions.0.merge'
    )
  })

  it('a PR bound by two questions is refused', () => {
    expect(messages(round([shipQ(), shipQ('q-ship2')]))).toEqual([
      'owner/name#7 is bound by more than one question: q-ship, q-ship2',
    ])
  })

  it('one PR bound at two heads is refused', () => {
    const other = shipQ('q-ship2', { merge: { ...merge, headSha: 'b'.repeat(40) } })
    expect(messages(round([shipQ(), other]))).toEqual([
      expect.stringContaining('owner/name#7 is bound by more than one question'),
    ])
  })

  it('the same PR number in another repo has its own page', () => {
    const key = 'owner/other#7'
    const other = shipQ('q-ship2', { page: key, merge: { ...merge, repo: 'owner/other' } })
    expect(() => ManifestSchema.parse(round([shipQ(), other]))).not.toThrow()
  })

  it('a bound question whose page is not its own PR is refused', () => {
    expect(
      messages(
        round([shipQ('q-ship', { page: 'owner/name#8' }), design('d1', { page: 'owner/name#8' })])
      )
    ).toEqual(
      expect.arrayContaining([
        'question q-ship: a merge-bound question\'s page must be "owner/name#7"',
      ])
    )
  })

  it('an unpaged bound question is refused', () => {
    expect(messages(round([shipQ('q-ship', { page: undefined })]))).toEqual([
      'question q-ship: a merge-bound question\'s page must be "owner/name#7"',
    ])
  })

  it('a page naming a PR with no ship/no-ship question is refused', () => {
    expect(messages(round([design('d1', { page: 'owner/name#9' })]))).toEqual([
      'question d1: page "owner/name#9" has no ship/no-ship question',
    ])
  })

  it('a malformed page key is refused', () => {
    for (const page of ['owner/name', 'owner/name#0', 'name#7', '#7'])
      expect(issues(round([design('d1', { page })]))).toContain('questions.0.page')
  })

  it('a build record parses, and a malformed one is refused', () => {
    const build = { mainSha: HEAD, mergeSha: 'c'.repeat(40) }
    expect(ManifestSchema.parse(round([shipQ()], { build })).build).toEqual(build)
    expect(
      issues(round([shipQ()], { build: { mainSha: 'abc', mergeSha: build.mergeSha } }))
    ).toContain('build.mainSha')
  })

  it('a round with no bindings parses exactly as today', () => {
    const parsed = ManifestSchema.parse(base())
    expect(parsed).not.toHaveProperty('build')
    for (const q of parsed.questions) {
      expect(q).not.toHaveProperty('merge')
      expect(q).not.toHaveProperty('page')
    }
    expect(ManifestSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed)
  })

  it('leaves the feedback schema untouched', () => {
    expect(JSON.stringify(feedbackJsonSchema())).not.toMatch(/headSha|"merge"|mergeSha|"page"/)
  })
})
