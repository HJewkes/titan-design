import { describe, expect, it } from 'vitest'
import { createReducer, initialState, numberKeyAction, stopsFor } from '../page/state.ts'
import { manifest } from './fixtures.ts'

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
