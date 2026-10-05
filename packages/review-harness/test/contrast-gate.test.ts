import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXIT_REFUSED, buildRound, contrastProblem } from '../src/build.ts'
import type { Check } from '../src/contrast-check.ts'
import {
  contrastReport,
  formatContrastReport,
  matchesDefect,
  type MeasuredFrame,
} from '../src/contrast-gate.ts'
import { ReviewError } from '../src/review.ts'
import { ManifestSchema, MANIFEST_SCHEMA_ID, type ManifestInput } from '../src/schema.ts'

const SHA = 'a'.repeat(64)

function draft(extra: Partial<ManifestInput> = {}): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-478-unit',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [360],
    variants: [
      { key: 'A', storyId: 'components-chip--default', label: 'Chip' },
      { key: 'B', storyId: 'components-chip--outline', label: 'Outline' },
    ],
    questions: [],
    ...extra,
  }
}

const lowText: Check = {
  kind: 'text',
  role: 'text',
  selector: 'div > span',
  testId: 'chip-label',
  text: 'Last week',
  fg: '#b8b8b8',
  bg: '#f3f4f6',
  ratio: 1.7,
  required: 4.5,
  pass: false,
}

function measured(variant: string, mode: 'light' | 'dark', checks: Check[]): MeasuredFrame {
  return { variant, width: 360, mode, result: { checks, indeterminate: [] } }
}

function report(input: ManifestInput, frames: MeasuredFrame[]) {
  return contrastReport({ manifest: ManifestSchema.parse(input), manifestSha256: SHA, frames })
}

describe('known defects', () => {
  const finding = { variant: 'A', mode: 'light' as const, width: 360, ...lowText }
  const exact = {
    element: 'chip-label',
    mode: 'light',
    kind: 'text',
    route: 'TD-490',
    reason: 'text-muted on the light base',
  } as const

  it('match one element exactly, by its own test id or its full selector', () => {
    expect(matchesDefect(exact, finding)).toBe(true)
    expect(matchesDefect({ ...exact, element: 'div > span' }, finding)).toBe(true)
    expect(matchesDefect({ ...exact, element: 'chip' }, finding)).toBe(false)
    expect(matchesDefect({ ...exact, element: 'span' }, finding)).toBe(false)
    expect(matchesDefect({ ...exact, element: 'Last week' }, finding)).toBe(false)
  })

  it('match only the mode, kind and variant they name', () => {
    expect(matchesDefect({ ...exact, mode: 'dark' }, finding)).toBe(false)
    expect(matchesDefect({ ...exact, kind: 'large-text' }, finding)).toBe(false)
    expect(matchesDefect({ ...exact, variant: 'B' }, finding)).toBe(false)
    expect(matchesDefect({ ...exact, variant: 'A' }, finding)).toBe(true)
  })

  it('excuse a miss at its recorded ratio or better, and block one that got worse', () => {
    expect(matchesDefect({ ...exact, minRatio: finding.ratio }, finding)).toBe(true)
    expect(matchesDefect({ ...exact, minRatio: finding.ratio - 0.2 }, finding)).toBe(true)
    expect(matchesDefect({ ...exact, minRatio: finding.ratio + 0.2 }, finding)).toBe(false)
  })

  it('are refused at load when they still carry the renamed maxRatio', () => {
    const old = ManifestSchema.safeParse(
      draft({
        contrast: {
          knownDefects: [
            {
              element: 'chip',
              mode: 'light',
              kind: 'text',
              maxRatio: 3,
              route: 'TD-490',
              reason: 'muted',
            },
          ] as never,
        },
      })
    )
    expect(old.success).toBe(false)
    expect(old.error?.issues.map((i) => i.message).join('\n')).toContain('renamed minRatio')
  })

  it('are refused at load unless they name element, mode and kind', () => {
    const broad = ManifestSchema.safeParse(
      draft({ contrast: { knownDefects: [{ route: 'TD-490', reason: 'muted' }] as never } })
    )
    expect(broad.success).toBe(false)
    const messages = broad.error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    expect(messages).toEqual(
      expect.arrayContaining([
        'contrast.knownDefects.0.mode: a known defect names its mode: light or dark',
        'contrast.knownDefects.0.kind: a known defect names its kind: text, large-text or non-text',
        expect.stringMatching(
          /^contrast\.knownDefects\.0\.element: a known defect names one element/
        ),
      ])
    )
  })

  it('must name a route: a task id or "component"', () => {
    const declare = (route: string) =>
      ManifestSchema.safeParse(draft({ contrast: { knownDefects: [{ ...exact, route }] } })).success
    expect(declare('TD-490')).toBe(true)
    expect(declare('component')).toBe(true)
    expect(declare('the primitive')).toBe(false)
  })
})

describe('contrastReport', () => {
  it('blocks on an undeclared miss and prints it with its ratio', () => {
    const r = report(draft(), [measured('A', 'light', [lowText]), measured('A', 'dark', [])])
    expect(r.passed).toBe(false)
    expect(r.failures).toHaveLength(1)
    expect(r.frames[0]).toMatchObject({ variant: 'A', mode: 'light', failures: 1 })
    const out = formatContrastReport(r).join('\n')
    expect(out).toContain('FAIL A light @360 text (text) 1.7:1 < 4.5 #b8b8b8 on #f3f4f6')
  })

  it('passes a miss declared in its section, and still prints it with route and ratio', () => {
    const r = report(
      draft({
        sections: [
          {
            id: 's1',
            title: 'Chip',
            variantKeys: ['A', 'B'],
            contrast: {
              knownDefects: [
                {
                  element: 'chip-label',
                  mode: 'light',
                  kind: 'text',
                  route: 'TD-490',
                  reason: 'muted token',
                },
              ],
            },
          },
        ],
      }),
      [measured('A', 'light', [lowText])]
    )
    expect(r.passed).toBe(true)
    expect(r.knownDefects[0]).toMatchObject({ route: 'TD-490', ratio: 1.7, variant: 'A' })
    expect(formatContrastReport(r).join('\n')).toContain('KNOWN TD-490 A light @360 text')
  })

  it('does not let one section excuse a frame in another', () => {
    const r = report(
      draft({
        sections: [
          { id: 's1', title: 'A', variantKeys: ['A'] },
          {
            id: 's2',
            title: 'B',
            variantKeys: ['B'],
            contrast: {
              knownDefects: [
                {
                  element: 'chip-label',
                  mode: 'light',
                  kind: 'text',
                  route: 'component',
                  reason: 'own fill',
                },
              ],
            },
          },
        ],
      }),
      [measured('A', 'light', [lowText])]
    )
    expect(r.passed).toBe(false)
    expect(r.unmatchedDefects[0]).toMatchObject({ where: 'section s2 contrast' })
  })

  it('refuses an image variant unless each mode is measured or declared unmeasured', () => {
    const variants = [{ key: 'I', image: 'shots/wall.png', label: 'Wall' }]
    expect(report(draft({ variants }), []).problems).toHaveLength(2)
    const light = {
      variant: 'I',
      mode: 'light',
      kind: 'text',
      element: 'caption',
      ratio: 7,
      source: 'picker',
    } as const
    const lightOnly = report(draft({ variants, contrast: { measured: [light] } }), [])
    expect(lightOnly.passed).toBe(false)
    expect(lightOnly.problems).toEqual([expect.stringContaining('image variant I has no dark')])
    const both = report(
      draft({
        variants,
        contrast: {
          measured: [light],
          unmeasured: [{ variant: 'I', mode: 'dark', reason: 'device capture' }],
        },
      }),
      []
    )
    expect(both.passed).toBe(true)
    expect(formatContrastReport(both).join('\n')).toContain('UNMEASURED I dark: device capture')
  })

  it('judges a builder-supplied image measurement at the same threshold', () => {
    const variants = [{ key: 'I', image: 'shots/wall.png', label: 'Wall' }]
    const measuredRatio = {
      variant: 'I',
      mode: 'light' as const,
      element: 'caption',
      source: 'picker',
    }
    const fail = report(
      draft({ variants, contrast: { measured: [{ ...measuredRatio, kind: 'text', ratio: 3.1 }] } }),
      []
    )
    expect(fail.failures[0]).toMatchObject({ variant: 'I', ratio: 3.1, required: 4.5 })
    const pass = report(
      draft({
        variants,
        contrast: { measured: [{ ...measuredRatio, kind: 'large-text', ratio: 3.1 }] },
      }),
      []
    )
    expect(pass.failures).toEqual([])
  })

  it('refuses unmeasured on a story variant, which the DOM can measure', () => {
    const parsed = ManifestSchema.safeParse(
      draft({ contrast: { unmeasured: [{ variant: 'A', mode: 'light', reason: 'skip it' }] } })
    )
    expect(parsed.success).toBe(false)
  })
})

describe('reading contrast.json', () => {
  async function roundDir(report?: string) {
    const dir = await mkdtemp(join(tmpdir(), 'titan-contrast-'))
    if (report !== undefined) await writeFile(join(dir, 'contrast.json'), report)
    return join(dir, 'round.json')
  }

  it('treats a missing report as no report', async () => {
    await expect(contrastProblem(await roundDir(), SHA)).resolves.toBe(
      'no contrast.json beside this round'
    )
  })

  it('names the file when the report is not JSON', async () => {
    const round = await roundDir('{not json')
    const problem = contrastProblem(round, SHA)
    await expect(problem).rejects.toThrow(ReviewError)
    await expect(problem).rejects.toThrow(/contrast\.json is not JSON/)
  })
})

describe('buildRound', () => {
  async function setup(input: Partial<ManifestInput>) {
    const dir = await mkdtemp(join(tmpdir(), 'titan-contrast-'))
    const path = join(dir, 'draft.json')
    await writeFile(path, JSON.stringify(draft(input)))
    return { dir, path }
  }

  const imageOnly = (contrast?: ManifestInput['contrast']): Partial<ManifestInput> => ({
    variants: [{ key: 'I', image: 'wall.png', label: 'Wall' }],
    ...(contrast ? { contrast } : {}),
  })

  async function png(dir: string) {
    const bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    await writeFile(join(dir, 'wall.png'), Buffer.from(bytes))
  }

  it('refuses a draft that already carries a contrast override', async () => {
    const override = { reason: 'shown ungated', problem: 'no contrast.json', failures: [] }
    const { dir, path } = await setup({ ...imageOnly(), contrastOverride: override })
    await png(dir)
    const build = buildRound(path, undefined, { stderr: () => {}, measure: async () => [] })
    await expect(build).rejects.toThrow('a draft never carries contrastOverride')
  })

  it('writes contrast.json but no round.json when the gate refuses', async () => {
    const { dir, path } = await setup(imageOnly())
    await png(dir)
    const lines: string[] = []
    const code = await buildRound(path, undefined, {
      stderr: (t) => lines.push(t),
      measure: async () => [],
    })
    expect(code).toBe(EXIT_REFUSED)
    expect((await readdir(dir)).sort()).toEqual(['contrast.json', 'draft.json', 'wall.png'])
    expect(lines.join('\n')).toContain('refused: round.json not written')
  })

  it('copies the draft byte for byte once it passes, and serving then finds no problem', async () => {
    const { dir, path } = await setup(
      imageOnly({
        unmeasured: [
          { variant: 'I', mode: 'light', reason: 'device capture' },
          { variant: 'I', mode: 'dark', reason: 'device capture' },
        ],
      })
    )
    await png(dir)
    const code = await buildRound(path, undefined, { stderr: () => {}, measure: async () => [] })
    expect(code).toBe(0)
    const round = await readFile(join(dir, 'round.json'))
    expect(round.equals(await readFile(path))).toBe(true)
    const sha = (await import('node:crypto')).createHash('sha256').update(round).digest('hex')
    expect(await contrastProblem(join(dir, 'round.json'), sha)).toBeNull()
    expect(await contrastProblem(join(dir, 'round.json'), SHA)).toContain('different manifest')
  })
})
