/**
 * ESLint rule: no-raw-color
 *
 * Colour in titan has exactly one source of truth: the OKLCH tonal ramps, and
 * the semantic tokens that reference them. A raw colour written into a component
 * bypasses that — it can't respond to a theme, can't be audited for contrast or
 * colourblind safety, and won't move when the ramps are re-spaced. The v0.10.0
 * surface work made that concrete: re-spacing the dark ramp updated every
 * tokenised surface automatically and left every hardcoded one behind.
 *
 * RATCHET, not a wall. There are existing violations, and a rule that fails on
 * all of them would simply be switched off. So each file carries an allowance in
 * `raw-color-baseline.json`: occurrences up to that count pass, and the first
 * one beyond it fails. New colour can't get in, and the backlog can be burned
 * down file by file without a flag day.
 *
 * Regenerate after burning some down:  node scripts/update-raw-color-baseline.mjs
 * The generator shares its detection with this rule (raw-color-patterns.js), so
 * the baseline always describes what the rule actually counts.
 *
 * NOT flagged, deliberately:
 *   - `transparent` — encodes absence, has no token equivalent
 *   - `currentColor` — defers to the cascade, which is the desired behaviour
 *   - anything in `src/theme/**` — that IS the colour system
 *   - a bare colour word passed as a `color`/`variant`/`tone` JSX attribute, or
 *     listed in a Storybook `argTypes.*.options` array — an enum member, not a
 *     colour to theme (see isEnumMemberLiteral)
 *   - a bare colour word used as `{ value, label }` demo data (see isDemoOptionLiteral)
 *   - documentation text in a `<Text>` element's children, e.g. a CSS-reference
 *     code block (see isTextChildDoc) — a `style` prop on the same element is
 *     unaffected and still flagged
 */

const path = require('node:path')
const { extractRawColors, NAMED_KEYWORD } = require('./raw-color-patterns')

/** Colour-ish JSX attribute names accepted by the enum-member heuristic below. */
const ENUM_COLOR_PROP_NAMES = /^(color|variant|tone)$/i

/**
 * The rule runs without type info, so it can't see that a prop's type is a
 * closed string union (e.g. `SpinnerColor`). Heuristic: a bare colour WORD
 * (not hex/rgb — those still get flagged) is an enum member, not a colour to
 * theme, when it's either the value of a `color`/`variant`/`tone` JSX
 * attribute (`<Spinner color="white" />`) or an element of a Storybook
 * `argTypes.*.options` array listing that same enum's members.
 */
function isEnumMemberLiteral(node) {
  if (node.type !== 'Literal' || typeof node.value !== 'string') return false
  if (!NAMED_KEYWORD.test(node.value.trim())) return false

  const parent = node.parent
  if (parent?.type === 'JSXAttribute' && ENUM_COLOR_PROP_NAMES.test(parent.name?.name ?? '')) {
    return true
  }
  return (
    parent?.type === 'ArrayExpression' &&
    parent.parent?.type === 'Property' &&
    parent.parent.key?.name === 'options'
  )
}

/**
 * `{ value, label }` demo-data objects (e.g. Select story options) reuse
 * colour words as arbitrary IDs, not styling. Heuristic: a bare colour word
 * that is the `value` or `label` property of an object literal which carries
 * both a `value` and a `label` property.
 */
function isDemoOptionLiteral(node) {
  if (node.type !== 'Literal' || typeof node.value !== 'string') return false
  if (!NAMED_KEYWORD.test(node.value.trim())) return false

  const prop = node.parent
  if (prop?.type !== 'Property' || !['value', 'label'].includes(prop.key?.name)) return false
  const obj = prop.parent
  if (obj?.type !== 'ObjectExpression') return false
  const keys = obj.properties.map((p) => p.key?.name)
  return keys.includes('value') && keys.includes('label')
}

/**
 * Text rendered as documentation content (e.g. a CSS-reference code block)
 * inside a `<Text>` element's children is prose, not a styling value. Only
 * matches when the literal sits in the element's *children* — a `style` prop
 * on the same `<Text>` walks to a JSXAttribute instead and still gets flagged.
 */
function isTextChildDoc(node) {
  let container = node
  while (container && container.type !== 'JSXExpressionContainer') container = container.parent
  const host = container?.parent
  return host?.type === 'JSXElement' && host.openingElement?.name?.name === 'Text'
}

let baselineCache = null
function loadBaseline() {
  if (baselineCache) return baselineCache
  try {
    baselineCache = require('./raw-color-baseline.json')
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
        'Disallow raw colour values outside the theme layer; use semantic tokens or ramp references.',
    },
    schema: [],
    messages: {
      hex: 'Raw hex colour. Use a semantic token (getSemanticColors / Surface / a className) so this follows the ramps and the theme.',
      functional:
        'Raw {{ notation }} colour. For translucency, derive it from a token (alpha(token, n)) rather than hardcoding channels.',
      twPalette:
        'Tailwind palette colour. titan ships its own ramps — use a semantic utility (bg-surface-raised, text-text-primary) instead of Tailwind’s default palette.',
      twAchromatic:
        'Tailwind white/black. Use a semantic token — pure white/black are almost never right on the dark ramp.',
      twArbitrary:
        'Arbitrary Tailwind colour value. This bypasses the token layer entirely; use a semantic utility.',
      named: 'Bare CSS colour keyword. Use a semantic token so this responds to the theme.',
    },
  },

  create(context) {
    // Remaining allowance per colour VALUE, not a plain count. Keying on the
    // value means the message lands on the colour you just added rather than on
    // whichever grandfathered literal happened to sit at the count boundary.
    const remaining = new Map(Object.entries(loadBaseline()[baselineKey(context)] ?? {}))

    const check = (text, node, loc) => {
      for (const { value, id } of extractRawColors(text)) {
        const left = remaining.get(value) ?? 0
        if (left > 0) {
          remaining.set(value, left - 1)
          continue
        }
        const data = { notation: id === 'functional' ? 'functional' : id }
        context.report(loc ? { loc, messageId: id, data } : { node, messageId: id, data })
        return // one message per literal is enough to act on
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return
        if (isEnumMemberLiteral(node) || isDemoOptionLiteral(node) || isTextChildDoc(node)) return
        check(node.value, node)
      },
      TemplateElement(node) {
        if (isTextChildDoc(node)) return
        check(node.value.raw, node)
      },
    }
  },
}
