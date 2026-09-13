/**
 * ESLint rule: no-local-formatter
 *
 * Decision 13 says numbers are formatted by the shared formatter module
 * (`utils/workout-format.ts`, `utils/number-format.ts`) — that's the one place
 * rounding and precision rules live, so a display change (or a bug fix) only
 * has to happen once. Nothing enforced that: VW-88 gap 3 found 13 raw
 * `.toFixed(` calls across 8 component files and a further 9 local
 * `format*`-named functions, each free to drift from what the module does.
 *
 * Flags two shapes outside the module:
 *   1. `x.toFixed(n)` — a raw rounding decision made at the call site.
 *   2. A function declaration or arrow/function expression assigned to a
 *      `const`/`let` whose name matches `/^format[A-Z]/` — a local formatter
 *      that should either call the shared module or live in it.
 *
 * RATCHET, not a wall, same shape as no-raw-color and no-upward-tier-import:
 * each file's existing occurrences are recorded in
 * `no-local-formatter-baseline.json`, keyed by the literal VALUE (the toFixed
 * argument text, or the function name) rather than a plain count — the
 * message then lands on the one you just added, not on whichever grandfathered
 * occurrence happens to sit at the count boundary.
 *
 * Regenerate after fixing some:  node scripts/update-no-local-formatter-baseline.mjs
 *
 * The formatter module itself (utils/workout-format.ts, utils/number-format.ts,
 * ActiveWork/format-time.ts) is exempted in eslint.config.js, not here — same
 * as no-raw-color exempting src/theme/** by `ignores` rather than a file list
 * baked into the rule.
 */

const path = require('node:path')

const FORMAT_NAME = /^format[A-Z]/

let baselineCache = null
function loadBaseline() {
  if (baselineCache) return baselineCache
  try {
    baselineCache = require('./no-local-formatter-baseline.json')
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
        'Disallow raw .toFixed( calls and local format*-named functions outside the shared formatter module.',
    },
    schema: [],
    messages: {
      toFixed:
        "Raw '.toFixed({{arg}})' outside the shared formatter module. Add or reuse a formatter in utils/workout-format.ts or utils/number-format.ts so rounding rules live in one place.",
      formatFn:
        "Local formatter '{{name}}' duplicates the shared formatter module. Move it to utils/workout-format.ts or utils/number-format.ts (or call an existing export) so formatting rules don't drift.",
    },
  },

  create(context) {
    const key = baselineKey(context)

    // Remaining allowance per VALUE (toFixed argument text, or function name),
    // not a plain count — same reasoning as no-raw-color and
    // no-upward-tier-import: the message lands on the thing you just added.
    const remaining = new Map(Object.entries(loadBaseline()[key] ?? {}))

    function checkValue(value, loc, messageId, data) {
      const left = remaining.get(value) ?? 0
      if (left > 0) {
        remaining.set(value, left - 1)
        return
      }
      context.report({ loc, messageId, data })
    }

    function checkFormatName(idNode) {
      if (!idNode || !FORMAT_NAME.test(idNode.name)) return
      checkValue(idNode.name, idNode.loc, 'formatFn', { name: idNode.name })
    }

    return {
      'CallExpression[callee.type="MemberExpression"][callee.property.name="toFixed"]'(node) {
        const args = node.arguments
        const argText = args.map((a) => context.sourceCode.getText(a)).join(', ')
        const loc =
          args.length > 0
            ? { start: args[0].loc.start, end: args[args.length - 1].loc.end }
            : node.loc
        checkValue(argText, loc, 'toFixed', { arg: argText })
      },

      FunctionDeclaration(node) {
        checkFormatName(node.id)
      },

      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
        ) {
          checkFormatName(node.id)
        }
      },
    }
  },
}
