/**
 * Shared @deprecated export registry for no-deprecated-import (VW-318) and its
 * baseline regenerator.
 *
 * Tried `eslint-plugin-deprecation` first: it isn't installed, and using it
 * would mean adding type-aware parsing (`parserOptions.project`) to the whole
 * flat config, a much bigger footprint than every other titan/* rule in this
 * package, none of which need type info. So this reads @deprecated the same
 * way those rules read everything else: parse each file once with
 * `@typescript-eslint/typescript-estree` (no type checker) and look at the
 * comment immediately above each exported declaration or re-export.
 *
 * Re-export chains are resolved, not just direct declarations, in BOTH
 * directions:
 *   - `StatusDot`'s tag lives only on the `custom/Workout` barrel's re-export
 *     line (that module was mid-edit under E1 when it was deprecated — see
 *     DEPRECATIONS.md), not on `StatusDot.tsx` itself, and every real
 *     consumer imports the module file directly.
 *   - `Tile`'s tag lives only on `Tile.tsx` itself, and every real consumer
 *     imports it through the untagged `ui/tile` barrel.
 * Both need the SAME graph: every same-name passthrough re-export
 * (`export { X } from './x'`) unifies `(thisFile, X)` and `(x, X)` into one
 * identity, and the whole identity is deprecated if ANY node in it carries
 * the tag. A RENAME (`export { IconProps as WorkoutIconProps }`) does NOT
 * unify — it deprecates the alias in favour of the source's own name, the
 * opposite relationship, so `IconProps` itself must stay clean.
 */

const fs = require('node:fs')
const path = require('node:path')
const { parse } = require('@typescript-eslint/typescript-estree')

const SCAN_ROOTS = ['theme', 'components']
const SKIP_FILE = /\.(test|stories)\.tsx?$/

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
}

/**
 * Whether `node` is immediately preceded by a block comment containing
 * `@deprecated`, with nothing but whitespace between them — the same "is this
 * its JSDoc" test an editor's hover tooltip uses.
 */
function hasLeadingDeprecated(sourceText, comments, node) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i]
    if (comment.range[1] > node.range[0]) continue
    const between = sourceText.slice(comment.range[1], node.range[0])
    if (!/^\s*$/.test(between)) return false
    return comment.type === 'Block' && /@deprecated/.test(comment.value)
  }
  return false
}

const RESOLVE_EXTENSIONS = ['.tsx', '.ts']

/**
 * Resolve a relative or `@/`-alias import specifier to a `src`-relative,
 * POSIX path — of the real file on disk, extension and `/index` included, so
 * it matches the path a registry entry built from a directory walk uses.
 * Specifiers never carry an extension (`from './BaseBadge'`), and a barrel
 * import (`from '../../ui/tile'`) resolves to a directory, not a file, so
 * both need probing the way Node/TS module resolution does.
 */
function resolveModule(specifierValue, fromFile, srcRoot) {
  let absolute
  if (specifierValue.startsWith('.')) {
    absolute = path.resolve(path.dirname(fromFile), specifierValue)
  } else if (specifierValue.startsWith('@/')) {
    absolute = path.join(srcRoot, specifierValue.slice(2))
  } else {
    return null
  }

  const candidates = [
    absolute,
    ...RESOLVE_EXTENSIONS.map((ext) => absolute + ext),
    ...RESOLVE_EXTENSIONS.map((ext) => path.join(absolute, `index${ext}`)),
  ]
  const resolved = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? absolute

  return path.relative(srcRoot, resolved).split(path.sep).join('/')
}

function declaredNames(declaration) {
  switch (declaration.type) {
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
      return declaration.id ? [declaration.id.name] : []
    case 'VariableDeclaration':
      return declaration.declarations
        .filter((d) => d.id.type === 'Identifier')
        .map((d) => d.id.name)
    default:
      return []
  }
}

function addEdge(edges, a, b) {
  if (!edges.has(a)) edges.set(a, new Set())
  if (!edges.has(b)) edges.set(b, new Set())
  edges.get(a).add(b)
  edges.get(b).add(a)
}

function buildRegistry(srcRoot) {
  const files = []
  for (const root of SCAN_ROOTS) {
    const dir = path.join(srcRoot, root)
    if (fs.existsSync(dir)) walk(dir, files)
  }

  const tagged = new Set() // `${srcRelativeFile}::${name}` directly carries @deprecated
  const edges = new Map() // same-name-forwarding identity graph, both directions

  for (const absFile of files) {
    const rel = path.relative(srcRoot, absFile).split(path.sep).join('/')
    if (SKIP_FILE.test(rel)) continue

    const source = fs.readFileSync(absFile, 'utf8')
    let ast
    try {
      ast = parse(source, { loc: true, range: true, comment: true, jsx: absFile.endsWith('x') })
    } catch {
      continue // unparseable file contributes no registry entries
    }
    const comments = ast.comments ?? []

    for (const node of ast.body) {
      if (node.type !== 'ExportNamedDeclaration') continue
      const deprecated = hasLeadingDeprecated(source, comments, node)

      if (node.declaration) {
        if (deprecated) {
          for (const name of declaredNames(node.declaration)) tagged.add(`${rel}::${name}`)
        }
        continue
      }
      // Re-export edges are recorded regardless of whether THIS statement is
      // tagged — an untagged barrel forwarding a tagged export (Tile via
      // ui/tile's index.ts) still needs to reach it.
      for (const specifier of node.specifiers ?? []) {
        const reExportKey = `${rel}::${specifier.exported.name}`
        if (deprecated) tagged.add(reExportKey)
        if (node.source && specifier.local.name === specifier.exported.name) {
          const target = resolveModule(node.source.value, absFile, srcRoot)
          if (target) addEdge(edges, reExportKey, `${target}::${specifier.local.name}`)
        }
      }
    }
  }
  return { tagged, edges }
}

/** BFS over the identity graph: deprecated if any connected node carries the tag. */
function isDeprecated({ tagged, edges }, file, name) {
  const start = `${file}::${name}`
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    const key = stack.pop()
    if (tagged.has(key)) return true
    for (const neighbor of edges.get(key) ?? []) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor)
        stack.push(neighbor)
      }
    }
  }
  return false
}

const cache = new Map()
function registryFor(srcRoot) {
  if (!cache.has(srcRoot)) cache.set(srcRoot, buildRegistry(srcRoot))
  return { isDeprecated: (file, name) => isDeprecated(cache.get(srcRoot), file, name) }
}

module.exports = { registryFor, resolveModule, hasLeadingDeprecated }
