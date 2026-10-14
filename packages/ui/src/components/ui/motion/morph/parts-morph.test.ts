import { describe, expect, it } from 'vitest'
import { back, easeOut, linear } from '../easing'
import type { MorphPart } from './match-parts'
import { partsMorph } from './parts-morph'

const part = (id: string, x: number, width = 20, key?: string): MorphPart => ({
  id,
  key,
  box: { x, y: 10, width, height: 10 },
})

const layerById = (layers: ReturnType<ReturnType<typeof partsMorph>>, id: string) => {
  const layer = layers.find((l) => l.id === id)
  if (!layer) throw new Error(`no layer ${id}`)
  return layer
}

describe('partsMorph', () => {
  // Mutation: lerping from the target box to the source box.
  it('carries a matched part from its source box to its target box', () => {
    const morph = partsMorph([part('a', 0)], [part('a', 100, 40)], { ease: linear })

    expect(layerById(morph(0), 'to:a').box).toEqual({ x: 0, y: 10, width: 20, height: 10 })
    expect(layerById(morph(0.5), 'to:a').box).toEqual({ x: 50, y: 10, width: 30, height: 10 })
    expect(layerById(morph(1), 'to:a').box).toEqual({ x: 100, y: 10, width: 40, height: 10 })
  })

  // Mutation: measuring the transform from the stage origin instead of the part's centre.
  it('paints the target part and transforms it about its centre into the current box', () => {
    const morph = partsMorph([part('a', 0)], [part('a', 100, 40)], { ease: linear })

    expect(layerById(morph(0), 'to:a').transform).toEqual({
      translateX: 10 - 120,
      translateY: 0,
      scaleX: 0.5,
      scaleY: 1,
    })
    expect(layerById(morph(1), 'to:a').transform).toEqual({
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
    })
  })

  // Mutation: passing the raw progress to the box lerp and dropping `ease`.
  it('eases the move', () => {
    const morph = partsMorph([part('a', 0)], [part('a', 100)], { ease: (p) => p * p })

    expect(layerById(morph(0.5), 'to:a').box.x).toBe(25)
  })

  // Mutation: swapping the exit and enter windows, or fading exits in.
  it('fades unmatched source parts out first and target parts in second', () => {
    const morph = partsMorph([part('gone', 0)], [part('new', 50)])

    expect(layerById(morph(0), 'from:gone').opacity).toBe(1)
    expect(layerById(morph(0.5), 'from:gone').opacity).toBe(0)
    expect(layerById(morph(0.5), 'to:new').opacity).toBe(0)
    expect(layerById(morph(1), 'to:new').opacity).toBe(1)
  })

  // Mutation: ignoring `windows` and always using the defaults.
  it('takes custom windows', () => {
    const morph = partsMorph([part('gone', 0)], [part('new', 50)], {
      windows: { exit: [0, 1], enter: [0, 0.25] },
    })

    expect(layerById(morph(0.5), 'from:gone').opacity).toBe(0.5)
    expect(layerById(morph(0.25), 'to:new').opacity).toBe(1)
  })

  // Mutation: giving the key-mapped pair two boxes, or not cross-fading.
  it('moves a key-mapped pair in one box while the source cross-fades into the target', () => {
    const morph = partsMorph([part('cache', 0)], [part('memo', 100)], {
      keyMap: { cache: 'memo' },
      ease: linear,
    })
    const layers = morph(0.25)

    expect(layerById(layers, 'from:cache').box).toEqual(layerById(layers, 'to:memo').box)
    expect(layerById(layers, 'from:cache').opacity).toBe(0.75)
    expect(layerById(layers, 'to:memo').opacity).toBe(0.25)
    expect(layers.every((l) => l.role === 'mapped')).toBe(true)
  })

  // Mutation: removing the clamp on the cross-fade, which lets opacity exceed 1 on an overshoot.
  it('lets an overshooting ease carry the box past the target but keeps opacity in [0, 1]', () => {
    const morph = partsMorph([part('a', 0)], [part('b', 100)], {
      keyMap: { a: 'b' },
      ease: easeOut(back()),
    })
    const layers = morph(0.9)

    expect(layerById(layers, 'to:b').box.x).toBeGreaterThan(100)
    expect(layerById(layers, 'to:b').opacity).toBe(1)
    expect(layerById(layers, 'from:a').opacity).toBe(0)
  })

  // Mutation: dropping the sign flip, which sends both swapping parts along the same side.
  it('bows swapping parts to opposite sides when given an arc, landing on their targets', () => {
    const morph = partsMorph([part('a', 0), part('c', 100)], [part('c', 0), part('a', 100)], {
      ease: linear,
      arc: 0.25,
    })
    const mid = morph(0.5)

    expect(layerById(mid, 'to:a').box.y).toBe(10 - 25)
    expect(layerById(mid, 'to:c').box.y).toBe(10 + 25)
    expect(layerById(morph(1), 'to:a').box).toEqual(part('a', 100).box)
  })

  // Mutation: smoothing the move toward its target across calls, as a frame-to-frame lerp would.
  it('is a pure function of progress: seeking back and forth gives equal frames', () => {
    const morph = partsMorph([part('a', 0), part('gone', 40)], [part('a', 80), part('new', 10)], {
      keyMap: {},
    })
    const first = morph(0.7)
    morph(0.2)
    morph(1)

    expect(morph(0.7)).toEqual(first)
  })

  // Mutation: emitting enters before exits, which paints a fading-in part under a fading-out one.
  it('orders layers exits, pairs, then enters, with ids stable across progress', () => {
    const morph = partsMorph([part('a', 0), part('gone', 40)], [part('new', 10), part('a', 80)])
    const ids = (p: number) => morph(p).map((l) => l.id)

    expect(ids(0)).toEqual(['from:gone', 'to:a', 'to:new'])
    expect(ids(0.6)).toEqual(ids(0))
  })

  // Mutation: accepting a zero-size box, which divides by zero in the scale.
  it('throws for a part without a positive size', () => {
    expect(() => partsMorph([part('a', 0, 0)], [])).toThrow(RangeError)
  })
})
