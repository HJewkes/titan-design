import { describe, expect, it } from 'vitest'
import { pathLength, pointAtLength } from './model'
import { interpolatePath, pathMorph } from './morph'

const LINE = 'M0 0 L10 0'
const RAISED = 'M0 10 L10 10'
const PEAK = 'M0 0 L5 5 L10 0'

function expectPoint(actual: { x: number; y: number }, x: number, y: number): void {
  expect(actual.x).toBeCloseTo(x, 6)
  expect(actual.y).toBeCloseTo(y, 6)
}

describe('pathMorph', () => {
  it('returns the input strings unchanged at 0 and 1', () => {
    const morph = pathMorph(LINE, PEAK)
    expect(morph(0)).toBe(LINE)
    expect(morph(1)).toBe(PEAK)
  })

  it('moves every point linearly between paths of the same structure', () => {
    const mid = pathMorph(LINE, RAISED)(0.5)
    expect(pathLength(mid)).toBeCloseTo(10, 6)
    expectPoint(pointAtLength(mid, 0), 0, 5)
    expectPoint(pointAtLength(mid, 10), 10, 5)
  })

  it('extrapolates past 1 for overshooting eases', () => {
    expectPoint(pointAtLength(pathMorph(LINE, RAISED)(1.5), 0), 0, 15)
  })

  it('splits the shorter path without changing its shape', () => {
    const almostLine = pathMorph(LINE, PEAK)(1e-9)
    expect(pathLength(almostLine)).toBeCloseTo(10, 6)
    expectPoint(pointAtLength(almostLine, 5), 5, 0)
    const almostPeak = pathMorph(PEAK, LINE)(1e-9)
    expect(pathLength(almostPeak)).toBeCloseTo(pathLength(PEAK), 6)
    expectPoint(pointAtLength(almostPeak, pathLength(PEAK) / 2), 5, 5)
  })

  it('passes halfway between paths with different command counts', () => {
    const mid = pathMorph(LINE, PEAK)(0.5)
    expectPoint(pointAtLength(mid, 0), 0, 0)
    expectPoint(pointAtLength(mid, pathLength(mid)), 10, 0)
    expectPoint(pointAtLength(mid, pathLength(mid) / 2), 5, 2.5)
  })

  it('closes the intermediate path only when both ends are closed', () => {
    const square = 'M0 0 H10 V10 H0 Z'
    const diamond = 'M5 0 L10 5 L5 10 L0 5 Z'
    expect(pathMorph(square, diamond)(0.5).endsWith('Z')).toBe(true)
    expect(pathMorph(square, 'M0 0 L10 0 L10 10')(0.5).endsWith('Z')).toBe(false)
  })

  it('morphs arcs and curves through valid cubic paths', () => {
    const disc = 'M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z'
    const square = 'M-50 -50 H50 V50 H-50 Z'
    const mid = pathMorph(disc, square)(0.5)
    expect(mid).toMatch(/^M[^A-Z]+(C[^A-Z]+)+Z$/)
    expectPoint(pointAtLength(mid, 0), -25, -50)
    expect(Number.isFinite(pathLength(mid))).toBe(true)
  })

  it('pairs a moveto with a curve by turning it into a line', () => {
    const mid = pathMorph('M0 0 L10 0 M0 5 L10 5', 'M0 0 L10 0 L10 5 L0 5')(0.5)
    expect(mid.match(/M/g)).toHaveLength(1)
    expectPoint(pointAtLength(mid, 0), 0, 0)
  })

  it('grows an empty path out of the other path’s first point', () => {
    const grow = pathMorph('', LINE)
    expect(pathLength(grow(0.5))).toBeCloseTo(5, 6)
    expect(pathMorph('', '')(0.5)).toBe('')
  })
})

describe('interpolatePath', () => {
  it('matches a prepared morph', () => {
    expect(interpolatePath(0.3, LINE, PEAK)).toBe(pathMorph(LINE, PEAK)(0.3))
  })
})
