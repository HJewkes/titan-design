import { describe, expect, it } from 'vitest'
import { CATALOGUE, TYPE_BY_ID } from './catalogue'
import { PATTERNS, PATTERN_BY_ID } from './patterns'
import { routeVisual } from './route'
import type { TypeId, TypeStatus } from './types'

const GAP_TYPES = CATALOGUE.filter((entry) => entry.status !== 'have')

describe('routeVisual', () => {
  it('routes a gap type to its closest available type with a caveat', () => {
    const result = routeVisual({ type: 'sequence' })

    expect(result).toMatchObject({
      type: 'sequence',
      status: 'new',
      render: null,
      gap: true,
      closest: { type: 'timeline', component: 'Timeline' },
    })
    expect(result.closest.caveat).toMatch(/Sequence is not built yet.*Timeline/)
    expect(result.notThis.map((n) => n.use)).toEqual(['state-machine', 'flowchart'])
  })

  it('renders a built type with its own component and no caveat', () => {
    const result = routeVisual({ type: 'er' })

    expect(result.render).toEqual({ component: 'SchemaCard' })
    expect(result.gap).toBe(false)
    expect(result.closest).toEqual({ type: 'er', component: 'SchemaCard', caveat: null })
  })

  it('says a skipped type is not planned rather than not built', () => {
    expect(routeVisual({ type: 'axonometric-plan' }).closest.caveat).toMatch(/is not planned/)
  })

  it('routes a pattern through its nearest type', () => {
    const result = routeVisual({ pattern: 'lifecycle' })

    expect(result.type).toBe('state-machine')
    expect(result.gap).toBe(true)
    expect(result.closest.type).toBe('dependency-graph')
  })

  it('prefers an explicit type over a pattern and a need', () => {
    expect(routeVisual({ type: 'bar', pattern: 'lifecycle', need: 'flowchart' }).type).toBe('bar')
  })

  it('matches a free-text need to the type that describes it', () => {
    expect(routeVisual({ need: 'messages between actors in order' })?.type).toBe('sequence')
    expect(routeVisual({ need: 'share of a whole across many parts' })?.type).toBe('treemap')
  })

  it('returns null for a need that matches no type', () => {
    expect(routeVisual({ need: 'zzz qqq' })).toBeNull()
    expect(routeVisual({})).toBeNull()
  })

  it('throws on an unknown type id', () => {
    expect(() => routeVisual({ type: 'pie' as TypeId })).toThrow(RangeError)
  })

  it.each(GAP_TYPES.map((entry) => [entry.id]))('gives gap type %s an available stand-in', (id) => {
    const result = routeVisual({ type: id })

    expect(result.gap).toBe(true)
    expect(TYPE_BY_ID.get(result.closest.type)?.status).toBe('have')
    expect(result.closest.caveat).not.toBeNull()
  })
})

describe('visual catalogue', () => {
  it('lists the 45 types once each with the inventory status counts', () => {
    const counts: Partial<Record<TypeStatus, number>> = {}
    for (const { status } of CATALOGUE) counts[status] = (counts[status] ?? 0) + 1

    expect(TYPE_BY_ID.size).toBe(45)
    expect(CATALOGUE).toHaveLength(45)
    expect(counts).toEqual({ have: 8, 'in-flight': 2, ng: 13, new: 11, template: 9, skip: 2 })
  })

  it('points every notThis and fallback at a type in the catalogue', () => {
    const dangling = CATALOGUE.flatMap((entry) =>
      [...entry.notThis.map((n) => n.use), ...entry.fallback]
        .filter((id) => id === entry.id || !TYPE_BY_ID.has(id))
        .map((id) => `${entry.id} -> ${id}`)
    )
    expect(dangling).toEqual([])
  })

  it('never falls back to a gap type', () => {
    const toGaps = CATALOGUE.flatMap((entry) =>
      entry.fallback
        .filter((id) => TYPE_BY_ID.get(id)?.status !== 'have')
        .map((id) => `${entry.id} -> ${id}`)
    )
    expect(toGaps).toEqual([])
  })

  it('gives every gap type a fallback and every built type a component and story', () => {
    expect(GAP_TYPES.filter((entry) => entry.fallback.length === 0)).toEqual([])
    for (const entry of CATALOGUE) {
      const built = entry.status === 'have'
      expect(entry.component !== null, entry.id).toBe(built)
      expect(entry.storyId === null ? null : /^[a-z-]+--default$/.test(entry.storyId)).toBe(
        built ? true : null
      )
    }
  })
})

describe('visual patterns', () => {
  it('has nine patterns whose nearest type routes them back', () => {
    expect(PATTERNS).toHaveLength(9)
    for (const pattern of PATTERNS) {
      expect(TYPE_BY_ID.get(pattern.nearestType)?.patterns, pattern.id).toContain(pattern.id)
    }
  })

  it('names only known patterns on each type', () => {
    const unknown = CATALOGUE.flatMap((entry) => entry.patterns).filter(
      (id) => !PATTERN_BY_ID.has(id)
    )
    expect(unknown).toEqual([])
  })
})
