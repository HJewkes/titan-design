/**
 * ESLint rule: no-unstyled-text
 *
 * On React Native Web a `Text` inherits nothing from the `View` around it, so a bare
 * `<Text>{badge}</Text>` renders black 14px System instead of the theme's text colour and
 * font (TD-358 / #601). jsdom strips NativeWind classes, so no unit test sees it; this rule
 * is the guard (TD-659).
 *
 * Flags a JSX element whose name resolves to `Text` imported from `react-native` (or
 * `react-native-web`, which tests alias it to), renamed imports and namespace imports
 * (`RN.Text`) included, when it has none of:
 *   - a `className` or `style` attribute;
 *   - a spread attribute, which may carry either;
 *   - a Text ancestor in the JSX tree, reached through children (not attributes), since a
 *     nested Text inherits its parent's style. Callbacks inside children (`items.map`) are
 *     walked through.
 * A Text passed as a prop value or returned from a render helper has no JSX ancestor the rule
 * can see, so it is flagged: where it lands is up to the receiving component.
 *
 * RATCHET, same shape as no-truncation: today's sites are recorded in
 * `no-unstyled-text-baseline.json`, keyed by file. The baseline only shrinks, and it must stay
 * exact: an allowance a file no longer spends is reported as `stale`.
 *
 *   Regenerate after fixing some:  node scripts/update-no-unstyled-text-baseline.mjs
 */

const { loadBaseline, baselineKey } = require('./ratchet')

const TEXT_SOURCES = new Set(['react-native', 'react-native-web'])
const STYLE_ATTRIBUTES = new Set(['className', 'style'])
const BASELINE_FILE = 'no-unstyled-text-baseline.json'
const BASELINE_KEY = 'unstyled'

/** The local names `Text` is bound to, and the namespaces it can be read from. */
function textBindings(program) {
  const names = new Set()
  const namespaces = new Set()
  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration' || !TEXT_SOURCES.has(node.source.value)) continue
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportNamespaceSpecifier') namespaces.add(spec.local.name)
      if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Text') {
        names.add(spec.local.name)
      }
    }
  }
  return { names, namespaces }
}

function isText(openingElement, { names, namespaces }) {
  const name = openingElement.name
  if (name.type === 'JSXIdentifier') return names.has(name.name)
  return (
    name.type === 'JSXMemberExpression' &&
    name.object.type === 'JSXIdentifier' &&
    namespaces.has(name.object.name) &&
    name.property.name === 'Text'
  )
}

function hasStyleSource(openingElement) {
  return openingElement.attributes.some(
    (attribute) =>
      attribute.type === 'JSXSpreadAttribute' ||
      (attribute.name.type === 'JSXIdentifier' && STYLE_ATTRIBUTES.has(attribute.name.name))
  )
}

/** True when a Text ancestor holds `element` among its children; a prop value stops the walk. */
function insideText(element, bindings) {
  for (let node = element.parent; node; node = node.parent) {
    if (node.type === 'JSXAttribute') return false
    if (node.type === 'JSXElement' && isText(node.openingElement, bindings)) return true
  }
  return false
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a react-native Text with no className, style or Text ancestor outside the shrink-only baseline.',
    },
    schema: [],
    messages: {
      unstyled:
        'Bare react-native Text renders black 14px System on web: it inherits nothing from the View around it. ' +
        'The theme owns text colour and font. Use `Typography` with a variant such as `variant="body2"`, ' +
        'add a className such as `text-text-secondary`, or move it inside another Text.',
      stale: `${BASELINE_FILE} still allows {{count}} bare Text this file no longer has. Use \`scripts/update-no-unstyled-text-baseline.mjs\` to shrink the baseline so the site can't come back unnoticed.`,
    },
  },

  create(context) {
    let allowance = loadBaseline(BASELINE_FILE)[baselineKey(context)]?.[BASELINE_KEY] ?? 0
    let bindings

    return {
      Program(node) {
        bindings = textBindings(node)
      },

      JSXElement(node) {
        const opening = node.openingElement
        if (!isText(opening, bindings) || hasStyleSource(opening)) return
        if (insideText(node, bindings)) return
        if (allowance > 0) {
          allowance -= 1
          return
        }
        context.report({ node: opening, messageId: 'unstyled' })
      },

      'Program:exit'() {
        if (allowance === 0) return
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'stale',
          data: { count: String(allowance) },
        })
      },
    }
  },
}
