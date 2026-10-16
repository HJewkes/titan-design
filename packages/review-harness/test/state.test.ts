import { describe, expect, it } from 'vitest'
import {
  createReducer,
  initialState,
  numberKeyAction,
  pageOf,
  pageStepAction,
  pagesFor,
  stopsFor,
} from '../page/state.ts'
import { ManifestSchema } from '@titan-design/review-schema'
import { manifest, pagedImageInput, sectioned, sectionedInput } from './fixtures.ts'

const m = manifest()
const reduce = createReducer(m)

describe('keyboard model', () => {
  it('orders stops as variants, then questions, then the general note', () => {
    expect(
      stopsFor(m).map((s) => (s.kind === 'variant' ? s.key : s.kind === 'question' ? s.id : s.kind))
    ).toEqual(['A', 'B', 'C', 'q1', 'q2', 'q3', 'q4', 'general'])
  })

  it('maps digits to a verdict on a variant, an option on a pick, a value on a scale', () => {
    const [a, , , q1, q2, q3, q4] = stopsFor(m)
    expect(numberKeyAction(m, a, '2')).toEqual({ type: 'verdict', key: 'A', verdict: 'rejected' })
    expect(numberKeyAction(m, q1, '3')).toEqual({
      type: 'pick',
      id: 'q1',
      option: 'C',
      many: false,
    })
    expect(numberKeyAction(m, q2, '9')).toBeNull()
    expect(numberKeyAction(m, q3, '4')).toEqual({ type: 'value', id: 'q3', value: 4 })
    expect(numberKeyAction(m, q4, '1')).toBeNull()
  })

  it('advances through every stop and then opens the review screen', () => {
    let state = initialState(m)
    for (let i = 0; i < stopsFor(m).length - 1; i++) state = reduce(state, { type: 'advance' })
    expect(state.active).toBe(7)
    expect(reduce(state, { type: 'advance' }).screen).toBe('review')
  })

  it('follows keyboard navigation but not a stop the human clicked into', () => {
    const advanced = reduce(initialState(m), { type: 'advance' })
    expect(advanced).toMatchObject({ active: 1, follow: true })
    expect(reduce(advanced, { type: 'activate', index: 4 })).toMatchObject({
      active: 4,
      follow: false,
    })
  })

  it('numbers pins per variant and focuses the new one', () => {
    const pin = { width: 360, x: 1, y: 2, xPct: 0, yPct: 0 }
    let state = reduce(initialState(m), { type: 'addPin', key: 'A', pin })
    state = reduce(state, { type: 'addPin', key: 'A', pin })
    expect(state.draft.variants.A.annotations.map((p) => p.id)).toEqual(['A-1', 'A-2'])
    expect(state.focusPin).toBe('A-2')
  })

  it('toggles pick-many options and clears a repeated pick-one', () => {
    let state = reduce(initialState(m), { type: 'pick', id: 'q2', option: 'A', many: true })
    state = reduce(state, { type: 'pick', id: 'q2', option: 'B', many: true })
    state = reduce(state, { type: 'pick', id: 'q2', option: 'A', many: true })
    state = reduce(state, { type: 'pick', id: 'q1', option: 'A', many: false })
    state = reduce(state, { type: 'pick', id: 'q1', option: 'A', many: false })
    expect(state.draft.answers.q2.picks).toEqual(['B'])
    expect(state.draft.answers.q1.pick).toBeUndefined()
  })
})

describe('section paging', () => {
  const paged = ManifestSchema.parse(pagedImageInput(60))

  it('keeps an unsectioned round on one page', () => {
    expect(pagesFor(m)).toEqual([{ id: 'all', title: m.unit, first: 0, last: 7, sectionIds: [] }])
    expect(pageStepAction(m, 3, 1)).toBeNull()
  })

  it('pages each section, then Other frames, then Overall with the general note', () => {
    expect(pagesFor(sectioned())).toEqual([
      { id: 'lead', title: 'Which card leads the page?', first: 0, last: 3, sectionIds: ['lead'] },
      { id: '#other', title: 'Other frames', first: 4, last: 4, sectionIds: [] },
      { id: '#overall', title: 'Overall', first: 5, last: 7, sectionIds: [] },
    ])
  })

  it('steps ] and [ to the first stop of the next or previous section, and stops at the ends', () => {
    const [one, two] = pagesFor(paged)
    expect(pageStepAction(paged, one.first + 5, 1)).toEqual({ type: 'jump', index: two.first })
    expect(pageStepAction(paged, two.last, -1)).toEqual({ type: 'jump', index: one.first })
    expect(pageStepAction(paged, 0, -1)).toBeNull()
    expect(pageStepAction(paged, stopsFor(paged).length - 1, 1)).toBeNull()
  })

  it('gives a context-only section one stop so ] and [ reach its page', () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'one', title: 'One', questionIds: ['q1'], variantKeys: ['A'] },
      { id: 'notes', title: 'Notes', questionIds: [], variantKeys: [] },
      { id: 'two', title: 'Two', questionIds: ['q2'], variantKeys: ['B'] },
    ]
    const round = ManifestSchema.parse(input)
    const pages = pagesFor(round)
    expect(pages.map((p) => [p.id, p.first, p.last])).toEqual([
      ['one', 0, 1],
      ['notes', 2, 2],
      ['two', 3, 4],
      ['#other', 5, 5],
      ['#overall', 6, 8],
    ])
    expect(pageStepAction(round, 0, 1)).toEqual({ type: 'jump', index: 2 })
    expect(pageStepAction(round, 2, 1)).toEqual({ type: 'jump', index: 3 })
    expect(pageStepAction(round, 3, -1)).toEqual({ type: 'jump', index: 2 })
    expect(numberKeyAction(round, stopsFor(round)[2], '1')).toBeNull()
  })

  it('follows a jump, and Enter carries the human from one section into the next', () => {
    const reducePaged = createReducer(paged)
    const [one, two] = pagesFor(paged)
    const jumped = reducePaged(initialState(paged), { type: 'jump', index: one.last })
    expect(jumped).toMatchObject({ active: one.last, follow: true })
    const next = reducePaged(jumped, { type: 'advance' })
    expect(pageOf(pagesFor(paged), next.active)).toBe(1)
    expect(next.active).toBe(two.first)
  })
})
