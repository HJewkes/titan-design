/**
 * ESLint rule: no-deprecated-import
 *
 * `@deprecated` on an export is a promise: no *new* usage appears before the
 * migration task removes it (DEPRECATIONS.md, consumer policy). Nothing
 * checked that promise — a docblock is just a comment (VW-88 gap 6), so a new
 * consumer of `StatusDot`/`Tile`/`MetricCell`/`BaseBadge`/etc. compiles clean.
 *
 * Scope is EXPORT-level deprecation only — a component whose whole export is
 * tagged (see `deprecated-export-registry.js` for how the tag is found and
 * re-export chains resolved). It does not cover a deprecated PROP on an
 * otherwise-live component (`PillProps.color`, `Typography.noWrap`): those
 * are typed compatibility shims by design (DEPRECATIONS.md "Softly
 * deprecated on Pill itself") and finding new prop *usage* needs the type
 * checker to attribute a JSX prop to a specific component — a materially
 * different, heavier rule this doesn't attempt.
 *
 * RATCHETED like no-raw-color and no-upward-tier-import: existing consumers
 * are recorded per file in `deprecated-import-baseline.json`, keyed by the
 * deprecated name. Regenerate with
 * `node scripts/update-deprecated-import-baseline.mjs` after a migration.
 *
 * The message inlines the first sentence of the tag, which names the
 * replacement (`Use \`Indicator\``, `Moved to \`ui/eyebrow\``). A pure rename
 * (`Renamed to \`WorkoutShell\``) also carries an editor suggestion that
 * imports the new name under the old local binding, so no call site changes.
 */

const path = require('node:path')
const { registryFor, resolveModule } = require('./deprecated-export-registry')

const PURE_RENAME = /^Renamed to `([A-Za-z_$][\w$]*)`/
const NO_SENTENCE = 'Its @deprecated tag names no replacement.'

function srcRootOf(filename) {
  const marker = `${path.sep}src${path.sep}`
  const i = filename.indexOf(marker)
  return i === -1 ? null : filename.slice(0, i + marker.length - 1)
}

let baselineCache = null
function loadBaseline() {
  if (baselineCache) return baselineCache
  try {
    baselineCache = require('./deprecated-import-baseline.json')
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

/** Import the new name under the old local binding, so the file's call sites keep compiling. */
function renameSuggestion(specifier, sentence) {
  const to = PURE_RENAME.exec(sentence)?.[1]
  if (!to) return []
  const { imported, local } = specifier
  const aliased = imported.range[0] !== local.range[0]
  return [
    {
      desc: `Import \`${to}\` in place of '${imported.name}'.`,
      fix: (fixer) => fixer.replaceText(imported, aliased ? to : `${to} as ${local.name}`),
    },
  ]
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow new imports of an export whose JSDoc carries an @deprecated tag.',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      deprecated:
        "'{{name}}' is deprecated and must not gain new consumers. {{replacement}} Use that replacement instead (DEPRECATIONS.md).",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename()
    const srcRoot = srcRootOf(filename)
    if (!srcRoot) return {}
    const registry = registryFor(srcRoot)

    // Remaining allowance per deprecated NAME, not a plain count — same
    // reasoning as no-raw-color: the message lands on the import you just
    // added rather than whichever grandfathered one sits at the boundary.
    const remaining = new Map(Object.entries(loadBaseline()[baselineKey(context)] ?? {}))

    function flag(specifier, sentence) {
      const name = specifier.imported.name
      const left = remaining.get(name) ?? 0
      if (left > 0) {
        remaining.set(name, left - 1)
        return
      }
      context.report({
        node: specifier.imported,
        messageId: 'deprecated',
        data: { name, replacement: sentence || NO_SENTENCE },
        suggest: renameSuggestion(specifier, sentence),
      })
    }

    return {
      // Only real VALUE/TYPE usage — `import { X } from '...'` — is checked.
      // A barrel re-exporting a deprecated name (`export { X } from '...'`)
      // is forwarding the public API, not consuming it: the package must
      // keep re-exporting a deprecated export until it's actually deleted,
      // so ratcheting that down would fight the deprecation policy itself.
      ImportDeclaration(node) {
        if (typeof node.source.value !== 'string') return
        const target = resolveModule(node.source.value, filename, srcRoot)
        if (!target) return
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue
          const sentence = registry.deprecation(target, specifier.imported.name)
          if (sentence !== null) flag(specifier, sentence)
        }
      },
    }
  },
}
