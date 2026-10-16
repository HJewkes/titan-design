import { describe, expect, it, vi } from 'vitest'
import { mapLayoutFixture as layout, mapTimelineFixture as timeline } from './fixtures'
import { MAP_WEIGHT, mapTime, resolveMapState, type MapState } from './map-state-model'
import type { MapTimeline } from './types'

const FPS = 60
const at = (t: number) => resolveMapState(timeline, layout, t)
const withoutTime = ({ t: _t, onMap: _onMap, ...rest }: MapState) => rest

describe('resolveMapState: seek equals sweep', () => {
  it('a cold seek equals a 1/60 s sweep across map, non-map and map spans', async () => {
    const frames = [0, 95, 186, 360, 420, 540, 552, 570, 615, 760, 839]
    const seeks: MapState[] = []
    for (const frame of frames) {
      vi.resetModules()
      const cold = await import('./map-state-model')
      seeks.push(cold.resolveMapState(timeline, layout, frame / FPS))
    }

    const swept: MapState[] = []
    for (let frame = 0; frame <= 14 * FPS; frame++) swept.push(at(frame / FPS))

    expect(frames.map((frame) => swept[frame])).toEqual(seeks)
  })
})

describe('resolveMapState: re-entry', () => {
  it('resumes on re-entry from the state the map left with', () => {
    expect(withoutTime(at(9))).toEqual(withoutTime(at(6)))
  })

  it('keeps reveals, edges and the minimap from the first span on re-entry', () => {
    const state = at(9)
    expect(state.nodes['pkg/web']?.opacity).toBe(1)
    expect(state.edges['e:api->store']).toBe(1)
    expect(state.minimap).toBe(1)
  })

  it('finishes a change that straddles the exit after the map returns', () => {
    expect(at(6).nodes['pkg/api']?.lit).toBeCloseTo(0.5, 6)
    expect(at(9.2).nodes['pkg/api']?.lit).toBe(1)
  })

  it('holds the exit state while off the map', () => {
    const off = at(7.5)
    expect(off.onMap).toBe(false)
    expect(off.mapT).toBe(6)
    expect(withoutTime(off)).toEqual(withoutTime(at(6)))
  })
})

describe('resolveMapState: channels', () => {
  it('dims every non-focus node to the context weight once the focus change ends', () => {
    const state = at(4 + 0.4)
    expect(state.nodes['pkg/store']?.weight).toBe(MAP_WEIGHT.context)
    expect(state.nodes['pkg/api']?.weight).toBe(MAP_WEIGHT.full)
    expect(at(3.9).nodes['pkg/store']?.weight).toBe(MAP_WEIGHT.full)
  })

  it('moves a node between weights when the focus set changes', () => {
    const later = at(9 + 0.9)
    expect(later.nodes['pkg/api/routes/notes.ts']?.weight).toBe(MAP_WEIGHT.full)
    expect(later.nodes['pkg/api']?.weight).toBe(MAP_WEIGHT.context)
  })

  it('reveals a node from 0 at its keyframe; a node no keyframe reveals is always shown', () => {
    expect(at(0.5).nodes['pkg/web']?.opacity).toBe(0)
    expect(at(0.7).nodes['pkg/web']?.opacity).toBeCloseTo(0.5, 6)
    expect(at(0.9).nodes['pkg/web']?.opacity).toBe(1)
    expect(at(0).nodes['sys:notes']?.opacity).toBe(1)
  })

  it('draws an edge on over its keyframe', () => {
    expect(at(1.5).edges['e:web->api']).toBe(0)
    expect(at(1.8).edges['e:web->api']).toBeCloseTo(0.5, 6)
    expect(at(0).edges['e:user->sys']).toBe(1)
  })

  it('enters a card, exits it, then drops it', () => {
    expect(at(9.9).cards).toEqual([])
    expect(at(10.25).cards).toEqual([{ id: 'card:notes.ts', enter: 1, exit: 0 }])
    expect(at(12.625).cards[0]?.exit).toBeCloseTo(0.5, 6)
    expect(at(12.75).cards).toEqual([])
  })

  it('steps the level and fades the minimap in', () => {
    expect([at(0).level, at(9.1).level, at(9.2).level]).toEqual([1, 1, 3])
    expect([at(2.9).minimap, at(3.25).minimap]).toEqual([0, 1])
  })
})

describe('mapTime', () => {
  it('counts only on-screen seconds, and is t itself without spans', () => {
    expect([
      mapTime(timeline.spans, 5),
      mapTime(timeline.spans, 8),
      mapTime(timeline.spans, 10),
    ]).toEqual([5, 6, 7])
    const always: MapTimeline = { ...timeline, spans: undefined }
    expect(resolveMapState(always, layout, 8).mapT).toBe(8)
    expect(resolveMapState(always, layout, 8).onMap).toBe(true)
  })
})
