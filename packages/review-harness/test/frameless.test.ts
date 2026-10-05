import { mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../page/App.tsx'
import { buildRound, unsectionedFrameWarnings } from '../src/build.ts'
import { MANIFEST_SCHEMA_ID, ManifestSchema, type ManifestInput } from '../src/schema.ts'
import { SHA } from './fixtures.ts'

/** A decisions round: sections of questions and context, and not one frame to look at. */
function questionsOnly(): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-673-decisions',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: [],
    questions: [
      { id: 'd1', kind: 'pick-one', prompt: 'Ship it?', options: ['Yes', 'No'], required: true },
      { id: 'd2', kind: 'text', prompt: 'Anything to change?' },
    ],
    sections: [
      { id: 'one', title: 'First decision', context: 'Why it matters.', questionIds: ['d1'] },
      { id: 'two', title: 'Second decision', questionIds: ['d2'] },
    ],
  }
}

describe('a round that declares no frames', () => {
  it('is a valid manifest, so it needs no placeholder variant', () => {
    expect(ManifestSchema.safeParse(questionsOnly()).success).toBe(true)
  })

  it('renders its section with no frame card, image strip or variant tab', () => {
    const manifest = ManifestSchema.parse(questionsOnly())
    const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256: SHA }))
    expect(markup).toContain('data-testid="section-one"')
    expect(markup).toContain('data-testid="question-d1"')
    expect(markup).not.toContain('data-testid="variant-')
    expect(markup).not.toContain('class="variants')
    expect(markup).not.toMatch(/<(img|iframe)\b/)
  })

  it('builds without measuring or warning, and writes round.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'titan-frameless-'))
    const path = join(dir, 'draft.json')
    await writeFile(path, JSON.stringify(questionsOnly()))
    const lines: string[] = []
    const code = await buildRound(path, undefined, {
      stderr: (t) => lines.push(t),
      measure: async () => [],
    })
    expect(code).toBe(0)
    expect(lines.join('\n')).not.toContain('warning')
    expect((await readdir(dir)).sort()).toEqual(['contrast.json', 'draft.json', 'round.json'])
  })
})

describe('unsectionedFrameWarnings', () => {
  it('warns about a frame that no section declares', () => {
    const input = questionsOnly()
    input.variants = [{ key: 'index', image: 'img/index.png', label: 'Round index' }]
    expect(unsectionedFrameWarnings(ManifestSchema.parse(input))).toEqual([
      'warning: variant index is in no section, so it shows under Other frames; ' +
        'a round without frames leaves variants empty',
    ])
  })

  it('says nothing about a round without sections', () => {
    const input = questionsOnly()
    delete input.sections
    input.variants = [{ key: 'A', image: 'a.png', label: 'A' }]
    expect(unsectionedFrameWarnings(ManifestSchema.parse(input))).toEqual([])
  })
})
