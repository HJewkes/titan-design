/**
 * ESLint rule: no-html-element
 *
 * Components render on web and native, so they compose react-native primitives (CLAUDE.md,
 * Cross-Platform First): View, Text, Pressable, TextInput, Image and ScrollView. A lowercase
 * JSX element (`<div>`, `<path>`) is a DOM intrinsic that only react-native-web can mount, and
 * jsdom renders it fine, so no unit test notices (TD-689).
 *
 * Flags every JSX element whose name is a lowercase identifier, since React treats that as an
 * intrinsic. Three messages, so the fix named is the right one:
 *   - `html`: a DOM element, with the react-native primitive it maps to;
 *   - `anchor`: an `<a>`, which titan already wraps as the exported `Link` (TD-690);
 *   - `svg`: an SVG element, with the react-native-svg component of the same name.
 * `<Foo.bar>` is a member expression, not an intrinsic, and is left alone.
 *
 * RATCHET, same shape as no-unstyled-text: today's sites are recorded in
 * `no-html-element-baseline.json`, keyed by file and then element name, so swapping a
 * baselined `<path>` for a `<div>` is still a new site. The baseline only shrinks, and it must
 * stay exact: an allowance a file no longer spends is reported as `stale`.
 *
 *   Regenerate after fixing some:  node scripts/update-no-html-element-baseline.mjs
 */

const path = require('node:path')

const BASELINE_FILE = 'no-html-element-baseline.json'

/** DOM element -> the react-native primitive that renders the same role on both platforms. */
const HTML_PRIMITIVE = {
  div: 'View',
  section: 'View',
  article: 'View',
  header: 'View',
  footer: 'View',
  nav: 'View',
  main: 'View',
  aside: 'View',
  ul: 'View',
  ol: 'View',
  li: 'View',
  table: 'View',
  thead: 'View',
  tbody: 'View',
  tr: 'View',
  td: 'View',
  th: 'View',
  form: 'View',
  figure: 'View',
  hr: 'View',
  span: 'Text',
  p: 'Text',
  h1: 'Text',
  h2: 'Text',
  h3: 'Text',
  h4: 'Text',
  h5: 'Text',
  h6: 'Text',
  label: 'Text',
  strong: 'Text',
  em: 'Text',
  b: 'Text',
  i: 'Text',
  small: 'Text',
  code: 'Text',
  pre: 'Text',
  blockquote: 'Text',
  time: 'Text',
  button: 'Pressable',
  input: 'TextInput',
  textarea: 'TextInput',
  img: 'Image',
  picture: 'Image',
}

/** SVG element -> the react-native-svg component of the same role. */
const SVG_COMPONENT = {
  svg: 'Svg',
  path: 'Path',
  g: 'G',
  circle: 'Circle',
  ellipse: 'Ellipse',
  rect: 'Rect',
  line: 'Line',
  polyline: 'Polyline',
  polygon: 'Polygon',
  text: 'Text',
  tspan: 'TSpan',
  textPath: 'TextPath',
  defs: 'Defs',
  use: 'Use',
  symbol: 'Symbol',
  marker: 'Marker',
  mask: 'Mask',
  clipPath: 'ClipPath',
  pattern: 'Pattern',
  image: 'Image',
  linearGradient: 'LinearGradient',
  radialGradient: 'RadialGradient',
  stop: 'Stop',
  foreignObject: 'ForeignObject',
  filter: 'Filter',
  feGaussianBlur: 'FeGaussianBlur',
  feDropShadow: 'FeDropShadow',
  feOffset: 'FeOffset',
  feMerge: 'FeMerge',
  feMergeNode: 'FeMergeNode',
  // react-native-svg has no Title; the accessible name goes on Svg.
  title: 'an accessibilityLabel on Svg',
  desc: 'an accessibilityLabel on Svg',
}

let baselineCache = null
function loadBaseline() {
  try {
    baselineCache ??= require(`./${BASELINE_FILE}`)
  } catch {
    baselineCache = {}
  }
  return baselineCache
}

/** Baseline keys are package-relative POSIX paths, so they're stable across machines. */
function baselineKey(context) {
  const cwd = context.cwd ?? context.getCwd?.() ?? process.cwd()
  return path
    .relative(cwd, context.filename ?? context.getFilename())
    .split(path.sep)
    .join('/')
}

/** The element name when the opening element is a lowercase intrinsic, else null. */
function intrinsicName(openingElement) {
  const { name } = openingElement
  if (name.type !== 'JSXIdentifier' || !/^[a-z]/.test(name.name)) return null
  return name.name
}

function reportFor(element) {
  if (element === 'a') return { messageId: 'anchor', data: { element } }
  if (Object.hasOwn(SVG_COMPONENT, element)) {
    return { messageId: 'svg', data: { element, component: SVG_COMPONENT[element] } }
  }
  const primitive = Object.hasOwn(HTML_PRIMITIVE, element)
    ? HTML_PRIMITIVE[element]
    : 'one of View, Text, Pressable, TextInput, Image or ScrollView'
  return { messageId: 'html', data: { element, primitive } }
}

const unspent = (remaining) => [...remaining.values()].reduce((sum, n) => sum + n, 0)

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow lowercase JSX intrinsic elements (HTML and SVG) in components outside the shrink-only baseline.',
    },
    schema: [],
    messages: {
      html:
        'Lowercase <{{element}}> is an HTML element, so it mounts on web only and never on native. ' +
        'Components compose the react-native primitives: View, Text, Pressable, TextInput, Image and ScrollView ' +
        '(CLAUDE.md, Cross-Platform First). Use {{primitive}} here, or compose `Typography`, `Button` or `Input`. ' +
        'A web-only site that must stay keeps `// eslint-disable-next-line titan/no-html-element -- <why>`.',
      anchor:
        'Lowercase <{{element}}> is an HTML element, so it mounts on web only and never on native. ' +
        'Components compose the react-native primitives (CLAUDE.md, Cross-Platform First), and the navigation ' +
        'link is already one of them: `Link` (`ui/link`) wraps Pressable and Text with href, isExternal and ' +
        'isDisabled. Use `Link` here. ' +
        'A web-only site that must stay keeps `// eslint-disable-next-line titan/no-html-element -- <why>`.',
      svg:
        'Lowercase <{{element}}> is a web SVG element, so it mounts on web only and never on native. ' +
        'SVG in components goes through react-native-svg, a peer dependency that renders on both platforms, ' +
        'the same way View, Text, Pressable, TextInput, Image and ScrollView stand in for HTML. ' +
        'Use {{component}} from react-native-svg here, or compose `SvgIcon`. ' +
        'A web-only site that must stay keeps `// eslint-disable-next-line titan/no-html-element -- <why>`.',
      stale: `${BASELINE_FILE} still allows {{count}} lowercase element(s) this file no longer has. Use \`scripts/update-no-html-element-baseline.mjs\` to shrink the baseline so the site can't come back unnoticed.`,
    },
  },

  create(context) {
    const remaining = new Map(Object.entries(loadBaseline()[baselineKey(context)] ?? {}))

    return {
      JSXOpeningElement(node) {
        const element = intrinsicName(node)
        if (element === null) return
        const left = remaining.get(element) ?? 0
        if (left > 0) {
          remaining.set(element, left - 1)
          return
        }
        // Reported on the name alone, so the baseline script reads the key straight off the range.
        context.report({ node: node.name, ...reportFor(element) })
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
