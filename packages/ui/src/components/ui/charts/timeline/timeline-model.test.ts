import { describe, it, expect } from 'vitest'
import {
  EDGE_FADE,
  edgeOpacity,
  followWindow,
  layoutTimeline,
  normalizeWindow,
  timelineDomain,
  type TimelineItem,
} from './timeline-model'

const items: TimelineItem[] = [
  { id: 'start', at: 0, label: 'Start' },
  { id: 'quarter', at: 25, label: 'Quarter' },
  { id: 'mid', at: 50, label: 'Middle' },
  { id: 'end', at: 100, label: 'End' },
]

const positionOf = (id: string, layout: ReturnType<typeof layoutTimeline>) =>
  layout.marks.find((mark) => mark.item.id === id)?.position

describe('layoutTimeline', () => {
  it('lays an item at the domain midpoint out at half the width', () => {
    expect(positionOf('mid', layoutTimeline({ items }))).toBe(0.5)
  })

  it('reads dates on the same scale as numbers', () => {
    const dated = [
      { id: 'a', at: new Date('2026-01-01T00:00:00Z'), label: 'A' },
      { id: 'b', at: new Date('2026-01-03T00:00:00Z'), label: 'B' },
    ]
    const layout = layoutTimeline({
      items: dated,
      domain: [new Date('2026-01-02T00:00:00Z'), new Date('2026-01-04T00:00:00Z')],
    })
    expect(positionOf('b', layout)).toBe(0.5)
  })

  it('puts the playhead at its fraction of the domain', () => {
    expect(layoutTimeline({ items, playhead: 0.25 }).playhead).toBe(0.25)
  })

  it('maps the playhead through the pan window, not the whole domain', () => {
    expect(layoutTimeline({ items, playhead: 0.75, window: [0.5, 1] }).playhead).toBe(0.5)
  })

  it('drops the items and playhead the pan window leaves out', () => {
    const layout = layoutTimeline({ items, playhead: 0.25, window: [0.5, 1] })
    expect(layout.marks.map((mark) => mark.item.id)).toEqual(['mid', 'end'])
    expect(layout.playhead).toBeNull()
  })

  it('orders marks by time and alternates their label lanes', () => {
    const layout = layoutTimeline({ items: [...items].reverse() })
    expect(layout.marks.map((mark) => [mark.item.id, mark.lane])).toEqual([
      ['start', 0],
      ['quarter', 1],
      ['mid', 0],
      ['end', 1],
    ])
  })

  it('keeps each label on its side of the track as the window pans', () => {
    const lanes = (window: [number, number]) =>
      Object.fromEntries(
        layoutTimeline({ items, window }).marks.map((mark) => [mark.item.id, mark.lane])
      )
    const whole = lanes([0, 1])
    for (const window of [
      [0.2, 1],
      [0.3, 1],
      [0.5, 1],
    ] as [number, number][]) {
      for (const [id, lane] of Object.entries(lanes(window))) expect(lane).toBe(whole[id])
    }
  })

  it('fades an item out across the edge fade instead of dropping it at the edge', () => {
    const mark = (window: [number, number]) =>
      layoutTimeline({ items, window }).marks.find((m) => m.item.id === 'quarter')
    // 'quarter' sits at 0.25 of the domain; a window [0.25 + d, 1] puts it just past the left edge.
    expect(mark([0.25, 1])?.opacity).toBe(1)
    expect(mark([0.28, 1])?.opacity).toBeCloseTo(1 - 0.03 / 0.72 / EDGE_FADE)
    expect(mark([0.4, 1])).toBeUndefined()
  })

  it('skips an item whose time is not finite', () => {
    const layout = layoutTimeline({ items: [...items, { id: 'bad', at: NaN, label: 'Bad' }] })
    expect(layout.marks).toHaveLength(items.length)
  })
})

describe('edgeOpacity', () => {
  it('is fully opaque inside the window, on both edges', () => {
    expect([0, 0.5, 1].map(edgeOpacity)).toEqual([1, 1, 1])
  })

  it('falls linearly to 0 across the fade on either side', () => {
    expect(edgeOpacity(-EDGE_FADE / 2)).toBeCloseTo(0.5)
    expect(edgeOpacity(1 + EDGE_FADE / 4)).toBeCloseTo(0.75)
    expect(edgeOpacity(-EDGE_FADE)).toBe(0)
    expect(edgeOpacity(2)).toBe(0)
  })
})

describe('timelineDomain', () => {
  it('centres a single instant', () => {
    expect(timelineDomain([{ id: 'a', at: 10, label: 'A' }])).toEqual([9, 11])
  })

  it('falls back to [0, 1] with no finite time', () => {
    expect(timelineDomain([])).toEqual([0, 1])
  })
})

describe('normalizeWindow', () => {
  it('lets the window run past the domain ends', () => {
    expect(normalizeWindow([-0.5, 0.5])).toEqual([-0.5, 0.5])
  })

  it('treats a non-finite window as the whole domain', () => {
    expect(normalizeWindow([NaN, 0.5])).toEqual([0, 1])
  })

  it('treats an inverted window as the whole domain', () => {
    expect(normalizeWindow([0.8, 0.2])).toEqual([0, 1])
  })
})

describe('followWindow', () => {
  it('centres a window of the given width on the playhead', () => {
    const [start, end] = followWindow(0.3, 0.5)
    expect(start).toBeCloseTo(0.05)
    expect(end).toBeCloseTo(0.55)
  })

  it('runs past the domain start rather than stopping at it', () => {
    expect(followWindow(0.1, 0.5)).toEqual([-0.15, 0.35])
  })

  it('gives the whole domain for a width outside (0, 1]', () => {
    expect(followWindow(0.3, 0)).toEqual([0, 1])
    expect(followWindow(0.3, 1.5)).toEqual([0, 1])
  })

  it('keeps the playhead at the centre from the first frame to the last', () => {
    for (const playhead of [0, 0.05, 0.25, 0.5, 0.8, 0.95, 1]) {
      const layout = layoutTimeline({ items, playhead, window: followWindow(playhead, 0.5) })
      expect(layout.playhead).toBeCloseTo(0.5)
    }
  })
})

describe('layoutTimeline track', () => {
  it('spans the whole plot when the window is the whole domain', () => {
    expect(layoutTimeline({ items }).track).toEqual([0, 1])
  })

  it('starts where the domain starts when the window runs past it', () => {
    expect(layoutTimeline({ items, window: [-0.25, 0.25] }).track).toEqual([0.5, 1])
    expect(layoutTimeline({ items, window: [0.75, 1.25] }).track).toEqual([0, 0.5])
  })

  it('is absent when the window misses the domain', () => {
    expect(layoutTimeline({ items, window: [1.5, 2] }).track).toBeNull()
  })
})
