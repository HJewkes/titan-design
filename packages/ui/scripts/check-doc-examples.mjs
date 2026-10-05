/**
 * Compiles the ```ts and ```tsx fences in the markdown docs (TD-27 S3).
 *
 *   node scripts/check-doc-examples.mjs [--update [--allow-increase]] [--verbose]
 *
 * Writes every fence of DOCS into a temp project whose tsconfig maps `@titan-design/react-ui` and
 * its subpaths to the src entries, then type-checks it as `tsc --noEmit` would, one fence file at a
 * time (see diagnoseProject). A fence whose info string is `tsx fragment` (or `ts fragment`) is
 * not compiled. Fences that fail are listed in
 * doc-examples-baseline.json by key `<doc>#<index>:<hash>`; the baseline only shrinks. The check
 * fails on a failing fence that is not listed and on a listed fence that now compiles.
 * `--update` drops listed fences that now compile; `--allow-increase` also adds new failures.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

import { isEntryPoint } from './lib/entry.mjs'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = path.resolve(PKG_ROOT, '../..')
const BASELINE_PATH = path.join(PKG_ROOT, 'scripts/doc-examples-baseline.json')

/** Docs whose fences are compiled, relative to the repo root. */
export const DOCS = [
  'CLAUDE.md',
  'README.md',
  'packages/ui/README.md',
  'packages/ui/TOKENS.md',
  'packages/ui/MATURITY.md',
  'packages/ui/DEPRECATIONS.md',
  'packages/ui/docs/WEB_SETUP.md',
  'packages/ui/docs/render-testing-pattern.md',
  'packages/ui/src/components/custom/Workout/VelocityBandScale.contract.md',
  'packages/ui/src/components/ui/charts/dependency-matrix/API-NOTE.md',
  'packages/ui/src/components/ui/charts/line-chart/API-NOTE.md',
  'packages/ui/src/components/ui/table/API-NOTE.md',
  'packages/ui/src/components/ui/tree-view/API-NOTE.md',
]

/** Public entry points, as the package `exports` map names them, to their src files. */
const ENTRY_PATHS = {
  '@titan-design/react-ui': 'src/index.ts',
  '@titan-design/react-ui/bodymap': 'src/bodymap.ts',
  '@titan-design/react-ui/pages': 'src/pages.ts',
  '@titan-design/react-ui/theme': 'src/theme/index.ts',
  '@titan-design/react-ui/theme/tokens': 'src/theme/tokens/index.ts',
  '@titan-design/react-ui/theme/tokens-css': 'src/theme/tokens-css.ts',
  '@titan-design/react-ui/tailwind.config.js': 'tailwind.config.js',
}

const FENCE_OPEN = /^( {0,3})(`{3,}|~{3,})\s*([^`]*)$/
const COMPILED_LANGS = new Set(['ts', 'tsx'])

function parseOpen(line) {
  const match = FENCE_OPEN.exec(line)
  if (!match) return undefined
  const [, indent, marker, info] = match
  const [lang = '', ...flags] = info.trim().split(/\s+/)
  return { indent: indent.length, marker, lang, isFragment: flags.includes('fragment') }
}

function closes(line, open) {
  const trimmed = line.trim()
  return trimmed.startsWith(open.marker) && trimmed === open.marker[0].repeat(trimmed.length)
}

function stripIndent(line, indent) {
  const leading = line.length - line.trimStart().length
  return line.slice(Math.min(indent, leading))
}

/**
 * The ts and tsx fences of a markdown document, in order. `index` counts ts and tsx fences
 * (fragments included), so marking one fence a fragment does not rekey the others.
 */
export function extractFences(markdown) {
  const fences = []
  let open
  let body = []
  for (const line of markdown.split('\n')) {
    if (!open) {
      open = parseOpen(line)
      body = []
    } else if (closes(line, open)) {
      if (COMPILED_LANGS.has(open.lang)) {
        const { lang, isFragment } = open
        fences.push({ index: fences.length, lang, isFragment, code: body.join('\n') })
      }
      open = undefined
    } else {
      body.push(stripIndent(line, open.indent))
    }
  }
  return fences
}

/** The baseline key of a fence: doc path, fence index and a hash of the fence's code. */
export function fenceKey(doc, fence) {
  const hash = createHash('sha256').update(fence.code).digest('hex').slice(0, 12)
  return `${doc}#${fence.index}:${hash}`
}

/**
 * Compares the failing fence keys with the baseline. `unbaselined` failures and `stale` entries
 * (listed fences that now compile, changed or vanished) both fail the check.
 */
export function compareToBaseline(failingKeys, baselineKeys) {
  const failing = new Set(failingKeys)
  const baseline = new Set(baselineKeys)
  const unbaselined = [...failing].filter((key) => !baseline.has(key)).sort()
  const stale = [...baseline].filter((key) => !failing.has(key)).sort()
  return { ok: unbaselined.length === 0 && stale.length === 0, unbaselined, stale }
}

/** The baseline `--update` writes: stale entries dropped, new failures added only when allowed. */
export function updatedBaseline(failingKeys, baselineKeys, { allowIncrease }) {
  const failing = new Set(failingKeys)
  const kept = baselineKeys.filter((key) => failing.has(key))
  const added = allowIncrease ? failingKeys.filter((key) => !baselineKeys.includes(key)) : []
  return [...new Set([...kept, ...added])].sort()
}

/** Every fence to compile, with the file name it gets in the temp project. */
export function collectFences(docs, readDoc) {
  return docs.flatMap((doc) =>
    extractFences(readDoc(doc))
      .filter((fence) => !fence.isFragment)
      .map((fence) => ({
        key: fenceKey(doc, fence),
        file: `${doc.replace(/[^A-Za-z0-9]+/g, '_')}_${fence.index}.${fence.lang}`,
        code: fence.code,
      }))
  )
}

// Emit options; rootDir and outDir also resolve against the temp dir and would reject the fences.
const DROPPED_OPTIONS = new Set(['outDir', 'rootDir', 'declaration', 'declarationMap', 'sourceMap'])

function tsconfigFor() {
  const paths = { '@/*': [path.join(PKG_ROOT, 'src/*')] }
  for (const [specifier, file] of Object.entries(ENTRY_PATHS)) {
    paths[specifier] = [path.join(PKG_ROOT, file)]
  }
  const own = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'tsconfig.json'), 'utf8'))
  const options = Object.fromEntries(
    Object.entries(own.compilerOptions).filter(([name]) => !DROPPED_OPTIONS.has(name))
  )
  return {
    compilerOptions: {
      ...options,
      noEmit: true,
      allowJs: true,
      baseUrl: '.',
      paths,
      typeRoots: [path.join(PKG_ROOT, 'src/types'), path.join(PKG_ROOT, 'node_modules/@types')],
    },
    include: ['*.ts', '*.tsx', path.join(PKG_ROOT, 'src/types/**/*.d.ts')],
  }
}

// Consumers import the stylesheets through a bundler; tsc only needs to know they are modules.
// The icon library is the consumer's choice and not a titan dependency, so its types are absent.
const AMBIENT = "declare module '*.css'\ndeclare module 'lucide-react'\n"

function writeProject(dir, fences) {
  fs.symlinkSync(path.join(PKG_ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(tsconfigFor(), null, 2))
  fs.writeFileSync(path.join(dir, 'ambient.d.ts'), AMBIENT)
  // `export {}` makes every fence a module, so two fences that declare `meta` do not collide.
  for (const fence of fences) {
    fs.writeFileSync(path.join(dir, fence.file), `${fence.code}\nexport {}\n`)
  }
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  if (!diagnostic.file) return `TS${diagnostic.code}: ${message}`
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  return `${line + 1}:${character + 1} TS${diagnostic.code}: ${message}`
}

/**
 * Diagnostics per fence file, as `tsc --noEmit` would report them. tsc stops at syntax errors
 * program-wide, so one broken fence would hide type errors in the rest; asking per file avoids
 * that. Config and global errors come back under the key `''`.
 */
function diagnoseProject(dir) {
  const configPath = path.join(dir, 'tsconfig.json')
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, dir)
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
  const byFile = new Map()
  const global = [
    ...parsed.errors,
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ]
  if (global.length > 0) byFile.set('', global.map(formatDiagnostic))
  for (const fileName of parsed.fileNames.filter((name) => path.dirname(name) === dir)) {
    const source = program.getSourceFile(fileName)
    const syntactic = program.getSyntacticDiagnostics(source)
    const found = syntactic.length > 0 ? syntactic : program.getSemanticDiagnostics(source)
    if (found.length > 0) byFile.set(path.basename(source.fileName), found.map(formatDiagnostic))
  }
  return byFile
}

/** Compiles the fences in a fresh temp project and returns the diagnostics by file. */
function compileFences(fences) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-examples-'))
  try {
    writeProject(dir, fences)
    return diagnoseProject(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function readBaseline() {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
}

function report(result, diagnostics, fences) {
  const fileOf = new Map(fences.map((fence) => [fence.key, fence.file]))
  for (const key of result.unbaselined) {
    process.stderr.write(`\n${key} does not compile:\n`)
    process.stderr.write(`${diagnostics.get(fileOf.get(key)).join('\n')}\n`)
  }
  for (const key of result.stale) {
    process.stderr.write(`\n${key} is in the baseline but compiles, changed or is gone.\n`)
  }
  if (!result.ok) {
    process.stderr.write(
      '\nFix the fence, mark a non-standalone snippet `tsx fragment`, or drop stale entries with ' +
        '`node scripts/check-doc-examples.mjs --update`.\n'
    )
  }
}

function printDiagnostics(fences, diagnostics) {
  for (const fence of fences.filter((candidate) => diagnostics.has(candidate.file))) {
    process.stdout.write(`\n${fence.key}:\n${diagnostics.get(fence.file).join('\n')}\n`)
  }
}

function main(argv) {
  const fences = collectFences(DOCS, (doc) => fs.readFileSync(path.join(REPO_ROOT, doc), 'utf8'))
  const diagnostics = compileFences(fences)
  if (diagnostics.has('')) {
    process.stderr.write(`check-doc-examples: project errors:\n${diagnostics.get('').join('\n')}\n`)
    process.exitCode = 1
    return
  }
  if (argv.includes('--verbose')) printDiagnostics(fences, diagnostics)
  const failing = fences.filter((fence) => diagnostics.has(fence.file)).map((fence) => fence.key)
  if (argv.includes('--update')) {
    const allowIncrease = argv.includes('--allow-increase')
    const next = updatedBaseline(failing, readBaseline(), { allowIncrease })
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
  }
  const result = compareToBaseline(failing, readBaseline())
  report(result, diagnostics, fences)
  const verdict = result.ok ? 'all baselined' : 'baseline mismatch'
  process.stdout.write(
    `check-doc-examples: ${fences.length} fences, ${failing.length} failing, ${verdict}\n`
  )
  if (!result.ok) process.exitCode = 1
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  main(process.argv.slice(2))
}
