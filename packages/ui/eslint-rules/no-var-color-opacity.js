/**
 * ESLint rule: no-var-color-opacity
 *
 * Tailwind v3 cannot apply an opacity modifier to a colour whose value is a
 * `var(--…)` reference. It does not warn, it does not fall back — it emits NO
 * RULE AT ALL, and the class is dead CSS on web. Every colour in
 * `tailwind.config.js` is var()-backed (that is what makes light/dark switching
 * work), so `bg-brand-primary/10` has always been invisible while the
 * literal-valued `text-white/70` and `bg-black/50` compile fine. That asymmetry
 * is why this shipped unnoticed in four components for months (VW-308).
 *
 * The banned set is DERIVED from `tailwind.config.js`, not hardcoded: any colour
 * leaf whose value matches `var(--color-…)` is flagged when a `/<n>` modifier
 * follows it. So a new token is covered the day it is added, and `white`,
 * `black`, `transparent` and the rest of Tailwind's literal palette stay usable.
 *
 * Use instead:
 *   - a wash rung — `bg-brand-primary-subtle` / `-muted` / `-strong`
 *   - `alpha(resolvedColor, a)` from `src/utils/colors.ts` for an inline style
 *   - a role that already means the state — `text-text-disabled`, `hairline-*`
 *
 * Errors rather than warns: the four call sites are fixed, so this holds the
 * line at zero instead of documenting a backlog.
 */

const path = require('node:path')

/** `brand.primary.DEFAULT` -> the `brand-primary` class suffix. */
function flattenColors(node, prefix = [], out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = key === 'DEFAULT' ? prefix : [...prefix, key]
    if (value && typeof value === 'object') flattenColors(value, nextPrefix, out)
    else if (typeof value === 'string') out[nextPrefix.join('-')] = value
  }
  return out
}

const tailwindConfig = require(path.join(__dirname, '..', 'tailwind.config.js'))
const VAR_BACKED = new Set(
  Object.entries(flattenColors(tailwindConfig.theme?.extend?.colors ?? {}))
    .filter(([, value]) => /^var\(--color-/.test(value))
    .map(([name]) => name)
)

/**
 * A utility with an opacity modifier: an optional variant chain (`web:hover:`),
 * a colour-taking property prefix, the colour name, then `/<n>` or `/[…]`.
 */
const OPACITY_UTILITY =
  /\b(?:[a-z][a-z0-9-]*:)*(bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration|divide|accent|caret|placeholder)-([a-z][a-zA-Z0-9-]*)\/(?:\[[^\]]+\]|\d+)/g

function findViolations(text) {
  const found = []
  for (const match of text.matchAll(OPACITY_UTILITY)) {
    if (VAR_BACKED.has(match[2])) found.push({ className: match[0], token: match[2] })
  }
  return found
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Tailwind opacity modifiers on var()-backed colour tokens, which compile to nothing',
    },
    schema: [],
    messages: {
      deadClass:
        '`{{className}}` compiles to no CSS rule: Tailwind v3 cannot apply an opacity modifier to the var()-backed token `{{token}}`. Use a wash rung (`-subtle`/`-muted`/`-strong`) where the role publishes one, a role that already means the state, or `alpha()` in an inline style. See VW-308.',
    },
  },

  create(context) {
    function check(node, text) {
      for (const { className, token } of findViolations(text)) {
        context.report({ node, messageId: 'deadClass', data: { className, token } })
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value)
      },
      TemplateElement(node) {
        check(node, node.value.raw)
      },
    }
  },
}
