import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../page/App.tsx'
import { NO_CURRENT } from '../page/SectionParts.tsx'
import { loadRound } from '../src/review.ts'
import { runCli, type CliIo } from '../src/run.ts'
import { roundLayout } from '../src/sections.ts'
import { ManifestSchema, manifestJsonSchema, type ManifestInput } from '../src/schema.ts'
import { SHA, noTreeGit } from './fixtures.ts'

type Section = NonNullable<ManifestInput['sections']>[number]
type Part = NonNullable<Section['parts']>[number]
type PickOne = Extract<ManifestInput['questions'][number], { kind: 'pick-one' }>

const SIZE_PART: Part = {
  id: 'P1',
  label: 'the `size` prop',
  current: "size?: 'sm' | 'md'",
  proposed: "size?: 'sm' | 'md' | 'lg'",
  lang: 'ts',
}

const TONE_PART: Part = {
  id: 'P2',
  label: 'a new `tone` prop',
  proposed: "tone?: 'quiet' | 'loud'",
  lang: 'ts',
}

const SETTLED_PART: Part = {
  id: 'P3',
  label: '`isDisabled`, default `false`',
  proposed: 'isDisabled?: boolean',
  lang: 'ts',
  settled: { cite: 'props table: `isDisabled`, not `disabled`' },
}

/** A frameless prop-shape round: two parts the owner decides, one the author settled. */
function partsRound(): ManifestInput {
  return {
    schema: 'titan-review/round@2',
    unit: 'parts-fixture',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: [],
    questions: [
      {
        id: 'size',
        kind: 'pick-one',
        prompt: 'Add `lg` to the `size` union?',
        options: ['Proposed: add `lg`', 'Alternative: keep two sizes'],
        signsOff: 'P1',
        required: true,
      },
      {
        id: 'tone',
        kind: 'pick-one',
        prompt: 'Add a `tone` prop?',
        options: ['Proposed: add `tone`', 'Alternative: no `tone` prop'],
        signsOff: 'P2',
        required: true,
      },
      { id: 'reopen', kind: 'text', prompt: 'Reopen a settled part? Name its id.' },
    ],
    sections: [
      {
        id: 'props',
        title: 'The Badge props',
        deciding: 'The two unsettled parts below.',
        changed: 'One union grows and one prop is new.',
        context: 'Nothing here changes pixels.',
        parts: [SIZE_PART, TONE_PART, SETTLED_PART],
        questionIds: ['size', 'tone', 'reopen'],
        variantKeys: [],
      },
    ],
  }
}

function withParts(parts: Part[], input = partsRound()): ManifestInput {
  return { ...input, sections: [{ ...input.sections![0], parts }] }
}

function withSignsOff(signsOff: string, input = partsRound()): ManifestInput {
  const [size, ...rest] = input.questions
  return { ...input, questions: [{ ...(size as PickOne), signsOff }, ...rest] }
}

async function writeRound(input: unknown) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-parts-'))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  return path
}

async function refusal(input: unknown) {
  return loadRound(await writeRound(input)).then(
    () => '',
    (err: Error) => err.message
  )
}

const page = (input: ManifestInput) =>
  renderToStaticMarkup(
    createElement(App, { manifest: ManifestSchema.parse(input), manifestSha256: SHA })
  )

describe('section parts under the review contract', () => {
  it('loads a round whose pick-ones each sign off an unsettled part of their section', async () => {
    expect(await refusal(partsRound())).toBe('')
  })

  it('carries parts into the resolved section the page reads', () => {
    const [section] = roundLayout(ManifestSchema.parse(partsRound())).sections
    expect(section.parts?.map((p) => p.id)).toEqual(['P1', 'P2', 'P3'])
  })

  it('refuses a signsOff that names no part in its section', async () => {
    expect(await refusal(withSignsOff('P9'))).toContain(
      'question size: signsOff "P9" names no part in section props'
    )
  })

  it('refuses a signsOff that names a settled part', async () => {
    expect(await refusal(withSignsOff('P3'))).toContain(
      'question size: signsOff "P3" names a settled part in section props;'
    )
  })

  it('refuses a settled part with an empty cite', async () => {
    const blank = { ...SETTLED_PART, settled: { cite: '  ' } }
    expect(await refusal(withParts([SIZE_PART, TONE_PART, blank]))).toContain(
      'section props parts.2.settled.cite: a settled part names what settles it'
    )
  })

  it('refuses one part id used in two sections', async () => {
    const input = partsRound()
    input.sections!.push({
      id: 'again',
      title: 'Again',
      deciding: 'Nothing.',
      changed: 'Nothing.',
      context: 'Nothing.',
      parts: [{ ...SETTLED_PART, id: 'P1' }],
      questionIds: [],
      variantKeys: [],
    })
    expect(await refusal(input)).toContain('part P1 is in sections props and again')
  })

  it('refuses one part id used twice in one section, naming that section', async () => {
    const message = await refusal(withParts([SIZE_PART, SIZE_PART, TONE_PART, SETTLED_PART]))
    expect(message).toContain('part P1 repeats in section props')
    expect(message).not.toContain('is in sections')
  })

  it('keeps free-text signsOff in a section without parts', async () => {
    const input = partsRound()
    delete input.sections![0].parts
    expect(await refusal(withSignsOff('the size union', input))).toBe('')
  })

  it('refuses to build a round whose signsOff names no part', async () => {
    const stderr: string[] = []
    const io: CliIo = {
      stdout: () => {},
      stderr: (t) => stderr.push(t),
      openBrowser: () => {},
      capture: async () => [],
      measure: async () => [],
      git: noTreeGit,
      createPage: async () => ({ handler: () => {}, close: async () => {} }),
      harnessFreshness: async () => ({ state: 'current' }),
      signal: new AbortController().signal,
    }
    const path = await writeRound(withSignsOff('P9'))
    expect(await runCli(['build', path, '--no-open'], io)).toBe(2)
    expect(stderr.join('\n')).toContain('signsOff "P9" names no part')
  })

  it('publishes parts in the JSON Schema an author writes against', () => {
    const schema = manifestJsonSchema() as {
      properties: { sections: { items: { properties: Record<string, unknown> } } }
    }
    expect(schema.properties.sections.items.properties).toHaveProperty('parts')
  })
})

describe('section parts on the page', () => {
  it('renders each unsettled part as Current and Proposed code panes with the lang class', () => {
    const markup = page(partsRound())
    const part = markup.slice(markup.indexOf('data-testid="part-P1"'))
    expect(part.indexOf('data-testid="part-pane-current"')).toBeLessThan(
      part.indexOf('data-testid="part-pane-proposed"')
    )
    expect(part).toContain(
      `<pre><code class="language-ts">size?: &#x27;sm&#x27; | &#x27;md&#x27;</code></pre>`
    )
    expect(part).toContain(
      '<code class="language-ts">size?: &#x27;sm&#x27; | &#x27;md&#x27; | &#x27;lg&#x27;</code>'
    )
    expect(part).toContain('<strong>P1</strong> · the <code>size</code> prop')
  })

  it('shows a part with no current form as new', () => {
    const markup = page(partsRound())
    const part = markup.slice(markup.indexOf('data-testid="part-P2"'))
    expect(part).toContain(`<code class="language-ts">${NO_CURRENT}</code>`)
  })

  it('folds every settled part into one collapsed list with its cite', () => {
    const markup = page(partsRound())
    expect(markup.match(/data-testid="settled-parts"/g)).toHaveLength(1)
    const settled = markup.slice(markup.indexOf('<details'))
    expect(settled).not.toMatch(/<details[^>]*\sopen/)
    expect(settled).toContain('1 settled part, FYI')
    expect(settled).toContain('data-testid="part-P3"')
    expect(settled).toContain(
      'Cite: props table: <code>isDisabled</code>, not <code>disabled</code>'
    )
    expect(settled).not.toContain('data-testid="part-pane-current"')
  })

  it('renders nothing for a section without parts', () => {
    const input = partsRound()
    delete input.sections![0].parts
    expect(page(input)).not.toContain('data-testid="section-parts"')
  })
})
