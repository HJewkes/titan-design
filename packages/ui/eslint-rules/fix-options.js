/**
 * Fix options for titan/* lint messages, derived from the sources that define
 * them (TD-189, TD-23 S1).
 *
 * A message that lists the classes, keys or exports an agent may write instead
 * is only useful while that list is current, so nothing here is hand-kept:
 * colours, spacing, font sizes and radii come from `tailwind.config.js`; the
 * semantic spacing px values from the `:root` block of `global.css`; and the TS
 * unions, story roots and formatter exports from their source via
 * `ts-source.js`. `fromConfig` is pure so a test can run it on a fixture config.
 */

const fs = require('node:fs')
const path = require('node:path')
const { readStringUnion, readExportedFunctions, readArrayAt } = require('./ts-source')

const PKG_ROOT = path.join(__dirname, '..')
const SRC = path.join(PKG_ROOT, 'src')

/** `brand.primary.DEFAULT` -> the `brand-primary` class suffix. */
function flattenColors(node, prefix = [], out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = key === 'DEFAULT' ? prefix : [...prefix, key]
    if (value && typeof value === 'object') flattenColors(value, nextPrefix, out)
    else if (typeof value === 'string') out[nextPrefix.join('-')] = value
  }
  return out
}

/** Role class -> its leaf keys (`scrim` -> `DEFAULT`, `subtle`, …), for every node that has leaves. */
function collectRungs(node, prefix = [], out = {}) {
  const leaves = Object.keys(node).filter((key) => typeof node[key] === 'string')
  if (prefix.length > 0 && leaves.length > 0) out[prefix.join('-')] = leaves
  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object') collectRungs(value, [...prefix, key], out)
  }
  return out
}

function colorsByRoot(colors) {
  const byRoot = {}
  for (const [root, value] of Object.entries(colors)) {
    byRoot[root] = Object.keys(flattenColors({ [root]: value }))
  }
  return byRoot
}

/** `--name: value;` declarations of the first real `:root { … }` block; comments are ignored. */
function parseRootVars(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const block = /:root\s*\{([^}]*)\}/.exec(stripped)?.[1]
  if (block === undefined) throw new Error('fix-options: no :root block in the css')
  const vars = Object.fromEntries(
    [...block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])
  )
  if (Object.keys(vars).length === 0) throw new Error('fix-options: :root block declares no vars')
  return vars
}

const pxOf = (value) => {
  if (value === '0') return 0
  const match = /^(-?[\d.]+)px$/.exec(String(value).trim())
  return match ? Number(match[1]) : null
}

function spacingStepsOf(spacing) {
  return Object.entries(spacing)
    .map(([key, value]) => ({ key, px: pxOf(value) }))
    .filter((step) => step.px !== null)
    .sort((a, b) => a.px - b.px)
}

/** `squish-x-md` -> `space.squish.x.md`, the JS key a style object uses. */
const spaceJsKey = (key) => `space.${key.split('-').join('.')}`

function semanticSpacingOf(extendSpacing, rootVars) {
  return Object.entries(extendSpacing).map(([key, value]) => {
    const varName = /^var\(--([\w-]+)\)$/.exec(value)?.[1]
    return { key, px: varName ? pxOf(rootVars[varName] ?? '') : null, jsKey: spaceJsKey(key) }
  })
}

function nearestSpacingFrom(steps, semantic) {
  const at = (step) =>
    step && {
      ...step,
      spaceKeys: semantic.filter((s) => s.px === step.px).map((s) => s.jsKey),
    }
  return function nearestSpacing(px) {
    const below = [...steps].reverse().find((step) => step.px <= px)
    const above = steps.find((step) => step.px >= px)
    return { below: at(below), above: at(above) }
  }
}

const isPlainObject = (value) => Boolean(value) && typeof value === 'object'

/** Tailwind's merge of `theme.x` with `theme.extend.x`: nested objects merge, leaves are replaced. */
function deepMerge(base, extra) {
  const out = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMerge(out[key], value) : value
  }
  return out
}

/** Colour, spacing, font-size and radius options from a Tailwind config (and its `global.css`). */
function fromConfig(config, css = '') {
  const theme = config.theme ?? {}
  const extend = theme.extend ?? {}
  // Read both: a theme-replace would move colours out of `extend` (TD-23 section 0, item 4).
  const colors = deepMerge(theme.colors ?? {}, extend.colors ?? {})
  const spacingSteps = spacingStepsOf(theme.spacing ?? {})
  const semanticSpacing = semanticSpacingOf(extend.spacing ?? {}, css ? parseRootVars(css) : {})
  return {
    colors: flattenColors(colors),
    colorsByRoot: colorsByRoot(colors),
    rungsByRole: collectRungs(colors),
    spacingSteps,
    semanticSpacing,
    nearestSpacing: nearestSpacingFrom(spacingSteps, semanticSpacing),
    fontSizes: Object.keys({ ...(theme.fontSize ?? {}), ...(extend.fontSize ?? {}) }),
    radii: Object.keys({ ...(theme.borderRadius ?? {}), ...(extend.borderRadius ?? {}) }),
  }
}

const FORMATTER_MODULES = ['utils/number-format', 'utils/workout-format']

function loadFormatterExports() {
  return Object.fromEntries(
    FORMATTER_MODULES.map((mod) => [mod, readExportedFunctions(path.join(SRC, `${mod}.ts`))])
  )
}

/** Each export a message may recommend -> the `src`-relative module that exports it. */
function symbolsFor(formatterExports) {
  const symbols = {
    alpha: 'utils/colors',
    resolveColor: 'theme/resolve-color',
    useOnSurfaceColor: 'components/ui/surface/SurfaceContext',
    linearGradient: 'theme/gradients',
    surfaceGradient: 'theme/gradients',
    space: 'theme/tokens/semantic',
    getSemanticColors: 'theme/tokens/semantic',
  }
  for (const [mod, names] of Object.entries(formatterExports)) {
    for (const name of names) symbols[name] = mod
  }
  return symbols
}

const PREVIEW = path.join(PKG_ROOT, '.storybook', 'preview.tsx')

/** Top-level sidebar roots: the string entries of `storySort.order`, without the nested child lists. */
function storyRootsOf(file = PREVIEW, source) {
  const order = readArrayAt(file, 'preview.parameters.options.storySort.order', source)
  return order.filter((entry) => typeof entry === 'string')
}

function loadDefaults() {
  const config = require(path.join(PKG_ROOT, 'tailwind.config.js'))
  const css = fs.readFileSync(path.join(SRC, 'theme', 'global.css'), 'utf8')
  const formatterExports = loadFormatterExports()
  return {
    ...fromConfig(config, css),
    typographyVariants: readStringUnion(
      path.join(SRC, 'components/ui/typography/Typography.tsx'),
      'TypographyVariant'
    ),
    onSurfaceRoles: readStringUnion(
      path.join(SRC, 'components/ui/surface/SurfaceContext.ts'),
      'OnSurfaceRole'
    ),
    storyRoots: storyRootsOf(),
    formatterExports,
    SYMBOLS: symbolsFor(formatterExports),
  }
}

module.exports = { ...loadDefaults(), fromConfig, flattenColors, parseRootVars, storyRootsOf }
