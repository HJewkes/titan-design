import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isEntryPoint } from './lib/entry.mjs'
import { fetchChangedPaths } from './visual-paths.mjs'

/**
 * Picks the stories the `contrast` job checks on a pull request (TD-869). A PR runs only the
 * story files it changes plus the story files that import a changed module, directly or through
 * other modules; a push to main and the nightly schedule run every story. A regression in a story
 * the diff cannot reach is caught on main, by the owner's decision.
 *
 * Anything every story reads (tokens, the theme, Storybook, Tailwind, the contrast harness, the
 * dependency set) selects the full run, and so does a change the Storybook preview imports. An
 * edit to the contrast baseline or blank list selects the stories whose entries it changes.
 */
export const FULL_RUN_PATTERNS = [
  /^packages\/ui\/src\/theme\/(?!.*\.(test(-d)?\.tsx?|stories\.tsx?|mdx)$)/,
  /^packages\/ui\/src\/test\/(contrast-stories|blank-render)\.ts$/,
  /^packages\/ui\/\.storybook\//,
  /^packages\/ui\/(tailwind\.config\.js|postcss\.config\.js|vite-rn-svg-plugins\.ts|tsconfig\.json|package\.json)$/,
  /^packages\/ui\/playwright[^/]*\.config\.[^/]+$/,
  /^packages\/ui\/tests\/visual\/(contrast\.spec|contrast\.global-setup|render-story|story-index\.global-setup)\.ts$/,
  /^packages\/ui\/scripts\/(contrast-stories|visual-paths)\.mjs$/,
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json)$/,
  /^\.github\/workflows\/ci\.yml$/,
]

// GET /pulls/{n}/files lists at most 3000 files; past that the list is incomplete.
const API_FILE_CAP = 3000

// Past a third of the story files a subset costs about one full shard, so the three shards win.
const SUBSET_SHARE_LIMIT = 1 / 3

const UI_ROOT = 'packages/ui'
const SOURCE_FILE = /\.(tsx?|jsx?|mjs)$/
const STORY_FILE = /\.stories\.(ts|tsx)$/
const TEST_FILE = /\.test(-d)?\.tsx?$/
const PREVIEW_FILE = `${UI_ROOT}/.storybook/preview.tsx`
export const BASELINE_FILE = `${UI_ROOT}/tests/visual/contrast-stories-baseline.json`
export const BLANK_LIST_FILE = `${UI_ROOT}/tests/visual/contrast-blank-stories.json`
// Vite's web resolution order (vite-rn-svg-plugins.ts), then the plain extensions.
const RESOLVE_SUFFIXES = [
  '.web.tsx',
  '.web.ts',
  '.web.jsx',
  '.web.js',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mjs',
]
const IMPORT_SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*['"]([^'"\n]+)['"]/g

/** Every module specifier a source file names in an import, re-export or dynamic import. */
export function parseImports(source) {
  return [...source.matchAll(IMPORT_SPECIFIER)].map((match) => match[1])
}

// The bare path comes last: it is a directory whenever an `index` file is meant.
function candidates(base) {
  return [
    ...RESOLVE_SUFFIXES.map((suffix) => base + suffix),
    ...RESOLVE_SUFFIXES.map((suffix) => `${base}/index${suffix}`),
    base,
  ]
}

/** The repo-relative file a specifier names, or undefined for a package or an unresolved path. */
export function resolveImport(fromFile, specifier, exists) {
  let base
  if (specifier.startsWith('@/')) base = posix.join(UI_ROOT, 'src', specifier.slice(2))
  else if (specifier.startsWith('.')) base = posix.join(posix.dirname(fromFile), specifier)
  else return undefined
  return candidates(base).find(exists)
}

/** For each file, the files that import it. */
export function buildImporters(files, readSource, exists) {
  const importers = new Map()
  for (const file of files) {
    for (const specifier of parseImports(readSource(file))) {
      const target = resolveImport(file, specifier, exists)
      if (!target) continue
      if (!importers.has(target)) importers.set(target, new Set())
      importers.get(target).add(file)
    }
  }
  return importers
}

/** Every file that is one of `changed` or reaches one through its imports. */
export function reachingFiles(changed, importers) {
  const seen = new Set(changed)
  const queue = [...changed]
  while (queue.length > 0) {
    for (const importer of importers.get(queue.pop()) ?? []) {
      if (seen.has(importer)) continue
      seen.add(importer)
      queue.push(importer)
    }
  }
  return seen
}

/**
 * The story ids whose baseline entry or blank-list membership differs between two versions of
 * those files. A baseline key is `<story id>|<theme>`.
 */
export function changedBaselineIds(previous, next) {
  const ids = new Set()
  const keys = new Set([...Object.keys(previous.baseline), ...Object.keys(next.baseline)])
  for (const key of keys) {
    const [before, after] = [previous.baseline[key], next.baseline[key]]
    if (JSON.stringify(before) !== JSON.stringify(after)) ids.add(key.split('|')[0])
  }
  const [blankBefore, blankAfter] = [new Set(previous.blank), new Set(next.blank)]
  for (const id of previous.blank) if (!blankAfter.has(id)) ids.add(id)
  for (const id of next.blank) if (!blankBefore.has(id)) ids.add(id)
  return [...ids].sort()
}

const full = (reason) => ({ mode: 'full', storyFiles: [], storyIds: [], reason })
const touchesBaseline = (paths) =>
  paths.some((path) => path === BASELINE_FILE || path === BLANK_LIST_FILE)

function fullRunReason(changedPaths, baselineIds) {
  if (changedPaths.length >= API_FILE_CAP)
    return `${changedPaths.length} changed paths reach the API cap`
  const shared = changedPaths.find((path) => FULL_RUN_PATTERNS.some((p) => p.test(path)))
  if (shared) return `${shared} is shared by every story`
  if (touchesBaseline(changedPaths) && !baselineIds)
    return 'the changed baseline entries are unknown'
  return undefined
}

/**
 * The contrast run a PR needs: `full`, `subset` with the story files and ids to check, or `none`.
 * `files` is every source file under packages/ui/src and .storybook, repo-relative; `baselineIds`
 * is `changedBaselineIds` of the PR's baseline edit, needed only when it makes one.
 */
export function selectContrast({ changedPaths, files, readSource, exists, baselineIds }) {
  const fullReason = fullRunReason(changedPaths, baselineIds)
  if (fullReason) return full(`${fullReason}; running every story`)

  const reached = reachingFiles(changedPaths, buildImporters(files, readSource, exists))
  if (reached.has(PREVIEW_FILE))
    return full('the Storybook preview imports a changed module; running every story')
  const allStories = files.filter((file) => STORY_FILE.test(file))
  const storyFiles = allStories.filter((file) => reached.has(file)).sort()
  const storyIds = touchesBaseline(changedPaths) ? baselineIds : []
  const selected = storyFiles.length + storyIds.length
  if (selected === 0) {
    return {
      mode: 'none',
      storyFiles,
      storyIds,
      reason: `no story reaches the ${changedPaths.length} changed paths`,
    }
  }
  const reason = `${storyFiles.length} of ${allStories.length} story files and ${storyIds.length} baseline stories affected`
  if (selected > allStories.length * SUBSET_SHARE_LIMIT)
    return full(`${reason}; running every story`)
  return { mode: 'subset', storyFiles, storyIds, reason }
}

/**
 * What one matrix shard does with a selection: a subset runs whole on shard 1 and the other
 * shards end green without running, so a small diff pays for one Storybook build, not three.
 */
export function shardPlan(selection, shard, total) {
  if (selection.mode === 'none') return { run: false, shardArg: '' }
  if (selection.mode === 'subset') return { run: shard === 1, shardArg: '' }
  return { run: true, shardArg: `--shard=${shard}/${total}` }
}

function listSourceFiles(repoRoot, dir) {
  return readdirSync(join(repoRoot, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = posix.join(dir, entry.name)
    if (entry.isDirectory())
      return entry.name === 'node_modules' ? [] : listSourceFiles(repoRoot, path)
    return SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name) ? [path] : []
  })
}

/** A file's JSON at the PR's base commit, or `fallback` when the base has no such file. */
async function fetchBaseJson({ repo, path, ref, token, fallback }) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${ref}`
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github.raw+json' },
  })
  if (response.status === 404) return fallback
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`)
  return response.json()
}

async function baselineIdsAgainstBase(env, repoRoot) {
  const request = { repo: env.GITHUB_REPOSITORY, ref: env.BASE_SHA, token: env.GITHUB_TOKEN }
  const readHead = (path, fallback) =>
    existsSync(join(repoRoot, path))
      ? JSON.parse(readFileSync(join(repoRoot, path), 'utf8'))
      : fallback
  const previous = {
    baseline: await fetchBaseJson({ ...request, path: BASELINE_FILE, fallback: {} }),
    blank: await fetchBaseJson({ ...request, path: BLANK_LIST_FILE, fallback: [] }),
  }
  return changedBaselineIds(previous, {
    baseline: readHead(BASELINE_FILE, {}),
    blank: readHead(BLANK_LIST_FILE, []),
  })
}

async function selectFromPullRequest(env, repoRoot) {
  try {
    const changedPaths = await fetchChangedPaths({
      repo: env.GITHUB_REPOSITORY,
      pr: env.PR_NUMBER,
      token: env.GITHUB_TOKEN,
    })
    return selectContrast({
      changedPaths,
      files: [`${UI_ROOT}/src`, `${UI_ROOT}/.storybook`].flatMap((dir) =>
        listSourceFiles(repoRoot, dir)
      ),
      readSource: (file) => readFileSync(join(repoRoot, file), 'utf8'),
      exists: (file) => existsSync(join(repoRoot, file)),
      baselineIds: touchesBaseline(changedPaths)
        ? await baselineIdsAgainstBase(env, repoRoot)
        : undefined,
    })
  } catch (error) {
    return full(`could not select stories (${error.message}); running every story`)
  }
}

async function main() {
  const env = process.env
  const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
  const selection =
    env.GITHUB_EVENT_NAME === 'pull_request'
      ? await selectFromPullRequest(env, repoRoot)
      : full(`a ${env.GITHUB_EVENT_NAME ?? 'local'} run checks every story`)
  const plan = shardPlan(selection, Number(env.SHARD ?? 1), Number(env.SHARD_TOTAL ?? 1))
  console.log(`contrast-stories: ${selection.mode}: ${selection.reason}`)
  for (const entry of [...selection.storyFiles, ...selection.storyIds]) console.log(`  ${entry}`)
  if (!plan.run) console.log('contrast-stories: this shard has nothing to check')
  if (env.STORY_LIST_FILE) {
    writeFileSync(
      env.STORY_LIST_FILE,
      JSON.stringify({ files: selection.storyFiles, ids: selection.storyIds })
    )
  }
  if (env.GITHUB_OUTPUT) {
    appendFileSync(
      env.GITHUB_OUTPUT,
      `run=${plan.run}\nmode=${selection.mode}\nshard=${plan.shardArg}\n`
    )
  }
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main()
