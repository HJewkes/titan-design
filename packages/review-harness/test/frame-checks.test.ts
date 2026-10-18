import { mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRound, type BuildIo } from '../src/build.ts'
import type { MeasuredFrame } from '../src/contrast-gate.ts'
import { MANIFEST_SCHEMA_ID, type ManifestInput } from '@titan-design/review-schema'
import { SECTION_TEXTS, noTreeGit } from './fixtures.ts'

// Replays of the frame faults an owner reported by hand (TD-962), built synthetically: each
// shape must refuse the build and name its frame, and the clean round must build.

const STORY = 'components-atoms-gauge--default'

type Variant = ManifestInput['variants'][number]

const storyFrame = (key: string, extra: Partial<Variant> = {}): Variant =>
  ({ key, storyId: STORY, label: key, ...extra }) as Variant

const lightFrame = (key: string) => storyFrame(key, { globals: { theme: 'light' } })

/** One section over `variants`, one pick anchored on all of them, plus any extra sections. */
function draft(variants: Variant[], extra: Partial<ManifestInput> = {}): ManifestInput {
  const keys = variants.map((v) => v.key)
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-962-replay',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [800],
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

async function build(input: ManifestInput, io: Partial<BuildIo> = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-frame-checks-'))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  const lines: string[] = []
  const run = buildRound(path, undefined, {
    stderr: (t) => lines.push(t),
    measure: async (): Promise<MeasuredFrame[]> => [],
    git: noTreeGit,
    ...io,
  })
  return { run, lines, dir }
}

beforeEach(() => {
  vi.stubGlobal('fetch', async () => Response.json({ entries: { [STORY]: {} } }))
})
afterEach(() => vi.unstubAllGlobals())

describe('frame checks before a round is served (TD-962)', () => {
  it('builds a clean round', async () => {
    const { run, dir } = await build(draft([lightFrame('clean-l')]))
    expect(await run).toBe(0)
    expect(await readdir(dir)).toContain('round.json')
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
