// Which part of a story's layout counts as "one component" for per-component budgets, and which
// stories sit outside them. Pure over collectLayout output and the story's id and title.

const VARIANT_GRID =
  /(^|-)(all|variants?|sizes|colou?rs|states|gallery|matrix|palette|examples|showcase)(-|$)/

/** The export half of a story id (`components-atoms-chip--all-sizes` gives `all-sizes`). */
const exportPart = (id = '') => id.split('--').at(-1)

const inkedChildren = (nodes, parent) => nodes.filter((n) => n.parent === parent && n.ink)

/**
 * The node ids that are each one instance. `null` stands for the whole story root. Descends through
 * single-inked-child wrappers to the first node with two or more inked children; in a variant grid
 * (by the story id's export name) each of that node's inked children is an instance.
 */
export function instanceRoots({ nodes }, story) {
  let at = null
  let kids = inkedChildren(nodes, at)
  while (kids.length === 1) {
    at = kids[0].id
    kids = inkedChildren(nodes, at)
  }
  if (VARIANT_GRID.test(exportPart(story?.id)) && kids.length >= 2) return kids.map((k) => k.id)
  return [null]
}

/** True when node `id` lies in the instance rooted at `rootId` (ids are child-index paths). */
export const inInstance = (id, rootId) =>
  rootId === null || id === rootId || id.startsWith(`${rootId}.`)

/** Page and shell stories answer to page budgets only. */
export const isPageScope = (story) => /^(Pages|Shell)\//.test(story?.title ?? '')

/** Foundations stories are specimens that show every size on purpose. */
export const isSpecimen = (story) => /^Foundations\//.test(story?.title ?? '')
