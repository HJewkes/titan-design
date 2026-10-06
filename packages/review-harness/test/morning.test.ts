import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROUND_FILE } from '../src/build.ts'
import {
  DECIDER_BY,
  MORNING_ITEMS_SCHEMA_ID,
  roundFromMorning,
  type DeciderEntry,
  type MorningItem,
  type MorningItems,
} from '../src/morning.ts'
import { proposalText, relabelAsProposed, repairMarkdown } from '../src/morning-text.ts'
import { loadRound } from '../src/review.ts'
import { runCli, type CliIo } from '../src/run.ts'
import { RoundSchema } from '../src/schema.ts'

// Every item here is invented: a widget shop's seats deciding on paint and a price list.

const PATHS = { itemsDir: '/rounds/r1', draftDir: '/rounds/r1' }

function item(patch: Partial<MorningItem> = {}): MorningItem {
  return {
    id: 'paint-1',
    seat: 'paint-seat',
    morning: '1',
    door: 'two-way',
    title: 'Repaint the widget shelf in teal?',
    body: 'The shelf is beige. Recommended default: teal, because the lamps are warm.',
    options: [
      { label: 'A: Teal', proposal: 'Repaint in teal this week. Pro: matches the lamps.' },
      { label: 'B: Keep beige', proposal: 'Leave it. Pro: no paint cost.' },
      { label: 'C: Defer', proposal: 'Decide after the lamps arrive.' },
    ],
    ...patch,
  }
}

function items(list: MorningItem[] = [item()], patch: Partial<MorningItems> = {}): MorningItems {
  return {
    schema: MORNING_ITEMS_SCHEMA_ID,
    unit: 'widget-shop-morning',
    round: 1,
    items: list,
    ...patch,
  }
}

function decider(patch: Partial<DeciderEntry> = {}): DeciderEntry {
  return {
    questionId: 'paint-1',
    answer: 'A: Teal',
    rationale: 'The lamps are warm and teal reads well under them.',
    confidence: 0.7,
    cite: 'paint-notes section 2',
    ...patch,
  }
}

function section(input: MorningItems, id: string, entries: DeciderEntry[] = []) {
  const draft = roundFromMorning(input, entries, PATHS)
  const found = draft.sections?.find((s) => s.id === id)
  if (!found) throw new Error(`no section ${id}`)
  return found
}

describe('seat text as the owner reads it', () => {
  it('relabels every seat recommendation as a proposal', () => {
    expect(relabelAsProposed('Recommended default: teal')).toBe('Proposed: teal')
    expect(relabelAsProposed('**Recommended default:** teal')).toBe('**Proposed:** teal')
    expect(relabelAsProposed('**Recommend yes**')).toBe('**Proposed: yes**')
    expect(relabelAsProposed('Recommendation: teal. Recommend it.')).toBe(
      'Proposal: teal. Propose it.'
    )
    expect(relabelAsProposed('Default: teal; the seat recommends it')).toBe(
      'Proposed: teal; the plan proposes it'
    )
    expect(relabelAsProposed('Silence goes to the decider. Fine.')).toBe('Fine.')
  })

  it('gives a headerless table the header row GitHub markdown needs', () => {
    expect(repairMarkdown('| teal | 2 |\n| beige | 0 |')).toBe(
      '| | |\n|---|---|\n| teal | 2 |\n| beige | 0 |'
    )
  })

  it('leaves a table that already has a header row unchanged, inside a quote too', () => {
    const headed = '| shade | cost |\n|---|---|\n| teal | 2 |'
    expect(repairMarkdown(headed)).toBe(headed)
    const quoted = '> | shade | cost |\n> |:---|---:|\n> | teal | 2 |'
    expect(repairMarkdown(quoted)).toBe(quoted)
    expect(repairMarkdown('> |---|---|\n> | teal | 2 |')).toBe(
      '> | | |\n> |---|---|\n> | teal | 2 |'
    )
  })

  it('repairs a quoted table with no space after the >', () => {
    expect(repairMarkdown('>| teal | 2 |\n>| beige | 0 |')).toBe(
      '>| | |\n>|---|---|\n>| teal | 2 |\n>| beige | 0 |'
    )
    const headed = '>| shade | cost |\n>|---|---|\n>| teal | 2 |'
    expect(repairMarkdown(headed)).toBe(headed)
  })

  it('drops an orphan ** so the rest of the line is not bold', () => {
    expect(repairMarkdown('Teal is **warm and cheap')).toBe('Teal is warm and cheap')
    expect(repairMarkdown('**Teal** is **warm')).toBe('**Teal** is warm')
    expect(repairMarkdown('**Teal** stays')).toBe('**Teal** stays')
  })

  it('quotes code spans and fenced blocks verbatim', () => {
    expect(relabelAsProposed('Set `default: 1` and Recommend `Recommend`')).toBe(
      'Set `default: 1` and Propose `Recommend`'
    )
    expect(repairMarkdown('Glob `a**b` is **bold')).toBe('Glob `a**b` is bold')
    expect(repairMarkdown('Code `a**b` and **bold** text')).toBe('Code `a**b` and **bold** text')
    const fence = '```yaml\ndefault: teal\n| not | a table |\na**b\n```'
    expect(proposalText(`Recommended default: teal\n${fence}\n| teal | 2 |`)).toBe(
      `Proposed: teal\n${fence}\n| | |\n|---|---|\n| teal | 2 |`
    )
  })

  it('relabels the same way on a second pass and keeps a verb a verb', () => {
    for (const text of [
      'Default: buy',
      'Recommend Default: buy',
      'We Recommend teal; the seat recommends it.',
      '- Recommend teal\n**Recommend:** teal. Recommend buying.',
      'Recommendation: teal (recommended default in bold)',
    ]) {
      const once = relabelAsProposed(text)
      expect(relabelAsProposed(once)).toBe(once)
      expect(once).not.toMatch(/Proposed: Proposed/)
    }
    expect(relabelAsProposed('Default: buy')).toBe('Proposed: buy')
    expect(relabelAsProposed('Recommend Default: buy')).toBe('Proposed: buy')
    expect(relabelAsProposed('We Recommend teal and we recommend it now')).toBe(
      'We Propose teal and we propose it now'
    )
    expect(relabelAsProposed('- Recommend teal\n**Recommend:** teal. Recommend buying.')).toBe(
      '- Propose teal\n**Proposed:** teal. Propose buying.'
    )
  })

  it('relabels only whole words, each form to its own', () => {
    expect(relabelAsProposed('Recommendation engine')).toBe('Proposal engine')
    expect(relabelAsProposed('Recommended: A')).toBe('Proposed: A')
    expect(relabelAsProposed('Recommends teal')).toBe('Proposes teal')
    expect(relabelAsProposed('Recommended changes are below.')).toBe('Proposed changes are below.')
    expect(relabelAsProposed('Recommendations: A')).toBe('Proposals: A')
    expect(relabelAsProposed('Our recommendations: A')).toBe('Our proposals: A')
    expect(relabelAsProposed('It was recommended; my recommendations stand.')).toBe(
      'It was proposed; my proposals stand.'
    )
    for (const text of ['Recommendation engine', 'Recommended: A', 'Recommends teal'])
      expect(relabelAsProposed(relabelAsProposed(text))).toBe(relabelAsProposed(text))
  })

  it('keeps a bold label inside its bold', () => {
    expect(relabelAsProposed('**Recommend** teal')).toBe('**Proposed:** teal')
    expect(relabelAsProposed('**Recommended:** teal')).toBe('**Proposed:** teal')
    expect(relabelAsProposed('**Proposed:** teal')).toBe('**Proposed:** teal')
  })

  it('leaves link targets, URLs and file paths naming what they named', () => {
    expect(
      relabelAsProposed(
        'See [recommended sizes](https://x.io/recommended-sizes) and docs/recommendations.md'
      )
    ).toBe('See [proposed sizes](https://x.io/recommended-sizes) and docs/recommendations.md')
    expect(relabelAsProposed('Read <https://x.io/recommend> or https://x.io/recommend now')).toBe(
      'Read <https://x.io/recommend> or https://x.io/recommend now'
    )
    expect(relabelAsProposed('Edit recommendations.md and ./recommend/index.ts')).toBe(
      'Edit recommendations.md and ./recommend/index.ts'
    )
  })

  it('drops the default-in-each note before the general rule rewrites it', () => {
    expect(relabelAsProposed('I recommend (recommended default in each) A.')).toBe('I propose A.')
    expect(relabelAsProposed('Recommendation: teal (recommended default in bold)')).toBe(
      'Proposal: teal'
    )
  })

  it('reads a mid-sentence "default:" as prose, not a label', () => {
    expect(relabelAsProposed('Use the default: it works')).toBe('Use the default: it works')
    expect(relabelAsProposed('Costs two. default: teal')).toBe('Costs two. proposal: teal')
  })

  it('gives a table after a fence its own header', () => {
    const fence = '```\nx\n```'
    expect(repairMarkdown(`| a |\n${fence}\n| b |`)).toBe(
      `| |\n|---|\n| a |\n${fence}\n| |\n|---|\n| b |`
    )
  })

  it('relabels, then repairs', () => {
    expect(proposalText('Recommended default: **teal\n| a |')).toBe(
      'Proposed: teal\n| |\n|---|\n| a |'
    )
  })
})

describe('a round from Morning items', () => {
  it('shows every option with its proposal text labelled Proposed', () => {
    const { deciding } = section(items(), 'paint-1')
    expect(deciding).toContain('- **A: Teal** Proposed: Repaint in teal this week.')
    expect(deciding).toContain('- **B: Keep beige** Proposed: Leave it.')
    expect(deciding).toContain('- **C: Defer** Proposed: Decide after the lamps arrive.')
  })

  it('labels an option whose proposal already opens with a label once', () => {
    const labelled = item({
      options: [{ label: 'A: Buy', proposal: 'Default: buy two.' }, item().options[1]],
    })
    const { deciding } = section(items([labelled]), 'paint-1')
    expect(deciding).toContain('- **A: Buy** Proposed: buy two.')
    expect(deciding).not.toContain('Proposed: Proposed')
  })

  it.each([
    ['**Recommend** teal.', '- **A: Teal** Proposed: teal.'],
    ['**Recommend:** teal.', '- **A: Teal** Proposed: teal.'],
    ['**Recommended:** teal.', '- **A: Teal** Proposed: teal.'],
    ['**Recommend yes** because gold.', '- **A: Teal** Proposed: **yes** because gold.'],
  ])('labels an option whose proposal opens with the bold label %s once', (proposal, line) => {
    const bold = item({ options: [{ label: 'A: Teal', proposal }, item().options[1]] })
    const { deciding = '' } = section(items([bold]), 'paint-1')
    const found = deciding.split('\n').find((l) => l.startsWith('- **A: Teal**'))
    expect(found).toBe(line)
    expect(found?.match(/Proposed:/g)).toHaveLength(1)
    expect((found?.split('**').length ?? 1) % 2).toBe(1)
  })

  it('refuses an option that is only a heading', () => {
    const bare = item({ options: [{ label: 'A: Thresholds', proposal: ' ' }, item().options[1]] })
    expect(() => roundFromMorning(items([bare]), [], PATHS)).toThrow(/bare heading/)
  })

  it.each(['**Recommend**', 'Recommend:', 'Default:', '**Proposed:**'])(
    'refuses an option whose proposal is only the label %s',
    (proposal) => {
      const bare = item({ options: [{ label: 'A: Teal', proposal }, item().options[1]] })
      expect(() => roundFromMorning(items([bare]), [], PATHS)).toThrow(/bare heading/)
    }
  )

  it.each([
    ['Recommended changes are below.', '- **A: Teal** Proposed: changes are below.'],
    ['**Proposed: **yes**', '- **A: Teal** Proposed: yes'],
    ['Proposed: **Proposed:** x', '- **A: Teal** Proposed: x'],
  ])('says Proposed once, with no empty bold, for the proposal %s', (proposal, line) => {
    const labelled = item({ options: [{ label: 'A: Teal', proposal }, item().options[1]] })
    const { deciding = '' } = section(items([labelled]), 'paint-1')
    const found = deciding.split('\n').find((l) => l.startsWith('- **A: Teal**'))
    expect(found).toBe(line)
    expect(found?.match(/Proposed/g)).toHaveLength(1)
    expect(found).not.toContain('****')
  })

  it('relabels the body and repairs its markdown in the section text', () => {
    const body = 'Recommended default: teal.\n| teal | 2 |\nCosts: **2 coins'
    const { changed } = section(items([item({ body })]), 'paint-1')
    expect(changed).toBe('Proposed: teal.\n| | |\n|---|---|\n| teal | 2 |\nCosts: 2 coins')
  })

  it('has no variant strip and no index image when no item has images', () => {
    const draft = roundFromMorning(items(), [], PATHS)
    expect(draft.variants).toEqual([])
    expect(draft.sections?.map((s) => s.variantKeys ?? [])).toEqual([[]])
    expect(draft.sections?.[0].kind).toBeUndefined()
    expect(draft.sections?.[0].contrast).toBeUndefined()
    expect(JSON.stringify(draft)).not.toMatch(/index/i)
  })

  it('attaches the decider recommendation from its own file, with the cite', () => {
    const draft = roundFromMorning(items(), [decider()], PATHS)
    const [q] = draft.questions
    expect(q.kind === 'pick-one' && q.recommendation).toEqual({
      answer: 'A: Teal',
      rationale:
        'The lamps are warm and teal reads well under them.\n\nCite: paint-notes section 2',
      confidence: 0.7,
      by: DECIDER_BY,
    })
    expect(draft.recommendations).toBe('after-answer')
  })

  it('leaves a question without a decider entry unrecommended', () => {
    const [q] = roundFromMorning(items(), [], PATHS).questions
    expect(q.kind === 'pick-one' && q.recommendation).toBeUndefined()
  })

  it('refuses a decider answer that is not one of the options, or an unknown item', () => {
    expect(() => roundFromMorning(items(), [decider({ answer: 'D: Pink' })], PATHS)).toThrow(
      /"D: Pink" is not one of its options/
    )
    expect(() => roundFromMorning(items(), [decider({ questionId: 'paint-9' })], PATHS)).toThrow(
      /no item has the id paint-9/
    )
  })

  it('refuses two decider entries for one item rather than keep the last', () => {
    const twice = [decider(), decider({ answer: 'B: Keep beige' })]
    expect(() => roundFromMorning(items(), twice, PATHS)).toThrow(
      /more than one entry answers paint-1/
    )
  })

  function threeItems(): MorningItem[] {
    const door = [
      { label: 'A: Paint it', proposal: 'Teal, same tin.' },
      { label: 'B: Leave it', proposal: 'The door stays white.' },
      { label: 'C: Defer', proposal: 'Decide with the shelf.' },
    ]
    const price = [
      { label: 'A: Whole coins', proposal: 'Round every price up.' },
      { label: 'B: Keep halves', proposal: 'Prices stay as they are.' },
    ]
    return [
      item({ id: 'paint-1', seat: 'paint-seat' }),
      item({ id: 'price-1', seat: 'price-seat', title: 'Whole coins?', options: price }),
      item({
        id: 'paint-2',
        seat: 'paint-seat',
        title: 'The door too?',
        morning: '2',
        options: door,
      }),
    ]
  }

  it('groups items by seat in order of first appearance and sets signsOff', () => {
    const draft = roundFromMorning(items(threeItems()), [], PATHS)
    expect(draft.sections?.map((s) => s.id)).toEqual(['paint-1', 'paint-2', 'price-1'])
    expect(draft.questions.map((q) => q.id)).toEqual(['paint-1', 'paint-2', 'price-1'])
    expect(draft.sections?.[1].title).toBe('paint-seat Morning 2: The door too?')
    const [q] = draft.questions
    expect(q.kind === 'pick-one' && q.signsOff).toBe(
      'the answer to paint-seat Morning 1: Repaint the widget shelf in teal?'
    )
    expect(q.required).toBe(true)
  })

  it('keeps an author-given signsOff and says which door the item is', () => {
    const one = item({ door: 'one-way', signsOff: 'the shelf colour' })
    const draft = roundFromMorning(items([one]), [], PATHS)
    const [q] = draft.questions
    expect(q.kind === 'pick-one' && q.signsOff).toBe('the shelf colour')
    expect(draft.sections?.[0].context).toContain('One-way door')
  })

  it('puts item captures in a STATES strip with both modes declared unmeasured', () => {
    const images = [
      { key: 'before', file: 'shots/before.png', label: 'Beige, today' },
      { key: 'after', file: 'shots/after.png', label: 'Teal, proposed' },
    ]
    const draft = roundFromMorning(items([item({ images })]), [], PATHS)
    expect(draft.variants.map((v) => v.image)).toEqual(['shots/before.png', 'shots/after.png'])
    const [s] = draft.sections!
    expect(s.kind).toBe('STATES')
    expect(s.variantKeys).toEqual(['before', 'after'])
    expect(s.contrast?.unmeasured?.map((u) => `${u.variant}|${u.mode}`)).toEqual([
      'before|light',
      'before|dark',
      'after|light',
      'after|dark',
    ])
  })

  it('names the length when a shared image key outgrows the variant key limit', () => {
    const long = 'a-fairly-long-item-identifier-'
    const shot = [{ key: 'before', file: 'before.png', label: 'Before' }]
    const list = [
      item({ id: `${long}1`, images: shot }),
      item({ id: `${long}2`, morning: '2', images: shot }),
    ]
    expect(() => roundFromMorning(items(list), [], PATHS)).toThrow(
      /becomes "before-a-fairly-long-item-identifier-1", 38 characters; a variant key is at most 32/
    )
  })

  it('qualifies an image key two items share with the item id', () => {
    const shots = (dir: string) => [
      { key: 'before', file: `${dir}/before.png`, label: 'Before' },
      { key: 'after', file: `${dir}/after.png`, label: 'After' },
    ]
    const list = [
      item({ images: shots('shelf') }),
      item({ id: 'paint-2', morning: '2', title: 'The door too?', images: shots('door') }),
      item({
        id: 'price-1',
        seat: 'price-seat',
        title: 'Whole coins?',
        options: [
          { label: 'A: Whole', proposal: 'Round up.' },
          { label: 'B: Halves', proposal: 'Keep.' },
        ],
        images: [{ key: 'till', file: 'till.png', label: 'The till' }],
      }),
    ]
    const draft = roundFromMorning(items(list), [], PATHS)
    expect(draft.variants.map((v) => v.key)).toEqual([
      'before-paint-1',
      'after-paint-1',
      'before-paint-2',
      'after-paint-2',
      'till',
    ])
    expect(draft.sections?.[1].variantKeys).toEqual(['before-paint-2', 'after-paint-2'])
    expect(draft.sections?.[1].contrast?.unmeasured?.map((u) => u.variant)).toEqual([
      'before-paint-2',
      'before-paint-2',
      'after-paint-2',
      'after-paint-2',
    ])
    expect(RoundSchema.safeParse(draft).success).toBe(true)
  })

  it('refuses a draft whose images would sit outside its directory', () => {
    const images = [{ key: 'before', file: 'shots/before.png', label: 'Beige, today' }]
    const paths = { itemsDir: '/rounds/r1', draftDir: '/rounds/r1/out' }
    expect(() => roundFromMorning(items([item({ images })]), [], paths)).toThrow(
      /item paint-1: image shots\/before.png is outside the draft's directory/
    )
  })

  it('passes the round@2 contract', () => {
    const draft = roundFromMorning(items(threeItems()), [decider()], PATHS)
    expect(RoundSchema.safeParse(draft).success).toBe(true)
  })

  it('qualifies an option label two items share with the item id, decider answer included', () => {
    const list = [item(), item({ id: 'paint-2', morning: '2', title: 'The door too?' })]
    const draft = roundFromMorning(items(list), [decider({ questionId: 'paint-2' })], PATHS)
    const [first, second] = draft.questions
    expect(first.kind === 'pick-one' && first.options).toEqual([
      'A: Teal (paint-1)',
      'B: Keep beige (paint-1)',
      'C: Defer (paint-1)',
    ])
    expect(second.kind === 'pick-one' && second.recommendation?.answer).toBe('A: Teal (paint-2)')
    expect(draft.sections?.[1].deciding).toContain('- **C: Defer (paint-2)** Proposed:')
    expect(RoundSchema.safeParse(draft).success).toBe(true)
  })

  it('leaves an option label only one item uses as it is', () => {
    const draft = roundFromMorning(items(threeItems()), [], PATHS)
    const price = draft.questions[2]
    expect(price.kind === 'pick-one' && price.options).toEqual(['A: Whole coins', 'B: Keep halves'])
    expect(draft.questions[0].kind === 'pick-one' && draft.questions[0].options[2]).toBe(
      'C: Defer (paint-1)'
    )
  })
})

describe('titan-review round from-morning', () => {
  const io = (stderr: string[]): CliIo => ({
    stdout: () => {},
    stderr: (t) => stderr.push(t),
    openBrowser: () => {},
    capture: async () => [],
    measure: async () => [],
    createPage: async () => ({ handler: () => {}, close: async () => {} }),
    harnessFreshness: async () => ({ state: 'current' }),
    signal: new AbortController().signal,
  })

  async function writeInputs(input: MorningItems, entries?: DeciderEntry[]) {
    const dir = await mkdtemp(join(tmpdir(), 'titan-morning-'))
    const itemsPath = join(dir, 'items.json')
    await writeFile(itemsPath, JSON.stringify(input))
    const deciderPath = join(dir, 'decider.json')
    if (entries) await writeFile(deciderPath, JSON.stringify(entries))
    return { dir, itemsPath, deciderPath: entries ? deciderPath : undefined }
  }

  it('writes draft.json beside the items file and build accepts it', async () => {
    const { dir, itemsPath, deciderPath } = await writeInputs(items(), [decider()])
    const stderr: string[] = []
    const args = ['round', 'from-morning', itemsPath, '--decider', deciderPath!]
    expect(await runCli(args, io(stderr))).toBe(0)
    const draftPath = join(dir, 'draft.json')
    expect(stderr.join('\n')).toContain(`wrote ${draftPath}`)
    const draft = JSON.parse(await readFile(draftPath, 'utf8'))
    expect(draft.schema).toBe('titan-review/round@2')
    expect(draft.questions[0].recommendation.by).toBe(DECIDER_BY)

    expect(await runCli(['build', draftPath], io(stderr))).toBe(0)
    const round = await loadRound(join(dir, ROUND_FILE))
    expect(round.manifest.sections?.[0].deciding).toContain('Proposed: Repaint in teal')
  })

  it('refuses to write round.json, which build owns', async () => {
    const { dir, itemsPath } = await writeInputs(items())
    const stderr: string[] = []
    const args = ['round', 'from-morning', itemsPath, '--out', join(dir, ROUND_FILE)]
    expect(await runCli(args, io(stderr))).toBe(2)
    expect(stderr.join('\n')).toContain('build writes that file')
  })

  it('names the item field an invalid items file is missing', async () => {
    const { itemsPath } = await writeInputs({
      ...items(),
      items: [{ ...item(), options: [{ label: 'A: Thresholds' }] }],
    } as unknown as MorningItems)
    const stderr: string[] = []
    expect(await runCli(['round', 'from-morning', itemsPath], io(stderr))).toBe(2)
    expect(stderr.join('\n')).toContain('items.0.options.0.proposal: every option carries')
  })

  it('rejects a misspelt subcommand with the usage', async () => {
    const stderr: string[] = []
    expect(await runCli(['round', 'from-evening', 'x.json'], io(stderr))).toBe(2)
    expect(stderr.join('\n')).toContain('round from-morning <items.json>')
  })
})
