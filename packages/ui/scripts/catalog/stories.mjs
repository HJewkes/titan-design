/**
 * Story-file reading for the component catalog: the `meta` a story file default-exports,
 * the story ids it declares, and the maturity status its tags resolve to.
 *
 * Parsing goes through the TypeScript compiler API, never regexes over source text.
 */
import { storyNameFromExport, toId } from 'storybook/internal/csf'
import ts from 'typescript'

const STATUS_PREFIX = 'status:'
const STATUS_ROW = /^\|\s*`status:([a-z]+)`\s*\|/gm

/** The status vocabulary: every `status:<name>` row of MATURITY.md's statuses table. */
export function maturityStatuses(maturityText) {
  return [...maturityText.matchAll(STATUS_ROW)].map((match) => match[1]).sort()
}

function parse(fileName, text) {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function unwrap(node) {
  let current = node
  while (
    current &&
    (ts.isSatisfiesExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }
  return current
}

function variableInitializers(sourceFile) {
  const initializers = new Map()
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const decl of statement.declarationList.declarations) {
      if (ts.isIdentifier(decl.name)) initializers.set(decl.name.text, unwrap(decl.initializer))
    }
  }
  return initializers
}

function defaultExportObject(sourceFile) {
  const initializers = variableInitializers(sourceFile)
  for (const statement of sourceFile.statements) {
    if (!ts.isExportAssignment(statement) || statement.isExportEquals) continue
    const value = unwrap(statement.expression)
    const resolved = ts.isIdentifier(value) ? initializers.get(value.text) : value
    return resolved && ts.isObjectLiteralExpression(resolved) ? resolved : null
  }
  return null
}

function property(objectLiteral, name) {
  const prop = objectLiteral?.properties.find(
    (p) => ts.isPropertyAssignment(p) && p.name && ts.isIdentifier(p.name) && p.name.text === name
  )
  return prop ? unwrap(prop.initializer) : undefined
}

function stringArray(node) {
  if (!node || !ts.isArrayLiteralExpression(node)) return []
  return node.elements.filter(ts.isStringLiteralLike).map((element) => element.text)
}

function hasExportModifier(statement) {
  return (ts.getModifiers(statement) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
}

function namedExports(sourceFile) {
  const names = []
  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) continue
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) names.push(decl.name.text)
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.push(statement.name.text)
    }
  }
  return names
}

/** The tags of the default-exported object literal in a `tags: [...]` config file. */
export function defaultExportTags(fileName, text) {
  return stringArray(property(defaultExportObject(parse(fileName, text)), 'tags'))
}

/** What the catalog needs from one story file: its meta component, tags and story ids. */
export function readStoryFile(fileName, text) {
  const sourceFile = parse(fileName, text)
  const meta = defaultExportObject(sourceFile)
  const title = property(meta, 'title')
  const component = property(meta, 'component')
  if (!title || !ts.isStringLiteralLike(title)) {
    throw new Error(`${fileName}: the default-exported meta has no string-literal title`)
  }
  return {
    component: component && ts.isIdentifier(component) ? component.text : null,
    tags: stringArray(property(meta, 'tags')),
    storyIds: namedExports(sourceFile).map((name) => toId(title.text, storyNameFromExport(name))),
  }
}

const statusesIn = (tags) =>
  tags.filter((tag) => tag.startsWith(STATUS_PREFIX)).map((tag) => tag.slice(STATUS_PREFIX.length))

/**
 * The statuses a story file declares. A status on the meta wins over the inherited project
 * default even without `!status:review`, which several story files omit. Otherwise it is
 * Storybook's combination: project tags, then meta tags, where `!tag` removes `tag`.
 */
export function resolveStatuses(projectTags, metaTags) {
  const declared = statusesIn(metaTags)
  if (declared.length > 0) return declared
  const tags = new Set()
  for (const tag of [...projectTags, ...metaTags]) {
    if (tag.startsWith('!')) tags.delete(tag.slice(1))
    else tags.add(tag)
  }
  return statusesIn([...tags])
}
