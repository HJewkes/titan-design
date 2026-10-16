import { execFileSync } from 'node:child_process'
import { dirname, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MAX_TARGETS = 40
export const EXIT_NO_TARGETS = 1
export const EXIT_USAGE = 64

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const PACKAGE_PREFIX = 'packages/ui/'
const SRC_PREFIX = 'src/'
const STORY_FILE = /\.stories\.tsx$/
const WIDE_PATHS = [/^src\/theme\//, /^tailwind\.config\.js$/, /^\.storybook\//]

export class TargetError extends Error {
  constructor(message, exitCode = EXIT_USAGE) {
    super(message)
    this.name = 'TargetError'
    this.exitCode = exitCode
  }
}

const toPackagePath = (p) => (p.startsWith(PACKAGE_PREFIX) ? p.slice(PACKAGE_PREFIX.length) : p)
const toIndexPath = (p) => p.replace(/^\.\//, '')

function storyEntries(index) {
  return Object.values(index.entries ?? {})
    .filter((entry) => entry.type === 'story')
    .map((entry) => ({ id: entry.id, path: toIndexPath(entry.importPath) }))
}

function storyFilesInDirs(index, dirs) {
  return new Set(
    storyEntries(index)
      .map((s) => s.path)
      .filter((p) => dirs.has(posix.dirname(p)))
  )
}

function directTargetFiles(changed, index) {
  const files = new Set()
  const dirs = new Set()
  for (const path of changed) {
    if (STORY_FILE.test(path)) files.add(path)
    else dirs.add(posix.dirname(path))
  }
  for (const file of storyFilesInDirs(index, dirs)) files.add(file)
  return files
}

// One level only: a dependent of a dependent is never added.
function dependentTargetFiles(changed, graph, index) {
  const changedDirs = new Set(changed.map((p) => posix.dirname(p)))
  const changedNames = new Set(
    graph.components
      .filter((c) => changedDirs.has(posix.dirname(toPackagePath(c.file))))
      .map((c) => c.name)
  )
  const dependentDirs = new Set(
    graph.components
      .filter((c) => (c.dependsOn ?? []).some((name) => changedNames.has(name)))
      .map((c) => posix.dirname(toPackagePath(c.file)))
  )
  return storyFilesInDirs(index, dependentDirs)
}

export function normalizeChanged(paths) {
  return [...new Set(paths.map(toPackagePath))].filter(
    (p) => p.startsWith(SRC_PREFIX) || WIDE_PATHS.some((re) => re.test(p))
  )
}

function idsForFiles(index, files) {
  return storyEntries(index)
    .filter((s) => files.has(s.path))
    .map((s) => s.id)
}

function explicitIds(index, ids) {
  const known = new Set(storyEntries(index).map((s) => s.id))
  const missing = ids.filter((id) => !known.has(id))
  if (missing.length > 0) throw new TargetError(`unknown story id: ${missing.join(', ')}`)
  return ids
}

function capTargets(ids, all) {
  if (ids.length > MAX_TARGETS && !all) {
    throw new TargetError(
      `${ids.length} stories exceed the ${MAX_TARGETS} cap; narrow with --stories or pass --all`
    )
  }
  return ids
}

function diffIds({ changed, index, graph, dependents }) {
  const wide = changed.find((p) => WIDE_PATHS.some((re) => re.test(p)))
  if (wide) {
    throw new TargetError(`${wide} touches every story; pass --stories <ids> or --all`)
  }
  const files = directTargetFiles(changed, index)
  if (dependents) for (const f of dependentTargetFiles(changed, graph, index)) files.add(f)
  const ids = idsForFiles(index, files)
  if (ids.length === 0) {
    const listed = changed.length > 0 ? changed.join(', ') : '(no changed files under src/)'
    throw new TargetError(
      `no stories touched by: ${listed}; pass --stories <ids> to name them`,
      EXIT_NO_TARGETS
    )
  }
  return ids
}

/**
 * Story ids to audit. Pure over its inputs: `changed` is a list of repo-relative paths,
 * `index` is Storybook's /index.json and `graph` is arch-graph.json.
 * Throws TargetError carrying the exit code the command should use.
 */
export function selectTargets({
  changed = [],
  index,
  graph,
  dependents = false,
  stories = [],
  all = false,
}) {
  if (all) return storyEntries(index).map((s) => s.id)
  if (stories.length > 0) return capTargets(explicitIds(index, stories), all)
  const ids = diffIds({ changed: normalizeChanged(changed), index, graph, dependents })
  return capTargets(ids, all)
}

// -z keeps a non-ASCII path as written; without it git quotes and octal-escapes the name.
export function gitDiffArgs(mergeBase) {
  return ['diff', '--name-only', '-z', mergeBase]
}

export const gitUntrackedArgs = () => ['ls-files', '--others', '--exclude-standard', '-z']
export const gitMergeBaseArgs = (base) => ['merge-base', base, 'HEAD']

const paths = (text) => text.split('\0').filter(Boolean)

/** A git runner rooted at `cwd`. `ls-files --others` answers relative to its cwd. */
export function gitAt(cwd) {
  return (args) => execFileSync('git', args, { cwd, encoding: 'utf8' })
}

/** Repo-relative changed paths: the diff against the merge base plus untracked files. */
export function changedFilesFromGit(base = 'origin/main', git = gitAt(REPO_ROOT)) {
  const mergeBase = git(gitMergeBaseArgs(base)).trim()
  return [...new Set([...paths(git(gitDiffArgs(mergeBase))), ...paths(git(gitUntrackedArgs()))])]
}
