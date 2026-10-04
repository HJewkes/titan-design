/**
 * Catalog entries from arch-graph components: which components qualify, which story files
 * belong to each, and the structural fields every entry carries.
 */
import path from 'node:path'

import { resolveStatuses } from './stories.mjs'

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/
const FIXTURE = /-fixture/

/** Why an arch-graph component is not a catalog entry, or null when it is one. */
export function exclusionReason(component) {
  if (FIXTURE.test(path.posix.basename(component.file))) return 'fixture'
  if (!PASCAL_CASE.test(component.name)) return 'not-pascal-case'
  if (!component.exports.includes(component.name)) return 'name-not-exported'
  return null
}

/**
 * The colocated story files whose `meta.component` names the entry, else `<Name>.stories.tsx`
 * beside it. `stories` maps a repo-relative story path to its parsed story file.
 */
export function storiesFor(component, stories) {
  const dir = path.posix.dirname(component.file)
  const colocated = [...stories.keys()].filter((file) => path.posix.dirname(file) === dir)
  const byMeta = colocated.filter((file) => stories.get(file).component === component.name)
  if (byMeta.length > 0) return byMeta
  const conventional = `${dir}/${component.name}.stories.tsx`
  return stories.has(conventional) ? [conventional] : []
}

function statusSource(component, files) {
  const conventional = files.find((file) => file.endsWith(`/${component.name}.stories.tsx`))
  return conventional ?? files[0] ?? null
}

function statusOf(source, stories, projectTags, vocabulary) {
  const statuses = resolveStatuses(projectTags, source ? stories.get(source).tags : [])
  const where = source ?? 'the Storybook project tags'
  if (statuses.length !== 1) {
    throw new Error(`${where} resolves to ${statuses.length} statuses (${statuses}); want 1`)
  }
  if (!vocabulary.includes(statuses[0])) {
    throw new Error(`${where}: status:${statuses[0]} is not in MATURITY.md (${vocabulary})`)
  }
  return statuses[0]
}

/** One catalog entry. `docs` is the entry's `{ purpose, props, source }` from docgen. */
export function buildEntry(component, { stories, projectTags, vocabulary }, docs) {
  const files = storiesFor(component, stories)
  const source = statusSource(component, files)
  return {
    name: component.name,
    file: component.file,
    family: component.family,
    tier: component.tier,
    status: statusOf(source, stories, projectTags, vocabulary),
    purpose: docs.purpose,
    props: docs.props,
    composes: [...component.dependsOn].sort(),
    storyIds: [...new Set(files.flatMap((file) => stories.get(file).storyIds))].sort(),
    sources: { props: docs.source, status: source },
  }
}
