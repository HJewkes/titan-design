/**
 * Type-checks the stories and tests against a per-file error baseline (TD-27 S6).
 *
 *   node scripts/check-examples-types.mjs [--update [--allow-increase]] [--verbose]
 *
 * `tsconfig.json` excludes `*.stories.tsx` and `*.test.ts(x)`, so `pnpm type-check` never sees
 * them. This compiles `tsconfig.examples.json` (all of src plus what it imports), counts the
 * errors per file and compares the counts with examples-types-baseline.json, which only shrinks.
 * The check fails on a file with errors and no entry, a count above its entry, a count below its
 * entry (lower the entry) and an entry for a file that no longer exists. A syntax error always
 * fails: the file's type errors cannot be counted until it parses.
 * `--update` lowers and drops entries; `--allow-increase` also raises and adds them.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG_PATH = path.join(PKG_ROOT, 'tsconfig.examples.json')
const BASELINE_PATH = path.join(PKG_ROOT, 'scripts/examples-types-baseline.json')

function sortedObject(entries) {
  return Object.fromEntries([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

/**
 * Error counts per file and the files that do not parse. A file with a syntax error is left out
 * of `counts`: its semantic errors are not computed, so its count would be meaningless.
 * Each diagnostic is `{ file, syntactic }`, `file` relative to packages/ui.
 */
export function groupDiagnostics(diagnostics) {
  const syntaxFiles = new Set(diagnostics.filter((d) => d.syntactic).map((d) => d.file))
  const counts = new Map()
  for (const { file } of diagnostics) {
    if (!syntaxFiles.has(file)) counts.set(file, (counts.get(file) ?? 0) + 1)
  }
  return { counts: sortedObject(counts), syntaxFiles: [...syntaxFiles].sort() }
}

/**
 * Compares error counts with the baseline. Files in `syntaxFiles` are skipped: they fail on
 * their own. `exists(file)` tells a fixed file (now 0 errors) from a deleted one.
 */
export function compareToBaseline(counts, baseline, { syntaxFiles = [], exists }) {
  const skip = new Set(syntaxFiles)
  const unbaselined = []
  const increased = []
  const decreased = []
  const missing = []
  for (const [file, count] of Object.entries(counts)) {
    if (skip.has(file)) continue
    const entry = baseline[file]
    if (entry === undefined) unbaselined.push({ file, count })
    else if (count > entry) increased.push({ file, count, baseline: entry })
  }
  for (const [file, entry] of Object.entries(baseline)) {
    if (skip.has(file)) continue
    const count = counts[file] ?? 0
    if (!exists(file)) missing.push(file)
    else if (count < entry) decreased.push({ file, count, baseline: entry })
  }
  const ok =
    syntaxFiles.length + unbaselined.length + increased.length + decreased.length === 0 &&
    missing.length === 0
  return { ok, unbaselined, increased, decreased, missing }
}

/**
 * The baseline `--update` writes: entries lowered to the current count, dropped at 0 or when the
 * file is gone. Raising an entry or adding a file needs `allowIncrease`.
 */
export function updatedBaseline(counts, baseline, { allowIncrease, syntaxFiles = [], exists }) {
  const skip = new Set(syntaxFiles)
  const next = new Map()
  for (const [file, entry] of Object.entries(baseline)) {
    if (!exists(file)) continue
    const count = skip.has(file) ? entry : (counts[file] ?? 0)
    const kept = count > entry && !allowIncrease ? entry : count
    if (kept > 0) next.set(file, kept)
  }
  if (allowIncrease) {
    for (const [file, count] of Object.entries(counts)) {
      if (!next.has(file) && !skip.has(file)) next.set(file, count)
    }
  }
  return sortedObject(next)
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  if (!diagnostic.file) return `TS${diagnostic.code}: ${message}`
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  const file = path.relative(PKG_ROOT, diagnostic.file.fileName)
  return `${file}:${line + 1}:${character + 1} TS${diagnostic.code}: ${message}`
}

function ownSourceFiles(program) {
  return program
    .getSourceFiles()
    .filter((source) => !path.relative(PKG_ROOT, source.fileName).startsWith('..'))
    .filter((source) => !source.fileName.includes('/node_modules/'))
}

/**
 * Diagnostics of every own file, as `tsc --noEmit -p tsconfig.examples.json` reports them, except
 * that a syntax error in one file does not hide the type errors of the others (the tsc CLI
 * reports only syntax errors when any file has one). Project-wide errors come back as `global`.
 */
function compileExamples() {
  const { config, error } = ts.readConfigFile(CONFIG_PATH, ts.sys.readFile)
  if (error) return { global: [formatDiagnostic(error)], diagnostics: [] }
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, PKG_ROOT, undefined, CONFIG_PATH)
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
  const global = [
    ...parsed.errors,
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ].map(formatDiagnostic)
  const diagnostics = []
  for (const source of ownSourceFiles(program)) {
    const syntactic = program.getSyntacticDiagnostics(source)
    const found = syntactic.length > 0 ? syntactic : program.getSemanticDiagnostics(source)
    const file = path.relative(PKG_ROOT, source.fileName)
    for (const diagnostic of found) {
      diagnostics.push({
        file,
        syntactic: syntactic.length > 0,
        text: formatDiagnostic(diagnostic),
      })
    }
  }
  return { global, diagnostics }
}

function readBaseline() {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
}

function printFileDiagnostics(diagnostics, file) {
  const lines = diagnostics
    .filter((d) => d.file === file)
    .map((d) => `  ${d.text.replaceAll('\n', '\n    ')}`)
  process.stderr.write(`${lines.join('\n')}\n`)
}

function report(result, diagnostics, syntaxFiles) {
  const write = (text) => process.stderr.write(text)
  for (const file of syntaxFiles) {
    write(`\n${file} has syntax errors; its type errors are not counted until it parses:\n`)
    printFileDiagnostics(diagnostics, file)
  }
  for (const { file, count } of result.unbaselined) {
    write(`\n${file} has ${count} type error(s) and no baseline entry:\n`)
    printFileDiagnostics(diagnostics, file)
  }
  for (const { file, count, baseline } of result.increased) {
    write(`\n${file} has ${count} type error(s), above its baseline of ${baseline}:\n`)
    printFileDiagnostics(diagnostics, file)
  }
  for (const { file, count, baseline } of result.decreased) {
    write(`\n${file} has ${count} type error(s), below its baseline of ${baseline}; lower it.\n`)
  }
  for (const file of result.missing) write(`\n${file} is in the baseline but no longer exists.\n`)
  if (!result.ok) {
    write(
      '\nFix the new errors. Lower or drop stale entries with ' +
        '`node scripts/check-examples-types.mjs --update`.\n'
    )
  }
}

function main(argv) {
  const { global, diagnostics } = compileExamples()
  if (global.length > 0) {
    process.stderr.write(`check-examples-types: project errors:\n${global.join('\n')}\n`)
    process.exitCode = 1
    return
  }
  if (argv.includes('--verbose')) {
    process.stdout.write(`${diagnostics.map((d) => d.text).join('\n')}\n`)
  }
  const { counts, syntaxFiles } = groupDiagnostics(diagnostics)
  const exists = (file) => fs.existsSync(path.join(PKG_ROOT, file))
  if (argv.includes('--update')) {
    const allowIncrease = argv.includes('--allow-increase')
    const next = updatedBaseline(counts, readBaseline(), { allowIncrease, syntaxFiles, exists })
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
  }
  const result = compareToBaseline(counts, readBaseline(), { syntaxFiles, exists })
  report(result, diagnostics, syntaxFiles)
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const files = Object.keys(counts).length
  const verdict = result.ok ? 'all baselined' : 'baseline mismatch'
  process.stdout.write(`check-examples-types: ${total} errors in ${files} files, ${verdict}\n`)
  if (!result.ok) process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2))
}
