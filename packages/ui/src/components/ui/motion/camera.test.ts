import { describe, expect, it } from 'vitest'
import { camera, fitBox, project, unproject, type Box, type CameraStation } from './camera'
import { linear } from './easing'

const viewport = { width: 1600, height: 900 }
const world: Box = { x: 0, y: 0, width: 1600, height: 900 }
const child: Box = { x: 1200, y: 600, width: 100, height: 56.25 }
const sibling: Box = { x: 200, y: 100, width: 400, height: 225 }

const scaleAt = (t: number, stations: readonly CameraStation[]) =>
  camera(t, stations, { viewport })?.scale

describe('camera', () => {
  it('frames each station box exactly at its atS', () => {
    const stations = [
      { atS: 0, box: world },
      { atS: 3, box: child },
      { atS: 4, box: sibling },
    ]

    for (const { atS, box } of stations) {
      expect(camera(atS, stations, { viewport })?.box).toEqual(box)
    }
  })

  it('reaches the geometric-mean scale at mid-move on a 16x zoom in and out', () => {
    const zoomIn = [
      { atS: 0, box: world },
      { atS: 3, box: child },
    ]
    const zoomOut = [
      { atS: 0, box: child },
      { atS: 3, box: world },
    ]

    expect(scaleAt(2.25, zoomIn)).toBeCloseTo(Math.sqrt(1 * 16), 4)
    expect(scaleAt(2.25, zoomOut)).toBeCloseTo(Math.sqrt(16 * 1), 4)
  })

  it('moves only during the moveS before a station, never before the previous one', () => {
    const stations = [
      { atS: 0, box: world },
      { atS: 5, box: sibling },
      { atS: 6, box: child },
    ]

    expect(camera(3.4, stations, { viewport })?.box).toEqual(world)
    expect(camera(3.6, stations, { viewport })?.box).not.toEqual(world)
    expect(camera(5.2, stations, { viewport, ease: linear })?.box.width).toBeCloseTo(
      400 * (100 / 400) ** 0.2
    )
  })

  it('holds the first box before the first station instead of the world origin', () => {
    const stations = [{ atS: 2, box: child }]

    expect(camera(-10, stations, { viewport })?.box).toEqual(child)
  })

  it('holds the last box across a span with no map and moves on from it', () => {
    const stations = [
      { atS: 0, box: child },
      { atS: 2, box: null },
      { atS: 10, box: world },
    ]

    expect(camera(5, stations, { viewport })?.box).toEqual(child)
    expect(camera(8.5, stations, { viewport })?.box).toEqual(child)
    expect(camera(9.25, stations, { viewport, ease: linear })?.box.width).toBeCloseTo(400)
    expect(camera(10, stations, { viewport })?.box).toEqual(world)
  })

  it('opens on the first box when the stations start with a span with no map', () => {
    const stations = [
      { atS: 0, box: null },
      { atS: 4, box: sibling },
    ]

    expect(camera(1, stations, { viewport })?.box).toEqual(sibling)
  })

  it('keeps a nested target on screen throughout a zoom into it', () => {
    const stations = [
      { atS: 0, box: world },
      { atS: 1.5, box: child },
    ]

    for (let t = 0; t <= 1.5; t += 0.1) {
      const frame = camera(t, stations, { viewport })
      if (!frame) throw new Error('expected a frame')
      const topLeft = project(frame, child)
      expect(topLeft.x).toBeGreaterThanOrEqual(-1e-6)
      expect(topLeft.y).toBeGreaterThanOrEqual(-1e-6)
    }
  })

  it('returns null when no station has a box', () => {
    expect(camera(0, [], { viewport })).toBeNull()
    expect(camera(0, [{ atS: 0, box: null }], { viewport })).toBeNull()
  })

  it('rejects a station box without a positive size', () => {
    const flat = { x: 0, y: 0, width: 10, height: 0 }

    expect(() => camera(0, [{ atS: 0, box: flat }], { viewport })).toThrow(RangeError)
  })
})

describe('fitBox', () => {
  it('centres the box at the largest scale that fits inside the padding', () => {
    const tall = { x: 100, y: 100, width: 100, height: 400 }

    const frame = fitBox(tall, viewport, 50)

    expect(frame.scale).toBe(2)
    expect(project(frame, { x: 150, y: 300 })).toEqual({ x: 800, y: 450 })
    expect(project(frame, { x: 150, y: 100 }).y).toBe(50)
  })
})

describe('project', () => {
  it('round-trips through unproject in both directions', () => {
    const frame = fitBox(child, viewport, 24)
    const worldPoint = { x: 1234.5, y: -87.25 }
    const screenPoint = { x: 17, y: 899 }

    const backToWorld = unproject(frame, project(frame, worldPoint))
    const backToScreen = project(frame, unproject(frame, screenPoint))

    expect(backToWorld.x).toBeCloseTo(worldPoint.x, 9)
    expect(backToWorld.y).toBeCloseTo(worldPoint.y, 9)
    expect(backToScreen.x).toBeCloseTo(screenPoint.x, 9)
    expect(backToScreen.y).toBeCloseTo(screenPoint.y, 9)
  })
})
