// Fails when a split changes any string literal (so any Tailwind class string) across a file set.
// Usage: node scripts/compare-classnames.mjs <base-ref> <file-or-dir>...
// By design, a string that moves between components inside the file set still passes: the
// comparison is one multiset over the whole set, not per file or per component.
// By design, *.test.tsx, *.stories.tsx and *.d.ts files are skipped, so their strings are not compared.
// Exit 1 means the strings differ; exit 2 means the run could not compare (usage, a path that
// matches no file on either side, a base ref that does not resolve, or a syntax error).
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

import { isEntryPoint } from './lib/entry.mjs'

const SOURCE = /\.tsx?$/
const SKIPPED = /\.(test|stories|characterise\.test)\.tsx?$|\.d\.ts$/

export class CompareError extends Error {}

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
  const [diagnostic] = file.parseDiagnostics
  if (diagnostic) {
    const { line } = file.getLineAndCharacterOfPosition(diagnostic.start ?? 0)
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
    throw new CompareError(`syntax error in ${fileName}:${line + 1}: ${message}`)
  }
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

function workingTreeFiles(paths, cwd) {
  return paths.map((p) => walk(join(cwd, p)))
}

function workingTreeLiterals(fileLists) {
  const files = fileLists.flat().filter(isTracked)
  return files.flatMap((f) => collectLiterals(readFileSync(f, 'utf8'), f))
}

function makeGit(cwd) {
  return (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 << 20, stdio: 'pipe' })
}

function assertRefResolves(ref, git) {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`)
  } catch {
    throw new CompareError(`base ref ${JSON.stringify(ref)} does not resolve to a commit`)
  }
}

function baseFiles(ref, paths, git) {
  return paths.map((p) =>
    git('ls-tree', '-r', '--name-only', ref, '--', p).split('\n').filter(Boolean)
  )
}

function baseLiterals(ref, fileLists, git) {
  const files = fileLists.flat().filter(isTracked)
  return files.flatMap((f) => collectLiterals(git('show', `${ref}:./${f}`), f))
}

export function compare(ref, paths, cwd = process.cwd()) {
  const git = makeGit(cwd)
  assertRefResolves(ref, git)
  const current = workingTreeFiles(paths, cwd)
  const base = baseFiles(ref, paths, git)
  paths.forEach((p, i) => {
    if (current[i].length === 0 && base[i].length === 0) {
      throw new CompareError(
        `no file matches ${JSON.stringify(p)} in the working tree or at ${ref}`
      )
    }
  })
  return diffLiterals(baseLiterals(ref, base, git), workingTreeLiterals(current))
}

export function formatChanges(changes) {
  return changes
    .map(({ text, before, after }) => `  ${before} -> ${after}  ${JSON.stringify(text)}`)
    .join('\n')
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  const [ref, ...paths] = process.argv.slice(2)
  if (!ref || paths.length === 0) {
    console.error('Usage: node scripts/compare-classnames.mjs <base-ref> <file-or-dir>...')
    process.exit(2)
  }
  let changes
  try {
    changes = compare(ref, paths)
  } catch (error) {
    if (!(error instanceof CompareError)) throw error
    console.error(`compare-classnames: ${error.message}`)
    process.exit(2)
  }
  if (changes.length > 0) {
    console.error(
      `className strings differ from ${ref} (count before -> after):\n${formatChanges(changes)}`
    )
    process.exit(1)
  }
  console.log(`className strings match ${ref}.`)
}
