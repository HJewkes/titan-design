import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { globRegExp, parseLocks, tokensMatch } from '@titan-design/review-schema'
import { describe, expect, it } from 'vitest'
import { checkPlan } from '../src/locks-check.ts'
import { runCli } from '../src/run.ts'
import { locksCliIo } from './fixtures/locks/cli.ts'

const REGISTRY_URL = new URL('./fixtures/locks/registry.json', import.meta.url)
const REGISTRY = fileURLToPath(REGISTRY_URL)
const registry = () => parseLocks(JSON.parse(readFileSync(REGISTRY_URL, 'utf8')))
const UI = 'packages/ui/src/components/ui'

describe('checkPlan', () => {
  it('is clear when no open lock covers the files or tokens, and ignores merged locks', () => {
    const result = checkPlan(registry(), {
      files: [`${UI}/tabs/Tabs.tsx`],
      tokens: [{ name: 'surface-base', mode: 'dark' }, { name: 'divider' }],
    })

    expect(result.verdict).toBe('clear')
    expect(result.conflicts).toEqual([])
    expect(result.advisory).toMatch(/^Clear:/)
  })

  it('stacks on the holder when the plan edits a locked token, naming the branch and the lock', () => {
    const result = checkPlan(registry(), {
      files: [`${UI}/tabs/*.tsx`],
      tokens: [{ name: 'text-secondary', mode: 'light' }],
    })

    expect(result.verdict).toBe('stack-on')
    expect(result.holder).toMatchObject({ pr: 101, branch: 'feat/planes' })
    expect(result.advisory).toMatch(/^Stack on #101 \(branch feat\/planes, lock L-0001\): /)
    expect(result.advisory).toContain('--base feat/planes')
    expect(result.advisory).toContain('L-0001 on tokens text-secondary/light')
  })

  it('matches a glob against locked paths and a bare token name against both modes', () => {
    const byGlob = checkPlan(registry(), { files: ['packages/ui/tests/**'], tokens: [] })
    const byName = checkPlan(registry(), { files: [], tokens: [{ name: 'surface-base' }] })

    expect(byGlob.conflicts[0]).toMatchObject({ lock: 'L-0001', files: [expect.any(String)] })
    expect(byName.verdict).toBe('stack-on')
  })

  it('defers on a decision-only lock: do not re-ask it, file the task as its holder', () => {
    const result = checkPlan(registry(), { files: [`${UI}/input/Input.tsx`], tokens: [] })

    expect(result.verdict).toBe('defer')
    expect(result.holder).toBeUndefined()
    expect(result.advisory).toMatch(
      /^Defer \(lock L-0002\): park this task with blocked-by: L-0002/
    )
    expect(result.advisory).toContain('do not re-ask the decision')
    expect(result.advisory).toContain('file it as the holder of L-0002')
  })

  it('defers when the plan hits locks held by different PRs, since it can stack on only one', () => {
    const result = checkPlan(registry(), {
      files: [`${UI}/pill/Pill.tsx`, `${UI}/alert/Alert.tsx`],
      tokens: [],
    })

    expect(result.verdict).toBe('defer')
    expect(result.conflicts.map((c) => c.lock)).toEqual(['L-0001', 'L-0003'])
    expect(result.advisory).toContain('cannot stack on more than one holder')
  })

  it('reports a render overlap without blocking when the plan edits a reader only', () => {
    const result = checkPlan(registry(), { files: [`${UI}/select/Select.tsx`], tokens: [] })

    expect(result.verdict).toBe('clear')
    expect(result.renders).toEqual([
      { lock: 'L-0001', title: 'Planes', files: [`${UI}/select/Select.tsx`], tokens: [] },
    ])
    expect(result.advisory).toContain('Renders under L-0001 (#101 at aaaaaaa)')
  })
})

describe('token and path matching', () => {
  it('reads a token family pattern from the registry, mode by mode', () => {
    const family = { name: 'tint-{hue}-solid / on-tint-{hue}', mode: 'dark' as const }

    expect(tokensMatch(family, { name: 'tint-red-solid', mode: 'dark' })).toBe(true)
    expect(tokensMatch(family, { name: 'on-tint-red', mode: 'dark' })).toBe(true)
    expect(tokensMatch(family, { name: 'tint-red-solid', mode: 'light' })).toBe(false)
    expect(tokensMatch(family, { name: 'tint-red-subtle', mode: 'dark' })).toBe(false)
  })

  it('lets ** cross directories and keeps * and ? within one', () => {
    expect(globRegExp('packages/**/Select.tsx').test(`${UI}/select/Select.tsx`)).toBe(true)
    expect(globRegExp('packages/*/Select.tsx').test(`${UI}/select/Select.tsx`)).toBe(false)
    expect(globRegExp('a/b?.ts').test('a/b1.ts')).toBe(true)
    expect(globRegExp('a/b.ts').test('a/bxts')).toBe(false)
  })
})

describe('titan-review locks check', () => {
  const check = (...args: string[]) => ['locks', 'check', '--registry', REGISTRY, ...args]

  it('exits 0 clear, 10 stack-on and 11 defer', async () => {
    const out: string[] = []
    const io = locksCliIo(out)

    expect(await runCli(check('--files', `${UI}/tabs/Tabs.tsx`), io)).toBe(0)
    expect(await runCli(check('--tokens', 'surface-base/light,text-tertiary/light'), io)).toBe(10)
    expect(await runCli(check('--files', `${UI}/input/Input.tsx`), io)).toBe(11)
    expect(out[1]).toMatch(/^Stack on #101 \(branch feat\/planes, lock L-0001\)/)
    expect(out[2]).toMatch(/^Defer \(lock L-0002\)/)
  })

  it('prints the result as JSON with --json', async () => {
    const out: string[] = []

    const code = await runCli(check('--tokens', 'surface-base/light', '--json'), locksCliIo(out))

    expect(code).toBe(10)
    expect(JSON.parse(out.join(''))).toMatchObject({ verdict: 'stack-on', holder: { pr: 101 } })
  })

  it('is a usage error without a plan, with a bad mode, or without a registry', async () => {
    const out: string[] = []
    const io = locksCliIo(out)
    const env = process.env.TITAN_LOCKS_REGISTRY
    delete process.env.TITAN_LOCKS_REGISTRY

    expect(await runCli(check(), io)).toBe(2)
    expect(await runCli(check('--tokens', 'surface-base/dim'), io)).toBe(2)
    expect(await runCli(['locks', 'check', '--tokens', 'surface-base'], io)).toBe(2)
    expect(await runCli(check('--registry', '/nonexistent/locks.json', '--files', 'x'), io)).toBe(2)
    if (env !== undefined) process.env.TITAN_LOCKS_REGISTRY = env
    expect(out.join('\n')).toMatch(/--files or --tokens/)
    expect(out.join('\n')).toMatch(/name\/light or name\/dark/)
    expect(out.join('\n')).toMatch(/TITAN_LOCKS_REGISTRY/)
    expect(out.join('\n')).toMatch(/cannot read the registry/)
  })
})
