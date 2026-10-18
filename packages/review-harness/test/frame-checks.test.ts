import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRound, type BuildIo } from '../src/build.ts'
import type { Rgba } from '../src/contrast.ts'
import type { MeasuredFrame } from '../src/contrast-gate.ts'
import { labelledTheme } from '../src/frame-checks.ts'
import { lstar, toneOf, type FrameProbe } from '../src/frame-probe.ts'
import { frameKey, type FramesIndex } from '../src/frames.ts'
import {
  MANIFEST_SCHEMA_ID,
  isStoryVariant,
  type ManifestInput,
  type ThemeMode,
} from '@titan-design/review-schema'
import { SECTION_TEXTS, noTreeGit } from './fixtures.ts'

// Replays of the frame faults an owner reported by hand (TD-962), built synthetically: each
// shape must refuse the build and name its frame, and the clean round must build.

const STORY = 'components-atoms-gauge--default'
const WIDTH = 800

const LIGHT_PLANE: Rgba = [243, 244, 246, 1]
const DARK_PLANE: Rgba = [18, 18, 18, 1]
const CHARCOAL: Rgba = [51, 51, 51, 1]

type Variant = ManifestInput['variants'][number]

const storyFrame = (key: string, extra: Partial<Variant> = {}): Variant =>
  ({ key, storyId: STORY, label: key, ...extra }) as Variant

const lightFrame = (key: string) => storyFrame(key, { globals: { theme: 'light' } })

/** One section over `variants`, one pick anchored on all of them. */
function draft(variants: Variant[], extra: Partial<ManifestInput> = {}): ManifestInput {
  const keys = variants.map((v) => v.key)
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-962-replay',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [WIDTH],
    variants,
    questions: [
      {
        id: 'look',
        kind: 'pick-one',
        prompt: 'Does it read right?',
        options: ['Yes', 'No'],
        signsOff: 'the frames',
        frames: keys,
      },
    ],
    sections: [
      {
        id: 'frames',
        title: 'Frames',
        ...SECTION_TEXTS,
        kind: 'STATES',
        questionIds: ['look'],
        variantKeys: keys,
      },
    ],
    ...extra,
  }
}

/** A measured frame with one passing text check, on `plane`, and whatever the probe overrides. */
function measured(
  variant: string,
  mode: ThemeMode,
  probe: Partial<FrameProbe> = {}
): MeasuredFrame {
  const plane = toneOf(mode === 'light' ? LIGHT_PLANE : DARK_PLANE)
  return {
    variant,
    width: WIDTH,
    mode,
    result: {
      checks: [
        {
          kind: 'text',
          role: 'text',
          selector: 'p',
          fg: mode === 'light' ? '#111111' : '#eeeeee',
          bg: plane.hex,
          ratio: 15,
          required: 4.5,
          pass: true,
        },
      ],
      indeterminate: [],
    },
    probe: { box: { width: WIDTH, height: 200 }, plane, faces: [], ...probe },
  }
}

/** Every story variant measured clean in both modes, with `faults` replacing frames by key/mode. */
const measureClean =
  (faults: MeasuredFrame[] = []): BuildIo['measure'] =>
  async (round) =>
    round.manifest.variants
      .filter(isStoryVariant)
      .flatMap((v) =>
        (['light', 'dark'] as const).map(
          (mode) =>
            faults.find((f) => f.variant === v.key && f.mode === mode) ?? measured(v.key, mode)
        )
      )

async function writePng(file: string, color: Rgba) {
  const png = new PNG({ width: 8, height: 8 })
  for (let i = 0; i < png.data.length; i += 4) png.data.set([...color.slice(0, 3), 255], i)
  await writeFile(file, PNG.sync.write(png))
}

/** A static-frame render that paints each story frame on the plane `planeOf` gives its key. */
const renderOn =
  (planeOf: (key: string) => Rgba): BuildIo['renderFrames'] =>
  async (round, roundDir) => {
    await mkdir(join(roundDir, 'frames'), { recursive: true })
    const frames: FramesIndex['frames'] = []
    for (const v of round.manifest.variants.filter(isStoryVariant)) {
      const key = frameKey(v, WIDTH)
      await writePng(join(roundDir, 'frames', `${key}.png`), planeOf(v.key))
      frames.push({
        key,
        variant: v.key,
        storyId: v.storyId,
        theme: 'light',
        viewport: { width: WIDTH, height: 400 },
        file: `frames/${key}.png`,
        sha256: '0'.repeat(64),
      })
    }
    return {
      schema: 'titan-review/frames@1',
      unit: round.manifest.unit,
      round: round.manifest.round,
      storybookUrl: round.storybookUrl,
      frames,
    }
  }

async function build(input: ManifestInput, io: Partial<BuildIo> = {}, pngs: [string, Rgba][] = []) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-frame-checks-'))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  for (const [file, color] of pngs) await writePng(join(dir, file), color)
  const lines: string[] = []
  const run = buildRound(path, undefined, {
    stderr: (t) => lines.push(t),
    measure: measureClean(),
    renderFrames: renderOn(() => LIGHT_PLANE),
    git: noTreeGit,
    ...io,
  })
  return { run, lines, dir }
}

const refusals = (lines: string[]) => lines.filter((l) => l.startsWith('  REFUSED'))

beforeEach(() => {
  vi.stubGlobal('fetch', async () => Response.json({ entries: { [STORY]: {} } }))
})
afterEach(() => vi.unstubAllGlobals())

describe('frame checks before a round is served (TD-962)', () => {
  it('builds a clean round', async () => {
    const { run, dir, lines } = await build(draft([lightFrame('clean-l'), storyFrame('clean-d')]))
    expect(await run).toBe(0)
    expect(refusals(lines)).toEqual([])
    expect(await readdir(dir)).toContain('round.json')
  })

  it('refuses a dark toolbar in a light frame (tb-compact-l)', async () => {
    const face = { selector: '[data-testid="toolbar-bold"]', ...toneOf(CHARCOAL) }
    const fault = measured('tb-compact-l', 'light', { faces: [face] })
    const { run, dir, lines } = await build(draft([lightFrame('tb-compact-l')]), {
      measure: measureClean([fault]),
    })
    expect(await run).toBe(3)
    expect(refusals(lines)).toEqual([
      '  REFUSED light frame tb-compact-l light @800: control face [[data-testid="toolbar-bold"]] reads dark (L* 21.2 #333333)',
    ])
    expect(await readdir(dir)).not.toContain('round.json')
    const report = JSON.parse(await readFile(join(dir, 'contrast.json'), 'utf8'))
    expect(report.passed).toBe(false)
  })

  it('refuses a light frame served on black, though it declares no theme (rom-todo-l)', async () => {
    const { run, dir, lines } = await build(draft([storyFrame('rom-todo-l')]), {
      renderFrames: renderOn(() => [0, 0, 0, 1]),
    })
    expect(await run).toBe(3)
    expect(refusals(lines)).toEqual([
      '  REFUSED light frame 800-rom-todo-l-default: its plane reads dark (L* 0 #000000) in frames/800-rom-todo-l-default.png',
    ])
    expect(await readdir(dir)).not.toContain('round.json')
    const report = JSON.parse(await readFile(join(dir, 'contrast.json'), 'utf8'))
    expect(report.passed).toBe(false)
  })

  it('refuses an image labelled light whose plane reads dark', async () => {
    const image = { key: 'shot-l', image: 'shot-l.png', label: 'Toolbar, light' } as Variant
    const unmeasured = (['light', 'dark'] as const).map((mode) => ({
      variant: 'shot-l',
      mode,
      reason: 'a screenshot',
    }))
    const input = draft([image], { contrast: { unmeasured } as never })
    const { run, lines } = await build(input, {}, [['shot-l.png', DARK_PLANE]])
    expect(await run).toBe(3)
    expect(refusals(lines)).toEqual([
      '  REFUSED light frame shot-l: its plane reads dark (L* 5.5 #121212) in shot-l.png',
    ])
  })

  it('refuses a pick in a frameless section of a round with frames (d4-chart-text)', async () => {
    const input = draft([lightFrame('chart-l')])
    input.questions.push({
      id: 'chart-text',
      kind: 'pick-one',
      prompt: 'Which tick label style?',
      options: ['Mono', 'Sans'],
      signsOff: 'the tick labels',
    })
    input.sections!.push({
      id: 'chart-text',
      title: 'Chart text',
      ...SECTION_TEXTS,
      questionIds: ['chart-text'],
    })
    const { run, dir } = await build(input)
    await expect(run).rejects.toThrow(/frameless-decision: question chart-text/)
    expect(await readdir(dir)).toEqual(['draft.json'])
  })
})

describe('labelledTheme', () => {
  it('reads a declared theme first, then the key suffix, then the label', () => {
    expect(labelledTheme(storyFrame('tb-l', { globals: { theme: 'dark' } }) as never)).toBe('dark')
    expect(labelledTheme(storyFrame('rom-todo-l') as never)).toBe('light')
    expect(labelledTheme(storyFrame('vl-over-main-d') as never)).toBe('dark')
    expect(labelledTheme(storyFrame('a', { label: 'Header, light' }) as never)).toBe('light')
    expect(labelledTheme(storyFrame('lead', { label: 'Lead card' }) as never)).toBeUndefined()
  })
})

describe('lstar', () => {
  it('runs from 0 for black to 100 for white, with mid-grey near 50', () => {
    expect(lstar([0, 0, 0, 1])).toBe(0)
    expect(lstar([255, 255, 255, 1])).toBeCloseTo(100, 5)
    expect(lstar([119, 119, 119, 1])).toBeCloseTo(50, 0)
  })
})
