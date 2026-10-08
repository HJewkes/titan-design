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
 *
 * The fix is always to move the imported code down to the importer's tier,
 * the lowest home that makes the import legal; CLAUDE.md placement forbids
 * copying it or replacing it with a slot. When the target is a deprecated shim
 * whose tag says where the code already moved (`Moved to \`ui/eyebrow\``), the
 * message names that path instead.
 */

const path = require('node:path')
const { loadBaseline, baselineKey, srcRootOf } = require('./ratchet')
const { registryFor, resolveModule } = require('./deprecated-export-registry')

const TIER_ORDER = ['theme', 'icons', 'ui', 'custom', 'shell', 'pages']

/** Classify a `src`-relative, POSIX-separated path into a tier, or null if untiered. */
function tierOf(srcRelativePath) {
  if (srcRelativePath.startsWith('lab/')) return 'lab'
  if (srcRelativePath.startsWith('theme/')) return 'theme'
  const match = /^components\/(icons|ui|custom|shell|pages)\//.exec(srcRelativePath)
  return match ? match[1] : null
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

/** `src`-relative path as a message names it: `components/` dropped, no extension or `/index`. */
function displayPath(srcRelative) {
  return srcRelative
    .replace(/^components\//, '')
    .replace(/\.tsx?$/, '')
    .replace(/\/index$/, '')
}

/** Tier of a path as a deprecation tag writes it (`ui/eyebrow`, `src/hooks/x.ts`). */
function tierOfTagPath(tagPath) {
  const rel = tagPath.replace(/^src\//, '')
  return tierOf(/^(icons|ui|custom|shell|pages)\//.test(rel) ? `components/${rel}` : rel)
}

/** The `Moved to \`path\`` of the first imported name whose shim already lives at or below `tier`. */
function movedHome(node, importedRelative, srcRoot, tier) {
  const registry = registryFor(srcRoot)
  for (const specifier of node.specifiers ?? []) {
    const name =
      specifier.type === 'ImportSpecifier' ? specifier.imported.name : specifier.local.name
    const sentence = registry.deprecation(importedRelative, name)
    const moved = sentence && /^Moved to `([^`]+)`/.exec(sentence)?.[1]
    const movedTier = moved && tierOfTagPath(moved)
    if (moved && TIER_ORDER.indexOf(movedTier) <= TIER_ORDER.indexOf(tier)) return moved
  }
  return null
}

function fixFor(node, importedRelative, srcRoot, currentTier) {
  const moved = movedHome(node, importedRelative, srcRoot, currentTier)
  if (moved) return `It is a deprecated shim: import it from \`${moved}\`, where it already moved.`
  const target = displayPath(importedRelative)
  return `Move \`${target}\` down to \`${currentTier}/\`, the lowest tier that makes this import legal.`
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
        "'{{specifier}}' imports from the {{importedTier}} tier, which sits above {{currentTier}} (tier order: theme -> icons -> ui -> custom -> shell -> pages). {{fix}} Never copy it, and never replace it with a slot.",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename()
    const srcRoot = srcRootOf(context)
    if (!srcRoot) return {}

    const currentRelative = path.relative(srcRoot, filename).split(path.sep).join('/')
    const currentTier = tierOf(currentRelative)
    if (!currentTier || currentTier === 'lab') return {}
    const currentIndex = TIER_ORDER.indexOf(currentTier)

    // Remaining allowance per import SPECIFIER, not a plain count — same
    // reasoning as no-raw-color: the message lands on the import you just
    // added rather than whichever grandfathered one sits at the boundary.
    const remaining = new Map(
      Object.entries(loadBaseline('tier-import-baseline.json')[baselineKey(context)] ?? {})
    )

    function check(node) {
      const sourceNode = node.source
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
        data: {
          specifier,
          importedTier,
          currentTier,
          fix: fixFor(node, resolveModule(specifier, filename, srcRoot), srcRoot, currentTier),
        },
      })
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    }
  },
}
