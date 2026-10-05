/**
 * `no-restricted-syntax` entries for `eslint.config.js`, grouped by what they
 * guard (TD-23 S3). Each group is a plain list of `{ selector, message }` that a
 * config block spreads into its rule options; flat config replaces the rule per
 * file, so a block repeats every group it needs.
 *
 * The selectors are the detection and must not drift: a message may change, a
 * selector only with its own task. Messages follow the contract in README.md,
 * with options from `color-options.js`.
 */

const { familyClasses, styleOptions, optionList } = require('./color-options')

const gradientMessage =
  'Inline linear-gradient string: the theme owns gradient stops, so build it with `linearGradient(from, to, angle)` or a surfaceGradient preset from `theme/gradients`.'

const semanticClasses = [familyClasses('bg', 'surface')[0], familyClasses('text', 'text')[0]]

const hexMessage = `Raw hex colour: the token layer owns colour. Use a semantic className (${optionList(semanticClasses)}), or in a style ${styleOptions}.`

const frozenThemeMessage = `getSemanticColors() without useSurfaceMode() freezes colour to one theme; the surface context owns the mode. Resolve at render time with ${styleOptions}, or call \`getSemanticColors(useSurfaceMode())\` for a whole palette. See TOKENS.md §3.`

const gradient = [
  { selector: 'Literal[value=/linear-gradient/]', message: gradientMessage },
  { selector: 'TemplateElement[value.raw=/linear-gradient/]', message: gradientMessage },
]

const hex = [
  { selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]', message: hexMessage },
  { selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]', message: hexMessage },
]

// The `:not(:has(...))` clause carves out exactly the render-time form the
// message recommends (VW-381): a bare selector on the call name banned that
// form too, since it can't see the argument.
const frozenTheme = [
  {
    selector:
      'CallExpression[callee.name="getSemanticColors"]:not(:has(> CallExpression[callee.name="useSurfaceMode"]))',
    message: frozenThemeMessage,
  },
]

module.exports = { gradient, hex, frozenTheme }
