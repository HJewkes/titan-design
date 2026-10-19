import { describe, expect, it } from 'vitest'
import { matchParts, type MorphPart } from './match-parts'

const part = (id: string, key?: string): MorphPart => ({
  id,
  key,
  box: { x: 0, y: 0, width: 10, height: 10 },
})

describe('matchParts', () => {
  // Mutation: swapping `exits` and `enters`.
  it('pairs equal keys, sends source-only parts out and target-only parts in', () => {
    const result = matchParts([part('a'), part('b')], [part('b'), part('c')])

    expect(result).toEqual({
      pairs: [{ from: 'b', to: 'b', via: 'key' }],
      exits: ['a'],
      enters: ['c'],
    })
  })

  // Mutation: matching by `id` and ignoring `key`.
  it('matches by key when ids differ, so a shape or role can stand in for identity', () => {
    const result = matchParts([part('old-plus', '+')], [part('new-plus', '+')])

    expect(result.pairs).toEqual([{ from: 'old-plus', to: 'new-plus', via: 'key' }])
  })

  // Mutation: always pairing with the first target that shares the key.
  it('pairs parts sharing a key in order and fades the extra', () => {
    const result = matchParts(
      [part('x1', 'x'), part('x2', 'x'), part('x3', 'x')],
      [part('y1', 'x'), part('y2', 'x')]
    )

    expect(result.pairs.map(({ from, to }) => [from, to])).toEqual([
      ['x1', 'y1'],
      ['x2', 'y2'],
    ])
    expect(result.exits).toEqual(['x3'])
  })

  // Mutation: matching keys before the key map claims its pairs (Manim's order), which animates
  // `a` twice and leaves `b` both paired and mapped.
  it('lets the key map claim its pairs before keys match', () => {
    const result = matchParts([part('a'), part('b')], [part('a'), part('b')], { a: 'b' })

    expect(result).toEqual({
      pairs: [{ from: 'a', to: 'b', via: 'keyMap' }],
      exits: ['b'],
      enters: ['a'],
    })
  })

  // Mutation: dropping the guard for a key-map entry with a side missing.
  it('ignores key-map entries naming a key absent from either scene', () => {
    const result = matchParts([part('a')], [part('a')], { a: 'gone', ghost: 'a' })

    expect(result.pairs).toEqual([{ from: 'a', to: 'a', via: 'key' }])
  })

  // Mutation: skipping key-map entries whose two keys are equal.
  it('maps a key to itself to cross-fade a part whose content changed', () => {
    const result = matchParts([part('status')], [part('status')], { status: 'status' })

    expect(result.pairs).toEqual([{ from: 'status', to: 'status', via: 'keyMap' }])
  })

  // Mutation: collecting enters from a Set or in target-map order rather than input order.
  it('keeps input order in every list', () => {
    const result = matchParts([part('c'), part('a')], [part('z'), part('a'), part('y')])

    expect(result.exits).toEqual(['c'])
    expect(result.enters).toEqual(['z', 'y'])
  })

  // Mutation: removing the repeated-id check, which would give two layers one React key.
  it('throws when an id repeats within a scene', () => {
    expect(() => matchParts([part('a'), part('a', 'other')], [])).toThrow(RangeError)
  })
})
