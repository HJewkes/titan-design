import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXIT_REFUSED, buildRound, type BuildIo, type TreeGit } from '../src/build.ts'
import { prepareLockBuild, recordedShips, type FootprintReader } from '../src/locks-build.ts'
import { runCli } from '../src/run.ts'
import type { PriorRound } from '../src/ship-gate.ts'
import {
  MANIFEST_SCHEMA_ID,
  RoundSchema,
  type Feedback,
  type ManifestInput,
} from '@titan-design/review-schema'
import { SECTION_TEXTS } from './fixtures.ts'
import { locksCliIo } from './fixtures/locks/cli.ts'

// The round builder against the synthetic registry: L-0001 (planes) is held by #101; #102 edits
// a locked token and #103 only edits a component that reads one.

type Touches = NonNullable<ManifestInput['questions'][number]['touches']>

const REGISTRY = new URL('./fixtures/locks/registry.json', import.meta.url).pathname
const REPO = 'example/design'
const TREE = '/checkouts/storybook-tree'
const MAIN = '0'.repeat(40)
const HOLDER = 'a'.repeat(40)
const DEPENDENT = 'b'.repeat(40)
const STACKED = 'd'.repeat(40)
const READER = 'e'.repeat(40)
const MERGE = 'f'.repeat(40)
const SELECT = 'packages/ui/src/components/ui/select/Select.tsx'
/** A component L-0002, which comes after L-0001, declares. */
const INPUT = 'packages/ui/src/components/ui/input/Input.tsx'

const history: Record<string, string[]> = {
  [MERGE]: [MAIN, HOLDER, DEPENDENT, STACKED, READER],
  [STACKED]: [MAIN, HOLDER],
  [DEPENDENT]: [MAIN],
  [READER]: [MAIN],
}

/** A tree at `head` whose commits' histories are `history`. */
function stubTree(head = MERGE, commits = history): TreeGit {
  return {
    revParse: async (tree, ref) => {
      expect(tree).toBe(TREE)
      return ref === 'HEAD' ? head : MAIN
    },
    isAncestor: async (_tree, sha, of) => sha === of || (commits[of] ?? []).includes(sha),
  }
}

const footprints: Record<string, { tokens: { name: string; mode: 'light' }[]; files: string[] }> = {
  [HOLDER]: {
    tokens: [
      { name: 'surface-base', mode: 'light' },
      { name: 'text-secondary', mode: 'light' },
    ],
    files: ['packages/ui/src/theme/global.css', INPUT],
  },
  [DEPENDENT]: { tokens: [{ name: 'text-secondary', mode: 'light' }], files: [SELECT] },
  [STACKED]: { tokens: [{ name: 'text-secondary', mode: 'light' }], files: [SELECT] },
  [READER]: { tokens: [], files: [SELECT] },
}

/** Footprints by head, read in the tree against origin/main or the holder head stacked on. */
const footprint: FootprintReader = async (opts) => {
  expect(opts.repo).toBe(TREE)
  expect(opts.base).toBe('origin/main')
  const fp = footprints[opts.head!]
  if (!fp) throw new Error(`no footprint for ${opts.head}`)
  return {
    derivedFrom: { mainSha: MAIN, headSha: opts.head! },
    ...fp,
    components: { direct: [], readers: [], rendersCount: 0 },
  }
}

const pageOf = (pr: number) => `${REPO}#${pr}`

function ship(pr: number, head: string) {
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

const frame = (key: string) => ({ key, storyId: `lab-${key}--default`, label: `Frame ${key}` })

function section(pr: number, variantKeys: string[]) {
  return {
    id: `pr-${pr}`,
    title: `#${pr}`,
    ...SECTION_TEXTS,
    kind: 'STATES' as const,
    questionIds: [`ship-${pr}`],
    variantKeys,
  }
}

interface Group {
  pr: number
  head: string
  stackedOn?: { pr: number; head: string }
}

const prGroup = (g: Group) => ({
  pr: pageOf(g.pr),
  headSha: g.head,
  sectionIds: [`pr-${g.pr}`],
  ...(g.stackedOn && { stackedOn: { repo: REPO, pr: g.stackedOn.pr, headSha: g.stackedOn.head } }),
})

/** PR groups in the order given, one frame and one Ship each; `extra` adds loose questions. */
function draft(groups: Group[], extra: Partial<ManifestInput> = {}): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'locks-unit',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: groups.map((g) => frame(`f${g.pr}`)),
    questions: groups.map((g) => ship(g.pr, g.head)),
    sections: groups.map((g) => section(g.pr, [`f${g.pr}`])),
    ...(groups.length && { prGroups: groups.map(prGroup) }),
    ...extra,
  }
}

const holder: Group = { pr: 101, head: HOLDER }
/** Draft 4a: the dependent at its own head on main, beside the holder. */
const unstacked = () => draft([{ pr: 102, head: DEPENDENT }, holder])
/** Draft 4b: the same dependent rebased on the holder head. */
const stacked = () =>
  draft([{ pr: 102, head: STACKED, stackedOn: { pr: 101, head: HOLDER } }, holder])

async function setup(input: ManifestInput) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-locks-build-'))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  return { dir, path }
}

async function build(path: string, git: TreeGit = stubTree(), tree: string | null = TREE) {
  const lines: string[] = []
  const io: BuildIo = { stderr: (t) => lines.push(t), measure: async () => [], git, footprint }
  const options = { locks: REGISTRY, ...(tree !== null && { tree }) }
  const code = await buildRound(path, undefined, io, options)
  return { code, lines }
}

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'))

beforeEach(() => {
  const ids = [101, 102, 103].map((pr) => `lab-f${pr}--default`)
  const entries = Object.fromEntries(ids.map((id) => [id, {}]))
  vi.stubGlobal('fetch', async () => Response.json({ entries }))
})
afterEach(() => vi.unstubAllGlobals())

describe('titan-review build --locks', () => {
  it('refuses the unstacked dependent as superseded-state, printing it like a lint problem', async () => {
    const { dir, path } = await setup(unstacked())

    const { code, lines } = await build(path)

    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toMatch(/^refused: the round fails the lock checks:\n {2}superseded-state: /)
    expect(lines[0]).toContain('#102 overlaps L-0001 (#101 at aaaaaaa) on text-secondary/light')
    expect(lines.at(-1)).toBe('refused: round.json not written')
    expect(await readdir(dir)).toEqual(['draft.json'])
  })

  it('writes round.json for the stacked dependent, holder group first, its frames labelled', async () => {
    const { dir, path } = await setup(stacked())

    const { code, lines } = await build(path)

    expect(code).toBe(0)
    expect(lines.some((l) => l.startsWith('refused'))).toBe(false)
    const round = await readJson(join(dir, 'round.json'))
    expect(round.sections.map((s: { id: string }) => s.id)).toEqual(['pr-101', 'pr-102'])
    expect(round.variants).toEqual([
      {
        key: 'f102',
        storyId: 'lab-f102--default',
        label: 'rendered with decided #101: Frame f102',
      },
      { key: 'f101', storyId: 'lab-f101--default', label: 'Frame f101' },
    ])
    expect(round.build).toEqual({ mainSha: MAIN, mergeSha: MERGE })
  })

  it('yields the same round.json when run twice, and the lock rule is idempotent', async () => {
    const { dir, path } = await setup(stacked())
    await build(path)
    const first = await readFile(join(dir, 'round.json'))

    await build(path)

    expect((await readFile(join(dir, 'round.json'))).equals(first)).toBe(true)
    const prepared = await prepareLockBuild({
      draft: stacked(),
      registryPath: REGISTRY,
      tree: TREE,
      priors: [],
      git: stubTree(),
      footprint,
    })
    if ('refusal' in prepared) throw new Error(prepared.refusal.join('\n'))
    const once = prepared.rule(stacked())
    expect(prepared.rule(once)).toEqual(once)
    expect(once.sections?.map((s) => s.id)).toEqual(['pr-101', 'pr-102'])
  })

  it('refuses a render overlap whose holder head the tree lacks (lock-head-missing)', async () => {
    const reader = draft([{ pr: 103, head: READER }])
    const { dir, path } = await setup(reader)
    const without = { ...history, [MERGE]: [MAIN, READER] }

    const { code, lines } = await build(path, stubTree(MERGE, without))

    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toContain(
      `  lock-head-missing: #103 overlaps L-0001 on files ${SELECT}, but its holder #101 at aaaaaaa is not in the tree at HEAD fffffff`
    )
    expect(await readdir(dir)).toEqual(['draft.json'])
  })

  it('does not bind a holder to a lock downstream of its own, even when that holder head is absent', async () => {
    const registry = JSON.parse(await readFile(REGISTRY, 'utf8'))
    registry.locks[1].holders = [{ pr: 105, headSha: 'c'.repeat(40) }]
    const { dir, path } = await setup(draft([holder]))
    await writeFile(join(dir, 'locks.json'), JSON.stringify(registry))
    const lines: string[] = []
    const io: BuildIo = {
      stderr: (t) => lines.push(t),
      measure: async () => [],
      git: stubTree(),
      footprint,
    }

    const code = await buildRound(path, undefined, io, {
      tree: TREE,
      locks: join(dir, 'locks.json'),
    })

    expect(code).toBe(0)
    expect(lines.some((l) => l.startsWith('refused'))).toBe(false)
    expect((await readJson(join(dir, 'round.json'))).variants[0].label).toBe('Frame f101')
  })

  it('builds a render overlap when the tree holds the holder head, labelling its frames', async () => {
    const { dir, path } = await setup(draft([{ pr: 103, head: READER }]))

    const { code } = await build(path)

    expect(code).toBe(0)
    const round = await readJson(join(dir, 'round.json'))
    expect(round.variants[0].label).toBe('rendered with decided #101: Frame f103')
  })

  it('refuses a question that asks a decided row again (re-ask), and warns on one that declares nothing', async () => {
    const asks = (id: string, touches?: Touches) => ({
      id,
      kind: 'pick-one' as const,
      prompt: `Which ${id}?`,
      options: [`${id}-a`, `${id}-b`],
      implemented: `${id}-a`,
      required: true,
      signsOff: id,
      decision: 'decide' as const,
      ...(touches && { touches }),
    })
    const again = asks('focus-again', { tokens: [{ name: 'border-input-focus', mode: 'light' }] })
    const silent = asks('silent')
    const input = draft([holder], {
      questions: [again, silent, ship(101, HOLDER)],
      sections: [
        {
          id: 'loose',
          title: 'Decisions',
          ...SECTION_TEXTS,
          questionIds: ['focus-again', 'silent'],
        },
        section(101, ['f101']),
      ],
    })
    const { path } = await setup(input)

    const { code, lines } = await build(path)

    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toBe(
      'warning: question silent is on no PR page and declares no touches, so it is not checked against the locks'
    )
    expect(lines[1]).toContain(
      '  re-ask: question focus-again asks again what L-0002 decided (border-input-focus/light)'
    )
  })

  it('needs --tree to read the heads of a draft that holds a PR', async () => {
    const { path } = await setup(stacked())

    const { code, lines } = await build(path, stubTree(), null)

    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toBe('refused: --locks reads each PR head in the tree; pass --tree <path>')
  })

  it('refuses a dependent rendered at a head other than its last recorded Ship (stale-ship)', async () => {
    const shipped = RoundSchema.parse(draft([{ pr: 102, head: DEPENDENT }, holder]))
    const feedback = {
      answers: [{ questionId: 'ship-102', pick: 'Ship' }],
    } as unknown as Feedback
    const prior: PriorRound = { feedbackPath: '/prior/feedback.json', manifest: shipped, feedback }
    const next = { ...stacked(), round: 2, questions: [ship(101, HOLDER)] }
    next.sections = [section(101, ['f101']), { ...section(102, ['f102']), questionIds: [] }]

    expect(
      recordedShips(next, [prior], [{ key: pageOf(102), pr: 102, head: STACKED, base: HOLDER }])
    ).toEqual([
      { pr: 102, head: DEPENDENT },
      { pr: 101, head: HOLDER },
    ])
    const prepared = await prepareLockBuild({
      draft: next,
      registryPath: REGISTRY,
      tree: TREE,
      priors: [prior],
      git: stubTree(),
      footprint,
    })
    if ('refusal' in prepared) throw new Error(prepared.refusal.join('\n'))
    const problems = await prepared.problems(MERGE)
    expect(problems.map((p) => p.rule)).toEqual(['stale-ship'])
    expect(problems[0]!.message).toContain(
      '#102 was shipped at bbbbbbb but the round plans ddddddd'
    )
  })
})

describe('the --locks flag', () => {
  const env = process.env.TITAN_LOCKS_REGISTRY
  afterEach(() => {
    if (env === undefined) delete process.env.TITAN_LOCKS_REGISTRY
    else process.env.TITAN_LOCKS_REGISTRY = env
  })

  it('takes a path, or bare reads the env var, and is a usage error with neither', async () => {
    const question = {
      id: 'again',
      kind: 'pick-one' as const,
      prompt: 'Again?',
      options: ['a', 'b'],
      required: true,
      signsOff: 'again',
      touches: { tokens: [{ name: 'divider', mode: 'light' as const }] },
    }
    const loose = { id: 'loose', title: 'Decisions', ...SECTION_TEXTS, questionIds: ['again'] }
    const { path } = await setup(draft([], { questions: [question], sections: [loose] }))
    const out: string[] = []
    const io = locksCliIo(out)

    delete process.env.TITAN_LOCKS_REGISTRY
    expect(await runCli(['build', path, '--locks'], io)).toBe(2)
    expect(out.at(-1)).toMatch(/--locks needs a registry path/)

    expect(await runCli(['build', path, '--locks', REGISTRY], io)).toBe(EXIT_REFUSED)
    expect(out.at(-2)).toContain(
      're-ask: question again asks again what L-0004 decided (divider/light)'
    )

    process.env.TITAN_LOCKS_REGISTRY = REGISTRY
    expect(await runCli(['build', path, '--locks'], io)).toBe(EXIT_REFUSED)
    expect(await runCli(['build', path], io)).toBe(0)
  })
})
