/**
 * Read string unions, exported function names and array literals out of
 * TypeScript source for the titan/* rules (TD-189).
 *
 * The rules are CommonJS and cannot `require` a `.ts` module, so a list that
 * lives in TS (`TypographyVariant`, `OnSurfaceRole`, `storySort.order`) is
 * parsed with `@typescript-eslint/typescript-estree`, the same no-type-checker
 * approach `deprecated-export-registry.js` takes. Each reader takes an optional
 * `source` so a test can feed fixture text instead of a file on disk.
 */

const fs = require('node:fs')
const { parse } = require('@typescript-eslint/typescript-estree')

function parseFile(file, source) {
  const text = source ?? fs.readFileSync(file, 'utf8')
  return parse(text, { jsx: file.endsWith('x'), range: true })
}

/** Top-level statements, with any `export` wrapper removed. */
function topLevelDeclarations(ast) {
  return ast.body.map((node) =>
    node.type === 'ExportNamedDeclaration' && node.declaration ? node.declaration : node
  )
}

function stringLiteralsOf(typeNode) {
  if (typeNode.type === 'TSUnionType') return typeNode.types.flatMap(stringLiteralsOf)
  if (typeNode.type === 'TSLiteralType' && typeof typeNode.literal.value === 'string') {
    return [typeNode.literal.value]
  }
  return []
}

/** The string members of `type <typeName> = 'a' | 'b'`, in source order. */
function readStringUnion(file, typeName, source) {
  const alias = topLevelDeclarations(parseFile(file, source)).find(
    (node) => node.type === 'TSTypeAliasDeclaration' && node.id.name === typeName
  )
  if (!alias) throw new Error(`ts-source: no type ${typeName} in ${file}`)
  return stringLiteralsOf(alias.typeAnnotation)
}

function isFunctionInit(declarator) {
  const init = declarator.init
  return Boolean(
    init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')
  )
}

/** Names of exported functions: `export function f` and `export const f = () => …`. */
function readExportedFunctions(file, source) {
  const names = []
  for (const node of parseFile(file, source).body) {
    const declaration = node.type === 'ExportNamedDeclaration' ? node.declaration : null
    if (declaration?.type === 'FunctionDeclaration' && declaration.id) {
      names.push(declaration.id.name)
    } else if (declaration?.type === 'VariableDeclaration') {
      for (const d of declaration.declarations) {
        if (d.id.type === 'Identifier' && isFunctionInit(d)) names.push(d.id.name)
      }
    }
  }
  return names
}

function propertyNamed(objectNode, name) {
  return objectNode.properties.find(
    (prop) =>
      prop.type === 'Property' &&
      ((prop.key.type === 'Identifier' && prop.key.name === name) ||
        (prop.key.type === 'Literal' && prop.key.value === name))
  )
}

/** Strip `as const`, `satisfies T` and `: T` wrappers down to the literal. */
function unwrap(node) {
  let current = node
  while (current && ['TSAsExpression', 'TSSatisfiesExpression'].includes(current.type)) {
    current = current.expression
  }
  return current
}

/** String and nested-array elements of an array literal; other elements are skipped. */
function arrayValue(node) {
  return node.elements.flatMap((element) => {
    const el = unwrap(element)
    if (el?.type === 'Literal' && typeof el.value === 'string') return [el.value]
    if (el?.type === 'ArrayExpression') return [arrayValue(el)]
    return []
  })
}

function variableInit(ast, name) {
  for (const node of topLevelDeclarations(ast)) {
    if (node.type !== 'VariableDeclaration') continue
    const declarator = node.declarations.find(
      (d) => d.id.type === 'Identifier' && d.id.name === name
    )
    if (declarator) return unwrap(declarator.init)
  }
  return null
}

/** The array literal at `variable.prop.prop`, for example `preview.parameters.options.storySort.order`. */
function readArrayAt(file, dottedPath, source) {
  const [variable, ...props] = dottedPath.split('.')
  let node = variableInit(parseFile(file, source), variable)
  for (const prop of props) {
    const property = node?.type === 'ObjectExpression' ? propertyNamed(node, prop) : null
    node = property ? unwrap(property.value) : null
  }
  if (node?.type !== 'ArrayExpression') {
    throw new Error(`ts-source: no array literal at ${dottedPath} in ${file}`)
  }
  return arrayValue(node)
}

module.exports = { readStringUnion, readExportedFunctions, readArrayAt }
