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
const { nearestClasses, typeOptions } = require('./spacing-options')

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

// Arbitrary spacing / radius / type values. `w-[420px]` and `min-w-[130px]` are
// deliberate layout geometry and stay allowed; the scale properties are where a
// specimen's hand-tuned pixels leak into the library.
const SCALE_PROPS =
  '\\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|text|rounded|space-x|space-y)-\\[[0-9.]+px\\]'

const arbitraryMessage = `Arbitrary spacing/radius/type value: the scale owns it, so use the nearest step (\`gap-[13px]\` becomes ${optionList(nearestClasses('gap', 13)).replace(', ', ' or ')}), or a semantic key. See TOKENS.md §5.`

const arbitrarySpacing = [
  { selector: `Literal[value=/${SCALE_PROPS}/]`, message: arbitraryMessage },
  { selector: `TemplateElement[value.raw=/${SCALE_PROPS}/]`, message: arbitraryMessage },
]

const fontSizeMessage = `Hardcoded inline fontSize defeats the type scale: use ${typeOptions}. See TOKENS.md §4.`

// Restricted to literals on purpose: a *computed* size
// (`fontSize: valueLabelFontSize(height)`) is chart geometry fitting text to its
// container, which no scale can express — that stays allowed.
const fontSize = [
  { selector: 'Property[key.name="fontSize"][value.type="Literal"]', message: fontSizeMessage },
]

module.exports = { gradient, hex, arbitrarySpacing, fontSize, frozenTheme }
