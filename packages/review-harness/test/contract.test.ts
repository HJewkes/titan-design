import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../page/App.tsx'
import { sectionedExampleManifest } from '../src/example.ts'
import { loadRound } from '../src/review.ts'
import { runCli, type CliIo } from '../src/run.ts'
import {
  LEGACY_MANIFEST_SCHEMA_ID,
  isBlanketSignOff,
  ManifestSchema,
  RoundSchema,
  type ManifestInput,
} from '@titan-design/review-schema'
import { SECTION_TEXTS, SHA, noTreeGit } from './fixtures.ts'

type Section = NonNullable<ManifestInput['sections']>[number]
type PickOne = Extract<ManifestInput['questions'][number], { kind: 'pick-one' }>

/** A PNG signature and IHDR header, which is all loading reads: the type, then the width. */
function pngOfWidth(width: number): Buffer {
  const header = Buffer.alloc(24)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header)
  header.write('IHDR', 12, 'ascii')
  header.writeUInt32BE(width, 16)
  return header
}

/** Two captures of a spacing choice, and one question that signs off the spacing. */
function choiceRound(): ManifestInput {
  return {
    schema: 'titan-review/round@2',
    unit: 'td-670-contract',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: [
      { key: 'keep', image: 'keep.png', label: '24 + rule + 24' },
      { key: 'tight', image: 'tight.png', label: '12 + rule + 12' },
    ],
    questions: [
      {
        id: 'spacing',
        kind: 'pick-one',
        prompt: 'How much space around the rule?',
        options: ['keep', 'tight'],
        signsOff: 'the spacing under a pinned header',
        required: true,
      },
    ],
    sections: [
      {
        id: 'spacing',
        title: 'Spacing under a pinned header',
        ...SECTION_TEXTS,
        kind: 'CHOICE',
        questionIds: ['spacing'],
        variantKeys: ['keep', 'tight'],
      },
    ],
  }
}

function withSection(patch: Partial<Section>, input = choiceRound()): ManifestInput {
  return { ...input, sections: [{ ...input.sections![0], ...patch }] }
}

function withQuestion(patch: Partial<PickOne>, input = choiceRound()): ManifestInput {
  return { ...input, questions: [{ ...(input.questions[0] as PickOne), ...patch }] }
}

/** A required Ship/Don't ship question bound to one PR head, on that PR's page. */
function shipQuestion(pr: number): PickOne {
  const page = `owner/name#${pr}`
  return {
    id: `ship-${pr}`,
    kind: 'pick-one',
    prompt: `Ship ${page}?`,
    options: ['Ship', "Don't ship"],
    required: true,
    signsOff: `the change in ${page}`,
    page,
    merge: { repo: 'owner/name', pr, headSha: String(pr).repeat(40), ship: ['Ship'] },
  }
}

/** The same question bound to no PR, offering Ship beside an option of its own. */
function unboundQuestion(pr: number): PickOne {
  const { merge: _merge, page: _page, ...question } = shipQuestion(pr)
  return { ...question, options: ['Ship', `Hold ${pr}`] }
}

/** A questions-only round, one section per question. */
function shipRound(questions: PickOne[]): ManifestInput {
  return {
    ...choiceRound(),
    variants: [],
    questions,
    sections: questions.map((q) => ({
      id: `pr-${q.id}`,
      title: q.prompt,
      ...SECTION_TEXTS,
      questionIds: [q.id],
    })),
  }
}

async function writeRound(input: unknown, widths = { keep: 1280, tight: 1280 }) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-contract-'))
  await writeFile(join(dir, 'keep.png'), pngOfWidth(widths.keep))
  await writeFile(join(dir, 'tight.png'), pngOfWidth(widths.tight))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  return path
}

async function refusal(input: unknown, widths?: { keep: number; tight: number }) {
  return loadRound(await writeRound(input, widths)).then(
    () => '',
    (err: Error) => err.message
  )
}

describe('the review contract', () => {
  it('loads a round whose sections and questions carry every part', async () => {
    expect(await refusal(choiceRound())).toBe('')
    expect(RoundSchema.safeParse(sectionedExampleManifest('http://127.0.0.1:6100')).success).toBe(
      true
    )
  })

  it.each(['changed', 'deciding', 'context'] as const)(
    'refuses a section without %s, naming the section and the field',
    async (field) => {
      const section: Record<string, unknown> = { ...choiceRound().sections![0] }
      delete section[field]
      expect(await refusal({ ...choiceRound(), sections: [section] })).toContain(
        `section spacing ${field}: a section says what`
      )
    }
  )

  it('refuses a section text that is only whitespace', async () => {
    expect(await refusal(withSection({ deciding: '  ' }))).toContain('section spacing deciding')
  })

  it('refuses a strip of frames without a kind', async () => {
    expect(await refusal(withSection({ kind: undefined }))).toContain(
      'section spacing: a strip of frames needs kind CHOICE or STATES'
    )
  })

  it('refuses a CHOICE strip whose captures differ in width', async () => {
    expect(await refusal(choiceRound(), { keep: 1280, tight: 2560 })).toContain(
      'section spacing: its CHOICE frames differ in captured width (keep: 1280px, tight: 2560px)'
    )
  })

  it('refuses a CHOICE strip whose frames differ in a recorded frame setting', async () => {
    const input = choiceRound()
    input.variants[1] = { ...input.variants[1], height: 600 }
    expect(await refusal(input)).toContain('its CHOICE frames differ in height')
  })

  it('accepts a STATES strip whose captures differ in width, and refuses one that asks a pick', async () => {
    const states = withSection({ kind: 'STATES', questionIds: [] })
    expect(await refusal(states, { keep: 1280, tight: 2560 })).toBe('')
    expect(await refusal(withSection({ kind: 'STATES' }))).toContain(
      'a STATES strip asks no choice, but question spacing picks a frame'
    )
  })

  it('refuses a pick-one that does not name what it signs off', async () => {
    expect(await refusal(withQuestion({ signsOff: undefined }))).toContain(
      'question spacing signsOff: a pick-one question names the changed part it signs off'
    )
  })

  it.each([
    ['an option', { options: ['keep', 'Sign off as built'] }],
    ['a prompt', { prompt: 'Sign-off as built?' }],
  ])('refuses %s that is only a blanket sign-off', async (_what, patch) => {
    expect(await refusal(withQuestion(patch))).toMatch(
      /question spacing: ".*" is a blanket sign-off/
    )
  })

  it('refuses an option repeated within a question or shared with another pick-one', async () => {
    const twice = withQuestion({ options: ['keep', 'Rework it', 'Rework it'] })
    expect(await refusal(twice)).toContain('question spacing: option "Rework it" repeats')
    const input = withQuestion({ options: ['keep', 'tight', 'Rework it'] })
    input.questions.push({
      id: 'rule',
      kind: 'pick-one',
      prompt: 'Keep the rule?',
      options: ['Keep the rule', 'Rework it'],
      signsOff: 'the rule under a pinned header',
    })
    input.sections![0].questionIds!.push('rule')
    expect(await refusal(input)).toContain('question rule: option "Rework it" is also in spacing')
  })

  it("accepts a round binding two PRs, each asked Ship or Don't ship", async () => {
    const input = shipRound([shipQuestion(7), shipQuestion(8)])
    expect(ManifestSchema.safeParse(input).success).toBe(true)
    expect(await refusal(input)).toBe('')
  })

  it('refuses Ship shared with a question that binds no PR', async () => {
    const unbound = unboundQuestion(8)
    expect(await refusal(shipRound([unbound, shipQuestion(7)]))).toContain(
      'question ship-7: option "Ship" is also in ship-8'
    )
    expect(await refusal(shipRound([shipQuestion(7), unbound]))).toContain(
      'question ship-8: option "Ship" is also in ship-7'
    )
  })

  it('refuses Ship shared between two questions that bind no PR', async () => {
    expect(await refusal(shipRound([unboundQuestion(7), unboundQuestion(8)]))).toContain(
      'question ship-8: option "Ship" is also in ship-7'
    )
  })

  it('refuses Ship twice within one merge-bound question', async () => {
    const twice = { ...shipQuestion(7), options: ['Ship', 'Ship', "Don't ship"] }
    expect(await refusal(shipRound([twice, shipQuestion(8)]))).toContain(
      'question ship-7: option "Ship" repeats'
    )
  })

  it('refuses a frame that no section holds, and a round written before the contract', async () => {
    const loose = withSection({ variantKeys: ['keep'], kind: 'STATES', questionIds: [] })
    expect(await refusal(loose)).toContain('variant tight is in no section')
    expect(await refusal({ ...choiceRound(), schema: LEGACY_MANIFEST_SCHEMA_ID })).toContain(
      'predates the review contract'
    )
  })

  it('tells a blanket sign-off from an option that names its part', () => {
    expect(['as built', 'Merge as built.', 'approve it as built'].map(isBlanketSignOff)).toEqual([
      true,
      true,
      true,
    ])
    expect(isBlanketSignOff('Merge with the gutter as built')).toBe(false)
  })
})

describe('the CLI under the review contract', () => {
  const io = (stderr: string[]): CliIo => ({
    stdout: () => {},
    stderr: (t) => stderr.push(t),
    openBrowser: () => {},
    capture: async () => [],
    measure: async () => [],
    git: noTreeGit,
    createPage: async () => ({ handler: () => {}, close: async () => {} }),
    harnessFreshness: async () => ({ state: 'current' }),
    signal: new AbortController().signal,
  })

  it.each([[[]], [['build']]])(
    'refuses to serve or build a round missing a part (%j)',
    async (cmd) => {
      const path = await writeRound(withSection({ changed: undefined }))
      const stderr: string[] = []
      expect(await runCli([...cmd, path, '--no-open'], io(stderr))).toBe(2)
      expect(stderr.join('\n')).toContain('section spacing changed')
    }
  )
})

describe('a section on the page', () => {
  it('renders deciding, then changed, then context marked secondary, and names the strip kind', () => {
    const manifest = ManifestSchema.parse(
      withSection({ deciding: 'Pick one.', changed: 'Both new.', context: 'Rule is TD-489.' })
    )
    const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256: SHA }))
    const at = (testId: string) => markup.indexOf(`data-testid="${testId}"`)
    expect(at('section-deciding')).toBeGreaterThan(-1)
    expect(at('section-deciding')).toBeLessThan(at('section-changed'))
    expect(at('section-changed')).toBeLessThan(at('section-context'))
    expect(markup).toContain('class="section-text section-context"')
    expect(markup).toContain('data-testid="strip-kind-spacing"')
  })
})
