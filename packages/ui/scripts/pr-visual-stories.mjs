import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

import { isEntryPoint } from './lib/entry.mjs'
import { API_FILE_CAP, fetchChangedPaths, firstRenderedPath } from './visual-paths.mjs'

/**
 * Picks the stories the `pr-visual` workflow captures before and after a pull request (TP-1697).
 * A changed component or story file selects its catalog entry's stories, and the entries that
 * compose it one level up. Generated metadata that renders nothing is ignored, and a helper or
 * secondary story file selects the catalogued entries of its own directory (TP-6757). A global
 * (Tailwind, tokens, Storybook config, dependencies) could change any story, and so could a path
 * outside every catalogued directory, so either gives `broad` and the reason says which. Over the
 * cap, the first stories in a fixed order are captured and the truncation is recorded. A path is
 * classified by name, except the few `inertPaths` clears by reading the change (TP-6890).
 */
export const DEFAULT_CAP = 40

// A change to the capture pipeline itself renders one fixed story, so the pipeline's own PR
// proves it end to end. The pipeline includes the modules its scripts import.
const PIPELINE_PATHS = [
  /^\.github\/workflows\/pr-visual\.yml$/,
  /^packages\/ui\/scripts\/pr-visual-[a-z]+\.mjs$/,
  /^packages\/ui\/scripts\/(visual-paths|lib\/entry)\.mjs$/,
]
export const PIPELINE_CANARY = 'components-molecules-button--primary'

// RENDERED_UI_PATTERNS is CI's trigger list and over-includes on purpose. These are the paths
// in it that no story reads: generated metadata, and test and CI support (TP-6766). Only
// src/test/fixtures is imported by stories, so it stays rendered.
const NON_STORY_PATHS = [
  /^packages\/ui\/src\/arch\/[^/]+\.json$/,
  /\/__snapshots__\/[^/]+\.snap$/,
  /^packages\/ui\/src\/test\/(?!fixtures\/)/,
  /^packages\/ui\/tests\//,
  /^packages\/ui\/specimen\//,
  /^packages\/ui\/(playwright[^/]*|vitest[^/]*)\.config\.[^/]+$/,
  /^packages\/ui\/scripts\//,
  /^turbo\.json$/,
  /^\.github\//,
]

const GLOBAL_PATHS = [
  /^packages\/ui\/(tailwind\.config\.js|postcss\.config\.js|vite-rn-svg-plugins\.ts|tsconfig\.json|package\.json)$/,
  /^packages\/ui\/src\/theme\//,
  /^packages\/ui\/\.storybook\//,
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$/,
]

const matches = (patterns, path) => patterns.some((pattern) => pattern.test(path))

const UI_MANIFEST = 'packages/ui/package.json'
const ENTRY_FILE = /^packages\/ui\/src\/[^/]+\.ts$/
const NO_PATHS = new Set()

const parseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
const withoutExports = (pkg) => ({ ...pkg, exports: undefined })
const exportTargets = (node) =>
  typeof node === 'string' ? [node] : Object.values(node ?? {}).flatMap(exportTargets)

/** Whether `head` differs from `base` in its `exports` map alone; unparsable counts as more. */
const changesExportsOnly = (base, head) =>
  Boolean(base && head) && isDeepStrictEqual(withoutExports(base), withoutExports(head))

/**
 * The changed paths whose content shows that no story renders them, though their path is a
 * global or a story's (TP-6890): `packages/ui/package.json` when only its `exports` map changed,
 * and a `src/*.ts` package entry the change adds and that map names. An added file reaches a story
 * only through a file that imports it, and that importer is in the same diff, classified on its
 * own. `readBase` and `readHead` give a file's text before and after, undefined where it is absent.
 */
export function inertPaths(changedPaths, { readBase, readHead }) {
  const head = parseJson(readHead(UI_MANIFEST))
  const targets = new Set(exportTargets(head?.exports))
  const isAddedEntry = (path) =>
    ENTRY_FILE.test(path) &&
    targets.has(`./${path.slice('packages/ui/'.length)}`) &&
    readBase(path) === undefined &&
    readHead(path) !== undefined
  const isInert = (path) =>
    path === UI_MANIFEST ? changesExportsOnly(parseJson(readBase(path)), head) : isAddedEntry(path)
  return new Set(changedPaths.filter(isInert))
}

/**
 * What a changed path is to the capture: `pipeline`, `global` (could change any story), `story`
 * (a story renders it), `non-story` (CI reads it, no story does), or undefined outside CI's
 * trigger list. `inert` holds the paths `inertPaths` cleared by content. The one place a path is
 * classified, so selection and the seat check agree.
 */
export function pathRole(path, inert = NO_PATHS) {
  if (matches(PIPELINE_PATHS, path)) return 'pipeline'
  if (!firstRenderedPath([path])) return undefined
  if (inert.has(path)) return 'non-story'
  if (matches(GLOBAL_PATHS, path)) return 'global'
  return matches(NON_STORY_PATHS, path) ? 'non-story' : 'story'
}

const isPipeline = (path) => pathRole(path) === 'pipeline'
const rendersStory = (path, inert) => ['story', 'global'].includes(pathRole(path, inert))

/**
 * Whether a change touches a path a story renders, so a run that shows nothing for it is a
 * failure for the seat to diagnose rather than an owner gate with nothing to look at (TP-6766).
 * A list at the API cap is incomplete, so it may hide a rendered path and counts as one.
 */
export const changesStories = (changedPaths, inert = NO_PATHS) =>
  changedPaths.length >= API_FILE_CAP ||
  changedPaths.some((path) => rendersStory(path, inert) || isPipeline(path))

const owns = (entry, path) => entry.file === path || entry.sources?.status === path
const dirOf = (path) => path.slice(0, path.lastIndexOf('/'))
// Code-unit order, so the capture order never depends on the runner's locale.
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const stem = (path) => path.replace(/\.[^./]+$/, '')

const IMPORT_SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g

/** Whether `source`, the text of the file at `file`, statically imports the module at `path`. */
function importsPath(file, source, path) {
  const target = stem(path)
  for (const [, specifier] of source.matchAll(IMPORT_SPECIFIER)) {
    const parts = [...dirOf(file).split('/'), ...specifier.split('/')]
    const resolved = []
    for (const part of parts)
      if (part === '..') resolved.pop()
      else if (part !== '.') resolved.push(part)
    const joined = stem(resolved.join('/'))
    if (joined === target || `${joined}/index` === target) return true
  }
  return false
}

/** `X.<suffix>.stories.tsx` belongs to the entry whose story file is `X.stories.tsx` beside it. */
function secondaryStoryOwners(path, entries) {
  const match = /^(.*\/[^/.]+)\.[^/]+(\.stories\.(ts|tsx|mdx))$/.exec(path)
  if (!match) return []
  return entries.filter((entry) => entry.sources?.status === `${match[1]}${match[2]}`)
}

/** The catalogued entries of `path`'s directory, narrowed to those importing it if any do. */
function directoryOwners(path, entries, readSource) {
  const siblings = entries.filter((entry) => dirOf(entry.file) === dirOf(path))
  const importers = siblings.filter((entry) =>
    importsPath(entry.file, readSource(entry.file), path)
  )
  return importers.length > 0 ? importers : siblings
}

/** The entries a rendered path selects, or `[]` when it belongs to no catalogued component. */
function ownersOf(path, entries, readSource) {
  const direct = entries.filter((entry) => owns(entry, path))
  if (direct.length > 0) return direct
  if (matches(GLOBAL_PATHS, path)) return []
  const secondary = secondaryStoryOwners(path, entries)
  return secondary.length > 0 ? secondary : directoryOwners(path, entries, readSource)
}

function broadReason(unowned) {
  const global = unowned.find((path) => matches(GLOBAL_PATHS, path))
  if (global)
    return `${global} is a global (Tailwind, tokens, Storybook config or dependencies) that can change any story, so no story subset is captured`
  return `${unowned[0]} maps to no catalog entry`
}

/** Each entry the rendered paths reach, with the paths that reached it directly or by composition. */
function reachedEntries(attribution, entries) {
  const own = (entry) => attribution.get(entry) ?? []
  const reached = new Map()
  for (const entry of entries) {
    const composed = entries.filter((other) => entry.composes?.includes(other.name))
    const paths = [...own(entry), ...composed.flatMap(own)]
    if (paths.length > 0) reached.set(entry, { direct: own(entry).length > 0, paths })
  }
  return reached
}

/** Story ids in capture order: stories of directly changed entries first, then composers, each by id. */
function orderedStories(reached, pipelinePaths) {
  const paths = new Map()
  const direct = new Set()
  for (const [entry, reach] of reached)
    for (const id of entry.storyIds) {
      paths.set(id, new Set([...(paths.get(id) ?? []), ...reach.paths]))
      if (reach.direct) direct.add(id)
    }
  if (pipelinePaths.length > 0) {
    paths.set(PIPELINE_CANARY, new Set([...(paths.get(PIPELINE_CANARY) ?? []), ...pipelinePaths]))
    direct.add(PIPELINE_CANARY)
  }
  const rank = (id) => (direct.has(id) ? 0 : 1)
  const ids = [...paths.keys()].sort((a, b) => rank(a) - rank(b) || byCodeUnit(a, b))
  return ids.map((story) => ({ story, paths: [...paths.get(story)].sort() }))
}

function emptyReason(changedPaths, attribution) {
  if (attribution.size === 0) return `none of ${changedPaths.length} changed paths renders a story`
  const names = [...attribution.keys()].map((entry) => entry.name).sort(byCodeUnit)
  return `the change reaches only entries without stories: ${names.join(', ')}`
}

function attribute(rendered, entries, readSource) {
  const attribution = new Map()
  const unowned = []
  for (const path of rendered) {
    const owners = ownersOf(path, entries, readSource)
    if (owners.length === 0) unowned.push(path)
    for (const entry of owners) attribution.set(entry, [...(attribution.get(entry) ?? []), path])
  }
  return { attribution, unowned }
}

/**
 * `{ storyIds, selected, reason, truncated? }` for the stories a change reaches, or
 * `{ broad: true, storyIds: [], unowned, reason }` when it cannot be narrowed. `catalog` is
 * `src/arch/component-catalog.json`; `readSource(file)` returns a catalogued file's text, and
 * `inert` the paths `inertPaths` cleared.
 */
export function storiesFor(
  changedPaths,
  catalog,
  { cap = DEFAULT_CAP, readSource = () => '', inert = NO_PATHS } = {}
) {
  const entries = catalog.entries
  const pipelinePaths = changedPaths.filter(isPipeline)
  const rendered = changedPaths.filter((path) => rendersStory(path, inert))
  const { attribution, unowned } = attribute(rendered, entries, readSource)
  if (unowned.length > 0)
    return { broad: true, storyIds: [], selected: [], unowned, reason: broadReason(unowned) }

  const ordered = orderedStories(reachedEntries(attribution, entries), pipelinePaths)
  if (ordered.length === 0)
    return { storyIds: [], selected: [], reason: emptyReason(changedPaths, attribution) }
  const selected = ordered.slice(0, cap).sort((a, b) => byCodeUnit(a.story, b.story))
  const storyIds = selected.map((item) => item.story)
  if (ordered.length <= cap)
    return { storyIds, selected, reason: `${ordered.length} stories reached` }
  const reason = `${ordered.length} stories reached, over the cap of ${cap}; capturing the first ${cap} (changed entries first, then composers, each by story id)`
  return { storyIds, selected, truncated: { reached: ordered.length, cap }, reason }
}

const readRepoFile = (file) => {
  try {
    return readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8')
  } catch {
    return ''
  }
}

const git = (...args) =>
  execFileSync('git', ['-C', fileURLToPath(new URL('../../../', import.meta.url)), ...args], {
    encoding: 'utf8',
  })
const readAt = (rev) => (file) =>
  git('ls-tree', '--name-only', rev, file) ? git('show', `${rev}:${file}`) : undefined

// The tree is the PR's merge commit, so its first parent is the base the PR merges into. A read
// that fails clears nothing, so every path keeps the role its name gives it.
function inertAtMerge(paths) {
  try {
    return inertPaths(paths, { readBase: readAt('HEAD^1'), readHead: readAt('HEAD') })
  } catch (error) {
    console.log(`pr-visual-stories: classifying by path only (${error.message})`)
    return NO_PATHS
  }
}

async function select({ GITHUB_REPOSITORY, PR_NUMBER, GITHUB_TOKEN }) {
  const catalog = JSON.parse(
    readFileSync(new URL('../src/arch/component-catalog.json', import.meta.url), 'utf8')
  )
  try {
    const paths = await fetchChangedPaths({
      repo: GITHUB_REPOSITORY,
      pr: PR_NUMBER,
      token: GITHUB_TOKEN,
    })
    const inert = inertAtMerge(paths)
    const selection = storiesFor(paths, catalog, { readSource: readRepoFile, inert })
    return { ...selection, inert: [...inert], changesStories: changesStories(paths, inert) }
  } catch (error) {
    return {
      storyIds: [],
      changesStories: true,
      reason: `could not list changed paths (${error.message})`,
    }
  }
}

async function main() {
  const selection = await select(process.env)
  console.log(`pr-visual-stories: ${selection.reason}`)
  for (const path of selection.inert ?? []) console.log(`  renders nothing by content: ${path}`)
  for (const path of selection.unowned ?? []) console.log(`  unowned: ${path}`)
  for (const id of selection.storyIds) console.log(`  ${id}`)
  writeFileSync(process.env.STORIES_FILE, JSON.stringify(selection))
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `run=${selection.storyIds.length > 0}\n`)
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main()
