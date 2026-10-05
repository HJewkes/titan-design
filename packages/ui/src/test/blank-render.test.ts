import { blankRenderReason } from './blank-render'

describe('blank render guard', () => {
  it('passes a root with a box and children', () => {
    expect(blankRenderReason({ width: 320, height: 48, childElementCount: 1 })).toBeNull()
  })

  it('fails an empty root', () => {
    expect(blankRenderReason({ width: 1280, height: 0, childElementCount: 0 })).toMatch(
      /zero-size|no child/
    )
    expect(blankRenderReason({ width: 1280, height: 20, childElementCount: 0 })).toMatch(
      /no child elements/
    )
  })

  it('fails a zero-size root that has children', () => {
    expect(blankRenderReason({ width: 1280, height: 0, childElementCount: 2 })).toMatch(
      /zero-size box/
    )
  })

  it('fails a missing root', () => {
    expect(blankRenderReason(null)).toMatch(/missing/)
  })
})
