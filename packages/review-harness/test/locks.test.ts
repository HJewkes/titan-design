import { LockFootprintSchema } from '@titan-design/review-schema'
import { describe, expect, it } from 'vitest'
import { GLOBAL_CSS, TAILWIND_CONFIG } from '../src/locks-footprint.ts'
import { isComponentSource, lockFootprint, parseBatch, type LocksIo } from '../src/locks.ts'
import { runCli, type CliIo } from '../src/run.ts'
import { ALERT, SELECT, TABS, css, sources, tailwindConfig } from './fixtures/locks/sources.ts'

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

type Replies = Record<string, string | Error>

function fakeIo(files = sources(), overrides: Replies = {}) {
  const calls: string[][] = []
  const batches: string[] = []
  const replies: Replies = {
    [`rev-parse --verify ${HEAD}^{commit}`]: HEAD,
    [`rev-parse --verify feat/x^{commit}`]: HEAD,
    [`merge-base origin/main ${HEAD}`]: MAIN,
    [`diff --name-only ${MAIN} ${HEAD}`]: [GLOBAL_CSS, ALERT].join('\n'),
    [`show ${MAIN}:${GLOBAL_CSS}`]: css('base'),
    [`show ${HEAD}:${GLOBAL_CSS}`]: css('head'),
    [`show ${HEAD}:${TAILWIND_CONFIG}`]: tailwindConfig(),
    [`ls-tree -r --name-only ${HEAD} -- packages/ui/src/components/`]: [
      ...files.keys(),
      SELECT_TEST,
    ].join('\n'),
    ...overrides,
  }
  const io: LocksIo = {
    git: async (repo, args) => {
      expect(repo).toBe(REPO)
      calls.push(args)
      const key = args.join(' ')
      if (!(key in replies)) throw new Error(`unexpected git ${key}`)
      const reply = replies[key]!
      if (reply instanceof Error) throw reply
      return reply
    },
    gitBatch: async (_repo, args, stdin) => {
      calls.push(args)
      batches.push(stdin)
      return batchOutput(stdin, files)
    },
    gh: async (repo, args) => {
      expect(repo).toBe(REPO)
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
      'space-inset-md/dark',
      'surface-raised/light',
      'text-secondary/light',
      'hairline-default/light',
      'space-inset-md/light',
    ])
    expect(footprint.components.readers).toEqual(expect.arrayContaining([SELECT, TABS]))
    expect(footprint.files).toEqual([ALERT, GLOBAL_CSS])
    expect(calls.some((c) => c[0] === 'gh' || c[0] === 'fetch')).toBe(false)
    expect(batches[0]).not.toContain(SELECT_TEST)
  })

  it('resolves a PR through gh read-only in the repo, fetches base and head, reads the sha', async () => {
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

  it('refuses a half-given ref pair, a missing PR number, and a PR given beside refs', async () => {
    const { io, calls } = fakeIo()

    await expect(lockFootprint({ base: 'origin/main', repo: REPO }, io)).rejects.toThrow(/--head/)
    await expect(lockFootprint({ repo: REPO }, io)).rejects.toThrow(/PR number/)
    await expect(lockFootprint({ pr: 'eight', repo: REPO }, io)).rejects.toThrow(/PR number/)
    await expect(
      lockFootprint({ pr: '800', base: 'origin/main', head: HEAD, repo: REPO }, io)
    ).rejects.toThrow(/not both/)
    expect(calls).toEqual([])
  })

  it('treats a path absent at a ref as empty, but surfaces any other git failure', async () => {
    const absent = new Error(`fatal: path '${GLOBAL_CSS}' does not exist in '${MAIN}'`)
    const added = fakeIo(sources(), { [`show ${MAIN}:${GLOBAL_CSS}`]: absent })
    const broken = fakeIo(sources(), {
      [`show ${MAIN}:${GLOBAL_CSS}`]: new Error('fatal: bad object'),
    })
    const opts = { base: 'origin/main', head: HEAD, repo: REPO }

    const footprint = await lockFootprint(opts, added.io)

    expect(footprint.tokens.every((t) => t.to && !t.from)).toBe(true)
    await expect(lockFootprint(opts, broken.io)).rejects.toThrow(/bad object/)
  })

  it('refuses a head without tailwind.config.js, since readers come from its theme', async () => {
    const absent = new Error(`fatal: path '${TAILWIND_CONFIG}' does not exist in '${HEAD}'`)
    const { io } = fakeIo(sources(), { [`show ${HEAD}:${TAILWIND_CONFIG}`]: absent })

    await expect(
      lockFootprint({ base: 'origin/main', head: HEAD, repo: REPO }, io)
    ).rejects.toThrow(/tailwind\.config\.js is missing/)
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
      'packages/ui/src/components/ui/table/Table.test-d.ts',
      'packages/ui/src/components/ui/table/types.d.ts',
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

  it('prints the footprint as JSON in the titan-locks/1 footprint shape and exits 0', async () => {
    const out: string[] = []
    const args = ['locks', 'footprint', '--base', 'origin/main', '--head', HEAD, '--repo', REPO]

    expect(await runCli(args, cliIo(fakeIo().io, out))).toBe(0)

    const printed = LockFootprintSchema.parse(JSON.parse(out.join('')))
    expect(printed.derivedFrom).toEqual({ mainSha: MAIN, headSha: HEAD })
    expect(printed.tokens).toHaveLength(5)
  })

  it('is a usage error without a PR or refs, and for an unknown locks verb', async () => {
    const out: string[] = []
    const io = cliIo(fakeIo().io, out)

    expect(await runCli(['locks', 'footprint'], io)).toBe(2)
    expect(await runCli(['locks', 'open', '800'], io)).toBe(2)
    expect(out.join('\n')).toMatch(/PR number/)
  })
})
