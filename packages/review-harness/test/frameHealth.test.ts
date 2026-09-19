import { describe, expect, it } from 'vitest'
import { reachedStorybook } from '../page/Frame.tsx'

function doc(ids: string[]): Pick<Document, 'getElementById'> {
  return { getElementById: (id) => (ids.includes(id) ? ({} as HTMLElement) : null) }
}

describe('frame health', () => {
  it('counts a loaded story frame as reached', () => {
    expect(reachedStorybook(doc(['storybook-root']))).toBe(true)
  })

  it("counts the proxy's unreachable page as dead", () => {
    expect(reachedStorybook(doc([]))).toBe(false)
  })

  it('gives a cross-origin frame, which cannot be inspected, the benefit of the doubt', () => {
    expect(reachedStorybook(null)).toBe(true)
  })
})
