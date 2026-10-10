import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXIT_REFUSED, buildRound, type TreeGit } from '../src/build.ts'
import { applyRoundRules } from '../src/round-rules.ts'
import {
  FEEDBACK_SCHEMA_ID,
  MANIFEST_SCHEMA_ID,
  RoundSchema,
  type ManifestInput,
} from '@titan-design/review-schema'
import { SECTION_TEXTS } from './fixtures.ts'

const REPO = 'owner/name'
const HEAD = (n: number) => String(n % 10).repeat(40)
const MERGE = 'f'.repeat(40)
const tree: TreeGit = {
  revParse: async (_t, ref) => (ref === 'HEAD' ? MERGE : '0'.repeat(40)),
  isAncestor: async () => true,
}

const pageOf = (pr: number) => `${REPO}#${pr}`

function ship(pr: number, head = HEAD(pr)) {
  return {
    id: `ship-${pr}`,
    kind: 'pick-one' as const,
    prompt: `Ship ${pageOf(pr)}?`,
    options: ['Ship', "Don't ship"],
    required: true,
    signsOff: `the change in ${pageOf(pr)}`,
    page: pageOf(pr),
    merge: { repo: REPO, pr, headSha: head, ship: ['Ship'] },
  }
}

const pick = (id: string, frames: string[], pr?: number) => ({
  id,
  kind: 'pick-one' as const,
  prompt: `Which ${id}?`,
  options: [`${id}-x`, `${id}-y`],
  implemented: `${id}-x`,
  required: true,
  signsOff: id,
  frames,
  ...(pr ? { page: pageOf(pr) } : {}),
})

const frame = (key: string) => ({ key, storyId: `lab-${key}--default`, label: `Frame ${key}` })
const section = (id: string, title: string, questionIds: string[], variantKeys: string[]) => ({
  id,
  title,
  ...SECTION_TEXTS,
  kind: 'STATES' as const,
  questionIds,
  variantKeys,
})

/** Two PRs whose sections interleave, Ship before its own context, and a loose iteration section. */
function interleaved(extra: Partial<ManifestInput> = {}): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'batch-1',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: ['it', 'a1', 'a2', 'b1'].map(frame),
    questions: [pick('tone', ['it']), ship(7), pick('depth', ['b1'], 8), ship(8)],
    sections: [
      section('iter', 'Tone', ['tone'], ['it']),
      section('a-ship', `#7 ship`, ['ship-7'], ['a1']),
      section('b-ctx', `#8 ctx`, ['depth', 'ship-8'], ['b1']),
      section('a-ctx', `#7 context`, [], ['a2']),
    ],
    ...extra,
  }
}

async function dirWith(name: string, draft: ManifestInput) {
  const root = await mkdtemp(join(tmpdir(), 'titan-rules-'))
  const dir = join(root, name)
  await mkdir(dir)
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(draft))
  return { root, dir, path }
}

async function build(path: string, priorFeedback: string[] = []) {
  const lines: string[] = []
  const io = { stderr: (t: string) => lines.push(t), measure: async () => [], git: tree }
  const code = await buildRound(path, undefined, io, '/tree', priorFeedback)
  return { code, lines }
}

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'))

beforeEach(() => {
  const entries = Object.fromEntries(['it', 'a1', 'a2', 'b1'].map((k) => [`lab-${k}--default`, {}]))
  vi.stubGlobal('fetch', async () => Response.json({ entries }))
})
afterEach(() => vi.unstubAllGlobals())

describe('builder rules: labels and topics', () => {
  it('labels a Ship question SHIP and every other question ITERATION', () => {
    const out = applyRoundRules(interleaved())
    const prompts = Object.fromEntries(out.questions.map((q) => [q.id, q.prompt]))
    expect(prompts['ship-7']).toBe('SHIP: Ship owner/name#7?')
    expect(prompts['tone']).toBe('ITERATION: Which tone?')
    expect(out.questions.find((q) => q.id === 'tone')?.topics).toContain('topic:iteration')
    expect(out.questions.find((q) => q.id === 'ship-7')?.topics).toContain('topic:ship')
  })

  it('keeps a question id and its ask topic the same across rounds of the same ask', () => {
    const first = applyRoundRules(interleaved())
    const later = applyRoundRules(interleaved({ unit: 'batch-2', round: 3 }))
    const ask = (m: ManifestInput, id: string) =>
      m.questions.find((q) => q.id === id)?.topics?.find((t) => t.startsWith('ask:'))
    expect(later.questions.map((q) => q.id)).toEqual(first.questions.map((q) => q.id))
    expect(ask(later, 'ship-7')).toBe(ask(first, 'ship-7'))
    expect(ask(first, 'ship-7')).toBe('ask:owner/name#7/ship')
    expect(ask(first, 'tone')).toBe('ask:batch-1/tone')
  })

  it('keeps a draft-supplied topic and applying the rules twice changes nothing', () => {
    const draft = interleaved()
    draft.questions[0] = { ...draft.questions[0], topics: ['component:button'] }
    const once = applyRoundRules(draft)
    expect(once.questions[0].topics).toContain('component:button')
    expect(applyRoundRules(once)).toEqual(once)
  })
})

describe('builder rules: stacked base PR', () => {
  const base = { repo: REPO, pr: 7, headSha: HEAD(7) }

  it('labels the base PR frames as context when the base is not asked about', () => {
    const draft = interleaved({ stackedOn: base })
    draft.questions = draft.questions.filter((q) => q.id !== 'ship-7')
    draft.sections = draft.sections!.map((s) => ({
      ...s,
      questionIds: s.questionIds?.filter((q) => q !== 'ship-7') ?? [],
    }))
    const out = applyRoundRules(draft)
    const label = (key: string) => out.variants.find((v) => v.key === key)?.label
    expect(label('a1')).toBe('base PR #7, not under review: Frame a1')
    expect(label('a2')).toBe('base PR #7, not under review: Frame a2')
    expect(label('b1')).toBe('Frame b1')
    expect(out.stackedOn).toEqual(base)
  })

  it('leaves frames alone when the base PR has its own Ship question', () => {
    const out = applyRoundRules(interleaved({ stackedOn: base }))
    expect(out.variants.map((v) => v.label)).toEqual(interleaved().variants.map((v) => v.label))
  })

  it('writes stackedOn into round.json', async () => {
    const draft = interleaved({ stackedOn: base })
    const { dir, path } = await dirWith('round-1', draft)
    expect((await build(path)).code).toBe(0)
    expect((await readJson(join(dir, 'round.json'))).stackedOn).toEqual(base)
  })
})

describe('builder rules: PR grouping', () => {
  it('puts each PR sections together with the Ship section last', () => {
    const out = applyRoundRules(interleaved())
    expect(out.sections!.map((s) => s.id)).toEqual(['iter', 'a-ctx', 'a-ship', 'b-ctx'])
  })

  it('puts a Ship question last in its own section', () => {
    const draft = interleaved()
    draft.sections![2] = section('b-ctx', '#8 ctx', ['ship-8', 'depth'], ['b1'])
    const section8 = applyRoundRules(draft).sections!.find((s) => s.id === 'b-ctx')
    expect(section8?.questionIds).toEqual(['depth', 'ship-8'])
  })
})

describe('builder rules: Ship gate', () => {
  /** Round 1 of batch-1 as answered: `answers` maps question id to its answer. */
  async function answeredRound(
    answers: Record<string, object>,
    head = HEAD(7),
    depth: object = pick('depth', ['a2'], 7)
  ) {
    const draft = interleaved()
    draft.questions = draft.questions.map((q) => {
      if (q.id === 'ship-7') return ship(7, head)
      return q.id === 'depth' ? (depth as typeof q) : q
    })
    draft.sections = draft.sections!.map((s) => {
      if (s.id === 'b-ctx') return { ...s, questionIds: ['ship-8'] }
      return s.id === 'a-ctx' ? { ...s, questionIds: ['depth'] } : s
    })
    const { root, dir, path } = await dirWith('round-1', draft)
    expect((await build(path)).code).toBe(0)
    const sha = createHash('sha256')
      .update(await readFile(join(dir, 'round.json')))
      .digest('hex')
    const feedback = {
      schema: FEEDBACK_SCHEMA_ID,
      unit: 'batch-1',
      round: 1,
      manifestSha256: sha,
      submittedAt: '2026-10-09T12:00:00.000Z',
      answers: Object.entries(answers).map(([questionId, a]) => ({ questionId, ...a })),
      variants: draft.variants.map((v) => ({
        key: v.key,
        verdict: null,
        comment: '',
        annotations: [],
      })),
      general: '',
    }
    await writeFile(join(dir, 'feedback.json'), JSON.stringify(feedback))
    return { root, feedbackPath: join(dir, 'feedback.json') }
  }

  async function nextRound(root: string, head = HEAD(7)) {
    const draft = interleaved({ round: 2 })
    draft.questions = draft.questions.map((q) => (q.id === 'ship-7' ? ship(7, head) : q))
    const dir = join(root, 'round-2')
    await mkdir(dir)
    await writeFile(join(dir, 'draft.json'), JSON.stringify(draft))
    return join(dir, 'draft.json')
  }

  it('refuses when the earlier round declined to ship the PR, naming the question', async () => {
    const { root } = await answeredRound({ 'ship-7': { pick: "Don't ship" } })
    const next = await nextRound(root)
    const { code, lines } = await build(next)
    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toMatch(/ship-7 offers Ship for owner\/name#7, but round 1 of batch-1/)
    expect(lines[0]).toContain('changes-requested or not agreed')
    expect(await readdir(join(root, 'round-2'))).not.toContain('round.json')
  })

  it('refuses when a question about the PR has a revision requested', async () => {
    const { root } = await answeredRound({
      'ship-7': { pick: 'Ship' },
      depth: { revisionRequested: true, comment: 'fix the depth' },
    })
    const { code, lines } = await build(await nextRound(root))
    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toContain('depth')
  })

  it('offers Ship when an answer is the implemented option but not the recommended one', async () => {
    const { root } = await answeredRound({ depth: { pick: 'depth-x', agreed: false } })
    expect((await build(await nextRound(root))).code).toBe(0)
  })

  it('refuses on a not-agreed answer to an older question that declares no implemented option', async () => {
    const { implemented: _, ...depth } = pick('depth', ['a2'], 7)
    const { root } = await answeredRound(
      { depth: { pick: 'depth-x', agreed: false } },
      HEAD(7),
      depth
    )
    const { code, lines } = await build(await nextRound(root))
    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toContain('depth')
  })

  it('refuses through an explicit --prior-feedback file outside the sibling layout', async () => {
    const { root, feedbackPath } = await answeredRound({ 'ship-7': { pick: "Don't ship" } })
    const elsewhere = await dirWith('somewhere-else', interleaved({ unit: 'other', round: 5 }))
    const { code } = await build(elsewhere.path, [feedbackPath])
    expect(root).toBeDefined()
    expect(code).toBe(EXIT_REFUSED)
  })

  it('refuses when the earlier round picked an option the PR does not implement', async () => {
    const { root } = await answeredRound({ depth: { pick: 'depth-y' } })
    const { code, lines } = await build(await nextRound(root))
    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toContain('picked "depth-y", but the PR implements "depth-x"')
  })

  it('refuses when an earlier answer about the PR carries free text', async () => {
    const { root } = await answeredRound({ depth: { pick: 'depth-x', comment: 'tighten it' } })
    const { code, lines } = await build(await nextRound(root))
    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toContain('question depth: has a written comment')
  })

  it('offers Ship when every earlier answer is the implemented option with no text', async () => {
    const { root } = await answeredRound({ depth: { pick: 'depth-x' }, 'ship-7': { pick: 'Ship' } })
    expect((await build(await nextRound(root))).code).toBe(0)
  })

  it('offers Ship when the earlier round agreed', async () => {
    const { root } = await answeredRound({ 'ship-7': { pick: 'Ship', agreed: true } })
    const next = await nextRound(root)
    expect((await build(next)).code).toBe(0)
    expect(await readdir(join(root, 'round-2'))).toContain('round.json')
  })

  it('offers Ship at a new head after a fix round', async () => {
    const { root } = await answeredRound({ 'ship-7': { pick: "Don't ship" } })
    const next = await nextRound(root, '9'.repeat(40))
    expect((await build(next)).code).toBe(0)
  })

  it('refuses a feedback file that did not answer the round.json beside it', async () => {
    const { root, feedbackPath } = await answeredRound({ 'ship-7': { pick: 'Ship' } })
    const feedback = await readJson(feedbackPath)
    await writeFile(feedbackPath, JSON.stringify({ ...feedback, manifestSha256: '0'.repeat(64) }))
    await expect(build(await nextRound(root), [feedbackPath])).rejects.toThrow(
      /did not answer the round.json beside it/
    )
  })
})

describe('builder rules: an existing round', () => {
  const batch10 = async () =>
    JSON.parse(
      await readFile(
        new URL('./fixtures/drafts/gate2-batch-10-round-1.json', import.meta.url),
        'utf8'
      )
    ) as ManifestInput

  it('groups the gate2-batch-10 draft with every Ship last in its PR group', async () => {
    const draft = await batch10()
    const round = RoundSchema.parse(applyRoundRules(draft))
    const titles: string[] = round.sections!.map((s) => s.title)
    for (const q of round.questions) {
      if (q.kind !== 'pick-one' || !q.merge) continue
      const pr = q.merge.pr
      const group = titles.flatMap((t, i) => (t.startsWith(`#${pr} `) ? [i] : []))
      const shipAt = round.sections!.findIndex((s) => s.questionIds.includes(q.id))
      expect(shipAt).toBe(Math.max(...group))
    }
    expect(round.questions.map((q) => q.id)).toEqual(draft.questions.map((q) => q.id))
    const shipQuestions = round.questions.filter((q) => q.kind === 'pick-one' && q.merge)
    expect(shipQuestions.length).toBeGreaterThan(10)
    for (const q of shipQuestions) expect(q.prompt).toMatch(/^SHIP: /)
    expect(round.questions.find((q) => q.id === 'r1-rule')?.prompt).toMatch(/^ITERATION: /)
  })

  it('refuses to build it: its picks share one spread of frames (item 136)', async () => {
    const draft = await batch10()
    const stories = draft.variants.flatMap((v) => ('storyId' in v && v.storyId ? [v.storyId] : []))
    vi.stubGlobal('fetch', async () =>
      Response.json({ entries: Object.fromEntries(stories.map((id) => [id, {}])) })
    )
    const { path } = await dirWith('round-1', draft)
    await expect(build(path)).rejects.toThrow(
      /unanchored-question: question r1-rule: it decides something its section shows; name its frames/
    )
  })
})
