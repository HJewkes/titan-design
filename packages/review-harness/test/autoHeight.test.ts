import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AUTO_FALLBACK_HEIGHT,
  MIN_FRAME_HEIGHT,
  STORY_GUTTER,
  nextFrameHeight,
  storyContentHeight,
  type MeasurableDoc,
} from '../page/autoHeight.ts'
import { captureViewportHeight } from '../src/capture.ts'
import { ManifestSchema } from '../src/schema.ts'
import { sectionedInput } from './fixtures.ts'

function storyDoc(boxes: { top: number; bottom: number }[] | null): MeasurableDoc {
  return {
    getElementById: (id) =>
      id === 'storybook-root' && boxes
        ? {
            children: boxes.map((b) => ({ getBoundingClientRect: () => b })),
            scrollHeight: 0,
          }
        : null,
  }
}

describe('fitting a frame to its story', () => {
  it('measures the story elements, not the frame that holds them', () => {
    expect(storyContentHeight(storyDoc([{ top: 100, bottom: 340 }]))).toBe(240 + STORY_GUTTER)
  })

  it('spans every element the story drew', () => {
    const doc = storyDoc([
      { top: 20, bottom: 60 },
      { top: 60, bottom: 500 },
    ])
    expect(storyContentHeight(doc)).toBe(480 + STORY_GUTTER)
  })

  it('measures nothing for a frame it cannot read or that has not rendered', () => {
    expect(storyContentHeight(null)).toBeNull()
    expect(storyContentHeight(storyDoc(null))).toBeNull()
    expect(storyContentHeight(storyDoc([{ top: 10, bottom: 10 }]))).toBeNull()
  })

  it('keeps the fallback height when no measurement arrives', () => {
    expect(nextFrameHeight(AUTO_FALLBACK_HEIGHT, null, 1200)).toBe(AUTO_FALLBACK_HEIGHT)
    expect(nextFrameHeight(AUTO_FALLBACK_HEIGHT, storyContentHeight(null), 1200)).toBe(
      AUTO_FALLBACK_HEIGHT
    )
  })

  it('caps a tall story, floors a tiny one, and ignores a measurement that barely moved', () => {
    expect(nextFrameHeight(900, 4000, 1200)).toBe(1200)
    expect(nextFrameHeight(900, 20, 1200)).toBe(MIN_FRAME_HEIGHT)
    expect(nextFrameHeight(420, 424, 1200)).toBe(420)
    expect(nextFrameHeight(900, 420, 1200)).toBe(420)
  })
})

describe('captures', () => {
  it('renders an auto frame on the fallback canvas and a fixed one on its own', () => {
    const input = sectionedInput()
    input.variants[0].height = 360
    const m = ManifestSchema.parse(input)
    expect(captureViewportHeight(m, m.variants[0])).toBe(360)
    expect(captureViewportHeight(m, m.variants[1])).toBe(AUTO_FALLBACK_HEIGHT)
  })
})

describe('the rounds already reviewed', () => {
  const dir = new URL('./fixtures/rounds/', import.meta.url)
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))

  it('has all four real rounds as fixtures', () => {
    expect(files).toHaveLength(4)
  })

  it.each(files)('parses %s unchanged under the new schema', (file) => {
    const raw = JSON.parse(readFileSync(new URL(file, dir), 'utf8'))
    const parsed = ManifestSchema.parse(raw)
    expect(parsed.height).toBe(raw.height)
    expect(parsed.sections).toBeUndefined()
    expect(parsed.variants.map((v) => v.key)).toEqual(
      raw.variants.map((v: { key: string }) => v.key)
    )
  })
})
