/**
 * ESLint rule: no-frozen-theme
 *
 * `getSemanticColors(mode)` returns literal hex for one theme. Called at MODULE
 * scope — `const t = getSemanticColors('dark')` — the component captures the
 * dark palette once, at import time, and can never respond to a theme again.
 * The token-pure block in `eslint.config.js` has banned it for the families it
 * covers since E2, but that is 25 of 54 Workout files and none of Fatigue, so
 * 35 component files still freeze the theme (VW-88 gap 2).
 *
 * What the convention is instead: resolve at HOOK/RENDER time from the nearest
 * `<Surface>` — `useOnSurfaceColor(role)` for the neutral text roles, or
 * `getSemanticColors(useSurfaceMode())` when a component needs other tokens.
 * That keeps literal hex (which `toHaveStyle` can assert, unlike the `var()`
 * strings `resolveColor` returns under the RNW vitest alias) while still
 * tracking the theme.
 *
 * Two shapes are frozen, and both are reported:
 *   - a string-literal mode anywhere: `getSemanticColors('dark')`
 *   - a module-scope call with any argument: the value outlives every render
 * A call inside a function with a non-literal mode is the correct pattern and
 * is never reported.
 *
 * RATCHETED like no-raw-color and no-upward-tier-import: existing offenders are
 * recorded per file in `frozen-theme-baseline.json`, keyed by the frozen VALUE
 * (`dark`, `light`, `module-scope`) rather than a plain count, so the message
 * lands on the call you just added instead of a grandfathered one.
 * Regenerate with `node scripts/update-frozen-theme-baseline.mjs` after
 * migrating a file.
 */

const path = require('node:path')

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/** The frozen-value key for a non-literal module-scope call. */
const MODULE_SCOPE_KEY = 'module-scope'

/** True when no enclosing function stands between the call and the module body. */
function isAtModuleScope(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (FUNCTION_TYPES.has(current.type)) return false
  }
  return true
}

/** `getSemanticColors(...)` as a bare identifier or a namespace member. */
function isGetSemanticColorsCall(node) {
  const callee = node.callee
  if (callee.type === 'Identifier') return callee.name === 'getSemanticColors'
  return (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'getSemanticColors'
  )
}

let baselineCache = null
function loadBaseline() {
  if (baselineCache) return baselineCache
  try {
    baselineCache = require('./frozen-theme-baseline.json')
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
        'Disallow freezing the theme with a module-scope or string-literal getSemanticColors() call in components.',
    },
    schema: [],
    messages: {
      literalMode:
        "getSemanticColors('{{mode}}') freezes the component to the {{mode}} palette. Resolve at render time instead: useOnSurfaceColor(role) for text, or getSemanticColors(useSurfaceMode()) for other tokens. See TOKENS.md §3.",
      moduleScope:
        'getSemanticColors() at module scope captures one palette at import time, so the component can never follow the theme. Move the call inside the component and read the mode from the nearest Surface (useSurfaceMode / useOnSurfaceColor). See TOKENS.md §3.',
    },
  },

  create(context) {
    // Remaining allowance per frozen VALUE, not a plain count — same reasoning
    // as no-raw-color: the message lands on the call you just added rather than
    // whichever grandfathered one sits at the boundary.
    const remaining = new Map(Object.entries(loadBaseline()[baselineKey(context)] ?? {}))

    return {
      CallExpression(node) {
        if (!isGetSemanticColorsCall(node)) return

        const arg = node.arguments[0]
        const literal = arg && arg.type === 'Literal' && typeof arg.value === 'string'
        if (!literal && !isAtModuleScope(node)) return

        const value = literal ? arg.value : MODULE_SCOPE_KEY
        const left = remaining.get(value) ?? 0
        if (left > 0) {
          remaining.set(value, left - 1)
          return
        }
        context.report(
          literal
            ? { node, messageId: 'literalMode', data: { mode: value } }
            : { node, messageId: 'moduleScope' }
        )
      },
    }
  },
}
