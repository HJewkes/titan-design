// Layout collector for the D-35 DOM probes (TD-650). Both functions are serialised into the page, so
// they use browser globals and reach each other only as page globals: install them with
// `layoutCollectorSource` (one classic script), then call `collectLayout` from page.evaluate.
/* global document, getComputedStyle */

// Runs in the page. A short, stable selector for a finding: up to four steps from `el` towards
// `root`, stopping at a data-testid. Each step is the tag, its role and aria-label when present, and
// :nth-of-type only when same-tag siblings make the tag ambiguous.
export function buildSelectorOf(root) {
  const step = (n) => {
    const role = n.getAttribute('role')
    const label = n.getAttribute('aria-label')
    const sameTag = n.parentElement
      ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName)
      : []
    return (
      n.tagName.toLowerCase() +
      (role ? `[role="${role}"]` : '') +
      (label ? `[aria-label="${label.slice(0, 30)}"]` : '') +
      (sameTag.length > 1 ? `:nth-of-type(${sameTag.indexOf(n) + 1})` : '')
    )
  }
  return (el) => {
    if (el === root) return '#storybook-root'
    const parts = []
    for (let n = el; n && n !== root && parts.length < 4; n = n.parentElement) {
      const testId = n.getAttribute('data-testid')
      if (testId) {
        parts.unshift(`[data-testid="${testId}"]`)
        break
      }
      parts.unshift(step(n))
    }
    return parts.join(' > ')
  }
}

// Runs in the page. One node per visible element under #storybook-root, in document order. Reads
// layout only: no DOM mutation, no randomness, no time, so one frame always gives one output.
export function collectLayout({ spacingVars = [] } = {}) {
  if (document.fonts.status !== 'loaded') throw new Error('collectLayout: fonts are not ready')
  const MAX_NODES = 2000
  const root = document.querySelector('#storybook-root')
  const selectorOf = buildSelectorOf(root)
  const q = (v) => Math.round(v * 4) / 4 + 0
  const px = (v) => q(parseFloat(v) || 0)
  const rectBox = (r) => [q(r.x), q(r.y), q(r.width), q(r.height)]
  const sides = (cs, fmt) => ['Top', 'Right', 'Bottom', 'Left'].map((s) => px(cs[fmt(s)]))
  const ctx = document.createElement('canvas').getContext('2d')

  // Unlike checks.mjs, a 1px hairline counts: dividers are spacing evidence. Opacity does not
  // inherit, so every element under a transparent one is marked transparent too.
  const transparent = new Set()
  const isVisible = (el) => {
    const cs = getComputedStyle(el)
    if (Number(cs.opacity) === 0 || transparent.has(el.parentElement)) {
      transparent.add(el)
      return false
    }
    if (cs.display === 'none' || cs.visibility === 'hidden') return false
    const r = el.getBoundingClientRect()
    return Math.min(r.width, r.height) > 0 && Math.max(r.width, r.height) > 1
  }
  const INTERACTIVE_ROLES = new Set([
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'tab',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'slider',
    'textbox',
    'combobox',
    'spinbutton',
    'searchbox',
    'treeitem',
  ])
  const isTarget = (el) =>
    ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) ||
    (el.tagName === 'A' && el.hasAttribute('href')) ||
    INTERACTIVE_ROLES.has(el.getAttribute('role')) ||
    (el.hasAttribute('tabindex') && Number(el.getAttribute('tabindex')) >= 0)
  const REPLACED = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'INPUT', 'TEXTAREA', 'SELECT'])
  const alphaOf = (colour) => {
    if (!colour || colour === 'transparent') return 0
    const m = colour.match(/rgba?\(([^)]+)\)/)
    if (!m) return 1
    const parts = m[1].split(/[\s,/]+/).filter(Boolean)
    return parts.length > 3 ? parseFloat(parts[3]) : 1
  }
  const paintsBox = (el, cs) =>
    alphaOf(cs.backgroundColor) > 0 ||
    ['Top', 'Right', 'Bottom', 'Left'].some(
      (s) => parseFloat(cs[`border${s}Width`]) > 0 && alphaOf(cs[`border${s}Color`]) > 0
    ) ||
    cs.boxShadow !== 'none' ||
    REPLACED.has(el.tagName.toUpperCase())

  const ownTextNodes = (el) =>
    el.tagName === 'text'
      ? textNodesUnder(el)
      : [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
  function textNodesUnder(el) {
    const out = []
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3 && c.textContent.trim()) out.push(c)
        else if (c.nodeType === 1) walk(c)
      }
    }
    walk(el)
    return out
  }

  // A run is one text node in one font. Canvas measures at the declared size; `scale` maps that onto
  // the screen: the SVG screen matrix, or for HTML the glyph rect's height over the font box. SVG
  // glyph rects are not one ascent above the baseline, so SVG takes the baseline from the run start.
  const fontOf = (cs) => [cs.fontStyle, cs.fontWeight, cs.fontSize, cs.fontFamily].join(' ')
  function runOf(node, firstRect) {
    const holder = node.parentElement
    ctx.font = fontOf(getComputedStyle(holder))
    const m = ctx.measureText('')
    const fontBox = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent
    const ctm = holder.getStartPositionOfChar && holder.getScreenCTM()
    if (!ctm) {
      const scale = firstRect.height / fontBox
      return { font: ctx.font, scale, ascent: m.fontBoundingBoxAscent * scale }
    }
    const start = holder.getStartPositionOfChar(0).matrixTransform(ctm)
    return { font: ctx.font, scale: Math.hypot(ctm.b, ctm.d), baseline: start.y }
  }

  // One rect per non-space character, each tagged with its run and its own baseline.
  function charRects(nodes) {
    const range = document.createRange()
    const out = []
    for (const node of nodes) {
      const s = node.textContent
      let run = null
      for (let i = 0; i < s.length; i++) {
        if (!s[i].trim()) continue
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect()
        if (!r.width && !r.height) continue
        run = run ?? runOf(node, r)
        out.push({ ch: s[i], r, run, baseline: run.baseline ?? r.top + run.ascent })
      }
    }
    return out
  }

  function inkOf(c) {
    ctx.font = c.run.font
    const m = ctx.measureText(c.ch)
    return [
      c.baseline - m.actualBoundingBoxAscent * c.run.scale,
      c.baseline + m.actualBoundingBoxDescent * c.run.scale,
    ]
  }

  // A line shares one baseline, so runs of different sizes on it still group together.
  function groupLines(chars) {
    const lines = []
    for (const c of chars) {
      const line = lines.find((l) => Math.abs(l[0].baseline - c.baseline) < 1)
      if (line) line.push(c)
      else lines.push([c])
    }
    return lines.sort((a, b) => a[0].baseline - b[0].baseline)
  }

  function lineMetrics(chars) {
    const ink = chars.map(inkOf)
    return {
      baseline: q(chars[0].baseline),
      inkTop: q(Math.min(...ink.map(([top]) => top))),
      inkBottom: q(Math.max(...ink.map(([, bottom]) => bottom))),
      left: q(Math.min(...chars.map((c) => c.r.left))),
      right: q(Math.max(...chars.map((c) => c.r.right))),
    }
  }

  function textOf(el, cs) {
    const chars = charRects(ownTextNodes(el))
    if (!chars.length) return null
    const lines = groupLines(chars)
    return {
      fontSize: px(cs.fontSize),
      lineHeight: cs.lineHeight === 'normal' ? 'normal' : px(cs.lineHeight),
      font: cs.font,
      lineCount: lines.length,
      left: q(Math.min(...chars.map((c) => c.r.left))),
      right: q(Math.max(...chars.map((c) => c.r.right))),
      first: lineMetrics(lines[0]),
      last: lineMetrics(lines[lines.length - 1]),
    }
  }

  function describe(el, id, parent) {
    const cs = getComputedStyle(el)
    return {
      id,
      parent,
      selector: selectorOf(el),
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role'),
      interactive: isTarget(el),
      box: rectBox(el.getBoundingClientRect()),
      pad: sides(cs, (s) => `padding${s}`),
      border: sides(cs, (s) => `border${s}Width`),
      margin: sides(cs, (s) => `margin${s}`),
      layout: {
        display: cs.display,
        flexDirection: cs.flexDirection,
        flexWrap: cs.flexWrap,
        alignItems: cs.alignItems,
        alignSelf: cs.alignSelf,
        position: cs.position,
        rowGap: cs.rowGap,
        columnGap: cs.columnGap,
      },
      paints: paintsBox(el, cs),
      text: textOf(el, cs),
      ink: null,
    }
  }

  const union = (a, b) => {
    if (!a) return b
    const x = Math.min(a[0], b[0])
    const y = Math.min(a[1], b[1])
    return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y]
  }
  const textInk = ({ left, right, first, last }) => [
    left,
    first.inkTop,
    right - left,
    last.inkBottom - first.inkTop,
  ]

  // Children follow their parent in document order, so a reverse pass sees every child first.
  function assignInk(nodes) {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      if (n.paints) n.ink = n.box
      else if (n.text) n.ink = union(n.ink, textInk(n.text))
      if (n.ink) n.ink = n.ink.map(q)
      const p = byId.get(n.parent)
      if (p && !p.paints && n.ink) p.ink = union(p.ink, n.ink)
    }
  }

  function resolveSpacingVars() {
    const rootStyle = getComputedStyle(document.documentElement)
    const remPx = parseFloat(rootStyle.fontSize)
    const toPx = (raw) => (raw.endsWith('rem') ? parseFloat(raw) * remPx : parseFloat(raw))
    return Object.fromEntries(
      spacingVars.map((name) => [name, toPx(rootStyle.getPropertyValue(name).trim())])
    )
  }

  const ids = new Map()
  const collected = new Set()
  const idOf = (el) => {
    const index = String([...el.parentElement.children].indexOf(el))
    const parentId = ids.get(el.parentElement)
    return parentId === undefined ? index : `${parentId}.${index}`
  }
  const nearestCollected = (el) => {
    for (let a = el.parentElement; a && a !== root; a = a.parentElement)
      if (collected.has(a)) return ids.get(a)
    return null
  }
  const nodes = []
  for (const el of root.querySelectorAll('*')) {
    if (nodes.length >= MAX_NODES) break
    ids.set(el, idOf(el))
    if (!isVisible(el)) continue
    collected.add(el)
    nodes.push(describe(el, ids.get(el), nearestCollected(el)))
  }
  assignInk(nodes)
  return { nodes, truncated: nodes.length >= MAX_NODES, declared: resolveSpacingVars() }
}

export const layoutCollectorSource = `${buildSelectorOf}\n${collectLayout}`
