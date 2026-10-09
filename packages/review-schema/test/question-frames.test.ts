import { describe, expect, it } from 'vitest'
import { MANIFEST_SCHEMA_ID, ManifestSchema, RoundSchema } from '../src/index.ts'

const TEXTS = { deciding: 'Which weight.', changed: 'New weights.', context: 'None.' }

const frame = (key: string, height?: number) => ({
  key,
  image: `frames/${key}.png`,
  label: key,
  ...(height ? { height } : {}),
})

/** One STATES section of four frames; `pick` chooses between the first two. */
function round(frames?: string[]) {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'question-frames',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: ['A', 'B', 'C', 'D'].map((k) => frame(k)),
    questions: [
      {
        id: 'pick',
        kind: 'pick-one',
        prompt: 'Which weight?',
        options: ['A', 'B'],
        signsOff: 'the weight',
        ...(frames ? { frames } : {}),
      },
      { id: 'note', kind: 'text', prompt: 'Anything else?' },
    ],
    sections: [
      {
        id: 's1',
        title: 'Weights',
        ...TEXTS,
        kind: 'STATES',
        questionIds: ['pick', 'note'],
        variantKeys: ['A', 'B', 'C', 'D'],
      },
    ],
  }
}

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((i) => i.message) ?? []

describe('question frames', () => {
  it('lets a question in a STATES strip pick among the frames placed above it', () => {
    const result = RoundSchema.safeParse(round(['A', 'B']))
    expect(messages(result)).toEqual([])
    expect(result.data?.questions[0]?.frames).toEqual(['A', 'B'])
  })

  it('still refuses a frame-picking question in a STATES strip without frames', () => {
    expect(messages(RoundSchema.safeParse(round()))).toEqual([
      'section s1: a STATES strip asks no choice, but question pick picks a frame; give it frames to choose among them',
    ])
  })

  it('refuses a pick outside the question frames', () => {
    expect(messages(RoundSchema.safeParse(round(['A', 'C'])))).toEqual([
      'section s1: a STATES strip asks no choice, but question pick picks a frame; give it frames to choose among them',
    ])
  })

  it('refuses an unknown frame and a repeated one', () => {
    expect(messages(ManifestSchema.safeParse(round(['A', 'B', 'Z', 'A'])))).toEqual([
      'question pick: unknown frame Z',
      'question pick: frame A repeats',
    ])
  })

  it('refuses a frame from another section, which would not sit above the question', () => {
    const r = round(['A', 'B'])
    r.variants.push(frame('E'))
    r.sections.push({
      id: 's2',
      title: 'Other',
      ...TEXTS,
      kind: 'STATES',
      questionIds: [],
      variantKeys: ['E'],
    })
    r.questions[0] = { ...r.questions[0], frames: ['A', 'E'] }
    expect(messages(ManifestSchema.safeParse(r))).toEqual([
      'question pick: frame E is in section s2, not in its own section s1, so it would not sit directly above the question',
    ])
  })

  it('refuses one frame above two questions', () => {
    const r = round(['A', 'B'])
    r.questions[1] = { ...r.questions[1], frames: ['B'] }
    expect(messages(ManifestSchema.safeParse(r))).toEqual([
      'frame B sits above pick and note; a frame belongs to one question',
    ])
  })

  it('refuses frames on a question in no section, or in a round without sections', () => {
    const loose = round(['A', 'B'])
    loose.sections[0].questionIds = ['note']
    expect(messages(ManifestSchema.safeParse(loose))).toContain(
      'question pick: it has frames but is in no section, so none can sit above it'
    )
    const { sections: _, ...unsectioned } = round(['A', 'B'])
    expect(messages(ManifestSchema.safeParse(unsectioned))).toEqual([
      'question pick: frames need sections; group the round into sections',
    ])
  })

  it('holds CHOICE settings constant within each compared set, not across the strip', () => {
    const r = round(['A', 'B'])
    r.sections[0].kind = 'CHOICE'
    r.variants = [frame('A'), frame('B'), frame('C', 400), frame('D', 400)]
    expect(messages(RoundSchema.safeParse(r))).toEqual([])
    r.variants[1] = frame('B', 400)
    expect(messages(RoundSchema.safeParse(r))).toEqual([
      'section s1: its CHOICE frames differ in height (A: the section default, B: 400); a choice holds every frame setting constant except the property decided',
    ])
  })
})
