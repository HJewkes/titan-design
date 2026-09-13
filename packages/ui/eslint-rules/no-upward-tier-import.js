/**
 * ESLint rule: no-upward-tier-import
 *
 * `ui/README.md` fixes the dependency direction as
 * `theme -> icons -> ui -> custom -> shell -> pages`: a lower tier may never
 * import from a higher one (ui reaching into custom, custom reaching into
 * shell, theme reaching into anything above it). Until now that order lived
 * only in prose — `arch-graph.mjs` derives a tier from DAG depth for the audit
 * tool, but never checks direction, so an accidental upward import compiles
 * clean (VW-88 gap 1).
 *
 * This resolves each import specifier (relative, or the `@/` alias from
 * tsconfig) to the tier folder it lands in by STRING PATH only — no module
 * resolution, no type info — and reports when that tier sits above the
 * importing file's own tier. `src/lab/**` is exempt in both directions: it
 * holds specimen fixtures, not library code, so it neither carries a tier nor
 * restricts what may reach into it.
 *
 * RATCHETED like no-raw-color: existing offenders are recorded per file in
 * `tier-import-baseline.json`, keyed by the literal import specifier so the
 * message lands on the import you just added rather than an old one.
 * Regenerate with `node scripts/update-tier-import-baseline.mjs` after fixing one.
 */

const path = require('node:path')

const TIER_ORDER = ['theme', 'icons', 'ui', 'custom', 'shell', 'pages']

/** Classify a `src`-relative, POSIX-separated path into a tier, or null if untiered. */
function tierOf(srcRelativePath) {
  if (srcRelativePath.startsWith('lab/')) return 'lab'
  if (srcRelativePath.startsWith('theme/')) return 'theme'
  const match = /^components\/(icons|ui|custom|shell|pages)\//.exec(srcRelativePath)
  return match ? match[1] : null
}

/** Absolute path of the package's `src/` root, derived from the file being linted. */
function srcRootOf(filename) {
  const marker = `${path.sep}src${path.sep}`
  const i = filename.indexOf(marker)
  return i === -1 ? null : filename.slice(0, i + marker.length - 1)
}

/**
 * Resolve an import specifier to a `src`-relative, POSIX-separated path, or
 * null if it's neither relative nor the `@/` alias (e.g. a package import,
 * which has no tier).
 */
function resolveToSrcRelative(specifier, filename, srcRoot) {
  let absolute
  if (specifier.startsWith('.')) {
    absolute = path.resolve(path.dirname(filename), specifier)
  } else if (specifier.startsWith('@/')) {
    absolute = path.join(srcRoot, specifier.slice(2))
  } else {
    return null
  }
  return path.relative(srcRoot, absolute).split(path.sep).join('/')
}

let baselineCache = null
function loadBaseline() {
  if (baselineCache) return baselineCache
  try {
    baselineCache = require('./tier-import-baseline.json')
  } catch {
    baselineCache = {}
  }
  return baselineCache
}

/** Baseline keys are package-relative POSIX paths, so they're stable across machines. */
function baselineKey(context) {
  const cwd = context.getCwd?.() ?? process.cwd()
  return path
    .relative(cwd, context.filename ?? context.getFilename())
    .split(path.sep)
    .join('/')
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow imports that cross the theme -> icons -> ui -> custom -> shell -> pages tier order upward.',
    },
    schema: [],
    messages: {
      upward:
        "'{{specifier}}' imports from the {{importedTier}} tier, which sits above {{currentTier}}. Tier order is theme -> icons -> ui -> custom -> shell -> pages — move the shared code down a tier, or promote the importing file up.",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename()
    const srcRoot = srcRootOf(filename)
    if (!srcRoot) return {}

    const currentRelative = path.relative(srcRoot, filename).split(path.sep).join('/')
    const currentTier = tierOf(currentRelative)
    if (!currentTier || currentTier === 'lab') return {}
    const currentIndex = TIER_ORDER.indexOf(currentTier)

    // Remaining allowance per import SPECIFIER, not a plain count — same
    // reasoning as no-raw-color: the message lands on the import you just
    // added rather than whichever grandfathered one sits at the boundary.
    const remaining = new Map(Object.entries(loadBaseline()[baselineKey(context)] ?? {}))

    function check(sourceNode) {
      if (!sourceNode || typeof sourceNode.value !== 'string') return
      const specifier = sourceNode.value
      const importedRelative = resolveToSrcRelative(specifier, filename, srcRoot)
      if (!importedRelative) return
      const importedTier = tierOf(importedRelative)
      if (!importedTier || importedTier === 'lab') return
      if (TIER_ORDER.indexOf(importedTier) <= currentIndex) return

      const left = remaining.get(specifier) ?? 0
      if (left > 0) {
        remaining.set(specifier, left - 1)
        return
      }
      context.report({
        node: sourceNode,
        messageId: 'upward',
        data: { specifier, importedTier, currentTier },
      })
    }

    return {
      ImportDeclaration(node) {
        check(node.source)
      },
      ExportNamedDeclaration(node) {
        check(node.source)
      },
      ExportAllDeclaration(node) {
        check(node.source)
      },
    }
  },
}
