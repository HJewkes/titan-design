import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const PROSE_DIR = path.dirname(fileURLToPath(import.meta.url))

/**
 * Shrink-only. A regular expression on untrusted text is how every earlier review found a
 * quadratic scan, so the parse modules hold none. An entry is a file, or `file#name` for one
 * top-level declaration. The one left composes the consumer's linker patterns, which
 * `ProseLinker` requires to run in linear time.
 */
const REGEX_ALLOWLIST = ['proseInline.tsx#inlineContext']

/** Modules whose reads the counting tests see; any other string method would read unseen. */
const SCANNER_MODULES = ['proseSource.ts', 'proseLines.ts', 'proseInlineScan.ts']

const UNCOUNTED_METHOD =
  /^(indexOf|lastIndexOf|includes|startsWith|endsWith|trim\w*|split|search|match\w*|replace\w*)$/

const isParseModule = (file: string) =>
  /\.tsx?$/.test(file) && !/\.(test|stories)\.tsx?$/.test(file) && !file.includes('__fixtures__')

function parseModules(): string[] {
  return readdirSync(PROSE_DIR, { recursive: true, encoding: 'utf8' }).filter(isParseModule).sort()
}

function sourceOf(file: string): ts.SourceFile {
  const text = readFileSync(path.join(PROSE_DIR, file), 'utf8')
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function visit(node: ts.Node, found: (node: ts.Node) => void) {
  found(node)
  ts.forEachChild(node, (child) => visit(child, found))
}

/** The name of the top-level declaration holding `node`. */
function declarationName(node: ts.Node): string {
  let top = node
  while (top.parent && !ts.isSourceFile(top.parent)) top = top.parent
  if (ts.isFunctionDeclaration(top)) return top.name?.text ?? '(anonymous)'
  if (ts.isVariableStatement(top)) return top.declarationList.declarations[0]!.name.getText()
  return '(top level)'
}

function isRegex(node: ts.Node): boolean {
  if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) return true
  if (!ts.isNewExpression(node) && !ts.isCallExpression(node)) return false
  return ts.isIdentifier(node.expression) && node.expression.text === 'RegExp'
}

function regexSites(file: string): string[] {
  const sites: string[] = []
  visit(sourceOf(file), (node) => {
    if (isRegex(node)) sites.push(`${file}#${declarationName(node)}`)
  })
  return sites
}

function uncountedReads(file: string): string[] {
  const calls: string[] = []
  visit(sourceOf(file), (node) => {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return
    const method = node.expression.name.text
    if (UNCOUNTED_METHOD.test(method)) calls.push(`${file}#${declarationName(node)}: ${method}`)
  })
  return calls
}

const isAllowed = (site: string) =>
  REGEX_ALLOWLIST.some((entry) => site === entry || site.startsWith(`${entry}#`))

describe('prose parse modules', () => {
  it('no Prose parse module contains a regular expression', () => {
    const sites = parseModules().flatMap(regexSites)
    expect(sites.filter((site) => !isAllowed(site))).toEqual([])
    const stale = REGEX_ALLOWLIST.filter(
      (entry) => !sites.some((site) => site === entry || site.startsWith(`${entry}#`))
    )
    expect(stale, 'allowlist entries with no regex left: delete them').toEqual([])
  })

  it('scanner modules read input only through charCodeAt and slice', () => {
    expect(SCANNER_MODULES.flatMap(uncountedReads)).toEqual([])
  })
})
