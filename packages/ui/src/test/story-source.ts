import ts from 'typescript'

/**
 * Syntax-tree reads of component and story sources for the stable-layers detector. Comments and
 * string contents are trivia or literals here, so a name mentioned only in prose never counts.
 */

const cache = new Map<string, ts.SourceFile>()

export function parse(source: string): ts.SourceFile {
  let file = cache.get(source)
  if (!file) {
    file = ts.createSourceFile(
      'source.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    )
    cache.set(source, file)
  }
  return file
}

/** Thrown when the story meta's `parameters.layers` is not a plain literal the detector can read. */
export class UnreadableMeta extends Error {}

function unwrap(node: ts.Expression): ts.Expression {
  let inner = node
  while (
    ts.isSatisfiesExpression(inner) ||
    ts.isAsExpression(inner) ||
    ts.isParenthesizedExpression(inner)
  ) {
    inner = inner.expression
  }
  return inner
}

function isExported(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false
  return (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
}

export function usesAnyName(file: ts.SourceFile, names: string[]): boolean {
  let found = false
  const visit = (node: ts.Node): void => {
    if (found) return
    if (ts.isIdentifier(node) && names.includes(node.text)) found = true
    else ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

const isGenericFunction = (node: ts.Expression | undefined) =>
  !!node &&
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  !!node.typeParameters?.length

/** An exported (or default-exported) function, or exported const function, with type parameters. */
export function hasGenericExport(file: ts.SourceFile): boolean {
  return file.statements.some((statement) => {
    if (!isExported(statement)) return false
    if (ts.isFunctionDeclaration(statement)) return !!statement.typeParameters?.length
    if (!ts.isVariableStatement(statement)) return false
    return statement.declarationList.declarations.some((declaration) =>
      isGenericFunction(declaration.initializer && unwrap(declaration.initializer))
    )
  })
}

export function hasPlayFunction(file: ts.SourceFile): boolean {
  let found = false
  const visit = (node: ts.Node): void => {
    if (found) return
    const named = ts.isPropertyAssignment(node) || ts.isMethodDeclaration(node)
    if (named && propertyName(node) === 'play') found = true
    else ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

function propertyName(node: ts.ObjectLiteralElementLike): string | undefined {
  const name = node.name
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text
  return undefined
}

function variableInitializer(file: ts.SourceFile, name: string): ts.Expression | undefined {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        return declaration.initializer && unwrap(declaration.initializer)
      }
    }
  }
  return undefined
}

function metaObject(file: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
  const exported = file.statements.find(
    (statement): statement is ts.ExportAssignment =>
      ts.isExportAssignment(statement) && !statement.isExportEquals
  )
  if (!exported) return undefined
  const expression = unwrap(exported.expression)
  const meta = ts.isIdentifier(expression) ? variableInitializer(file, expression.text) : expression
  return meta && ts.isObjectLiteralExpression(meta) ? meta : undefined
}

/** The value of `name` in `object`; throws when a spread or computed key could hide it. */
function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  let value: ts.Expression | undefined
  for (const element of object.properties) {
    if (ts.isSpreadAssignment(element)) throw new UnreadableMeta(`a spread where ${name} may live`)
    const key = propertyName(element)
    if (key === undefined) throw new UnreadableMeta(`a computed key where ${name} may live`)
    if (key !== name) continue
    if (!ts.isPropertyAssignment(element)) throw new UnreadableMeta(`${name} is not key: value`)
    value = unwrap(element.initializer)
  }
  return value
}

function objectProperty(
  object: ts.ObjectLiteralExpression,
  name: string
): ts.ObjectLiteralExpression | undefined {
  const value = property(object, name)
  if (value === undefined) return undefined
  if (!ts.isObjectLiteralExpression(value)) {
    throw new UnreadableMeta(`${name} is not an object literal`)
  }
  return value
}

function declaration(element: ts.ObjectLiteralElementLike): [string, string] {
  const key = propertyName(element)
  const value = ts.isPropertyAssignment(element) ? unwrap(element.initializer) : undefined
  if (key === undefined || !value || !ts.isStringLiteralLike(value)) {
    throw new UnreadableMeta(`entry '${element.getText()}' is not layer: '<string>'`)
  }
  return [key, value.text]
}

/** Every `[layer, value]` entry of the default-exported meta's `parameters.layers`. */
export function readMetaLayers(file: ts.SourceFile): [string, string][] {
  const meta = metaObject(file)
  if (!meta) throw new UnreadableMeta('no default-exported meta object literal')
  const parameters = objectProperty(meta, 'parameters')
  const layers = parameters && objectProperty(parameters, 'layers')
  return layers ? layers.properties.map(declaration) : []
}

/** The string tags of the default-exported meta, or none when it cannot be read. */
export function metaTags(file: ts.SourceFile): string[] {
  const meta = metaObject(file)
  const tags = meta && meta.properties.find((element) => propertyName(element) === 'tags')
  if (!tags || !ts.isPropertyAssignment(tags)) return []
  const list = unwrap(tags.initializer)
  if (!ts.isArrayLiteralExpression(list)) return []
  return list.elements.filter(ts.isStringLiteralLike).map((element) => element.text)
}
