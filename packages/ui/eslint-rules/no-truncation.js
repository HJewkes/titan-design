/**
 * ESLint rule: no-truncation
 *
 * A domain component that clips its own text hides data the reader came for: a goal title cut
 * to one line, a session id ending in an ellipsis with no way to read the rest. TD-317 row 9
 * makes truncation in `custom/` and `shell/` an explicit decision instead of a default. `ui/`
 * is out of scope: there truncation is a consumer prop (Typography `truncate`), and the
 * consumer is what this rule checks.
 *
 * Flags three shapes:
 *   1. JSX attributes `truncate`, `noWrap`, `maxLines`, `numberOfLines`, `ellipsizeMode`.
 *   2. Object properties `maxLines`, `numberOfLines` (a props object spread onto Text).
 *   3. Class tokens `truncate`, `line-clamp-*`, `text-ellipsis` in any string, with or
 *      without variant prefixes (`web:truncate`).
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
const OBJECT_PROPERTIES = new Set(['maxLines', 'numberOfLines'])
const CLASS_TOKEN = /^(?:[\w-]+:)*!?(?:truncate|text-ellipsis|line-clamp-[\w[\]]+)$/
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
          check(node.name.name, node.name.loc, 'attribute')
        }
      },

      Property(node) {
        if (node.parent.type === 'ObjectPattern') return
        const name = propertyName(node)
        if (OBJECT_PROPERTIES.has(name)) check(name, node.key.loc, 'property')
      },

      Literal(node) {
        if (typeof node.value !== 'string' || node.parent.type === 'TSLiteralType') return
        if (node.parent.type === 'Property' && node.parent.key === node) return
        checkString(node, node.value)
      },

      TemplateElement(node) {
        checkString(node, node.value.cooked ?? node.value.raw)
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
