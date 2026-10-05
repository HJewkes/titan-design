import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../page/App.tsx'
import {
  checkHarnessFreshness,
  harnessVerdict,
  serveMainCommand,
} from '../src/harness-freshness.ts'
import { SHA, manifest } from './fixtures.ts'

type Reply = string | Error
const replies = new Map<string, Reply>()
const calls: string[][] = []

vi.mock('node:child_process', () => ({
  execFile: (
    _cmd: string,
    args: string[],
    _opts: unknown,
    done: (err: Error | null, stdout: string, stderr: string) => void
  ) => {
    const gitArgs = args.slice(2)
    calls.push(gitArgs)
    const reply = replies.get(gitArgs.join(' ')) ?? ''
    if (reply instanceof Error) done(reply, '', reply.message)
    else done(null, `${reply}\n`, '')
  },
}))

const FETCH = 'fetch --quiet origin main'
const OWN = 'rev-parse HEAD:./'
const MAIN = 'rev-parse origin/main:./'
const LOG = 'log --oneline HEAD..origin/main -- .'

describe('checkHarnessFreshness', () => {
  beforeEach(() => {
    replies.clear()
    calls.length = 0
  })

  it('is current when the harness tree equals main even if the commits differ', async () => {
    replies.set(OWN, 'aaa111')
    replies.set(MAIN, 'aaa111')

    const result = await checkHarnessFreshness()

    expect(result).toEqual({ state: 'current' })
    expect(calls[0]).toEqual(['fetch', '--quiet', 'origin', 'main'])
    expect(calls.map((c) => c.join(' '))).not.toContain(LOG)
  })

  it('is behind with the harness commits it lacks when the trees differ', async () => {
    replies.set(OWN, 'aaa111')
    replies.set(MAIN, 'bbb222')
    replies.set(LOG, 'c0ffee1 Add the pager (#453)\nbeef002 Partial submit (#449)')

    const result = await checkHarnessFreshness()

    expect(result).toEqual({
      state: 'behind',
      missing: ['c0ffee1 Add the pager (#453)', 'beef002 Partial submit (#449)'],
    })
  })

  it('is behind with no missing commits when only local harness edits differ', async () => {
    replies.set(OWN, 'aaa111')
    replies.set(MAIN, 'bbb222')

    expect(await checkHarnessFreshness()).toEqual({ state: 'behind', missing: [] })
  })

  it('is unchecked, not behind, when the fetch fails offline', async () => {
    replies.set(FETCH, new Error('fatal: unable to access origin: Could not resolve host'))

    const result = await checkHarnessFreshness()

    expect(result).toEqual({
      state: 'unchecked',
      reason:
        'git fetch origin main failed: fatal: unable to access origin: Could not resolve host',
    })
    expect(calls).toHaveLength(1)
  })

  it('is unchecked when the harness is not in a git checkout', async () => {
    replies.set(OWN, new Error('fatal: not a git repository'))

    const result = await checkHarnessFreshness()

    expect(result).toMatchObject({ state: 'unchecked' })
  })
})

describe('harnessVerdict', () => {
  const command = 'pnpm -C main review round.json'

  it('serves a current harness with no banner', () => {
    expect(harnessVerdict({ state: 'current' }, false, command)).toEqual({})
  })

  it('refuses a stale harness, listing what it lacks and the command for main', () => {
    const verdict = harnessVerdict({ state: 'behind', missing: ['c0ffee1 Pager'] }, false, command)

    expect(verdict).toHaveProperty('refusal')
    const refusal = (verdict as { refusal: string }).refusal
    expect(refusal).toContain('lacks 1 commit(s):\n  c0ffee1 Pager')
    expect(refusal).toContain(`  ${command}`)
    expect(refusal).toContain('--allow-stale')
  })

  it('serves a stale harness under --allow-stale with a banner', () => {
    const verdict = harnessVerdict({ state: 'behind', missing: ['a', 'b'] }, true, command)

    expect(verdict).toEqual({ banner: expect.stringContaining('2 commit(s) behind') })
  })

  it('warns rather than refuses when the check could not run', () => {
    const verdict = harnessVerdict({ state: 'unchecked', reason: 'offline' }, false, command)

    expect(verdict).toEqual({ banner: expect.stringContaining('not checked against origin/main') })
  })
})

describe('serveMainCommand', () => {
  it('serves main from a detached checkout, quoting the round arguments', () => {
    const command = serveMainCommand([
      '/rounds/r 1/round.json',
      '--storybook',
      'http://127.0.0.1:6107',
      '--contrast-override',
      "owner's call",
    ])

    expect(command).toContain(
      'worktree add --detach "${TMPDIR:-/tmp}/titan-review-main" origin/main'
    )
    expect(command).toContain('checkout --quiet --detach origin/main')
    expect(command).toContain('install --frozen-lockfile')
    expect(command).toContain(
      `review '/rounds/r 1/round.json' --storybook http://127.0.0.1:6107 --contrast-override 'owner'\\''s call'`
    )
  })
})

describe('the page banner', () => {
  it('shows the harness warning above the round', () => {
    const markup = renderToStaticMarkup(
      createElement(App, {
        manifest: manifest('http://127.0.0.1:6107'),
        manifestSha256: SHA,
        harnessWarning: 'Served with --allow-stale',
      })
    )

    expect(markup).toContain('data-testid="harness-warning"')
    expect(markup).toContain('Served with --allow-stale')
  })

  it('shows no banner for a current harness', () => {
    const markup = renderToStaticMarkup(
      createElement(App, { manifest: manifest('http://127.0.0.1:6107'), manifestSha256: SHA })
    )

    expect(markup).not.toContain('harness-warning')
  })
})
