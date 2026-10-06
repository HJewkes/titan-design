/**
 * ESLint rule: no-raw-spacing
 *
 * The bracket-form selectors in `eslint.config.js` catch `gap-[3px]` in a
 * className. They cannot see the other dialect: `paddingVertical: 9` and
 * `padding: '9px 12px'` in an inline style object, which is how the specimen-
 * derived components write spacing. The audit behind AW-142 found the off-scale
 * tail there — 3, 5, 7, 9, 11, 18, 22, 26, 30px — including unnamed optical
 * nudges repeated across files.
 *
 * Flags a numeric or shorthand-string literal on `padding*`, `margin*`, `gap`,
 * `rowGap` and `columnGap` inside an object expression. `0` is never flagged:
 * zero is the absence of spacing, not a value off the scale (`-0` included).
 * A negative number (`marginLeft: -7`) is the same value as its positive twin.
 *
 * EXEMPTION — a `// optical: <why>` comment on the same line or the line above:
 *
 *   // optical: the glyph's baseline sits 1px high in this weight
 *   paddingTop: 7,
 *
 * That escape hatch is the reason this is a rule and not two more
 * `no-restricted-syntax` selectors: a selector cannot read comments. Spacing
 * that is genuinely optical stays, and says why; spacing that is just untokenised
 * gets a token. Documented in TOKENS.md §5.
 *
 * No baseline. AW-142 decision 2 is one allow-list of enrolled files, extended
 * as each migration wave lands — not a second count ratchet.
 */

const { spacingAdvice } = require('./spacing-options')

const SPACING_PROPERTY = /^(padding|margin)([A-Z]|$)|^(gap|rowGap|columnGap)$/

/** A CSS length shorthand: `'9px'`, `'9px 12px'`, `'1px 2px 3px 4px'`. */
const LENGTH_SHORTHAND = /^\s*-?[0-9.]+(px|rem|em)?(\s+-?[0-9.]+(px|rem|em)?){0,3}\s*$/

/** The first length of a shorthand in px (`rem` and `em` at 16), the one the advice is for. */
function firstLengthPx(shorthand) {
  const [, number, unit] = /^\s*(-?[0-9.]+)(px|rem|em)?/.exec(shorthand)
  return Number(number) * (unit === 'rem' || unit === 'em' ? 16 : 1)
}

const OPTICAL = /^\s*optical:\s*\S/

/** The property's name, whether written bare or quoted. */
function propertyName(node) {
  if (node.computed) return null
  if (node.key.type === 'Identifier') return node.key.name
  if (node.key.type === 'Literal' && typeof node.key.value === 'string') return node.key.value
  return null
}

/**
 * The literal behind a value, seeing through a unary minus: `-7` parses as a
 * UnaryExpression over the Literal 7, and is the same off-scale value as 7.
 */
function spacingLiteral(valueNode) {
  if (valueNode.type === 'Literal') return { node: valueNode, negative: false }
  if (
    valueNode.type === 'UnaryExpression' &&
    valueNode.operator === '-' &&
    valueNode.argument.type === 'Literal' &&
    typeof valueNode.argument.value === 'number'
  ) {
    return { node: valueNode.argument, negative: true }
  }
  return null
}

/** True when a `// optical: …` comment sits on this line or the one above. */
function hasOpticalComment(sourceCode, node) {
  const line = node.loc.start.line
  return sourceCode
    .getAllComments()
    .some(
      (comment) =>
        OPTICAL.test(comment.value) &&
        (comment.loc.end.line === line || comment.loc.end.line === line - 1)
    )
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw numeric and shorthand-string spacing values on padding/margin/gap properties.',
    },
    schema: [],
    messages: {
      rawSpacing:
        "Raw spacing '{{property}}: {{value}}': the token layer owns spacing, so {{advice}}, or add `// optical: <why>`. See TOKENS.md §5.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode()

    function report(node, property, value, px) {
      if (hasOpticalComment(sourceCode, node)) return
      const advice = spacingAdvice(px)
      context.report({ node, messageId: 'rawSpacing', data: { property, value, advice } })
    }

    return {
      'ObjectExpression > Property'(node) {
        const property = propertyName(node)
        if (!property || !SPACING_PROPERTY.test(property)) return
        const literal = spacingLiteral(node.value)
        if (!literal) return

        const value = literal.negative ? -literal.node.value : literal.node.value
        if (typeof value === 'number' && value !== 0) {
          report(node, property, value, value)
        } else if (typeof value === 'string' && value !== '0' && LENGTH_SHORTHAND.test(value)) {
          report(node, property, `'${value}'`, firstLengthPx(value))
        }
      },
    }
  },
}
