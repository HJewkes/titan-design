import { describe, expect, it } from 'vitest'
import { VariantSchema } from '../src/index.ts'

describe('a variant names its marks (TD-962)', () => {
  it('takes named selectors on a story', () => {
    const marks = { ticks: '[data-testid^="gauge-tick"]', bars: 'rect.bar' }
    const parsed = VariantSchema.parse({ key: 'g', storyId: 'a--b', label: 'Gauge', marks })
    expect(parsed.marks).toEqual(marks)
  })

  it('refuses marks on an image, which has no DOM to probe', () => {
    const image = { key: 'g', image: 'g.png', label: 'Gauge', marks: { ticks: 'line' } }
    expect(VariantSchema.safeParse(image).error?.issues[0].message).toBe(
      'marks need a storyId variant'
    )
  })
})
