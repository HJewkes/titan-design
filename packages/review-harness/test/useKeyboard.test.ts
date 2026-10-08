import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState, pagesFor, type Action } from '../page/state.ts'
import { onFormKey } from '../page/useKeyboard.ts'
import { ManifestSchema } from '@titan-design/review-schema'
import { pagedImageInput } from './fixtures.ts'

class FakeTextArea {}
class FakeInput {}

const paged = ManifestSchema.parse(pagedImageInput(60))
const [one, two] = pagesFor(paged)

function press(key: string, active: number, target: object | null = null): Action[] {
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
    state: { ...initialState(paged), active },
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
