/**
 * ESLint rule: no-truncation
 *
 * A domain component that clips its own text hides data the reader came for: a goal title cut
 * to one line, a session id ending in an ellipsis with no way to read the rest. TD-317 row 9
 * makes truncation in `custom/` and `shell/` an explicit decision instead of a default. `ui/`
 * is out of scope: there truncation is a consumer prop (Typography `truncate`), and the
 * consumer is what this rule checks.
 *
 * Flags four shapes:
 *   1. JSX attributes `truncate`, `noWrap`, `maxLines`, `numberOfLines`, `ellipsizeMode`.
 *      `numberOfLines={numberOfLines}` or `{props.numberOfLines}` that forwards the component's
 *      own prop (no rename, no default) is not reported: the caller's attribute is the site.
 *   2. Object properties with those names (a props object spread onto Text, or a `cn({ truncate: on })`
 *      key), and `textOverflow: 'ellipsis'` in a style object.
 *   3. Class tokens `truncate`, `line-clamp-*`, `text-ellipsis` in any string, with or
 *      without variant prefixes (`web:truncate`), as an object key (`cn({ 'line-clamp-2': on })`)
 *      or as a template prefix (`line-clamp-${lines}`, reported as `line-clamp-*`).
 *   4. `line-clamp-none` is the opposite of a clamp, and a string that is only compared to
 *      `'truncate'` or imported from a `truncate` path is not a class.
 *
 * RATCHET, same shape as no-local-formatter: today's sites are recorded in
 * `no-truncation-baseline.json`, keyed by file and VALUE (the attribute or property name, or
 * the class token). The baseline only shrinks, and it must stay exact: an allowance a file no
 * longer spends is reported as `stale`, so a removed site has to be locked in by a regen.
 *
 *   Regenerate after removing some:  node scripts/update-no-truncation-baseline.mjs
 *
 * Permanent exceptions (a path or user name whose full text is one hover or press away) go in
 * `truncation-allowlist.json`, which the owner curates. The baseline is debt to burn down; the
 * allowlist is sanctioned use, so the two never share a file.
 */

const path = require('node:path')

const JSX_ATTRIBUTES = new Set(['truncate', 'noWrap', 'maxLines', 'numberOfLines', 'ellipsizeMode'])
const OBJECT_PROPERTIES = new Set(JSX_ATTRIBUTES)
const CLASS_TOKEN = /^(?:[\w-]+:)*!?(?:truncate|text-ellipsis|line-clamp-(?!none$)[\w[\]]+)$/
const DYNAMIC_CLAMP_TAIL = /(?:^|\s)(?:[\w-]+:)*!?line-clamp-$/
const DYNAMIC_CLAMP = 'line-clamp-*'
const NON_CLASS_PARENTS = new Set([
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportAllDeclaration',
  'ImportExpression',
  'SwitchCase',
])
const COMPARISONS = new Set(['===', '!==', '==', '!='])
const AFFORDANCES = new Set(['tooltip', 'press'])

const BASELINE_FILE = 'no-truncation-baseline.json'
const ALLOWLIST_FILE = 'truncation-allowlist.json'

function readJson(file, fallback) {
  try {
    return require(`./${file}`)
  } catch {
    return fallback
  }
}

let baselineCache = null
function loadBaseline() {
  baselineCache ??= readJson(BASELINE_FILE, {})
  return baselineCache
}

/**
 * Allowlist entries are `{ file, value, kind, affordance }`, one per sanctioned site. An entry
 * without a kind or a known affordance is a broken exception, so loading throws rather than
 * quietly allowing it.
 */
function parseAllowlist(entries) {
  const byFile = {}
  for (const entry of entries) {
    const { file, value, kind, affordance } = entry
    if (!file || !value || !kind || !AFFORDANCES.has(affordance)) {
      throw new Error(
        `${ALLOWLIST_FILE}: every entry needs file, value, kind and an affordance of ` +
          `${[...AFFORDANCES].join(' or ')}; got ${JSON.stringify(entry)}`
      )
    }
    byFile[file] ??= {}
    byFile[file][value] = (byFile[file][value] ?? 0) + 1
  }
  return byFile
}

let allowlistCache = null
function loadAllowlist() {
  allowlistCache ??= parseAllowlist(readJson(ALLOWLIST_FILE, []))
  return allowlistCache
}

/** Baseline keys are package-relative POSIX paths, so they're stable across machines. */
function baselineKey(context) {
  const cwd = context.getCwd?.() ?? process.cwd()
  return path
    .relative(cwd, context.filename ?? context.getFilename())
    .split(path.sep)
    .join('/')
}

function classTokens(text) {
  return text.split(/\s+/).filter((token) => CLASS_TOKEN.test(token))
}

function propertyName(node) {
  if (node.computed) return undefined
  if (node.key.type === 'Identifier') return node.key.name
  if (node.key.type === 'Literal') return String(node.key.value)
  return undefined
}

/** A string compared to, switched on or imported is a name, not a class list. */
function isNameNotClass(node) {
  const { parent } = node
  if (NON_CLASS_PARENTS.has(parent.type)) return true
  return parent.type === 'BinaryExpression' && COMPARISONS.has(parent.operator)
}

function isEllipsisValue(node) {
  return node.type === 'Literal' && node.value === 'ellipsis'
}

/** The variable `name` resolves to from `scope`, walking outwards. */
function findVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name)
    if (variable) return variable
  }
  return undefined
}

const FORWARDED_PROP = 'numberOfLines'
const COMPONENT_WRAPPERS = new Set(['forwardRef', 'memo'])

/** `forwardRef(…)`, `memo(…)`, `React.forwardRef(…)` or `React.memo(…)`. */
function isComponentWrapper(callee) {
  const name = callee.type === 'MemberExpression' ? callee.property : callee
  return name.type === 'Identifier' && COMPONENT_WRAPPERS.has(name.name)
}

/**
 * The props parameter: the first parameter of a function that is not a callback argument, or
 * of the function a `forwardRef`/`memo` wraps. A `.map` callback's first parameter is an item.
 */
function isPropsParameter(fn, param) {
  if (fn.params[0] !== param) return false
  const { parent } = fn
  if (parent.type !== 'CallExpression' && parent.type !== 'NewExpression') return true
  return parent.arguments[0] === fn && isComponentWrapper(parent.callee)
}

/** `function T({ numberOfLines })`: the prop destructured under its own name, no default. */
function isDestructuredProp(variable) {
  return variable.defs.some((def) => {
    if (def.type !== 'Parameter') return false
    const property = def.name.parent
    return (
      property.type === 'Property' &&
      property.value === def.name &&
      !property.computed &&
      property.key.type === 'Identifier' &&
      property.key.name === FORWARDED_PROP &&
      isPropsParameter(def.node, property.parent)
    )
  })
}

/** `function T(props)`: the props object itself, so `props.numberOfLines` is the caller's prop. */
function isPropsObject(variable) {
  return variable.defs.some(
    (def) => def.type === 'Parameter' && isPropsParameter(def.node, def.name)
  )
}

/**
 * `numberOfLines={numberOfLines}` or `{props.numberOfLines}` hands on the caller's own
 * `numberOfLines` prop, and the caller's `numberOfLines=` attribute is the site this rule checks.
 * Anything else, a renamed prop (`{ lines: numberOfLines }`), a default, a callback item or a
 * `maxLines` prop, has no such site, so it stays reported.
 */
function isForwardedProp(expression, scope) {
  if (expression.type === 'Identifier' && expression.name === FORWARDED_PROP) {
    const variable = findVariable(scope, expression.name)
    return variable !== undefined && isDestructuredProp(variable)
  }
  if (expression.type !== 'MemberExpression' || expression.computed) return false
  const { object, property } = expression
  if (object.type !== 'Identifier' || property.type !== 'Identifier') return false
  if (property.name !== FORWARDED_PROP) return false
  const variable = findVariable(scope, object.name)
  return variable !== undefined && isPropsObject(variable)
}

const FIX =
  'Let the text wrap, or give the full text a hover or press affordance (`ui/tooltip`) and ' +
  `add the site to ${ALLOWLIST_FILE} with its kind and affordance.`

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow text truncation in custom/ and shell/ components outside the shrink-only baseline and the owner allowlist.',
    },
    schema: [],
    messages: {
      attribute: `Truncation prop '{{value}}' clips text in a domain component. ${FIX}`,
      property: `Truncation property '{{value}}' clips text in a domain component. ${FIX}`,
      className: `Truncation class '{{value}}' clips text in a domain component. ${FIX}`,
      stale: `${BASELINE_FILE} still allows {{count}} '{{value}}' this file no longer has. Use \`scripts/update-no-truncation-baseline.mjs\` to shrink the baseline so the site can't come back unnoticed.`,
    },
  },

  create(context) {
    const key = baselineKey(context)
    const allowed = new Map(Object.entries(loadAllowlist()[key] ?? {}))
    const baselined = new Map(Object.entries(loadBaseline()[key] ?? {}))

    function spend(allowances, value) {
      const left = allowances.get(value) ?? 0
      if (left === 0) return false
      allowances.set(value, left - 1)
      return true
    }

    function check(value, loc, messageId) {
      if (spend(allowed, value) || spend(baselined, value)) return
      context.report({ loc, messageId, data: { value } })
    }

    function checkString(node, text) {
      for (const token of classTokens(text)) check(token, node.loc, 'className')
    }

    return {
      JSXAttribute(node) {
        if (node.name.type === 'JSXIdentifier' && JSX_ATTRIBUTES.has(node.name.name)) {
          const { value } = node
          if (
            node.name.name === 'numberOfLines' &&
            value?.type === 'JSXExpressionContainer' &&
            isForwardedProp(value.expression, context.sourceCode.getScope(node))
          ) {
            return
          }
          check(node.name.name, node.name.loc, 'attribute')
        }
      },

      Property(node) {
        if (node.parent.type === 'ObjectPattern') return
        const name = propertyName(node)
        if (OBJECT_PROPERTIES.has(name)) check(name, node.key.loc, 'property')
        else if (name === 'textOverflow' && isEllipsisValue(node.value)) {
          check(name, node.key.loc, 'property')
        } else if (name !== undefined) checkString(node.key, name)
      },

      Literal(node) {
        if (typeof node.value !== 'string' || node.parent.type === 'TSLiteralType') return
        if (node.parent.type === 'Property' && node.parent.key === node) return
        if (isNameNotClass(node)) return
        checkString(node, node.value)
      },

      TemplateElement(node) {
        const text = node.value.cooked ?? node.value.raw
        checkString(node, text)
        if (!node.tail && DYNAMIC_CLAMP_TAIL.test(text)) check(DYNAMIC_CLAMP, node.loc, 'className')
      },

      'Program:exit'() {
        for (const [value, count] of baselined) {
          if (count === 0) continue
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'stale',
            data: { value, count: String(count) },
          })
        }
      },
    }
  },
}

module.exports.parseAllowlist = parseAllowlist
