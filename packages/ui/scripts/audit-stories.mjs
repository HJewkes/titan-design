/**
 * `pnpm audit:stories`: renders the stories a diff touches and audits each frame's DOM.
 *
 * It starts its own isolated Storybook (6100-6199, never 6006), captures every target story at
 * each width in dark and light, writes dom.json and one PNG per frame under TMPDIR, prints at
 * most 30 lines, and stops the server it started by process group.
 *
 * Exit codes: 0 clean, 1 blockers remain (or no story is touched), 2 a story failed to render,
 * 70 an unexpected error,
 * 64 usage, targeting refusal or start failure, 130 interrupted.
 */
/* global process, console */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MAX_SUMMARY_LINES,
  captureAll,
  exitCodeFor,
  exitCodeForError,
  planJobs,
  summarise,
} from './audit-stories/capture.mjs'
import { attachStorybook, startStorybook, stopOnSignals } from './audit-stories/storybook.mjs'
import {
  REPO_ROOT,
  TargetError,
  changedFilesFromGit,
  gitAt,
  selectTargets,
} from './audit-stories/targets.mjs'
import { isEntryPoint } from './storybook-launch.mjs'

const UI_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_ROOT = 'titan-audit-stories'
const DEFAULT_WIDTHS = [360, 768, 1280]
const TOUCH_WIDTH = 320
const THEMES = ['dark', 'light']
const VALUE_FLAGS = ['base', 'stories', 'widths', 'themes', 'out', 'url']
const BOOLEAN_FLAGS = ['all', 'dependents', 'touch', 'help']

export const USAGE = `Usage: pnpm audit:stories [--base <ref>] [--stories <id,...>] [--all] [--dependents]
       [--widths 360,768,1280] [--themes dark,light] [--touch] [--out <dir>] [--url <loopback url>]

Audits the stories touched by the diff against --base (default origin/main).
--touch adds the 320 width and checks 44px hit targets. Output goes under TMPDIR.
Exit: 0 clean, 1 blockers or no story touched, 2 render error, 64 usage or start failure,
      70 unexpected error, 130 interrupted (SIGINT, SIGTERM or SIGHUP).`

/** A bad flag or output location; the command exits 64. */
export class UsageError extends Error {
  exitCode = 64
}

const list = (value) => value.split(',').filter(Boolean)

function readFlags(argv) {
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].startsWith('--') ? argv[i].slice(2) : null
    if (BOOLEAN_FLAGS.includes(name)) flags[name] = true
    else if (VALUE_FLAGS.includes(name)) flags[name] = flagValue(name, argv[++i])
    else throw new UsageError(`unknown argument: ${argv[i]}`)
  }
  return flags
}

function flagValue(name, value) {
  if (value === undefined || value.startsWith('--')) throw new UsageError(`--${name} needs a value`)
  return value
}

function parseWidths(raw, touch) {
  if (raw === undefined) return touch ? [TOUCH_WIDTH, ...DEFAULT_WIDTHS] : DEFAULT_WIDTHS
  const widths = list(raw).map(Number)
  if (widths.length === 0 || widths.some((w) => !Number.isInteger(w) || w < 200 || w > 4000)) {
    throw new UsageError(`--widths takes integers from 200 to 4000, not ${raw}`)
  }
  return widths
}

function parseThemes(raw) {
  const themes = raw === undefined ? THEMES : list(raw)
  if (themes.length === 0 || themes.some((t) => !THEMES.includes(t))) {
    throw new UsageError(`--themes takes ${THEMES.join(',')}, not ${raw}`)
  }
  return themes
}

/** Validated options from argv; throws UsageError on anything it does not understand. */
export function parseOptions(argv) {
  const flags = readFlags(argv)
  const touch = Boolean(flags.touch)
  return {
    help: Boolean(flags.help),
    base: flags.base ?? 'origin/main',
    stories: flags.stories ? list(flags.stories) : [],
    all: Boolean(flags.all),
    dependents: Boolean(flags.dependents),
    widths: parseWidths(flags.widths, touch),
    themes: parseThemes(flags.themes),
    touch,
    out: flags.out,
    url: flags.url,
  }
}

const isInside = (dir, root) => dir === root || dir.startsWith(root + sep)

function nextRunDir(parent) {
  const runs = existsSync(parent) ? readdirSync(parent) : []
  const last = Math.max(0, ...runs.map((name) => Number(/^run-(\d+)$/.exec(name)?.[1] ?? 0)))
  return join(parent, `run-${last + 1}`)
}

/** `--out`, or the next `run-<n>` under TMPDIR. Refuses an unset TMPDIR and any path in the repo. */
export function resolveOutDir({ out, tmpDir, sha, repoRoot = REPO_ROOT, cwd = process.cwd() }) {
  if (out === undefined && !tmpDir) {
    throw new UsageError('TMPDIR is unset; set it or pass --out <dir outside the repo>')
  }
  const dir = out === undefined ? nextRunDir(join(tmpDir, OUT_ROOT, sha)) : resolve(cwd, out)
  if (isInside(dir, repoRoot)) throw new UsageError(`output must be outside the repo, not ${dir}`)
  return dir
}

/** A diff that will be refused is refused here, before a Storybook is started for it. */
function refuseWideDiff(changed) {
  try {
    selectTargets({ changed, index: { entries: {} }, graph: { components: [] } })
  } catch (err) {
    if (!(err instanceof TargetError) || err.exitCode === 64) throw err
  }
}

function changedStoryFiles(changed) {
  return changed
    .filter((p) => p.startsWith('packages/ui/src/') && /\.stories\.tsx?$/.test(p))
    .filter((p) => existsSync(join(REPO_ROOT, p)))
    .map((p) => `./${relative('packages/ui', p)}`)
}

function changedSince(base, git) {
  try {
    return changedFilesFromGit(base, git)
  } catch (err) {
    throw new UsageError(`cannot diff against ${base}: ${err.message.split('\n')[0]}`)
  }
}

/**
 * Once a stop signal has arrived, its handler owns the exit (130 after the group is gone). The
 * run it broke must not settle first and exit with a code of its own, so it waits here for good.
 */
function yieldToInterrupt(server) {
  return server?.interrupted ? new Promise(() => {}) : undefined
}

/**
 * The stop is armed from `onSpawn`, while Storybook is still starting: a signal during the boot
 * would otherwise kill this process and leave the detached launcher running. `start` and
 * `signals` replace the launcher and the process in tests.
 */
export async function openServer(options, changed, { start = {}, signals } = {}) {
  const expectImportPaths = changedStoryFiles(changed)
  if (options.url) return attachStorybook(options.url, { expectImportPaths })
  let group
  const arm = (pgid, stopper) => {
    group = stopper
    stopOnSignals(stopper, signals)
    start.onSpawn?.(pgid, stopper)
  }
  try {
    return await startStorybook({ expectImportPaths, ...start, onSpawn: arm })
  } catch (err) {
    await yieldToInterrupt(group)
    throw err
  }
}

function targetStories(options, changed, index) {
  const graph = JSON.parse(readFileSync(join(UI_DIR, 'src/arch/arch-graph.json'), 'utf8'))
  const ids = selectTargets({ ...options, changed, index, graph })
  return ids.map((id) => ({ id, title: `${index.entries[id].title}/${index.entries[id].name}` }))
}

function writeDom(outDir, entries) {
  const stories = entries.map((e) => ({ ...e, shot: e.shot && relative(outDir, e.shot) }))
  const file = join(outDir, 'dom.json')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(file, `${JSON.stringify({ stories }, null, 2)}\n`)
  return file
}

async function audit(options, { outDir, changed, started }) {
  const server = await openServer(options, changed)
  try {
    const stories = targetStories(options, changed, server.index)
    const jobs = planJobs({ ...options, stories, outDir })
    const entries = await captureAll({ url: server.url, uiDir: UI_DIR, jobs })
    const domFile = writeDom(outDir, entries)
    const seconds = ((Date.now() - started) / 1000).toFixed(0)
    const owner = server.pid ? `storybook pid ${server.pid}` : `storybook at ${server.url}`
    console.log(summarise(entries, MAX_SUMMARY_LINES - 1))
    console.log(`${stories.length} stories in ${seconds}s, ${owner}; dom.json at ${domFile}`)
    return exitCodeFor(entries)
  } finally {
    await server.stop()
    await yieldToInterrupt(server)
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseOptions(argv)
  if (options.help) {
    console.log(USAGE)
    return 0
  }
  const git = gitAt(REPO_ROOT)
  const sha = git(['rev-parse', '--short', 'HEAD']).trim()
  const outDir = resolveOutDir({ out: options.out, tmpDir: env.TMPDIR, sha })
  const diffMode = !options.all && options.stories.length === 0
  const changed = diffMode ? changedSince(options.base, git) : []
  if (diffMode) refuseWideDiff(changed)
  return audit(options, { outDir, changed, started: Date.now() })
}

/** A refusal prints its message; anything unexpected prints its stack. Neither exits 0. */
function fail(err) {
  const expected = Number.isInteger(err?.exitCode)
  console.error(expected ? `audit-stories: ${err.message}` : err)
  if (err instanceof UsageError) console.error(USAGE)
  process.exit(exitCodeForError(err))
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  main().then((code) => process.exit(code), fail)
}
