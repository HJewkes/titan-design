import { describe, expect, it } from 'vitest'
import { MANIFEST_SCHEMA_ID, RoundSchema, lintRound, type LintRule } from '../src/index.ts'

const TEXTS = { deciding: 'Which format.', changed: 'Two formats.', context: 'As built.' }
const HEAD_101 = '1'.repeat(40)
const HEAD_102 = '2'.repeat(40)

const frame = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  image: `frames/${key}.png`,
  label: key,
  ...extra,
})
const view = (unit: string, alternate: string, theme: string) => ({
  key: `${unit}-${theme}`,
  storyId: 'components-atoms-pill--default',
  label: `${unit}, ${theme}`,
  args: { variant: unit },
  globals: { theme },
  variantUnit: unit,
  alternate,
  change: 'new',
})

const ship = (pr: number, headSha: string) => ({
  id: `ship-${pr}`,
  kind: 'pick-one',
  decision: 'ship',
  prompt: `Ship owner/name#${pr} at this head?`,
  options: ['Ship', "Don't ship"],
  outcomes: { Ship: 'accept', "Don't ship": 'changes' },
  required: true,
  signsOff: `the change in owner/name#${pr}`,
  page: `owner/name#${pr}`,
  merge: { repo: 'owner/name', pr, headSha, ship: ['Ship'] },
})

const section = (id: string, questionIds: string[], variantKeys: string[]) => ({
  id,
  title: id,
  ...TEXTS,
  kind: 'STATES',
  questionIds,
  variantKeys,
})

/** Two PR groups: #101 picks a format among two whole units, then ships; #102 only ships. */
function base() {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'lint-round',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: [
      frame('built', { change: 'unchanged' }),
      view('subtle', 'A', 'dark'),
      view('subtle', 'A', 'light'),
      view('outline', 'B', 'dark'),
      view('outline', 'B', 'light'),
      frame('button', { change: 'changed' }),
    ],
    questions: [
      {
        id: 'format',
        kind: 'pick-one',
        decision: 'iterate',
        prompt: 'Which format?',
        options: ['Subtle', 'Outline', 'Current'],
        outcomes: { Subtle: 'changes', Outline: 'changes', Current: 'accept' },
        required: true,
        signsOff: 'the format',
        page: 'owner/name#101',
        frames: ['subtle-dark', 'subtle-light', 'outline-dark', 'outline-light'],
      },
      {
        id: 'policy',
        kind: 'pick-one',
        decision: 'decide',
        prompt: 'Which policy?',
        options: ['Strict', 'Loose'],
        signsOff: 'the policy',
      },
      ship(101, HEAD_101),
      ship(102, HEAD_102),
    ] as Record<string, unknown>[],
    sections: [
      section(
        'pr-101',
        ['format', 'ship-101'],
        ['built', 'subtle-dark', 'subtle-light', 'outline-dark', 'outline-light']
      ),
      section('pr-102', ['policy', 'ship-102'], ['button']),
    ],
    prGroups: [
      { pr: 'owner/name#101', headSha: HEAD_101, sectionIds: ['pr-101'] },
      { pr: 'owner/name#102', headSha: HEAD_102, sectionIds: ['pr-102'] },
    ],
  }
}

type Draft = ReturnType<typeof base>

const lint = (draft: Draft) => lintRound(RoundSchema.parse(draft))
const rules = (draft: Draft) => lint(draft).map((p) => p.rule)
const only = (draft: Draft, rule: LintRule) =>
  lint(draft)
    .filter((p) => p.rule === rule)
    .map((p) => p.message)
const question = (draft: Draft, id: string) => draft.questions.find((q) => q.id === id)!

describe('lintRound', () => {
  it('passes a round whose decisions sit under their frames, each PR group whole, Ship last', () => {
    expect(lint(base())).toEqual([])
  })

  it('refuses a deciding question with no frames, but not a decide question or a Ship', () => {
    const draft = base()
    delete question(draft, 'format').frames
    expect(lint(draft)).toEqual([
      {
        rule: 'unanchored-question',
        message: 'question format: it decides something its section shows; name its frames',
      },
    ])
  })

  it('refuses an iterate question with no frames even in a section without frames', () => {
    const draft = base()
    question(draft, 'policy').decision = 'iterate'
    expect(rules(draft)).toEqual(['unanchored-question'])
  })

  it('refuses a frame from another section, which would not sit above the question', () => {
    const draft = base()
    question(draft, 'format').frames = [
      'subtle-dark',
      'subtle-light',
      'outline-dark',
      'outline-light',
      'button',
    ]
    expect(only(draft, 'frame-outside-section')).toEqual([
      'question format: frame button is in section pr-102, not in its own section pr-101, so it would not sit directly above the question',
    ])
  })

  it('refuses one frame above two questions', () => {
    const draft = base()
    draft.questions.push({
      id: 'note',
      kind: 'text',
      prompt: 'Anything else?',
      frames: ['subtle-dark'],
    })
    draft.sections[0].questionIds.splice(1, 0, 'note')
    expect(only(draft, 'shared-frame-set')).toEqual([
      'frame subtle-dark sits above format and note; a frame belongs to one question',
    ])
  })

  it('refuses a variant unit split across blocks or across alternates', () => {
    const split = base()
    split.variants[0] = { ...split.variants[0], variantUnit: 'subtle', alternate: 'A' }
    expect(only(split, 'split-variant-unit')).toEqual([
      "variant unit subtle is split across section pr-101's strip and question format; show its views together",
    ])
    const columns = base()
    columns.variants[2] = { ...columns.variants[2], alternate: 'B' }
    expect(only(columns, 'split-variant-unit')).toEqual([
      'variant unit subtle stands in alternates A and B; a unit is one column',
    ])
  })

  it('refuses alternates that show different sets of views', () => {
    const draft = base()
    draft.variants = draft.variants.filter((v) => v.key !== 'outline-light')
    draft.sections[0].variantKeys = draft.sections[0].variantKeys.filter(
      (k) => k !== 'outline-light'
    )
    question(draft, 'format').frames = ['subtle-dark', 'subtle-light', 'outline-dark']
    expect(only(draft, 'unequal-alternates')).toEqual([
      'question format: alternate A shows theme=dark, theme=light but B shows theme=dark; compare whole units over the same modes',
    ])
  })

  it("refuses a PR group split by another PR's section", () => {
    const draft = base()
    draft.variants.push(frame('more'))
    draft.sections.push(section('pr-101-more', [], ['more']))
    draft.prGroups[0].sectionIds.push('pr-101-more')
    expect(rules(draft)).toContain('split-pr-group')
    expect(only(draft, 'split-pr-group')).toEqual([
      "PR group owner/name#101 is split by section pr-102; keep a PR's sections together",
    ])
  })

  it('refuses a Ship that is not last in its PR group', () => {
    const draft = base()
    draft.variants.push(frame('more'))
    draft.sections.splice(1, 0, section('pr-101-more', [], ['more']))
    draft.prGroups[0].sectionIds.push('pr-101-more')
    expect(lint(draft)).toEqual([
      {
        rule: 'ship-not-last',
        message:
          "question ship-101: Ship sits in section pr-101, but owner/name#101's last section is pr-101-more",
      },
    ])
  })

  it('refuses an anchored Ship above another anchored question, and a Ship in another PR group', () => {
    const anchored = base()
    question(anchored, 'ship-101').frames = ['built']
    anchored.sections[0].questionIds = ['ship-101', 'format']
    expect(only(anchored, 'ship-not-last')).toEqual([
      'question ship-101: Ship is not the last question in section pr-101',
    ])
    const misplaced = base()
    misplaced.sections[0].questionIds = ['format']
    misplaced.sections[1].questionIds = ['policy', 'ship-102', 'ship-101']
    expect(only(misplaced, 'ship-not-last')).toEqual([
      'question ship-101: it ships owner/name#101 but sits in section pr-102, which is about owner/name#102',
    ])
  })

  it('refuses a Ship whose head or PR is not its group’s one PR at one head', () => {
    const draft = base()
    draft.prGroups[0].headSha = '3'.repeat(40)
    question(draft, 'ship-102').prompt = 'Ship owner/name#102 and owner/name#7 at abcdef1?'
    expect(only(draft, 'ship-head-mismatch')).toEqual([
      `question ship-101: it ships owner/name#101 at ${HEAD_101}, but its PR group is at ${'3'.repeat(40)}`,
      'question ship-102: its prompt names owner/name#7, but it ships owner/name#102',
      `question ship-102: its prompt names head abcdef1, but it ships owner/name#102 at ${HEAD_102}`,
    ])
  })

  it('accepts a Ship prompt naming its own head by short sha', () => {
    const draft = base()
    question(draft, 'ship-101').prompt = `Ship owner/name#101 at ${HEAD_101.slice(0, 7)}?`
    expect(lint(draft)).toEqual([])
  })
})
