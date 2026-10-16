import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState, pagesFor, stopsFor, type Action, type ReviewState } from '../page/state.ts'
import { onFormKey } from '../page/useKeyboard.ts'
import { ManifestSchema } from '@titan-design/review-schema'
import { pagedImageInput } from './fixtures.ts'

class FakeTextArea {}
class FakeInput {}

const paged = ManifestSchema.parse(pagedImageInput(60))
const [one, two] = pagesFor(paged)
const signOff = stopsFor(paged).findIndex((s) => s.kind === 'question' && s.id === 'sign-off')

function press(
  key: string,
  active: number,
  target: object | null = null,
  tab: ReviewState['tab'] = 'review'
): Action[] {
  const dispatched: Action[] = []
  const event = {
    key,
    target,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    preventDefault: () => {},
  } as unknown as KeyboardEvent
  onFormKey(event, {
    manifest: paged,
    state: { ...initialState(paged), active, tab },
    dispatch: (action) => dispatched.push(action),
    submit: () => {},
  })
  return dispatched
}

describe('the [ and ] paging keys on a sectioned round', () => {
  beforeEach(() => {
    vi.stubGlobal('HTMLTextAreaElement', FakeTextArea)
    vi.stubGlobal('HTMLInputElement', FakeInput)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('jumps ] forward to the first stop of the next section', () => {
    expect(press(']', one.first + 5)).toEqual([{ type: 'jump', index: two.first }])
  })

  it('jumps [ back to the first stop of the previous section', () => {
    expect(press('[', two.first + 3)).toEqual([{ type: 'jump', index: one.first }])
  })

  it('ignores both keys while the human types in a textarea', () => {
    const textarea = new FakeTextArea()
    expect(press(']', one.first + 5, textarea)).toEqual([])
    expect(press('[', two.first + 3, textarea)).toEqual([])
  })
})

describe('answer keys while a PR page shows Diff or Context', () => {
  beforeEach(() => {
    vi.stubGlobal('HTMLTextAreaElement', FakeTextArea)
    vi.stubGlobal('HTMLInputElement', FakeInput)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('answers the active stop with a digit on the Review tab', () => {
    expect(press('2', signOff, null, 'review')).toEqual([
      { type: 'pick', id: 'sign-off', option: 'Fail', many: false },
    ])
  })

  it('ignores digits and the annotate key on the Diff and Context tabs', () => {
    for (const tab of ['diff', 'context'] as const) {
      expect(press('1', signOff, null, tab)).toEqual([])
      expect(press('2', signOff, null, tab)).toEqual([])
      expect(press('a', signOff, null, tab)).toEqual([])
    }
  })

  it('still pages sections from the Diff tab', () => {
    expect(press(']', one.first + 5, null, 'diff')).toEqual([{ type: 'jump', index: two.first }])
  })
})
