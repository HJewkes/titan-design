import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

import { isEntryPoint } from './lib/entry.mjs'
import { fetchChangedPaths, firstRenderedPath } from './visual-paths.mjs'

/**
 * Picks the stories the `pr-visual` workflow captures before and after a pull request (TP-1697).
 * A changed component or story file selects its catalog entry's stories, and the entries that
 * compose it one level up. A rendered path no entry owns (tokens, Tailwind, `.storybook/`, a hook)
 * could change any story, so it gives `broad` instead of a guess, and so does a selection over
 * the cap: the workflow then captures nothing and says why.
 */
export const DEFAULT_CAP = 40

// A change to the capture pipeline itself renders one fixed story, so the pipeline's own PR
// proves it end to end.
const PIPELINE_PATHS = [
  /^\.github\/workflows\/pr-visual\.yml$/,
  /^packages\/ui\/scripts\/pr-visual-[a-z]+\.mjs$/,
]
export const PIPELINE_CANARY = 'components-molecules-button--primary'

const owns = (entry, path) => entry.file === path || entry.sources?.status === path

function selectEntries(paths, entries) {
  const direct = entries.filter((entry) => paths.some((path) => owns(entry, path)))
  const names = new Set(direct.map((entry) => entry.name))
  const composers = entries.filter((entry) => entry.composes?.some((name) => names.has(name)))
  return new Set([...direct, ...composers])
}

/**
 * `{ storyIds, reason }` for the stories a change reaches, or `{ broad: true, storyIds: [], reason }`
 * when it cannot be narrowed. `catalog` is `src/arch/component-catalog.json`.
 */
export function storiesFor(changedPaths, catalog, { cap = DEFAULT_CAP } = {}) {
  const entries = catalog.entries
  const pipeline = changedPaths.some((path) => PIPELINE_PATHS.some((p) => p.test(path)))
  const rendered = changedPaths.filter((path) => firstRenderedPath([path]))
  const unowned = rendered.find((path) => !entries.some((entry) => owns(entry, path)))
  if (unowned) return { broad: true, storyIds: [], reason: `${unowned} maps to no catalog entry` }

  const ids = new Set([...selectEntries(rendered, entries)].flatMap((entry) => entry.storyIds))
  if (pipeline) ids.add(PIPELINE_CANARY)
  if (ids.size > cap)
    return { broad: true, storyIds: [], reason: `${ids.size} stories exceed the cap of ${cap}` }
  if (ids.size === 0)
    return { storyIds: [], reason: `none of ${changedPaths.length} changed paths renders a story` }
  return { storyIds: [...ids].sort(), reason: `${ids.size} stories reached` }
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
    return storiesFor(paths, catalog)
  } catch (error) {
    return { storyIds: [], reason: `could not list changed paths (${error.message})` }
  }
}

async function main() {
  const selection = await select(process.env)
  console.log(`pr-visual-stories: ${selection.reason}`)
  for (const id of selection.storyIds) console.log(`  ${id}`)
  writeFileSync(process.env.STORIES_FILE, JSON.stringify(selection))
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `run=${selection.storyIds.length > 0}\n`)
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main()
