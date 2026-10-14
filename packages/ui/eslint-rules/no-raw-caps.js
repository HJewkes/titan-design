/**
 * ESLint rule: no-raw-caps
 *
 * Case, tracking and the small type sizes are role decisions, and the Typography variants own
 * them (TD-782). An uppercase label is the eyebrow role (card, stat, section and menu group
 * headers: `overline`), the column, axis-category and track label role (`microLabel`) or the
 * status token role (`monoLabel`). Each variant fixes its own tracking, and the type scale
 * fixes the size. A hand-rolled `uppercase tracking-wider text-[10px]` picks a fourth tracking
 * and a size off the scale, which is how one role came to render six ways.
 *
 * Flags, outside `Typography.tsx` and `Eyebrow.tsx` (the config scopes it):
 *   - the class tokens `uppercase`, `tracking-*` and `text-[Npx]` in any string or template
 *     literal, variant prefixes (`web:`, `md:`) and `!` included;
 *   - a `textTransform` or `letterSpacing` property in an object, the inline-style dialect, or
 *     as a JSX attribute (react-native-svg's `Text`).
 * A string that is the value of one of those properties (`as const` included), or a TypeScript
 * literal type, is not a class list and is left alone, so `textTransform: 'uppercase'` reports once.
 *
 * RATCHET, same shape as no-unstyled-text: today's sites are recorded in
 * `no-raw-caps-baseline.json`, keyed by file and then message id (`uppercase`, `tracking`,
 * `arbitrarySize`, `textTransform`, `letterSpacing`), so swapping a baselined `uppercase` for
 * a `letterSpacing` is still a new site. The baseline only shrinks, and it must stay exact: an
 * allowance a file no longer spends is reported as `stale`.
 *
 *   Regenerate after fixing some:  node scripts/update-no-raw-caps-baseline.mjs
 */

const { loadBaseline, baselineKey } = require('./ratchet')

const BASELINE_FILE = 'no-raw-caps-baseline.json'
const STYLE_PROPERTIES = new Set(['textTransform', 'letterSpacing'])
const VARIANT_PREFIX = /^(?:[\w-]+:)*!?/

/** The message id a class token spends, or null when the token is not a caps treatment. */
function classKind(token) {
  const bare = token.replace(VARIANT_PREFIX, '')
  if (bare === 'uppercase') return 'uppercase'
  if (bare.startsWith('tracking-')) return 'tracking'
  if (/^text-\[\d*\.?\d+px\]$/.test(bare)) return 'arbitrarySize'
  return null
}

/** The property's name, whether written bare or quoted. */
function propertyName(node) {
  if (node.computed) return null
  if (node.key.type === 'Identifier') return node.key.name
  if (node.key.type === 'Literal' && typeof node.key.value === 'string') return node.key.value
  return null
}

const TS_WRAPPERS = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'])

/** A style property's value or a type position: the property itself is the site, not its string. */
function isNotAClassList(node) {
  let value = node
  while (TS_WRAPPERS.has(value.parent?.type)) value = value.parent
  const parent = value.parent
  if (node.parent?.type === 'TSLiteralType') return true
  return (
    parent?.type === 'Property' &&
    parent.value === value &&
    STYLE_PROPERTIES.has(propertyName(parent))
  )
}

const unspent = (remaining) => [...remaining.values()].reduce((sum, n) => sum + n, 0)

const ROLE_OPTIONS =
  'Render `Typography` with the variant for the role: `variant="overline"` for an eyebrow ' +
  '(card, stat, section or menu group header), `variant="microLabel"` for a column, axis-category ' +
  'or track label, `variant="monoLabel"` for a status token, or compose `Eyebrow`.'
const HATCH =
  'A site that must stay keeps `// eslint-disable-next-line titan/no-raw-caps -- <why>`.'

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hand-rolled uppercase, tracking and pixel type sizes outside Typography and Eyebrow, outside the shrink-only baseline.',
    },
    schema: [],
    messages: {
      uppercase:
        'Class "{{value}}" hand-rolls an uppercase label. Uppercase is a label treatment the Typography ' +
        `variants own, together with the tracking and size that go with it. ${ROLE_OPTIONS} ` +
        'Titles, sentences, values and control labels stay sentence case. ' +
        HATCH,
      tracking:
        'Class "{{value}}" hand-rolls letter-spacing. Each Typography variant owns its tracking, so a label ' +
        `with its own picks a tracking no other label of its role has. ${ROLE_OPTIONS} ` +
        HATCH,
      arbitrarySize:
        'Class "{{value}}" sets a type size off the scale. The Typography variants and the font-size scale own ' +
        `type size. ${ROLE_OPTIONS} Other text uses a scale class such as \`text-2xs\` or \`text-xs\`. ` +
        HATCH,
      textTransform:
        'Inline `textTransform` hand-rolls a case treatment. Uppercase is a label treatment the Typography ' +
        `variants own, together with its tracking and size. ${ROLE_OPTIONS} ` +
        HATCH,
      letterSpacing:
        'Inline `letterSpacing` hand-rolls tracking. Each Typography variant owns its tracking, so a label ' +
        `with its own picks a tracking no other label of its role has. ${ROLE_OPTIONS} ` +
        HATCH,
      stale: `${BASELINE_FILE} still allows {{count}} caps treatment(s) this file no longer has. Use \`scripts/update-no-raw-caps-baseline.mjs\` to shrink the baseline so the site can't come back unnoticed.`,
    },
  },

  create(context) {
    const remaining = new Map(
      Object.entries(loadBaseline(BASELINE_FILE)[baselineKey(context)] ?? {})
    )

    const spend = (messageId, node, value) => {
      const left = remaining.get(messageId) ?? 0
      if (left > 0) {
        remaining.set(messageId, left - 1)
        return
      }
      context.report({ node, messageId, data: { value } })
    }

    const checkClasses = (text, node) => {
      for (const token of text.split(/\s+/)) {
        const kind = classKind(token)
        if (kind) spend(kind, node, token)
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string' || isNotAClassList(node)) return
        checkClasses(node.value, node)
      },

      TemplateElement(node) {
        checkClasses(node.value.raw, node)
      },

      Property(node) {
        const name = propertyName(node)
        if (STYLE_PROPERTIES.has(name)) spend(name, node.key, name)
      },

      // react-native-svg's Text takes the same two as props.
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : null
        if (STYLE_PROPERTIES.has(name)) spend(name, node.name, name)
      },

      'Program:exit'() {
        const count = unspent(remaining)
        if (count === 0) return
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'stale',
          data: { count: String(count) },
        })
      },
    }
  },
}
