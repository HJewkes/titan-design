// Fails when a split changes any string literal (so any Tailwind class string) across a file set.
// Usage: node scripts/compare-classnames.mjs <base-ref> <file-or-dir>...
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const SOURCE = /\.tsx?$/
const SKIPPED = /\.(test|stories|characterise\.test)\.tsx?$|\.d\.ts$/

const normalise = (text) => text.trim().replace(/\s+/g, ' ')

function isModuleSpecifier(node) {
  const parent = node.parent
  return (
    (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
    parent.moduleSpecifier === node
  )
}

// Collects string literals and the static parts of template literals, ignoring imports and types.
export function collectLiterals(source, fileName = 'file.tsx') {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const found = []
  const visit = (node) => {
    if (ts.isLiteralTypeNode(node) || ts.isImportTypeNode(node)) return
    const isText =
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    if (isText && !isModuleSpecifier(node)) {
      const text = normalise(node.text)
      if (text) found.push(text)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

function tally(literals) {
  const counts = new Map()
  for (const text of literals) counts.set(text, (counts.get(text) ?? 0) + 1)
  return counts
}

// Returns literals whose count differs between base and current, across the whole file set.
export function diffLiterals(baseLiterals, currentLiterals) {
  const base = tally(baseLiterals)
  const current = tally(currentLiterals)
  const changes = []
  for (const text of new Set([...base.keys(), ...current.keys()])) {
    const before = base.get(text) ?? 0
    const after = current.get(text) ?? 0
    if (before !== after) changes.push({ text, before, after })
  }
  return changes.sort((a, b) => a.text.localeCompare(b.text))
}

function walk(path) {
  if (!existsSync(path)) return []
  if (statSync(path).isFile()) return [path]
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)))
}

const isTracked = (path) => SOURCE.test(path) && !SKIPPED.test(path)

function workingTreeLiterals(paths, cwd) {
  const files = paths.flatMap((p) => walk(join(cwd, p))).filter(isTracked)
  return files.flatMap((f) => collectLiterals(readFileSync(f, 'utf8'), f))
}

function baseLiterals(ref, paths, cwd) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 << 20 })
  const files = paths
    .flatMap((p) => git('ls-tree', '-r', '--name-only', ref, '--', p).split('\n'))
    .filter((f) => f && isTracked(f))
  return files.flatMap((f) => collectLiterals(git('show', `${ref}:./${f}`), f))
}

export function compare(ref, paths, cwd = process.cwd()) {
  return diffLiterals(baseLiterals(ref, paths, cwd), workingTreeLiterals(paths, cwd))
}

export function formatChanges(changes) {
  return changes
    .map(({ text, before, after }) => `  ${before} -> ${after}  ${JSON.stringify(text)}`)
    .join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [ref, ...paths] = process.argv.slice(2)
  if (!ref || paths.length === 0) {
    console.error('Usage: node scripts/compare-classnames.mjs <base-ref> <file-or-dir>...')
    process.exit(2)
  }
  const changes = compare(ref, paths)
  if (changes.length > 0) {
    console.error(
      `className strings differ from ${ref} (count before -> after):\n${formatChanges(changes)}`
    )
    process.exit(1)
  }
  console.log(`className strings match ${ref}.`)
}
