/**
 * ESLint rule: no-copy-pitfalls
 *
 * TD-331 S9: four microcopy shapes a reviewer keeps catching by eye, checked in source instead.
 *
 * Flags, in display copy only:
 *   1. `times`: a spaced `×` or `x` between digits (`8 × 5`, `3 x 10`). Write `8×5`, the same
 *      no-space form numbers take beside their units (`185lb`, `90s`).
 *   2. `caps`: an all-caps word of four or more letters (`TODAY`, `FAILED`). Shouting is not
 *      emphasis; use sentence case and a Typography variant. Terms that are written in capitals
 *      (`AMRAP`) go in `copy-glossary.json`, which the rendered-text test shares.
 *   3. `ampersand`: ` & ` in running copy. Write "and".
 *   4. `bang`: `!` in an error string. An error states what happened and what to do, calmly.
 *      An error string is a display prop named `error*`, or copy inside an `Alert` or `Toast`
 *      whose `status` or `color` is `error`.
 *
 * Display copy is JSX text, a string literal child (`{'Done'}`), and a string literal or
 * template text in a display prop. Display props are the names in DISPLAY_PROPS (`label`,
 * `title`, `subtitle`, `description`, `placeholder`, `caption`, `hint`, `message`, `helperText`,
 * `emptyText`, `accessibilityLabel`, `accessibilityHint`, `aria-label`) and any prop named
 * `*Text`, `*Label` or `error*`. Identifiers, class names and other props are never read, and
 * eslint.config.js leaves tests, stories and src/lab out of scope.
 *
 * Messages quote the fragment in double quotes, not backticks: the message contract reads a
 * backticked span as an option it must resolve.
 *
 * RATCHET, same shape as no-truncation: today's sites are recorded in
 * `no-copy-pitfalls-baseline.json`, keyed by file and VALUE (the offending fragment). The
 * baseline only shrinks, and it must stay exact: an allowance a file no longer spends is
 * reported as `stale`, so a fixed site has to be locked in by a regen.
 *
 *   Regenerate after fixing some:  node scripts/update-no-copy-pitfalls-baseline.mjs
 */

const { loadBaseline, baselineKey } = require('./ratchet')

const BASELINE_FILE = 'no-copy-pitfalls-baseline.json'

const DISPLAY_PROPS = new Set([
  'label',
  'title',
  'subtitle',
  'description',
  'placeholder',
  'caption',
  'hint',
  'message',
  'helperText',
  'emptyText',
  'accessibilityLabel',
  'accessibilityHint',
  'aria-label',
])
const DISPLAY_SUFFIX = /(?:Text|Label)$/
const ERROR_PROP = /^error(?:[A-Z]|$)/
const ERROR_CONTAINERS = new Set(['Alert', 'Toast'])
const ERROR_TONE_PROPS = new Set(['status', 'color'])

const SPACED_TIMES = /\d(?:\s+[×x]\s*|\s*[×x]\s+)\d/g
const WORD = /[A-Za-z][A-Za-z0-9]*/g
const MIN_CAPS_LETTERS = 4
const AMPERSAND = / & /
const BANG_TOKEN = /\S*!\S*/

let glossaryCache = null

function loadGlossary() {
  glossaryCache ??= new Set(Object.keys(loadBaseline('copy-glossary.json').terms ?? {}))
  return glossaryCache
}

/**
 * The file's allowances: `spend(value)` uses one up, `unspent()` lists what is left at the end.
 */
function fileBaseline(context) {
  const left = new Map(Object.entries(loadBaseline(BASELINE_FILE)[baselineKey(context)] ?? {}))
  return {
    spend(value) {
      const count = left.get(value) ?? 0
      if (count === 0) return false
      left.set(value, count - 1)
      return true
    },
    unspent: () => [...left].filter(([, count]) => count > 0),
  }
}

function isShouting(word) {
  if (/[a-z]/.test(word)) return false
  return word.replace(/[^A-Z]/g, '').length >= MIN_CAPS_LETTERS && !loadGlossary().has(word)
}

/** Every pitfall in one piece of copy, as `{ messageId, value }`. */
function findPitfalls(text, isError) {
  const found = []
  for (const match of text.matchAll(SPACED_TIMES)) {
    found.push({ messageId: 'times', value: match[0] })
  }
  for (const [word] of text.matchAll(WORD)) {
    if (isShouting(word)) found.push({ messageId: 'caps', value: word })
  }
  if (AMPERSAND.test(text)) found.push({ messageId: 'ampersand', value: '&' })
  const bang = isError && text.match(BANG_TOKEN)
  if (bang) found.push({ messageId: 'bang', value: bang[0] })
  return found
}

function attributeName(attribute) {
  const { name } = attribute
  return name.type === 'JSXNamespacedName' ? `${name.namespace.name}:${name.name.name}` : name.name
}

function isDisplayProp(name) {
  return DISPLAY_PROPS.has(name) || DISPLAY_SUFFIX.test(name) || ERROR_PROP.test(name)
}

function staticValue(attribute) {
  return attribute.value?.type === 'Literal'
    ? attribute.value.value
    : attribute.value?.expression?.value
}

function isErrorContainer(element) {
  const { name } = element.openingElement
  if (name.type !== 'JSXIdentifier' || !ERROR_CONTAINERS.has(name.name)) return false
  return element.openingElement.attributes.some(
    (attribute) =>
      attribute.type === 'JSXAttribute' &&
      ERROR_TONE_PROPS.has(attributeName(attribute)) &&
      staticValue(attribute) === 'error'
  )
}

function insideErrorContainer(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === 'JSXElement' && isErrorContainer(current)) return true
  }
  return false
}

/** The string pieces of a prop value: literals, template text and both arms of a choice. */
function copyNodes(expression) {
  if (!expression) return []
  switch (expression.type) {
    case 'Literal':
      return typeof expression.value === 'string' ? [expression] : []
    case 'TemplateLiteral':
      return expression.quasis
    case 'ConditionalExpression':
      return [...copyNodes(expression.consequent), ...copyNodes(expression.alternate)]
    case 'LogicalExpression':
      return [...copyNodes(expression.left), ...copyNodes(expression.right)]
    case 'JSXExpressionContainer':
      return copyNodes(expression.expression)
    default:
      return []
  }
}

function copyText(node) {
  if (node.type === 'TemplateElement') return node.value.cooked ?? node.value.raw
  return node.value
}

// Plain, not backticked: the message contract reads `eslint-rules/...` as a class name.
const GLOSSARY_FILE = 'eslint-rules/copy-glossary.json'
const CASES = 'the cases in `src/test/no-copy-pitfalls.test.ts` show each fix'

const FIXES = {
  times: `Use the sign with no spaces (8×5), like a number beside its unit; ${CASES}.`,
  caps: `Write sentence case and use \`variant="overline"\` or \`variant="monoLabel"\` where the design wants capitals, or add a term that is written in capitals to ${GLOSSARY_FILE}.`,
  ampersand: `Use "and"; ${CASES}.`,
  bang: 'Describe what happened and what to do next, without an exclamation mark; `Alert` with status="error" already carries the tone.',
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow spaced ×, all-caps words outside the glossary, " & " and ! in error strings in display copy.',
    },
    schema: [],
    messages: {
      times: `Copy "{{value}}" has a spaced multiplication sign. ${FIXES.times}`,
      caps: `Copy "{{value}}" is an all-caps word outside the copy glossary. ${FIXES.caps}`,
      ampersand: `Copy "{{value}}" stands in for "and". ${FIXES.ampersand}`,
      bang: `Copy "{{value}}" puts an exclamation mark in an error. ${FIXES.bang}`,
      stale: `${BASELINE_FILE} still allows {{count}} "{{value}}" this file no longer has. Use \`scripts/update-no-copy-pitfalls-baseline.mjs\` to shrink the baseline so the site can't come back unnoticed.`,
    },
  },

  create(context) {
    const baseline = fileBaseline(context)

    function check(node, isError) {
      for (const { messageId, value } of findPitfalls(copyText(node), isError)) {
        if (!baseline.spend(value)) context.report({ node, messageId, data: { value } })
      }
    }

    return {
      JSXText(node) {
        check(node, insideErrorContainer(node))
      },

      ':matches(JSXElement, JSXFragment) > JSXExpressionContainer'(node) {
        for (const copy of copyNodes(node.expression)) check(copy, insideErrorContainer(node))
      },

      JSXAttribute(node) {
        const name = attributeName(node)
        if (!isDisplayProp(name)) return
        const isError = ERROR_PROP.test(name) || insideErrorContainer(node.parent)
        for (const copy of copyNodes(node.value)) check(copy, isError)
      },

      'Program:exit'() {
        for (const [value, count] of baseline.unspent()) {
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
