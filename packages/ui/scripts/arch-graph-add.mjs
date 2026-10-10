/**
 * The scoped write behind `arch:graph --add <file>`: splice freshly computed nodes into the
 * committed `src/arch/arch-graph.json` and leave every other component's block as committed.
 *
 * A full `arch:graph` rewrites metrics for components a change never touched, so feature PRs
 * cannot run one; before this mode a new component simply never got a node, and the catalog
 * (built from the graph) never listed it. Only the named node's own block changes. The file
 * stores no figure shared across nodes (edge list, totals, dead lists, a barrel hash), because
 * every component PR rewrote those lines and the second of any two such PRs conflicted
 * (TD-792); `src/arch/arch-graph-derived.ts` derives them from the nodes. `summary` holds only
 * whole-library figures, which change on a full reindex.
 */

function insertSorted(components, node) {
  const at = components.findIndex((c) => c.name.localeCompare(node.name) > 0)
  if (at === -1) components.push(node)
  else components.splice(at, 0, node)
}

function spliceOne(graph, fresh, file) {
  const node = fresh.components.find((c) => c.file === file)
  if (!node) throw new Error(`${file} is not a component file in the fresh graph`)
  graph.components = graph.components.filter((c) => c.file !== file)
  insertSorted(graph.components, node)
}

/**
 * `source` is the committed graph text, `fresh` the payload a full run computed, `files` the
 * repo-relative component files to splice. Returns the new graph text.
 */
export function spliceComponents(source, fresh, files) {
  const graph = JSON.parse(source)
  for (const file of files) spliceOne(graph, fresh, file)
  return JSON.stringify(graph, null, 2)
}
