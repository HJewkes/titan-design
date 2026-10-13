import { describe, it, expect } from 'vitest'
import {
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

  it('skips an item whose time is not finite', () => {
    const layout = layoutTimeline({ items: [...items, { id: 'bad', at: NaN, label: 'Bad' }] })
    expect(layout.marks).toHaveLength(items.length)
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
  it('clamps the window to the domain', () => {
    expect(normalizeWindow([-0.5, 0.5])).toEqual([0, 0.5])
  })

  it('treats an inverted window as the whole domain', () => {
    expect(normalizeWindow([0.8, 0.2])).toEqual([0, 1])
  })
})
