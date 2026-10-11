import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXIT_REFUSED, buildRound, contrastProblem, type TreeGit } from '../src/build.ts'
import { applyRoundRules } from '../src/round-rules.ts'
import { ReviewError, loadRound } from '../src/review.ts'
import { MANIFEST_SCHEMA_ID, type ManifestInput } from '@titan-design/review-schema'
import { SECTION_TEXTS, noTreeGit } from './fixtures.ts'

const TREE = '/checkouts/storybook-tree'
const MAIN = '0'.repeat(40)
const MERGE = 'f'.repeat(40)
const HEADS = { 7: '1'.repeat(40), 8: '2'.repeat(40) }

/** A tree whose HEAD is `head` and whose history holds exactly `commits`. */
function stubTree(head: string, commits: string[]): TreeGit {
  return {
    revParse: async (tree, ref) => {
      expect(tree).toBe(TREE)
      return ref === 'HEAD' ? head : MAIN
    },
    isAncestor: async (_tree, sha, of) => of === head && commits.includes(sha),
  }
}

function shipPage(pr: keyof typeof HEADS) {
  const page = `owner/name#${pr}`
  return {
    question: {
      id: `ship-${pr}`,
      kind: 'pick-one' as const,
      prompt: `Ship ${page}?`,
      options: ['Ship', "Don't ship"],
      required: true,
      signsOff: `the change in ${page}`,
      page,
      merge: { repo: 'owner/name', pr, headSha: HEADS[pr], ship: ['Ship'] },
    },
    section: { id: `pr-${pr}`, title: page, ...SECTION_TEXTS, questionIds: [`ship-${pr}`] },
  }
}

function draft(prs: (keyof typeof HEADS)[], extra: Partial<ManifestInput> = {}): ManifestInput {
  const pages = prs.map(shipPage)
  const plain = { id: 'd1', kind: 'text' as const, prompt: 'Anything to change?' }
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'tp-1845-unit',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: [],
    questions: [plain, ...pages.map((p) => p.question)],
    sections: [
      { id: 'notes', title: 'Notes', ...SECTION_TEXTS, questionIds: ['d1'] },
      ...pages.map((p) => p.section),
    ],
    ...extra,
  }
}

async function setup(input: ManifestInput) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-build-'))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  return { dir, path }
}

async function build(path: string, git: TreeGit, tree?: string) {
  const lines: string[] = []
  const io = { stderr: (t: string) => lines.push(t), measure: async () => [], git }
  const code = await buildRound(path, undefined, io, { tree })
  return { code, lines }
}

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'))

describe('titan-review build --tree', () => {
  it('a bound head absent from the tree refuses the build', async () => {
    const { dir, path } = await setup(draft([7]))
    const { code, lines } = await build(path, stubTree(MERGE, [HEADS[8]]), TREE)
    expect(code).toBe(EXIT_REFUSED)
    expect(lines).toEqual([
      `refused: owner/name#7 at ${HEADS[7]} (ship-7) is not in ${TREE} at HEAD ${MERGE}`,
      'refused: round.json not written',
    ])
    expect(await readdir(dir)).toEqual(['draft.json'])
  })

  it("the build records the tree's merge sha", async () => {
    const { dir, path } = await setup(draft([8]))
    const before = await readFile(path)
    const { code } = await build(path, stubTree(MERGE, [HEADS[7], HEADS[8]]), TREE)
    expect(code).toBe(0)
    const { build: provenance, ...rest } = await readJson(join(dir, 'round.json'))
    expect(provenance).toEqual({ mainSha: MAIN, mergeSha: MERGE })
    expect(rest).toEqual(applyRoundRules(JSON.parse(before.toString('utf8'))))
    expect((await readFile(path)).equals(before)).toBe(true)
  })

  it('a rebuild at the same heads rewrites build only', async () => {
    const { dir, path } = await setup(draft([7]))
    await build(path, stubTree(MERGE, [HEADS[7]]), TREE)
    const first = await readJson(join(dir, 'round.json'))
    const rebuilt = 'e'.repeat(40)
    expect((await build(path, stubTree(rebuilt, [HEADS[7]]), TREE)).code).toBe(0)
    const second = await readJson(join(dir, 'round.json'))
    expect(second).toEqual({ ...first, build: { mainSha: MAIN, mergeSha: rebuilt } })
  })

  it('a round with bindings and no tree is refused', async () => {
    const { dir, path } = await setup(draft([7]))
    const { code, lines } = await build(path, noTreeGit)
    expect(code).toBe(EXIT_REFUSED)
    expect(lines[0]).toBe(
      "refused: a PR head is bound by ship-7; pass --tree <path>, the Storybook's tree"
    )
    expect(await readdir(dir)).toEqual(['draft.json'])
  })

  it('a round with no bindings builds without a tree', async () => {
    const { dir, path } = await setup(draft([]))
    const { code } = await build(path, noTreeGit)
    expect(code).toBe(0)
    expect(await readJson(join(dir, 'round.json'))).toEqual(
      applyRoundRules(JSON.parse(await readFile(path, 'utf8')))
    )
  })

  it('a round built with a tree serves: contrast.json records the bytes written', async () => {
    const { dir, path } = await setup(draft([7]))
    await build(path, stubTree(MERGE, [HEADS[7]]), TREE)
    const roundPath = join(dir, 'round.json')
    const served = await loadRound(roundPath)
    expect(served.manifest.build).toEqual({ mainSha: MAIN, mergeSha: MERGE })
    expect(await contrastProblem(roundPath, served.manifestSha256)).toBeNull()
  })

  it('renders the static frames for the bytes round.json gets, only once the gate passes', async () => {
    const { dir, path } = await setup(draft([7]))
    const rendered: { dir: string; sha: string }[] = []
    const io = {
      stderr: () => {},
      measure: async () => [],
      renderFrames: async (round: { manifestSha256: string }, roundDir: string) => {
        rendered.push({ dir: roundDir, sha: round.manifestSha256 })
        return {
          schema: 'titan-review/frames@1' as const,
          unit: 'u',
          round: 1,
          storybookUrl: '',
          frames: [],
        }
      },
      git: stubTree(MERGE, [HEADS[7]]),
    }
    expect(await buildRound(path, undefined, io, { tree: TREE })).toBe(0)
    const roundSha = createHash('sha256')
      .update(await readFile(join(dir, 'round.json')))
      .digest('hex')
    expect(rendered).toEqual([{ dir, sha: roundSha }])
    const refused = await buildRound(
      path,
      undefined,
      { ...io, git: stubTree(MERGE, []) },
      { tree: TREE }
    )
    expect(refused).toBe(EXIT_REFUSED)
    expect(rendered).toHaveLength(1)
  })

  it('a draft that already carries build is refused', async () => {
    const { path } = await setup(draft([], { build: { mainSha: MAIN, mergeSha: MERGE } }))
    const built = build(path, stubTree(MERGE, []), TREE)
    await expect(built).rejects.toThrow(ReviewError)
    await expect(built).rejects.toThrow('a draft never carries build')
  })
})
