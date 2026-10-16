import { describe, expect, it } from 'vitest'
import { hostilePositions } from '../fixtures'
import { suppliedLayout } from './supplied-layout-model'

const nodes = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, label: id }))
const input = { nodes, edges: [], width: 100, height: 100 }

describe('suppliedLayout', () => {
  it('leaves out missing and non-finite positions and orders by y, then x, then id', () => {
    const layout = suppliedLayout({
      a: { x: 9, y: 5 },
      b: { x: 2, y: 5 },
      c: { x: 50, y: 1 },
      e: { x: Number.NaN, y: 3 },
      f: { x: 0, y: 0 },
    })
    const result = layout.compute(input)
    expect(result.order).toEqual(['c', 'b', 'a'])
    expect(Object.keys(result.positions).sort()).toEqual(['a', 'b', 'c'])
  })

  it('breaks a tie in both coordinates by id', () => {
    const result = suppliedLayout({ b: { x: 1, y: 1 }, a: { x: 1, y: 1 } }).compute(input)
    expect(result.order).toEqual(['a', 'b'])
  })

  it('does not treat inherited object keys as positions', () => {
    const result = suppliedLayout({}).compute({
      ...input,
      nodes: [{ id: 'constructor', label: 'x' }],
    })
    expect(result.order).toEqual([])
  })

  it('gives the natural size room for the labels beyond the furthest position', () => {
    const result = suppliedLayout({ a: { x: 300, y: 120 } }).compute(input)
    expect(result.width).toBeGreaterThan(300)
    expect(result.height).toBeGreaterThan(120)
  })

  it('keys by the positions, not by the object', () => {
    const same = suppliedLayout({ a: { x: 1, y: 2 }, b: { x: 3, y: 4 } })
    expect(suppliedLayout({ b: { x: 3, y: 4 }, a: { x: 1, y: 2 } }).key).toBe(same.key)
    expect(suppliedLayout({ a: { x: 1, y: 2 }, b: { x: 3, y: 5 } }).key).not.toBe(same.key)
  })

  it('handles the hostile positions without throwing', () => {
    const hostile = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05'].map((id) => ({
      id,
      label: id,
    }))
    const result = suppliedLayout(hostilePositions).compute({
      nodes: hostile,
      edges: [],
      width: 0,
      height: 0,
    })
    expect(result.order).toEqual(['alpha-01', 'alpha-02'])
  })
})
