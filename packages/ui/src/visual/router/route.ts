// routeVisual: from a semantic pattern, a type id or a free-text need to the type to draw,
// what renders it today and, for a gap, the closest type that does. Pattern-first routing
// is an idea from cathrynlavery/diagram-design (MIT, (c) 2025 Cathryn Lavery).
import { CATALOGUE, TYPE_BY_ID } from './catalogue'
import { PATTERN_BY_ID } from './patterns'
import type { NotThis, PatternId, TypeId, TypeStatus, VisualType } from './types'

export interface RouteRequest {
  pattern?: PatternId
  type?: TypeId
  need?: string
}

export interface RouteResult {
  type: TypeId
  status: TypeStatus
  /** What renders the type itself; null while it is a gap. */
  render: { component: string; preset?: string } | null
  /** What to render now: the type itself when built, else its first available fallback. */
  closest: { type: TypeId; component: string; caveat: string | null }
  gap: boolean
  notThis: readonly NotThis[]
}

const STOPWORDS = new Set(
  'the and for with that this how what show shows from into each one are its who our over'.split(
    ' '
  )
)

function stems(text: string): Set<string> {
  const words = text.toLowerCase().split(/[^a-z0-9]+/)
  return new Set(words.filter((w) => w.length > 2 && !STOPWORDS.has(w)).map((w) => w.slice(0, 5)))
}

function needScore(entry: VisualType, need: Set<string>): number {
  const name = stems(`${entry.name} ${entry.id}`)
  const bestFor = stems(entry.bestFor)
  let score = 0
  for (const stem of need) score += (name.has(stem) ? 3 : 0) + (bestFor.has(stem) ? 1 : 0)
  return score
}

function matchNeed(need: string): VisualType | undefined {
  const wanted = stems(need)
  let best: VisualType | undefined
  let bestScore = 0
  for (const entry of CATALOGUE) {
    const score = needScore(entry, wanted)
    if (score > bestScore) [best, bestScore] = [entry, score]
  }
  return best
}

function lookup(id: TypeId): VisualType {
  const entry = TYPE_BY_ID.get(id)
  if (!entry) throw new RangeError(`Unknown visual type "${id}"`)
  return entry
}

function resolveEntry(request: RouteRequest): VisualType | undefined {
  if (request.type) return lookup(request.type)
  if (request.pattern) {
    const pattern = PATTERN_BY_ID.get(request.pattern)
    if (!pattern) throw new RangeError(`Unknown visual pattern "${request.pattern}"`)
    return lookup(pattern.nearestType)
  }
  return request.need ? matchNeed(request.need) : undefined
}

function closestTo(entry: VisualType): RouteResult['closest'] {
  if (entry.status === 'have' && entry.component) {
    return { type: entry.id, component: entry.component, caveat: null }
  }
  const stand = entry.fallback.map(lookup).find((f) => f.status === 'have' && f.component)
  if (!stand?.component) throw new Error(`Visual type "${entry.id}" has no available fallback`)
  const state = entry.status === 'skip' ? 'is not planned' : `is not built yet (${entry.status})`
  return {
    type: stand.id,
    component: stand.component,
    caveat: `${entry.name} ${state}; ${stand.name} (${stand.component}) is the closest available type.`,
  }
}

function renderOf({ status, component, preset }: VisualType): RouteResult['render'] {
  if (status !== 'have' || component === null) return null
  return preset ? { component, preset } : { component }
}

function toResult(entry: VisualType): RouteResult {
  const render = renderOf(entry)
  return {
    type: entry.id,
    status: entry.status,
    render,
    closest: closestTo(entry),
    gap: render === null,
    notThis: entry.notThis,
  }
}

/**
 * Precedence is `type`, then `pattern` (its nearest type), then `need` (best keyword
 * match). A `need` alone that matches nothing returns null; an unknown id throws.
 */
export function routeVisual(
  request: RouteRequest & ({ type: TypeId } | { pattern: PatternId })
): RouteResult
export function routeVisual(request: RouteRequest): RouteResult | null
export function routeVisual(request: RouteRequest): RouteResult | null {
  const entry = resolveEntry(request)
  return entry ? toResult(entry) : null
}
