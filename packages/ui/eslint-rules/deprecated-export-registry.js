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
 *
 * `export * from './x'` (VW-322) is followed ONE way: `(barrel, X)` leads to
 * `(x, X)` for every name, so `import { Tile } from '@/components/ui'` reaches
 * Tile.tsx's tag through `ui/index.ts` -> `ui/tile` -> `Tile.tsx`. It is not an
 * identity edge, because a star line names nothing a tag could sit on. As in
 * ES, a name the barrel exports itself (declared or `export { X }`) shadows its
 * star re-exports, and `default` is never star-forwarded. The walk keeps a
 * seen-set, so an `export *` cycle terminates.
 *
 * Known limits:
 *   - `export * as ns from './x'` is out of scope: `ns` counts as an explicit
 *     export, and `ns.Tile` member access is never checked.
 *   - Two star sources exporting the same name is an ambiguity ES drops; here
 *     the name is deprecated if either source's copy is.
 *   - Only `src/theme` and `src/components` are scanned, so `src/index.ts`,
 *     `hooks/` and `utils/` barrels are not followed, and bare package
 *     specifiers (`@titan-design/react-ui`) are not resolved.
 *   - A tag directly on an `export *` line is ignored.
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
 * The first sentence after `@deprecated` in a JSDoc body, with the `*` gutter
 * and line breaks collapsed: `Use \`Indicator\` (roadmap decision 10) — …`.
 * A bare tag gives ''. A sentence ends at a `.` followed by whitespace, so
 * `0.23.0` stays whole.
 */
function firstSentenceOf(commentValue) {
  const text = commentValue
    .split('@deprecated')[1]
    .split(/\n\s*\*?\s*@\w/)[0]
    .replace(/\n\s*\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /^.*?\.(?=\s|$)/.exec(text)?.[0] ?? text
}

/**
 * The deprecation sentence when `node` is immediately preceded by a block
 * comment containing `@deprecated`, with nothing but whitespace between them
 * (the same "is this its JSDoc" test an editor's hover tooltip uses); null
 * otherwise.
 */
function leadingDeprecation(sourceText, comments, node) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i]
    if (comment.range[1] > node.range[0]) continue
    const between = sourceText.slice(comment.range[1], node.range[0])
    if (!/^\s*$/.test(between)) return null
    const tagged = comment.type === 'Block' && /@deprecated/.test(comment.value)
    return tagged ? firstSentenceOf(comment.value) : null
  }
  return null
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

function addTo(map, key, value) {
  if (!map.has(key)) map.set(key, new Set())
  map.get(key).add(value)
}

function indexNamedExport(registry, source, comments, node, file) {
  const { tagged, edges, explicit } = registry
  const deprecation = leadingDeprecation(source, comments, node)
  if (node.declaration) {
    for (const name of declaredNames(node.declaration)) {
      addTo(explicit, file.rel, name)
      if (deprecation !== null) tagged.set(`${file.rel}::${name}`, deprecation)
    }
    return
  }
  // Re-export edges are recorded regardless of whether THIS statement is
  // tagged — an untagged barrel forwarding a tagged export (Tile via
  // ui/tile's index.ts) still needs to reach it.
  for (const specifier of node.specifiers ?? []) {
    const reExportKey = `${file.rel}::${specifier.exported.name}`
    addTo(explicit, file.rel, specifier.exported.name)
    if (deprecation !== null) tagged.set(reExportKey, deprecation)
    if (node.source && specifier.local.name === specifier.exported.name) {
      const target = resolveModule(node.source.value, file.abs, file.srcRoot)
      if (target) addEdge(edges, reExportKey, `${target}::${specifier.local.name}`)
    }
  }
}

function indexFile(registry, file) {
  const source = fs.readFileSync(file.abs, 'utf8')
  let ast
  try {
    ast = parse(source, { loc: true, range: true, comment: true, jsx: file.abs.endsWith('x') })
  } catch {
    return // unparseable file contributes no registry entries
  }
  for (const node of ast.body) {
    if (node.type === 'ExportNamedDeclaration') {
      indexNamedExport(registry, source, ast.comments ?? [], node, file)
    } else if (node.type === 'ExportDefaultDeclaration') {
      addTo(registry.explicit, file.rel, 'default')
    } else if (node.type === 'ExportAllDeclaration' && node.exported) {
      addTo(registry.explicit, file.rel, node.exported.name) // `export * as ns` is out of scope
    } else if (node.type === 'ExportAllDeclaration') {
      const target = resolveModule(node.source.value, file.abs, file.srcRoot)
      if (target) addTo(registry.stars, file.rel, target)
    }
  }
}

function buildRegistry(srcRoot) {
  const files = []
  for (const root of SCAN_ROOTS) {
    const dir = path.join(srcRoot, root)
    if (fs.existsSync(dir)) walk(dir, files)
  }

  const registry = {
    tagged: new Map(), // `${srcRelativeFile}::${name}` directly carries @deprecated -> its first sentence
    edges: new Map(), // same-name-forwarding identity graph, both directions
    explicit: new Map(), // file -> names it exports itself, which shadow its `export *`
    stars: new Map(), // file -> files it `export * from`, followed one way only
  }
  for (const abs of files) {
    const rel = path.relative(srcRoot, abs).split(path.sep).join('/')
    if (!SKIP_FILE.test(rel)) indexFile(registry, { abs, rel, srcRoot })
  }
  return registry
}

/** Where `file::name` leads: its identity edges, plus its `export *` sources unless it exports `name` itself. */
function neighborsOf({ edges, explicit, stars }, key) {
  const neighbors = [...(edges.get(key) ?? [])]
  const sep = key.lastIndexOf('::')
  const file = key.slice(0, sep)
  const name = key.slice(sep + 2)
  if (name !== 'default' && !explicit.get(file)?.has(name)) {
    for (const target of stars.get(file) ?? []) neighbors.push(`${target}::${name}`)
  }
  return neighbors
}

/**
 * Graph walk: the first sentence of the first reachable tag, or null when no
 * node carries one; `seen` guards `export *` cycles.
 */
function deprecationOf(registry, file, name) {
  const start = `${file}::${name}`
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    const key = stack.pop()
    if (registry.tagged.has(key)) return registry.tagged.get(key)
    for (const neighbor of neighborsOf(registry, key)) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor)
        stack.push(neighbor)
      }
    }
  }
  return null
}

const cache = new Map()
function registryFor(srcRoot) {
  if (!cache.has(srcRoot)) cache.set(srcRoot, buildRegistry(srcRoot))
  const deprecation = (file, name) => deprecationOf(cache.get(srcRoot), file, name)
  return { deprecation, isDeprecated: (file, name) => deprecation(file, name) !== null }
}

module.exports = { registryFor, resolveModule, leadingDeprecation }
