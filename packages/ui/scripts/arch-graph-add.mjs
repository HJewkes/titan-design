/**
 * The scoped write behind `arch:graph --add <file>`: splice freshly computed nodes into the
 * committed `src/arch/arch-graph.json` and leave every other component's block as committed.
 *
 * A full `arch:graph` rewrites metrics for components a change never touched, so feature PRs
 * cannot run one; before this mode a new component simply never got a node, and the catalog
 * (built from the graph) never listed it. Rewritten per added node: the node itself, its
 * outgoing edges, its membership of `summary.dead` / `summary.deadByAssociation`,
 * `summary.total`, `summary.auditedCount` and `componentBarrelHash`. Edges INTO the node stay
 * as committed, because writing them would change the dependent's `dependsOn` too; add the
 * dependent as well when that matters. `standardCoverage`, `extractionTop` and `substitution`
 * are whole-library figures and change only on a full reindex.
 */

const isAudited = (component) => (component?.audited === 'audited' ? 1 : 0)

function insertSorted(components, node) {
  const at = components.findIndex((c) => c.name.localeCompare(node.name) > 0)
  if (at === -1) components.push(node)
  else components.splice(at, 0, node)
}

function setMembership(names, name, isMember) {
  const rest = names.filter((n) => n !== name)
  return isMember ? [...rest, name].sort() : rest
}

function spliceOne(graph, fresh, file) {
  const node = fresh.components.find((c) => c.file === file)
  if (!node) throw new Error(`${file} is not a component file in the fresh graph`)
  const previous = graph.components.find((c) => c.file === file)
  graph.components = graph.components.filter((c) => c.file !== file)
  insertSorted(graph.components, node)
  graph.edges = [
    ...graph.edges.filter(([src]) => src !== node.name),
    ...fresh.edges.filter(([src]) => src === node.name),
  ]
  const named = graph.components.filter((c) => c.name === node.name)
  const { summary } = graph
  summary.dead = setMembership(summary.dead, node.name, named.some((c) => c.verdict === 'dead'))
  summary.deadByAssociation = setMembership(
    summary.deadByAssociation,
    node.name,
    named.some((c) => c.deadByAssociation)
  )
  summary.auditedCount += isAudited(node) - isAudited(previous)
}

/**
 * `source` is the committed graph text, `fresh` the payload a full run computed, `files` the
 * repo-relative component files to splice. Returns the new graph text.
 */
export function spliceComponents(source, fresh, files) {
  const graph = JSON.parse(source)
  for (const file of files) spliceOne(graph, fresh, file)
  graph.summary.total = graph.components.length
  graph.componentBarrelHash = fresh.componentBarrelHash
  return JSON.stringify(graph, null, 2)
}
