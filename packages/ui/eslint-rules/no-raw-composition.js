/**
 * ESLint rule: no-raw-composition
 *
 * A component should compose titan's primitives rather than reach past them
 * (TD-24 S4, S5). Three shapes are flagged, each with a message naming the fix:
 *
 * - `rawButton`: a lowercase `<button>` JSX element or `createElement('button')`
 *   in `src/components/**`. It skips Pressable's cross-platform press handling
 *   and the Button family's tokens. Tests and stories may render one.
 * - `d3Import`: an import, re-export, dynamic import or require of `d3` or
 *   `d3-*` outside `src/components/ui/charts/**`, which is where charts and
 *   their shared scales and geometry live (CLAUDE.md placement table).
 * - `pathMath`: a template literal or `+` concatenation that builds an SVG
 *   path `d` string from computed values outside `src/components/ui/charts/**`.
 *   Tests and stories may build one. Static path data (no expressions) is fine.
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

// Each lone `#` stands for one computed value (a template expression or a non-string `+` operand).
const PATH_TOKEN = /\s+|,|[+-]?#|[MLHVCSQTAZ]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/iy
// Operands each command takes. `M` alone may take one `#`, as in `'M' + point`.
const PATH_ARITY = { M: 2, L: 2, T: 2, H: 1, V: 1, S: 4, Q: 4, C: 6, A: 7, Z: 0 }

function tokenizePath(shape) {
  const tokens = []
  PATH_TOKEN.lastIndex = 0
  while (PATH_TOKEN.lastIndex < shape.length) {
    const match = PATH_TOKEN.exec(shape)
    if (!match) return null
    if (match[0].trim() && match[0] !== ',') tokens.push(match[0])
  }
  return tokens
}

/** Commands with their operand counts; operands before the first command (a path prefix) are dropped. */
function pathSegments(tokens) {
  const segments = []
  for (const token of tokens) {
    const arity = PATH_ARITY[token.toUpperCase()]
    if (arity !== undefined) segments.push({ command: token, arity, operands: 0 })
    else if (segments.length > 0) segments[segments.length - 1].operands += 1
  }
  return segments
}

// Z closes a path and takes nothing; any other command needs at least its arity.
const isFed = (s) => (s.arity === 0 ? s.operands === 0 : s.operands >= s.arity)

/**
 * Whether a shape reads as SVG path data built from at least one computed value.
 * Each command needs its operands and the whole shape two, unless it opens with
 * `M`, so labels like `h${level}`, `Q${q} ${year}` or `${h}h ${m}m` stay legal.
 * It must also open with a moveto, use a comma, or chain two commands, which
 * keeps one-command labels such as `${h} h ${m}` legal.
 */
function isPathShape(shape) {
  const tokens = tokenizePath(shape)
  if (!tokens || !tokens.some((t) => t.endsWith('#'))) return false
  const segments = pathSegments(tokens)
  if (segments.length === 0) return false
  const opensWithMove = tokens[0] === 'M'
  const fed = segments.every((s, i) => isFed(s) || (i === 0 && opensWithMove && s.operands === 1))
  const structured = /^m$/i.test(tokens[0]) || shape.includes(',') || segments.length >= 2
  return fed && structured && tokens.length - segments.length >= (opensWithMove ? 1 : 2)
}

const templateShape = (node) => node.quasis.map((q) => q.value.cooked ?? '').join('#')

function isConcat(node) {
  return node?.type === 'BinaryExpression' && node.operator === '+'
}

/** A `+` chain flattened into one shape; null when no operand is a string. */
function concatShape(node) {
  const parts = []
  let hasString = false
  const walk = (operand) => {
    if (isConcat(operand)) {
      walk(operand.left)
      walk(operand.right)
      return
    }
    const text = operand.type === 'TemplateLiteral' ? templateShape(operand) : staticString(operand)
    if (text !== null) hasString = true
    parts.push(text ?? '#')
  }
  walk(node)
  return hasString ? parts.join('') : null
}

function isTestOrStory(srcRelative) {
  return /\.(test|stories)\.[jt]sx?$/.test(srcRelative)
}

/** Which checks apply to a file, by its `src`-relative path. */
function scopeOf(srcRelative) {
  if (!srcRelative || srcRelative.startsWith('lab/'))
    return { button: false, d3: false, path: false }
  const inComponents = srcRelative.startsWith('components/')
  const inCharts = srcRelative.startsWith('components/ui/charts/')
  return {
    button: inComponents && !isTestOrStory(srcRelative),
    d3: !inCharts,
    path: !inCharts && !isTestOrStory(srcRelative),
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

function pathVisitors(report) {
  return {
    TemplateLiteral(node) {
      if (isConcat(node.parent)) return
      if (isPathShape(templateShape(node))) report(node, 'pathMath')
    },
    BinaryExpression(node) {
      if (!isConcat(node) || isConcat(node.parent)) return
      const shape = concatShape(node)
      if (shape !== null && isPathShape(shape)) report(node, 'pathMath')
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
          'Disallow raw <button> elements in components, and d3 imports or SVG path math outside src/components/ui/charts.',
      },
      schema: [],
      messages: {
        rawButton:
          'Raw <button> bypasses titan’s pressable primitives. Use `Button` (with `ButtonText`), `ToolbarButton` for an icon action, TriggerSurface (internal, not exported) for an overlay trigger, or Pressable from react-native.',
        d3Import:
          "'{{specifier}}' is a d3 import outside src/components/ui/charts. Move the scale or geometry into `src/components/ui/charts/kit/`, or compose an existing chart such as `SparkBars`.",
        pathMath:
          'SVG path math outside src/components/ui/charts. Build the path with `d3-shape` inside `src/components/ui/charts/kit/`, or compose an existing chart such as `SparkBars`.',
      },
    },

    create(context) {
      const scope = scopeOf(srcRelativeOf(context.filename ?? context.getFilename()))
      if (!scope.button && !scope.d3 && !scope.path) return {}

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
        ...(scope.path ? pathVisitors(report) : {}),
      }
    },
  }
}

let baselineCache = null

/** @type {import('eslint').Rule.RuleModule & { withBaseline: (baseline: object) => import('eslint').Rule.RuleModule }} */
module.exports = createRule(() => (baselineCache ??= loadBaseline()))
module.exports.withBaseline = (baseline) => createRule(() => baseline)
