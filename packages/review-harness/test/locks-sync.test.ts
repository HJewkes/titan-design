import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseLocks } from '@titan-design/review-schema'
import { describe, expect, it } from 'vitest'
import { GLOBAL_CSS, TAILWIND_CONFIG } from '../src/locks-footprint.ts'
import { PR_STATE_FIELDS, formatSync, type PrState } from '../src/locks-sync.ts'
import { lockSync, type LocksIo } from '../src/locks.ts'
import { runCli } from '../src/run.ts'
import { locksCliIo } from './fixtures/locks/cli.ts'
import { ALERT, SELECT, TABS, css, sources, tailwindConfig } from './fixtures/locks/sources.ts'

const REGISTRY_URL = new URL('./fixtures/locks/registry.json', import.meta.url)
const registry = () => parseLocks(JSON.parse(readFileSync(REGISTRY_URL, 'utf8')))
const REPO = '/repo'
const MAIN = '0'.repeat(40)
const HOLDER_HEAD = 'a'.repeat(40)
const NEW_HEAD = 'e'.repeat(40)
const DEP_HEAD = '2'.repeat(40)
const FAMILY_HEAD = 'c'.repeat(40)
const MERGE = 'f'.repeat(40)

const open = (head: string, branch: string, base = 'main'): PrState => ({
  state: 'OPEN',
  headRefOid: head,
  headRefName: branch,
  baseRefName: base,
  mergeCommit: null,
  mergedAt: null,
})

/** #101 holds L-0001; #102 is stacked on it; #103 defers; #104 holds L-0003, which #105 stacks on. */
function prs(holder: Partial<PrState>): Record<number, PrState> {
  return {
    101: { ...open(HOLDER_HEAD, 'feat/planes'), ...holder },
    102: open(DEP_HEAD, 'feat/select', 'feat/planes'),
    103: open('3'.repeat(40), 'feat/later'),
    104: open(FAMILY_HEAD, 'feat/family'),
    105: open('5'.repeat(40), 'feat/pill', 'feat/family'),
  }
}

/**
 * git for two derivations: #101 fast-forwarded from its recorded head to a new one that merged
 * main, and #102, stacked on the recorded head, which merged the same main. #102 then has two
 * best merge-bases with the holder branch (the recorded head and main's tip), and git names main.
 */
const gitReplies: Record<string, string> = {
  [`rev-parse --verify ${NEW_HEAD}^{commit}`]: NEW_HEAD,
  [`rev-parse --verify ${DEP_HEAD}^{commit}`]: DEP_HEAD,
  [`merge-base origin/main ${NEW_HEAD}`]: MAIN,
  [`rev-parse --verify --quiet ${HOLDER_HEAD}^{commit}`]: HOLDER_HEAD,
  [`rev-parse --verify --quiet ${NEW_HEAD}^{commit}`]: NEW_HEAD,
  [`merge-base origin/feat/planes ${DEP_HEAD}`]: MAIN,
  [`merge-base ${HOLDER_HEAD} ${DEP_HEAD}`]: HOLDER_HEAD,
  [`merge-base ${NEW_HEAD} ${DEP_HEAD}`]: MAIN,
  [`rev-list --count ${MAIN}..${DEP_HEAD}`]: '9',
  [`rev-list --count ${HOLDER_HEAD}..${DEP_HEAD}`]: '2',
  [`diff --name-only ${MAIN} ${NEW_HEAD}`]: [GLOBAL_CSS, ALERT].join('\n'),
  [`diff --name-only ${HOLDER_HEAD} ${DEP_HEAD}`]: [SELECT, TABS].join('\n'),
  [`show ${MAIN}:${GLOBAL_CSS}`]: css('base'),
  [`show ${NEW_HEAD}:${GLOBAL_CSS}`]: css('head'),
  [`show ${HOLDER_HEAD}:${GLOBAL_CSS}`]: css('head'),
  [`show ${DEP_HEAD}:${GLOBAL_CSS}`]: css('head'),
  [`show ${NEW_HEAD}:${TAILWIND_CONFIG}`]: tailwindConfig(),
  [`show ${DEP_HEAD}:${TAILWIND_CONFIG}`]: tailwindConfig(),
}

function fakeIo(states: Record<number, PrState>) {
  const calls: string[][] = []
  const files = sources()
  const io: LocksIo = {
    gh: async (repo, args) => {
      expect(repo).toBe(REPO)
      calls.push(['gh', ...args])
      expect(args.slice(0, 2)).toEqual(['pr', 'view'])
      const pr = states[Number(args[2])]!
      if (args[4] === PR_STATE_FIELDS) return JSON.stringify(pr)
      return JSON.stringify({ baseRefName: pr.baseRefName, headRefOid: pr.headRefOid })
    },
    git: async (_repo, args) => {
      calls.push(args)
      if (args[0] === 'fetch') return ''
      if (args[0] === 'ls-tree') return [...files.keys()].join('\n')
      const reply = gitReplies[args.join(' ')]
      if (reply === undefined) throw new Error(`unexpected git ${args.join(' ')}`)
      return reply
    },
    gitBatch: async (_repo, args, stdin) => {
      calls.push(args)
      const paths = stdin
        .trimEnd()
        .split('\n')
        .map((l) => l.slice(l.indexOf(':') + 1))
      return Buffer.concat(
        paths.map((p) => {
          const body = Buffer.from(files.get(p)!, 'utf8')
          return Buffer.concat([Buffer.from(`x blob ${body.length}\n`), body, Buffer.from('\n')])
        })
      )
    },
  }
  return { io, calls }
}

/** No call sync makes may write: gh only views, git only reads and fetches. */
function expectReadOnly(calls: string[][]) {
  const verbs = new Set(calls.map((c) => (c[0] === 'gh' ? `gh ${c[1]} ${c[2]}` : c[0])))
  for (const verb of verbs)
    expect([
      'gh pr view',
      'fetch',
      'rev-parse',
      'merge-base',
      'rev-list',
      'diff',
      'show',
      'ls-tree',
      'cat-file',
    ]).toContain(verb)
}

describe('lockSync', () => {
  it('marks a merged holder merged and prints the retarget and release, running neither', async () => {
    const merged = {
      state: 'MERGED' as const,
      mergeCommit: { oid: MERGE },
      mergedAt: '2026-01-02T03:04:05Z',
    }
    const { io, calls } = fakeIo(prs(merged))

    const report = await lockSync(registry(), REPO, io)

    const l1 = report.locks.find((l) => l.lock === 'L-0001')!
    expect(l1).toMatchObject({
      newStatus: 'merged',
      mergeSha: MERGE,
      closedAt: '2026-01-02T03:04:05Z',
    })
    expect(l1.holders[0]).toMatchObject({ pr: 101, event: 'merged', mergeSha: MERGE })
    expect(l1.commands).toEqual([
      'gh pr edit 102 --base main',
      'titan-factory shepherd release example/design#102',
    ])
    expect(l1.notes).toContain('#103 was deferred on L-0001 and re-enters')
    expect(l1.edits[0]).toContain(`L-0001: status open -> merged, mergeSha ${MERGE}`)
    expect(report.locks.find((l) => l.lock === 'L-0003')!.commands).toEqual([])
    expect(calls.filter((c) => c[0] !== 'gh')).toEqual([])
    expectReadOnly(calls)
  })

  it('re-derives a fast-forwarded holder and diffs a stacked dependent from the recorded head', async () => {
    const states = prs({ headRefOid: NEW_HEAD })
    const { io, calls } = fakeIo({ ...states, 103: { ...states[103]!, state: 'CLOSED' } })

    const report = await lockSync(registry(), REPO, io)

    const l1 = report.locks.find((l) => l.lock === 'L-0001')!
    const holder = l1.holders[0]!
    expect(l1.newStatus).toBeUndefined()
    expect(holder).toMatchObject({ event: 'new-head', headSha: HOLDER_HEAD, newHeadSha: NEW_HEAD })
    expect(holder.footprint!.derivedFrom).toEqual({ mainSha: MAIN, headSha: NEW_HEAD })
    expect(holder.footprint!.tokens.map((t) => `${t.name}/${t.mode}`)).toContain(
      'text-secondary/light'
    )
    expect(holder.dependents).toEqual([
      { pr: 102, mode: 'stack-on', files: [], tokens: [], readers: [SELECT, TABS], changed: true },
    ])
    expect(l1.commands).toEqual([])
    expect(l1.edits).toEqual([expect.stringMatching(/holder #101: headSha aaaaaaa -> eeeeeee/)])
    expect(calls.some((c) => c[0] === 'gh' && c[2] === '105' && c[4] !== PR_STATE_FIELDS)).toBe(
      false
    )
    expectReadOnly(calls)
  })

  it('releases a lock whose only holder closed, and leaves the stacked rebase to its seat', async () => {
    const { io } = fakeIo(prs({ state: 'CLOSED' }))

    const report = await lockSync(registry(), REPO, io)

    const l1 = report.locks.find((l) => l.lock === 'L-0001')!
    expect(l1.newStatus).toBe('released')
    expect(l1.commands).toEqual([])
    expect(l1.notes).toContain(
      '#102 is stacked on a closed holder: rebase it onto main, then run ' +
        'gh pr edit 102 --base main and titan-factory shepherd release example/design#102'
    )
  })
})

describe('titan-review locks sync', () => {
  it('prints the text report with every command under "not run", and --json the report', async () => {
    const merged = {
      state: 'MERGED' as const,
      mergeCommit: { oid: MERGE },
      mergedAt: '2026-01-02T03:04:05Z',
    }
    const { io } = fakeIo(prs(merged))
    const out: string[] = []
    const cli = locksCliIo(out, io)
    const args = ['locks', 'sync', '--registry', fileURLToPath(REGISTRY_URL), '--repo', REPO]

    expect(await runCli(args, cli)).toBe(0)
    expect(await runCli([...args, '--json'], cli)).toBe(0)

    expect(out[0]).toContain('L-0001 (open -> merged)')
    expect(out[0]).toContain('Commands (not run):\ngh pr edit 102 --base main\n')
    expect(JSON.parse(out[1]!).locks[0].newStatus).toBe('merged')
  })

  it('says so when no open lock has a holder', () => {
    expect(formatSync({ repo: 'example/design', locks: [] })).toMatch(/nothing to sync/)
  })
})
