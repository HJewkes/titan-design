/**
 * ESLint rule: no-raw-composition
 *
 * A component should compose titan's primitives rather than reach past them
 * (TD-24 S4). Two shapes are flagged, each with a message naming the fix:
 *
 * - `rawButton`: a lowercase `<button>` JSX element or `createElement('button')`
 *   in `src/components/**`. It skips Pressable's cross-platform press handling
 *   and the Button family's tokens. Tests and stories may render one.
 * - `d3Import`: an import, re-export, dynamic import or require of `d3` or
 *   `d3-*` outside `src/components/ui/charts/**`, which is where charts and
 *   their shared scales and geometry live (CLAUDE.md placement table).
 *
 * `src/lab/**` is exempt, as it is for the other titan rules.
 *
 * RATCHETED like no-upward-tier-import: existing offenders are recorded in
 * `composition-baseline.json` as file, then messageId, then count. A count per
 * file stays stable under unrelated edits, where line numbers would not.
 * Regenerate with `node scripts/update-composition-baseline.mjs` after fixing one.
 */

const path = require('node:path')

const D3_SPECIFIER = /^d3(-[a-z0-9-]+)?(\/.*)?$/

/** `src`-relative, POSIX-separated path of the linted file, or null outside `src/`. */
function srcRelativeOf(filename) {
  const marker = `${path.sep}src${path.sep}`
  const i = filename.lastIndexOf(marker)
  return i === -1
    ? null
    : filename
        .slice(i + marker.length)
        .split(path.sep)
        .join('/')
}

function isTestOrStory(srcRelative) {
  return /\.(test|stories)\.[jt]sx?$/.test(srcRelative)
}

/** Which checks apply to a file, by its `src`-relative path. */
function scopeOf(srcRelative) {
  if (!srcRelative || srcRelative.startsWith('lab/')) return { button: false, d3: false }
  const inComponents = srcRelative.startsWith('components/')
  return {
    button: inComponents && !isTestOrStory(srcRelative),
    d3: !srcRelative.startsWith('components/ui/charts/'),
  }
}

/** Baseline keys are package-relative POSIX paths, so they're stable across machines. */
function baselineKey(context) {
  const cwd = context.cwd ?? context.getCwd?.() ?? process.cwd()
  return path
    .relative(cwd, context.filename ?? context.getFilename())
    .split(path.sep)
    .join('/')
}

function loadBaseline() {
  try {
    return require('./composition-baseline.json')
  } catch {
    return {}
  }
}

function staticString(node) {
  if (!node) return null
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked
  }
  return null
}

function isCreateElementCall(node) {
  const { callee } = node
  if (callee.type === 'Identifier') return callee.name === 'createElement'
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.name === 'createElement'
  )
}

function isRequireCall(node) {
  return node.callee.type === 'Identifier' && node.callee.name === 'require'
}

function buttonVisitors(report) {
  return {
    JSXOpeningElement(node) {
      if (node.name.type === 'JSXIdentifier' && node.name.name === 'button') {
        report(node, 'rawButton')
      }
    },
    CallExpression(node) {
      if (isCreateElementCall(node) && staticString(node.arguments[0]) === 'button') {
        report(node, 'rawButton')
      }
    },
  }
}

function d3Visitors(report) {
  const check = (sourceNode) => {
    const specifier = staticString(sourceNode)
    if (specifier && D3_SPECIFIER.test(specifier)) report(sourceNode, 'd3Import')
  }
  return {
    ImportDeclaration: (node) => check(node.source),
    ExportNamedDeclaration: (node) => check(node.source),
    ExportAllDeclaration: (node) => check(node.source),
    ImportExpression: (node) => check(node.source),
    'CallExpression:exit'(node) {
      if (isRequireCall(node)) check(node.arguments[0])
    },
  }
}

/** Build the rule against a given baseline; the module export uses the committed one. */
function createRule(getBaseline) {
  return {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow raw <button> elements in components and d3 imports outside src/components/ui/charts.',
      },
      schema: [],
      messages: {
        rawButton:
          'Raw <button> bypasses titan’s pressable primitives. Use Button (with ButtonText), ToolbarButton for an icon action, TriggerSurface for an overlay trigger, or Pressable.',
        d3Import:
          "'{{specifier}}' is a d3 import outside src/components/ui/charts. Move the scale or geometry into ui/charts/kit/, or compose an existing chart from ui/charts.",
      },
    },

    create(context) {
      const scope = scopeOf(srcRelativeOf(context.filename ?? context.getFilename()))
      if (!scope.button && !scope.d3) return {}

      // Remaining allowance per messageId; occurrences past it report.
      const remaining = new Map(Object.entries(getBaseline()[baselineKey(context)] ?? {}))

      function report(node, messageId) {
        const left = remaining.get(messageId) ?? 0
        if (left > 0) {
          remaining.set(messageId, left - 1)
          return
        }
        context.report({ node, messageId, data: { specifier: staticString(node) ?? '' } })
      }

      return {
        ...(scope.button ? buttonVisitors(report) : {}),
        ...(scope.d3 ? d3Visitors(report) : {}),
      }
    },
  }
}

let baselineCache = null

/** @type {import('eslint').Rule.RuleModule & { withBaseline: (baseline: object) => import('eslint').Rule.RuleModule }} */
module.exports = createRule(() => (baselineCache ??= loadBaseline()))
module.exports.withBaseline = (baseline) => createRule(() => baseline)
