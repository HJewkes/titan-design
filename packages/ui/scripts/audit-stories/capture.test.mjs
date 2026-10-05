// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { USAGE, UsageError, parseOptions, resolveOutDir } from '../audit-stories.mjs'
import {
  MAX_SUMMARY_LINES,
  exitCodeFor,
  exitCodeForError,
  loadAxeSource,
  planJobs,
  summarise,
  withOneRetry,
} from './capture.mjs'
import { StorybookError } from './storybook.mjs'
import { TargetError } from './targets.mjs'

const uiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const blocker = (kind, selector, detail = 'by 12px') => ({ kind, selector, detail })
const frame = (overrides = {}) => ({
  id: 'components-molecules-button--default',
  width: 360,
  theme: 'dark',
  rendered: true,
  shot: '360-dark.png',
  blockers: [],
  contrast_token: [],
  warnings: [],
  ...overrides,
})
const thrown = (fn) => {
  try {
    fn()
  } catch (error) {
    return error
  }
  return null
}

describe('summarise grouping', () => {
  it('prints one line for a blocker repeated across widths and themes, listing each frame', () => {
    const overflow = blocker('page-overflow', 'html')
    const lines = summarise([
      frame({ blockers: [overflow] }),
      frame({ theme: 'light', blockers: [overflow] }),
      frame({ width: 768, blockers: [overflow] }),
    ]).split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(
      'BLOCKER page-overflow components-molecules-button--default [360-dark 360-light 768-dark] html :: by 12px'
    )
    expect(lines[1]).toContain('3 blockers (1 distinct)')
  })

  it('keeps blockers apart when the story, kind, selector or detail differs', () => {
    const lines = summarise([
      frame({ blockers: [blocker('clipped-text', '.a'), blocker('clipped-text', '.b')] }),
      frame({ blockers: [blocker('hit-target', '.a'), blocker('clipped-text', '.a', 'by 3px')] }),
      frame({ id: 'other--default', blockers: [blocker('clipped-text', '.a')] }),
    ]).split('\n')
    expect(lines.filter((l) => l.startsWith('BLOCKER'))).toHaveLength(5)
  })

  it('lists render errors before every other blocker', () => {
    const lines = summarise([
      frame({ blockers: [blocker('clipped-text', '.a')] }),
      frame({
        width: 768,
        rendered: false,
        blockers: [blocker('render-error', '#storybook-root')],
      }),
    ]).split('\n')
    expect(lines[0]).toMatch(/^BLOCKER render-error /)
    expect(lines[1]).toMatch(/^BLOCKER clipped-text /)
  })

  it('ends with the frame, shot, blocker, contrast, warning and failed-render counts', () => {
    const lines = summarise([
      frame({ warnings: [{}, {}], contrast_token: [{}] }),
      frame({
        rendered: false,
        shot: null,
        blockers: [blocker('render-error', '#storybook-root')],
      }),
    ]).split('\n')
    expect(lines.at(-1)).toBe(
      '2 frames audited, 1 shot, 1 blockers (1 distinct), 1 contrast_token, 2 warnings, 1 failed renders'
    )
  })
})

describe('summarise line cap', () => {
  const many = (count) => [
    frame({ blockers: Array.from({ length: count }, (_, i) => blocker('clipped-text', `.n${i}`)) }),
  ]

  it('never prints more than 30 lines, and says how many blockers it left out', () => {
    const lines = summarise(many(100)).split('\n')
    expect(MAX_SUMMARY_LINES).toBe(30)
    expect(lines).toHaveLength(30)
    expect(lines[28]).toBe('... 72 more blockers in dom.json')
    expect(lines[29]).toMatch(/^1 frames audited, .* 100 blockers \(100 distinct\)/)
  })

  it('prints every blocker when they fit, with no overflow line', () => {
    const lines = summarise(many(28)).split('\n')
    expect(lines).toHaveLength(29)
    expect(lines.some((l) => l.startsWith('...'))).toBe(false)
  })

  it('leaves the command one line for the dom.json path', () => {
    expect(summarise(many(100), MAX_SUMMARY_LINES - 1).split('\n')).toHaveLength(29)
  })
})

describe('exit codes', () => {
  const blockedFrame = frame({ blockers: [blocker('hit-target', '.a')] })

  it('is 0 when every frame rendered without blockers, warnings allowed', () => {
    expect(exitCodeFor([frame({ warnings: [{}], contrast_token: [{}] })])).toBe(0)
  })

  it('is 1 when a blocker remains', () => {
    expect(exitCodeFor([frame(), frame({ blockers: [blocker('hit-target', '.a')] })])).toBe(1)
  })

  it('is 2 when a frame failed to render, even beside ordinary blockers', () => {
    const failed = frame({
      rendered: false,
      blockers: [blocker('render-error', '#storybook-root')],
    })
    expect(exitCodeFor([frame({ blockers: [blocker('hit-target', '.a')] }), failed])).toBe(2)
  })

  it('maps a targeting refusal to 64 and a diff that touches no story to 1', () => {
    expect(exitCodeForError(new TargetError('refused'))).toBe(64)
    expect(exitCodeForError(new TargetError('nothing touched', 1))).toBe(1)
  })

  it('maps a Storybook start failure and a usage error to 64', () => {
    expect(exitCodeForError(new StorybookError('no port'))).toBe(64)
    expect(exitCodeForError(new UsageError('bad flag'))).toBe(64)
  })

  it('is 70 for an unexpected error, apart from the code for blockers', () => {
    expect(exitCodeForError(new Error('boom'))).toBe(70)
    expect(exitCodeForError(new TypeError('boom'))).not.toBe(exitCodeFor([blockedFrame]))
  })

  it('never maps an unexpected error to 0', () => {
    expect(exitCodeForError(Object.assign(new Error('boom'), { exitCode: 0 }))).toBe(70)
    expect(exitCodeForError(undefined)).toBe(70)
  })

  it('names every exit code in the usage text', () => {
    for (const code of [0, 1, 2, 64, 70, 130]) expect(USAGE).toMatch(new RegExp(`\\b${code} `))
  })
})

describe('the retry on a failed render', () => {
  const attempts = (...results) => {
    const calls = { attempts: 0, pauses: 0 }
    const attempt = async () => results[calls.attempts++]
    const pause = async () => void calls.pauses++
    return { calls, attempt, pause }
  }

  it('returns the first render without retrying when it succeeded', async () => {
    const { calls, attempt, pause } = attempts({ rendered: true, n: 1 })
    expect(await withOneRetry(attempt, pause)).toEqual({ rendered: true, n: 1 })
    expect(calls).toEqual({ attempts: 1, pauses: 0 })
  })

  it('retries a failed render once, after a pause, and keeps the second result', async () => {
    const { calls, attempt, pause } = attempts({ rendered: false }, { rendered: true, n: 2 })
    expect(await withOneRetry(attempt, pause)).toEqual({ rendered: true, n: 2 })
    expect(calls).toEqual({ attempts: 2, pauses: 1 })
  })

  it('reports the failure when the retry fails too, without a third attempt', async () => {
    const { calls, attempt, pause } = attempts({ rendered: false, n: 1 }, { rendered: false, n: 2 })
    expect(await withOneRetry(attempt, pause)).toEqual({ rendered: false, n: 2 })
    expect(calls.attempts).toBe(2)
  })
})

describe('defaults and options', () => {
  it('audits 360, 768 and 1280 in dark and light against origin/main', () => {
    expect(parseOptions([])).toMatchObject({
      base: 'origin/main',
      widths: [360, 768, 1280],
      themes: ['dark', 'light'],
      touch: false,
      stories: [],
    })
  })

  it('adds the 320 width and 44px targets only with --touch', () => {
    const options = parseOptions(['--touch'])
    expect(options.widths).toEqual([320, 360, 768, 1280])
    const story = { id: 'a--default', title: 'A/Default' }
    const [job] = planJobs({ ...options, stories: [story], outDir: '/out' })
    expect(job).toEqual({
      story,
      width: 320,
      themes: ['dark', 'light'],
      touch: true,
      shotDir: join('/out', 'a--default'),
    })
  })

  it('plans one job per story and width', () => {
    const stories = [{ id: 'a--default' }, { id: 'b--default' }]
    const jobs = planJobs({ ...parseOptions([]), stories, outDir: '/out' })
    expect(jobs.map((j) => `${j.story.id}@${j.width}`)).toEqual([
      'a--default@360',
      'a--default@768',
      'a--default@1280',
      'b--default@360',
      'b--default@768',
      'b--default@1280',
    ])
  })

  it('reads story ids, widths and themes as comma lists', () => {
    const options = parseOptions(['--stories', 'a--x,b--y', '--widths', '400', '--themes', 'light'])
    expect(options).toMatchObject({ stories: ['a--x', 'b--y'], widths: [400], themes: ['light'] })
  })

  it.each([
    [['--nope']],
    [['stray']],
    [['--stories']],
    [['--stories', '--all']],
    [['--widths', '12,abc']],
    [['--themes', 'sepia']],
  ])('refuses %j with a usage error', (argv) => {
    const error = thrown(() => parseOptions(argv))
    expect(error).toBeInstanceOf(UsageError)
    expect(exitCodeForError(error)).toBe(64)
  })
})

describe('the output directory', () => {
  const where = { tmpDir: '/nonexistent-tmp', sha: 'abc1234', repoRoot: '/repo', cwd: '/repo' }

  it('defaults to the first run directory under TMPDIR, keyed by commit', () => {
    expect(resolveOutDir(where)).toBe('/nonexistent-tmp/titan-audit-stories/abc1234/run-1')
  })

  it('refuses when TMPDIR is unset and no --out is given', () => {
    expect(thrown(() => resolveOutDir({ ...where, tmpDir: undefined }))).toBeInstanceOf(UsageError)
  })

  it.each(['shots', '/repo', '/repo/packages/ui/out'])(
    'refuses --out %s inside the repo',
    (out) => {
      expect(thrown(() => resolveOutDir({ ...where, out }))).toBeInstanceOf(UsageError)
    }
  )

  it('accepts an --out outside the repo, including a sibling that shares its prefix', () => {
    expect(resolveOutDir({ ...where, out: '/repo-shots' })).toBe('/repo-shots')
  })
})

describe('the axe source', () => {
  it('loads axe-core through jest-axe, ready to inject into a page', () => {
    expect(loadAxeSource(uiDir)).toContain('axe.run')
  })
})
