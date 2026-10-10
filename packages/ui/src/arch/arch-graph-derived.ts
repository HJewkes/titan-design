import stored from './arch-graph.json'

/**
 * `arch-graph.json` with the figures every component PR would otherwise rewrite.
 *
 * The committed file stores nodes and the whole-library summary only. The edge list,
 * the component total, the dead lists and the audited count are derived here from the
 * nodes, so two PRs that each add a node touch only their own block and merge cleanly
 * in either order (TD-792).
 */

type StoredGraph = typeof stored
type Component = StoredGraph['components'][number]
type Edge = [from: string, to: string]

/** One `[from, to]` pair per `dependsOn` entry; same-named nodes contribute each pair once. */
export function deriveEdges(components: readonly Component[]): Edge[] {
  const keys = new Set(components.flatMap((c) => c.dependsOn.map((dep) => `${c.name}\0${dep}`)))
  return [...keys].map((key) => key.split('\0') as Edge)
}

const namesWhere = (components: readonly Component[], keep: (c: Component) => boolean) =>
  [...new Set(components.filter(keep).map((c) => c.name))].sort()

export function deriveCounts(components: readonly Component[]) {
  return {
    total: components.length,
    dead: namesWhere(components, (c) => c.verdict === 'dead'),
    deadByAssociation: namesWhere(components, (c) => c.deadByAssociation),
    auditedCount: components.filter((c) => c.audited === 'audited').length,
  }
}

export const archGraph = {
  ...stored,
  edges: deriveEdges(stored.components),
  summary: { ...stored.summary, ...deriveCounts(stored.components) },
}
