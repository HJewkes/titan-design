/**
 * The decomposition detector behind `src/arch/decomposition.test.ts` (TD-28).
 *
 * It measures shipping code under `src/components`, `src/hooks` and `src/utils` with one
 * TypeScript program, so own props come from the type checker rather than from text.
 *
 *   file-lines       code lines of a file
 *   component-lines  code lines of a component: a PascalCase function that contains JSX
 *   props            props of a component's first parameter that are declared under `src/`
 *   complexity       ESLint's classic `complexity` rule, per function
 *   function-lines   code lines of a function, every function
 *
 * A code line holds at least one token. Blank, comment and JSDoc lines do not count.
 *
 * Keys never hold line numbers: a file is `<path relative to src>` and a function is
 * `<path>#<QualifiedName>`. QualifiedName chains the enclosing functions with `>`. An
 * anonymous callback is named by its callee or JSX attribute plus an ordinal per parent
 * (`SetBarChart>useMemo#2`), and a repeated name gets `~2`.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export const LIMITS = Object.freeze({
  'file-lines': 225,
  'component-lines': 116,
  props: 13,
  complexity: 15,
  'function-lines': 100,
})

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TREE_DIR = '__decomposition_tree__/src'

const SCOPE_ROOT = /^(components|hooks|utils)\//
const EXCLUDED_DIR = /(^|\/)(lab|arch|test|__tests__|__mocks__)\//
const NON_SHIPPING_FILE =
  /\.(test|test-d|spec|stories)\.|\.d\.ts$|fixture|(^|-)mock\.|story-kit\.|Kit\.tsx?$/i
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/
const WRAPPERS = new Set(['forwardRef', 'memo'])

/** The scope rule: a shipping `.ts`/`.tsx` path, relative to `src`, that the detector measures. */
export function isInScope(relPath) {
  if (!SCOPE_ROOT.test(relPath) || EXCLUDED_DIR.test(relPath)) return false
  if (!/\.tsx?$/.test(relPath)) return false
  return !NON_SHIPPING_FILE.test(relPath.slice(relPath.lastIndexOf('/') + 1))
}

function relativeTo(dir, file) {
  const rel = path.relative(dir, file).split(path.sep).join('/')
  return rel.startsWith('..') || path.isAbsolute(rel) ? null : rel
}

function readConfig(pkgRoot) {
  const configPath = path.join(pkgRoot, 'tsconfig.json')
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, pkgRoot)
  return { options: { ...parsed.options, noEmit: true }, fileNames: parsed.fileNames }
}

/** A program over the package's in-scope files, with `rootDir` at its `src`. */
export function programFor(pkgRoot = PKG_ROOT) {
  const { options, fileNames } = readConfig(pkgRoot)
  const srcDir = path.join(pkgRoot, 'src')
  const roots = fileNames.filter((file) => {
    const rel = relativeTo(srcDir, file)
    return rel !== null && isInScope(rel)
  })
  return ts.createProgram(roots, { ...options, rootDir: srcDir })
}

const sharedSourceFiles = new Map()

function ancestorsOf(file, root) {
  const dirs = []
  for (let dir = path.dirname(file); dir.length > root.length; dir = path.dirname(dir)) {
    dirs.push(dir)
  }
  return dirs
}

/** A program over an in-memory tree (`path relative to src` to source), resolving real packages. */
export function programFromTree(tree, pkgRoot = PKG_ROOT) {
  const srcDir = path.join(pkgRoot, TREE_DIR)
  const files = new Map(Object.entries(tree).map(([rel, text]) => [path.join(srcDir, rel), text]))
  const options = { ...readConfig(pkgRoot).options, rootDir: srcDir }
  const host = ts.createCompilerHost(options, true)
  const { fileExists, readFile, getSourceFile, directoryExists } = host
  const dirs = new Set([...files.keys()].flatMap((file) => ancestorsOf(file, pkgRoot)))
  host.fileExists = (file) => files.has(file) || fileExists(file)
  host.readFile = (file) => files.get(file) ?? readFile(file)
  host.directoryExists = (dir) => dirs.has(dir) || directoryExists(dir)
  host.getSourceFile = (file, language, ...rest) => {
    if (files.has(file)) return ts.createSourceFile(file, files.get(file), language, true)
    if (!sharedSourceFiles.has(file)) {
      sharedSourceFiles.set(file, getSourceFile(file, language, ...rest))
    }
    return sharedSourceFiles.get(file)
  }
  return ts.createProgram([...files.keys()], options, host)
}

/** Every in-scope file and function in the program, keyed and sorted, to its metrics. */
export function measure(program) {
  const srcDir = program.getCompilerOptions().rootDir
  const checker = program.getTypeChecker()
  const entries = {}
  for (const sourceFile of program.getSourceFiles()) {
    const rel = relativeTo(srcDir, sourceFile.fileName)
    if (rel === null || !isInScope(rel)) continue
    Object.assign(entries, measureFile(sourceFile, rel, { checker, srcDir }))
  }
  return sortEntries(entries)
}

/** Only the metrics above their limit, for only the entries that have one. */
export function overLimit(entries) {
  const over = {}
  for (const [key, metrics] of Object.entries(entries)) {
    const exceeded = Object.entries(metrics).filter(([metric, value]) => value > LIMITS[metric])
    if (exceeded.length > 0) over[key] = Object.fromEntries(exceeded)
  }
  return over
}

function sortEntries(entries) {
  const sortedMetrics = (metrics) => Object.fromEntries(Object.entries(metrics).sort())
  return Object.fromEntries(
    Object.keys(entries)
      .sort()
      .map((key) => [key, sortedMetrics(entries[key])])
  )
}

function measureFile(sourceFile, rel, context) {
  const lines = codeLineIndex(sourceFile)
  const entries = { [rel]: { 'file-lines': lines.total } }
  for (const fn of collectFunctions(sourceFile)) {
    entries[`${rel}#${fn.name}`] = measureFunction(fn, sourceFile, lines, context)
  }
  return entries
}

function measureFunction(fn, sourceFile, lines, { checker, srcDir }) {
  const lineOf = (pos) => sourceFile.getLineAndCharacterOfPosition(pos).line
  const codeLines = lines.between(lineOf(fn.node.getStart(sourceFile)), lineOf(fn.node.getEnd()))
  const metrics = { complexity: complexityOf(fn.node), 'function-lines': codeLines }
  if (PASCAL_CASE.test(fn.ownName ?? '') && containsJsx(fn.node)) {
    metrics['component-lines'] = codeLines
    metrics.props = ownProps(fn.node, checker, srcDir)
  }
  return metrics
}

// ---------------------------------------------------------------------------
// Code lines

function codeLineIndex(sourceFile) {
  const marked = markCodeLines(sourceFile)
  const prefix = new Uint32Array(marked.length + 1)
  marked.forEach((isCode, line) => (prefix[line + 1] = prefix[line] + isCode))
  return {
    total: prefix[marked.length],
    between: (first, last) => prefix[last + 1] - prefix[first],
  }
}

/** One flag per line, set where a token sits; `getChildren` scans the tokens between nodes. */
function markCodeLines(sourceFile) {
  const marked = new Uint8Array(sourceFile.getLineStarts().length)
  const visit = (node) => {
    if (ts.isJSDoc(node) || isJsxComment(node)) return
    if (node.kind === ts.SyntaxKind.JsxText) return markJsxText(node, sourceFile, marked)
    const children = node.getChildren(sourceFile)
    if (children.length > 0) return children.forEach(visit)
    markSpan(sourceFile, node.getStart(sourceFile), node.getEnd(), marked)
  }
  visit(sourceFile)
  return marked
}

function isJsxComment(node) {
  return ts.isJsxExpression(node) && node.expression === undefined
}

function markSpan(sourceFile, start, end, marked) {
  if (end <= start) return
  const first = sourceFile.getLineAndCharacterOfPosition(start).line
  const last = sourceFile.getLineAndCharacterOfPosition(end - 1).line
  marked.fill(1, first, last + 1)
}

function markJsxText(node, sourceFile, marked) {
  let offset = node.getStart(sourceFile)
  for (const part of node.getText(sourceFile).split('\n')) {
    if (part.trim() !== '') marked[sourceFile.getLineAndCharacterOfPosition(offset).line] = 1
    offset += part.length + 1
  }
}

// ---------------------------------------------------------------------------
// Functions and their keys

const FUNCTION_KINDS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
  ts.SyntaxKind.Constructor,
])

const isFunction = (node) => FUNCTION_KINDS.has(node.kind) && node.body !== undefined

function collectFunctions(sourceFile) {
  const found = []
  const taken = new Map()
  const visit = (node, parent) => {
    let scope = parent
    if (isFunction(node)) {
      scope = childScope(parent, segmentOf(node), taken)
      found.push({ node, name: scope.name, ownName: declaredName(node) })
    } else if (ts.isClassDeclaration(node) && node.name) {
      scope = childScope(parent, { base: node.name.text }, taken)
    }
    ts.forEachChild(node, (child) => visit(child, scope))
  }
  visit(sourceFile, { name: null, ordinals: new Map() })
  return found
}

function childScope(parent, { base, anonymous = false }, taken) {
  let segment = base
  if (anonymous) {
    const ordinal = (parent.ordinals.get(base) ?? 0) + 1
    parent.ordinals.set(base, ordinal)
    segment = `${base}#${ordinal}`
  }
  const qualified = parent.name === null ? segment : `${parent.name}>${segment}`
  const seen = (taken.get(qualified) ?? 0) + 1
  taken.set(qualified, seen)
  const name = seen === 1 ? qualified : `${qualified}~${seen}`
  return { name, ordinals: new Map() }
}

function segmentOf(node) {
  const name = declaredName(node)
  return name === null ? { base: anonymousBase(node), anonymous: true } : { base: name }
}

const TRANSPARENT_PARENTS = new Set([
  ts.SyntaxKind.ParenthesizedExpression,
  ts.SyntaxKind.AsExpression,
  ts.SyntaxKind.SatisfiesExpression,
  ts.SyntaxKind.NonNullExpression,
  ts.SyntaxKind.TypeAssertionExpression,
])

/** The node that names a function: its holder after parentheses, casts and forwardRef/memo. */
function holderOf(node) {
  let current = node
  for (;;) {
    const parent = current.parent
    const isWrapperCall = ts.isCallExpression(parent) && WRAPPERS.has(calleeName(parent))
    if (!TRANSPARENT_PARENTS.has(parent.kind) && !isWrapperCall) return parent
    current = parent
  }
}

function declaredName(node) {
  if (ts.isConstructorDeclaration(node)) return 'constructor'
  if (node.name) return propertyNameText(node.name)
  const holder = holderOf(node)
  if (ts.isExportAssignment(holder)) return 'default'
  const named =
    ts.isVariableDeclaration(holder) ||
    ts.isPropertyAssignment(holder) ||
    ts.isPropertyDeclaration(holder)
  return named ? propertyNameText(holder.name) : null
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return null
}

function calleeName(call) {
  const callee = call.expression
  if (ts.isIdentifier(callee)) return callee.text
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text
  return 'call'
}

function anonymousBase(node) {
  const holder = holderOf(node)
  if (ts.isCallExpression(holder) || ts.isNewExpression(holder)) return calleeName(holder)
  if (ts.isJsxExpression(holder) && ts.isJsxAttribute(holder.parent)) {
    return holder.parent.name.getText()
  }
  return 'anonymous'
}

// ---------------------------------------------------------------------------
// Complexity: ESLint's classic `complexity` rule

const BRANCH_KINDS = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.CatchClause,
  ts.SyntaxKind.CaseClause,
])

const SHORT_CIRCUIT_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
])

/** ESLint starts a new code path at a function, a class field initializer and a static block. */
function startsCodePath(node) {
  return (
    FUNCTION_KINDS.has(node.kind) ||
    ts.isPropertyDeclaration(node) ||
    ts.isClassStaticBlockDeclaration(node)
  )
}

function increment(node) {
  if (BRANCH_KINDS.has(node.kind)) return 1
  if (ts.isBinaryExpression(node))
    return SHORT_CIRCUIT_OPERATORS.has(node.operatorToken.kind) ? 1 : 0
  if (node.questionDotToken !== undefined) return 1
  if (ts.isParameter(node) || ts.isBindingElement(node)) return node.initializer ? 1 : 0
  if (ts.isShorthandPropertyAssignment(node)) return node.objectAssignmentInitializer ? 1 : 0
  return 0
}

function complexityOf(fn) {
  let complexity = 1
  const visit = (node) => {
    if (startsCodePath(node) || ts.isTypeNode(node)) return
    complexity += increment(node)
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(fn, visit)
  return complexity
}

// ---------------------------------------------------------------------------
// Components and own props

function containsJsx(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return true
  }
  return ts.forEachChild(node, containsJsx) === true
}

/** Props of the first parameter's type that have a declaration under `src`. */
function ownProps(fn, checker, srcDir) {
  const param = fn.parameters[0]
  if (param === undefined) return 0
  const type = checker.getTypeAtLocation(param)
  const names = new Set()
  for (const member of type.isUnion() ? type.types : [type]) {
    for (const prop of checker.getPropertiesOfType(member)) {
      const declarations = prop.declarations ?? []
      if (declarations.some((d) => relativeTo(srcDir, d.getSourceFile().fileName) !== null)) {
        names.add(prop.name)
      }
    }
  }
  return names.size
}
