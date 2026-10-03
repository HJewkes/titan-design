import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXIT_REFUSED, buildRound, contrastWarning } from '../src/build.ts'
import type { Check } from '../src/contrast-check.ts'
import {
  contrastReport,
  formatContrastReport,
  matchesDefect,
  type MeasuredFrame,
} from '../src/contrast-gate.ts'
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

  it('match on variant, mode, kind and the element by test id, selector or text', () => {
    const route = 'TD-490'
    const reason = 'text-muted on the light base'
    expect(matchesDefect({ route, reason }, finding)).toBe(true)
    expect(matchesDefect({ route, reason, element: 'chip-label' }, finding)).toBe(true)
    expect(matchesDefect({ route, reason, element: 'Last' }, finding)).toBe(true)
    expect(matchesDefect({ route, reason, element: 'chip-icon' }, finding)).toBe(false)
    expect(matchesDefect({ route, reason, mode: 'dark' }, finding)).toBe(false)
    expect(matchesDefect({ route, reason, variant: 'B' }, finding)).toBe(false)
    expect(matchesDefect({ route, reason, kind: 'non-text' }, finding)).toBe(false)
  })

  it('must name a route: a task id or "component"', () => {
    const declare = (route: string) =>
      ManifestSchema.safeParse(
        draft({ contrast: { knownDefects: [{ route, reason: 'muted text' }] } })
      ).success
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
                { element: 'chip-label', mode: 'light', route: 'TD-490', reason: 'muted token' },
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
            contrast: { knownDefects: [{ route: 'component', reason: 'own fill' }] },
          },
        ],
      }),
      [measured('A', 'light', [lowText])]
    )
    expect(r.passed).toBe(false)
    expect(r.unmatchedDefects[0]).toMatchObject({ where: 'section s2 contrast' })
  })

  it('refuses an image variant with neither a measurement nor an unmeasured reason', () => {
    const variants = [{ key: 'I', image: 'shots/wall.png', label: 'Wall' }]
    expect(report(draft({ variants }), []).problems[0]).toContain('image variant I')
    const unmeasured = report(
      draft({ variants, contrast: { unmeasured: [{ variant: 'I', reason: 'device capture' }] } }),
      []
    )
    expect(unmeasured.passed).toBe(true)
    expect(formatContrastReport(unmeasured).join('\n')).toContain('UNMEASURED I: device capture')
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
    expect(pass.passed).toBe(true)
  })

  it('refuses unmeasured on a story variant, which the DOM can measure', () => {
    const parsed = ManifestSchema.safeParse(
      draft({ contrast: { unmeasured: [{ variant: 'A', reason: 'skip it' }] } })
    )
    expect(parsed.success).toBe(false)
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

  it('copies the draft byte for byte once it passes, and the review sees no warning', async () => {
    const { dir, path } = await setup(
      imageOnly({ unmeasured: [{ variant: 'I', reason: 'device capture' }] })
    )
    await png(dir)
    const code = await buildRound(path, undefined, { stderr: () => {}, measure: async () => [] })
    expect(code).toBe(0)
    const round = await readFile(join(dir, 'round.json'))
    expect(round.equals(await readFile(path))).toBe(true)
    const sha = (await import('node:crypto')).createHash('sha256').update(round).digest('hex')
    expect(await contrastWarning(join(dir, 'round.json'), sha)).toBeNull()
    expect(await contrastWarning(join(dir, 'round.json'), SHA)).toContain('different manifest')
  })
})
