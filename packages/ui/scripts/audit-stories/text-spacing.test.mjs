// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { UsageError, parseOptions } from '../audit-stories.mjs'
import { captureAll, exitCodeFor, planJobs, summarise } from './capture.mjs'
import { emptyDom, fakeBrowser } from './fixtures/fake-browser.mjs'
import {
  TEXT_SPACING_CSS,
  TEXT_SPACING_LOSS,
  TEXT_SPACING_WIDTHS,
  textSpacingLosses,
} from './text-spacing.mjs'

const uiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const blocker = (kind, selector, detail = 'by 4px') => ({ kind, selector, detail })

describe('--text-spacing options', () => {
  it('audits only 360 and 1280 with the text-spacing pass on', () => {
    const options = parseOptions(['--text-spacing'])

    expect(options).toMatchObject({ textSpacing: true, widths: [360, 1280] })
  })

  it('leaves the pass off by default', () => {
    expect(parseOptions([]).textSpacing).toBe(false)
  })

  it.each([[['--text-spacing', '--widths', '400']], [['--text-spacing', '--sweep']]])(
    'refuses %j with a usage error',
    (argv) => {
      expect(() => parseOptions(argv)).toThrow(UsageError)
    }
  )

  it('names every conflicting flag in the refusal', () => {
    expect(() => parseOptions(['--sweep', '--text-spacing'])).toThrow(
      '--sweep and --text-spacing cannot be combined'
    )
  })
})

describe('the WCAG 1.4.12 stylesheet', () => {
  it.each([
    'line-height: 1.5 !important',
    'letter-spacing: 0.12em !important',
    'word-spacing: 0.16em !important',
    'margin-bottom: 2em !important',
  ])('sets %s', (declaration) => {
    expect(TEXT_SPACING_CSS).toContain(declaration)
  })
})

describe('text-spacing losses', () => {
  it('warns for a blocker only the spaced frame has, naming what was lost', () => {
    const losses = textSpacingLosses([], [blocker('clipped-text', '.row', '"Due" cut by 6px')])

    expect(losses).toEqual([
      {
        kind: TEXT_SPACING_LOSS,
        selector: '.row',
        lost: 'clipped-text',
        detail: 'clipped-text under text spacing: "Due" cut by 6px',
      },
    ])
  })

  it('does not count a blocker that was already there and only grew', () => {
    const losses = textSpacingLosses(
      [blocker('overflow', 'html', 'by 4px')],
      [blocker('overflow', 'html', 'by 9px')]
    )

    expect(losses).toEqual([])
  })

  it('counts the same selector failing a different check as new', () => {
    const losses = textSpacingLosses([blocker('overflow', '.a')], [blocker('text-overlap', '.a')])

    expect(losses.map((l) => l.lost)).toEqual(['text-overlap'])
  })
})

describe('the text-spacing pass over a fixture story', () => {
  const dirs = []
  afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

  // A fixed-height dense row: its label fits until the 1.5 line height pushes it out.
  const denseRow = ({ spaced }) => ({
    ...emptyDom,
    blockers: spaced
      ? [blocker('clipped-text', '.dense-row > Text', '"Due today" cut by 6px')]
      : [],
  })

  async function run(textSpacing) {
    const outDir = mkdtempSync(join(tmpdir(), 'text-spacing-'))
    dirs.push(outDir)
    const { browser, log } = fakeBrowser(denseRow)
    const story = { id: 'fixture-dense-row--default', title: 'Fixture/DenseRow/Default' }
    const options = { ...parseOptions(textSpacing ? ['--text-spacing'] : []), stories: [story] }
    const jobs = planJobs({ ...options, outDir })
    const entries = await captureAll({ url: 'http://x', uiDir, jobs, launch: async () => browser })
    return { entries, log }
  }

  it('reports the clipped row as a warning at 360 and 1280 in both themes, not a blocker', async () => {
    const { entries } = await run(true)

    const frames = entries.map((e) => `${e.width}-${e.theme}`)
    const losses = entries.flatMap((e) => e.warnings.filter((w) => w.kind === TEXT_SPACING_LOSS))
    expect(frames).toEqual(['360-dark', '360-light', '1280-dark', '1280-light'])
    expect(losses).toHaveLength(4)
    expect(losses[0]).toMatchObject({ rule: 'DR-RB-03', lost: 'clipped-text' })
    expect(entries.every((e) => e.blockers.length === 0)).toBe(true)
    expect(exitCodeFor(entries)).toBe(0)
  })

  it('prints one grouped warning line for the loss', async () => {
    const { entries } = await run(true)

    expect(summarise(entries).split('\n')[0]).toBe(
      'WARN text-spacing-loss fixture-dense-row--default [360-dark 360-light 1280-dark 1280-light] ' +
        '.dense-row > Text :: clipped-text under text spacing: "Due today" cut by 6px'
    )
  })

  it('lists losses before blockers that were already there, counting only blockers as distinct', () => {
    const loss = {
      kind: TEXT_SPACING_LOSS,
      selector: '.row',
      detail: 'clipped-text under text spacing',
    }
    const entry = {
      id: 'fixture-dense-row--default',
      width: 360,
      theme: 'dark',
      rendered: true,
      shot: null,
      blockers: [blocker('overflow', 'html')],
      contrast_token: [],
      warnings: [loss],
    }

    const lines = summarise([entry]).split('\n')

    expect(lines[0]).toMatch(/^WARN text-spacing-loss /)
    expect(lines[1]).toMatch(/^BLOCKER overflow /)
    expect(lines[2]).toContain('1 blockers (1 distinct)')
  })

  it('injects the stylesheet once per frame, after that frame is shot unspaced', async () => {
    const { log } = await run(true)

    const injections = log.filter((line) => line === 'text-spacing stylesheet')
    const shots = log.filter((line) => line.startsWith('screenshot'))
    expect(injections).toHaveLength(4)
    expect(shots).toEqual(Array(4).fill('screenshot spaced=false'))
  })

  it('injects nothing without the flag', async () => {
    const { entries, log } = await run(false)

    expect(log).not.toContain('text-spacing stylesheet')
    expect(entries.map((e) => e.width)).not.toEqual(TEXT_SPACING_WIDTHS)
  })
})
