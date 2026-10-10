import { describe, expect, it } from 'vitest'
import { GLOBAL_CSS } from '../src/locks-footprint.ts'
import { isComponentSource, lockFootprint, parseBatch, type LocksIo } from '../src/locks.ts'
import { runCli, type CliIo } from '../src/run.ts'
import { ALERT, SELECT, css, sources } from './fixtures/locks/sources.ts'

const MAIN = '0'.repeat(40)
const HEAD = '1'.repeat(40)
const REPO = '/repo'
const SELECT_TEST = SELECT.replace('.tsx', '.test.tsx')

/** `git cat-file --batch` output for the files asked for, in the order asked. */
function batchOutput(stdin: string, files: Map<string, string>): Buffer {
  const parts = stdin
    .trimEnd()
    .split('\n')
    .map((line) => line.slice(line.indexOf(':') + 1))
    .map((path) => {
      const text = files.get(path)
      if (text === undefined) return Buffer.from(`${path} missing\n`)
      const body = Buffer.from(text, 'utf8')
      return Buffer.concat([Buffer.from(`abc blob ${body.length}\n`), body, Buffer.from('\n')])
    })
  return Buffer.concat(parts)
}

function fakeIo(files = sources()) {
  const calls: string[][] = []
  const batches: string[] = []
  const replies: Record<string, string> = {
    [`rev-parse --verify ${HEAD}^{commit}`]: HEAD,
    [`rev-parse --verify feat/x^{commit}`]: HEAD,
    [`merge-base origin/main ${HEAD}`]: MAIN,
    [`diff --name-only ${MAIN} ${HEAD}`]: [GLOBAL_CSS, ALERT].join('\n'),
    [`show ${MAIN}:${GLOBAL_CSS}`]: css('base'),
    [`show ${HEAD}:${GLOBAL_CSS}`]: css('head'),
    [`ls-tree -r --name-only ${HEAD} -- packages/ui/src/components/`]: [
      ...files.keys(),
      SELECT_TEST,
    ].join('\n'),
  }
  const io: LocksIo = {
    git: async (repo, args) => {
      expect(repo).toBe(REPO)
      calls.push(args)
      const key = args.join(' ')
      if (!(key in replies)) throw new Error(`unexpected git ${key}`)
      return replies[key]!
    },
    gitBatch: async (_repo, args, stdin) => {
      calls.push(args)
      batches.push(stdin)
      return batchOutput(stdin, files)
    },
    gh: async (args) => {
      calls.push(['gh', ...args])
      return JSON.stringify({ baseRefName: 'main', headRefOid: HEAD })
    },
  }
  return { io, calls, batches }
}

describe('lockFootprint', () => {
  it('derives the footprint from merge-base(base, head)..head with --base and --head', async () => {
    const { io, calls, batches } = fakeIo()

    const footprint = await lockFootprint({ base: 'origin/main', head: 'feat/x', repo: REPO }, io)

    expect(footprint.derivedFrom).toEqual({ mainSha: MAIN, headSha: HEAD })
    expect(footprint.tokens.map((t) => `${t.name}/${t.mode}`)).toEqual([
      'surface-raised/light',
      'text-secondary/light',
    ])
    expect(footprint.components.readers).toContain(SELECT)
    expect(footprint.files).toEqual([ALERT, GLOBAL_CSS])
    expect(calls.some((c) => c[0] === 'gh' || c[0] === 'fetch')).toBe(false)
    expect(batches[0]).not.toContain(SELECT_TEST)
  })

  it('resolves a PR through gh read-only, fetches its base and head, and reads from the sha', async () => {
    const { io, calls } = fakeIo()
    const withFetch: LocksIo = {
      ...io,
      git: (repo, args) =>
        args[0] === 'fetch' ? (calls.push(args), Promise.resolve('')) : io.git(repo, args),
    }

    const footprint = await lockFootprint({ pr: '800', repo: REPO }, withFetch)

    expect(calls[0]).toEqual(['gh', 'pr', 'view', '800', '--json', 'baseRefName,headRefOid'])
    expect(calls[1]).toEqual(['fetch', '--quiet', 'origin', 'main', 'refs/pull/800/head'])
    expect(calls.filter((c) => c[0] === 'gh')).toHaveLength(1)
    expect(footprint.derivedFrom.headSha).toBe(HEAD)
  })

  it('refuses a half-given ref pair and a missing PR number', async () => {
    const { io } = fakeIo()

    await expect(lockFootprint({ base: 'origin/main', repo: REPO }, io)).rejects.toThrow(/--head/)
    await expect(lockFootprint({ repo: REPO }, io)).rejects.toThrow(/PR number/)
    await expect(lockFootprint({ pr: 'eight', repo: REPO }, io)).rejects.toThrow(/PR number/)
  })
})

describe('parseBatch', () => {
  it('reads sizes in bytes, so multibyte text does not shift the next entry', () => {
    const files = new Map([
      ['a.tsx', '<Text>× ▼</Text>'],
      ['b.tsx', 'plain'],
    ])
    const out = batchOutput('h:a.tsx\nh:missing.tsx\nh:b.tsx\n', files)

    expect(parseBatch(['a.tsx', 'missing.tsx', 'b.tsx'], out)).toEqual(files)
  })
})

describe('isComponentSource', () => {
  it('keeps component implementations and drops tests, stories, snapshots and other trees', () => {
    expect(isComponentSource(SELECT)).toBe(true)
    expect(isComponentSource('packages/ui/src/components/ui/select/selectModel.ts')).toBe(true)
    for (const path of [
      SELECT_TEST,
      SELECT.replace('.tsx', '.stories.tsx'),
      'packages/ui/src/components/ui/select/__snapshots__/Select.characterise.test.tsx.snap',
      'packages/ui/src/components/ui/select/README.md',
      'packages/ui/src/theme/tokens/semantic.ts',
      'packages/ui/src/lab/decisions/ramp-aa.ts',
    ])
      expect(isComponentSource(path), path).toBe(false)
  })
})

describe('titan-review locks footprint', () => {
  const cliIo = (locks: LocksIo, out: string[]): CliIo => ({
    stdout: (t) => out.push(t),
    stderr: (t) => out.push(`! ${t}`),
    openBrowser: () => {},
    capture: async () => [],
    measure: async () => [],
    git: { revParse: async () => HEAD, isAncestor: async () => true },
    createPage: () => ({ handler: () => {}, close: async () => {} }) as never,
    harnessFreshness: async () => ({ state: 'current' }),
    locks,
    signal: new AbortController().signal,
  })

  it('prints the footprint as JSON and exits 0', async () => {
    const out: string[] = []
    const args = ['locks', 'footprint', '--base', 'origin/main', '--head', HEAD, '--repo', REPO]

    expect(await runCli(args, cliIo(fakeIo().io, out))).toBe(0)

    const printed = JSON.parse(out.join('')) as { derivedFrom: unknown; tokens: unknown[] }
    expect(printed.derivedFrom).toEqual({ mainSha: MAIN, headSha: HEAD })
    expect(printed.tokens).toHaveLength(2)
  })

  it('is a usage error without a PR or refs, and for an unknown locks verb', async () => {
    const out: string[] = []
    const io = cliIo(fakeIo().io, out)

    expect(await runCli(['locks', 'footprint'], io)).toBe(2)
    expect(await runCli(['locks', 'open', '800'], io)).toBe(2)
    expect(out.join('\n')).toMatch(/PR number/)
  })
})
