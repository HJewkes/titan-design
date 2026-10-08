/**
 * Finds claims in the repo docs that no longer resolve (TD-331 S4).
 *
 *   node scripts/doc-claims.mjs [--update [--allow-increase]]
 *
 * A claim is a backticked repo path (`path:`), a `pnpm <script>` (`script:`), a package imported
 * in a code fence (`import:`) or a term from doc-claims-retired.json (`retired:`). Dead claims are
 * listed in src/test/doc-claims-baseline.json by doc and claim, not by line, and the baseline only
 * shrinks: src/test/doc-claims.test.ts fails on a dead claim that is not listed and on a listed
 * claim that now resolves or is gone. `--update` drops those rows; `--allow-increase` also adds
 * new ones.
 *
 * The resolvers take a repo context from loadRepoContext and touch no disk, so the .claude/skills
 * shape check (TD-307) imports them rather than writing its own.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { isEntryPoint } from './lib/entry.mjs'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const REPO_ROOT = path.resolve(PKG_ROOT, '../..')
export const BASELINE_PATH = path.join(PKG_ROOT, 'src/test/doc-claims-baseline.json')
const RETIRED_PATH = path.join(PKG_ROOT, 'scripts/doc-claims-retired.json')
const PACKAGE_JSONS = ['package.json', 'packages/ui/package.json']

/** Docs whose claims are checked, relative to the repo root. `.claude/skills` is TD-307's. */
const SCOPE = [
  /^CLAUDE\.md$/,
  /^README\.md$/,
  /^docs\/.+\.md$/,
  /^packages\/ui\/[^/]+\.md$/,
  /^packages\/ui\/docs\/.+\.md$/,
  /^\.claude\/agents\//,
]

export function isScopedDoc(file) {
  return SCOPE.some((pattern) => pattern.test(file))
}

const FENCE_OPEN = /^\s{0,3}(`{3,}|~{3,})\s*([\w-]*)/
const IMPORT_LANGS = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'javascript', 'typescript'])

/** Splits markdown into prose lines and fenced blocks, keeping each fence's language. */
export function splitFences(markdown) {
  const prose = []
  const fences = []
  let open
  for (const line of markdown.split('\n')) {
    if (!open) {
      const match = FENCE_OPEN.exec(line)
      if (match) open = { marker: match[1], lang: match[2].toLowerCase(), lines: [] }
      else prose.push(line)
    } else if (line.trim().startsWith(open.marker) && /^[`~]+$/.test(line.trim())) {
      fences.push({ lang: open.lang, code: open.lines.join('\n') })
      open = undefined
    } else {
      open.lines.push(line)
    }
  }
  return { prose, fences }
}

const PATH_EXTENSIONS = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|css|ya?ml|sh|html|png|svg)$/
// Globs, placeholders, package specifiers, URLs and refs (`:`), anchors, routes (`/api/x`),
// negations (`!src/lab`), ellipses, a bare extension (`.d.ts`) and Tailwind fractions (`w-1/2`)
// are not paths.
const NOT_A_PATH = /[\s*{}<>$[\]()=,'"|\\:#…]|^[@~/!-]|^\.\.\.|^\.[a-z.]+$|\/\d+$/
// Story title groups (S5 resolves those), lint rule ids, git remotes, `a/b` identifier
// alternatives (`hexToRgb/mixHex`) and host names.
const NOT_A_PATH_HEAD =
  /^(Foundations|Components|Custom|Shell|Pages|Lab|titan|react|react-hooks|origin)\/|^[a-z]+[A-Z]\w*\/\w+$|^[\w-]+\.[a-z.]+\//
/** Build output: named in docs, never tracked. */
const GENERATED_SEGMENT =
  /(^|\/)(dist|node_modules|coverage|storybook-static|playwright-report|\.turbo)(\/|$)/

/**
 * The repo path an inline code span names, or undefined. A line reference (`file.ts:12-30`) or an
 * anchor is dropped first.
 */
export function pathCandidate(span) {
  const text = span
    .trim()
    .replace(/:\d+(?:[-,]\d+)*$/, '')
    .replace(/#[\w-]*$/, '')
  if (!text || NOT_A_PATH.test(text) || NOT_A_PATH_HEAD.test(text)) return undefined
  if (GENERATED_SEGMENT.test(text) || !/[a-z]/i.test(text)) return undefined
  if (!text.includes('/') && !PATH_EXTENSIONS.test(text)) return undefined
  return text
}

const PNPM_FLAG_WITH_VALUE = new Set(['--filter', '-F', '-C', '--dir'])
const PNPM_SCRIPT = /\bpnpm((?:[ \t]+[^\s;&|]+)+)/g

/** The script names `pnpm` is asked to run in a piece of text (`pnpm --filter x run y` gives `y`). */
export function pnpmScripts(text) {
  const names = []
  for (const match of text.matchAll(PNPM_SCRIPT)) {
    const words = match[1].trim().split(/\s+/)
    let index = 0
    while (index < words.length && words[index].startsWith('-')) {
      index += PNPM_FLAG_WITH_VALUE.has(words[index]) ? 2 : 1
    }
    if (words[index] === 'run') index += 1
    const name = words[index]?.replace(/[`'".,;:)]+$/, '')
    if (name && /^[\w][\w:.-]*$/.test(name)) names.push(name)
  }
  return names
}

const IMPORT_SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\(\s*)['"]([^'"]+)['"]/g

/** The package names a code fence imports; relative, alias and node builtin specifiers are skipped. */
export function importedPackages(code) {
  const names = []
  for (const [, specifier] of code.matchAll(IMPORT_SPECIFIER)) {
    if (/^[./~#]|^@\//.test(specifier) || specifier.startsWith('node:')) continue
    const parts = specifier.split('/')
    const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
    if (!builtinModules.includes(name)) names.push(name)
  }
  return names
}

/** Every claim a document makes, as `kind:claim` keys, unresolved. */
export function extractClaims(markdown, retired) {
  const { prose, fences } = splitFences(markdown)
  const claims = []
  for (const line of prose) {
    for (const [, span] of line.matchAll(/`([^`\n]+)`/g)) {
      const candidate = pathCandidate(span)
      if (candidate) claims.push(`path:${candidate}`)
      claims.push(...pnpmScripts(span).map((name) => `script:${name}`))
    }
  }
  for (const fence of fences) {
    claims.push(...pnpmScripts(fence.code).map((name) => `script:${name}`))
    if (IMPORT_LANGS.has(fence.lang)) {
      claims.push(...importedPackages(fence.code).map((name) => `import:${name}`))
    }
  }
  const lower = markdown.toLowerCase()
  for (const { term } of retired) {
    if (lower.includes(term.toLowerCase())) claims.push(`retired:${term}`)
  }
  return [...new Set(claims)]
}

// A module path in prose drops its extension, as an import does (`utils/workout-format`).
const MODULE_ENDINGS = ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts']

/**
 * True when `claim` names a tracked file or directory, by repo path or by any trailing segments,
 * or is a subpath of a known package (`nativewind/preset`).
 */
export function resolvePath(claim, doc, context) {
  const bare = claim.replace(/^\.?\//, '').replace(/\/$/, '')
  if (context.packages.has(bare.split('/')[0])) return true
  const target = bare.startsWith('../') ? path.posix.join(path.posix.dirname(doc), bare) : bare
  return MODULE_ENDINGS.some((ending) => context.pathSuffixes.has(target + ending))
}

export function resolveScript(name, context) {
  return context.scripts.has(name)
}

export function resolveImport(name, context) {
  return context.packages.has(name)
}

/** True when a `kind:claim` key still holds; a retired term never does. */
export function resolveClaim(key, doc, context) {
  const separator = key.indexOf(':')
  const kind = key.slice(0, separator)
  const claim = key.slice(separator + 1)
  if (kind === 'path') return resolvePath(claim, doc, context)
  if (kind === 'script') return resolveScript(claim, context)
  if (kind === 'import') return resolveImport(claim, context)
  return false
}

/** The dead claims of one document, sorted. */
export function deadClaims(doc, markdown, context) {
  return extractClaims(markdown, context.retired)
    .filter((key) => !resolveClaim(key, doc, context))
    .sort()
}

/** Every trailing run of segments of every file and directory, so `kit/scale.ts` matches. */
export function pathSuffixSet(files) {
  const suffixes = new Set()
  for (const file of files) {
    const parts = file.split('/')
    for (let end = parts.length; end > 0; end -= 1) {
      for (let start = 0; start < end; start += 1) suffixes.add(parts.slice(start, end).join('/'))
    }
  }
  return suffixes
}

/**
 * Commands pnpm runs itself, and the bins it falls back to, so `pnpm install` or `pnpm vitest`
 * is not read as a missing script.
 */
const PNPM_BUILTINS = [
  'add',
  'audit',
  'create',
  'dlx',
  'exec',
  'i',
  'install',
  'link',
  'list',
  'ls',
  'outdated',
  'pack',
  'publish',
  'remove',
  'rm',
  'store',
  'up',
  'update',
  'why',
]

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function listBins(root) {
  const dirs = ['node_modules/.bin', 'packages/ui/node_modules/.bin'].map((dir) =>
    path.join(root, dir)
  )
  return dirs.flatMap((dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []))
}

/** Tracked and untracked-but-not-ignored files, so a new file resolves before its commit. */
export function listRepoFiles(root) {
  const args = ['ls-files', '--cached', '--others', '--exclude-standard', '-z']
  const out = execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 })
  return out.split('\0').filter((file) => file && fs.existsSync(path.join(root, file)))
}

/** The facts the resolvers check against: files, scripts, packages and retired terms. */
export function loadRepoContext(root = REPO_ROOT) {
  const manifests = PACKAGE_JSONS.map((file) => readJson(path.join(root, file)))
  const scripts = manifests.flatMap((manifest) => Object.keys(manifest.scripts ?? {}))
  const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  const packages = manifests.flatMap((manifest) => [
    manifest.name,
    ...depFields.flatMap((field) => Object.keys(manifest[field] ?? {})),
  ])
  const files = listRepoFiles(root)
  return {
    files,
    pathSuffixes: pathSuffixSet(files),
    scripts: new Set([...scripts, ...PNPM_BUILTINS, ...listBins(root)]),
    packages: new Set(packages.filter(Boolean)),
    retired: readJson(RETIRED_PATH),
  }
}

/** Dead claims of every scoped doc that has any, keyed by doc. */
export function collectDeadClaims(context, root = REPO_ROOT) {
  const findings = {}
  for (const doc of context.files.filter(isScopedDoc).sort()) {
    const dead = deadClaims(doc, fs.readFileSync(path.join(root, doc), 'utf8'), context)
    if (dead.length > 0) findings[doc] = dead
  }
  return findings
}

function rows(byDoc) {
  return Object.entries(byDoc).flatMap(([doc, claims]) => claims.map((claim) => `${doc} ${claim}`))
}

/** Dead claims missing from the baseline, and baseline rows that no longer find a dead claim. */
export function compareToBaseline(findings, baseline) {
  const found = new Set(rows(findings))
  const listed = new Set(rows(baseline))
  return {
    unlisted: [...found].filter((row) => !listed.has(row)),
    stale: [...listed].filter((row) => !found.has(row)),
  }
}

/** The baseline minus stale rows; with `allowIncrease`, plus unlisted ones. */
export function updatedBaseline(findings, baseline, { allowIncrease = false } = {}) {
  const next = {}
  for (const doc of Object.keys({ ...baseline, ...findings }).sort()) {
    const dead = new Set(findings[doc] ?? [])
    const kept = (baseline[doc] ?? []).filter((claim) => dead.has(claim))
    const claims = allowIncrease ? [...dead] : kept
    if (claims.length > 0) next[doc] = [...new Set(claims)].sort()
  }
  return next
}

export function readBaseline() {
  return fs.existsSync(BASELINE_PATH) ? readJson(BASELINE_PATH) : {}
}

function main(argv) {
  const findings = collectDeadClaims(loadRepoContext())
  if (argv.includes('--update')) {
    const allowIncrease = argv.includes('--allow-increase')
    const next = updatedBaseline(findings, readBaseline(), { allowIncrease })
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
  }
  const { unlisted, stale } = compareToBaseline(findings, readBaseline())
  for (const row of unlisted) process.stdout.write(`dead claim: ${row}\n`)
  for (const row of stale) process.stdout.write(`shrink the baseline: ${row}\n`)
  process.stdout.write(
    `doc-claims: ${rows(findings).length} dead, ${unlisted.length} unlisted, ${stale.length} stale\n`
  )
  if (unlisted.length + stale.length > 0) process.exitCode = 1
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  main(process.argv.slice(2))
}
