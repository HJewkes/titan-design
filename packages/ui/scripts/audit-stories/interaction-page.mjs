// In-page half of the interaction driver (TD-941). installInteraction is serialised into the page
// beside buildSelectorOf, so it uses browser globals and reaches the selector builder only as a
// page global: install it with `interactionPageSource`, then call `window.__auditIx` methods.
/* global document, getComputedStyle, innerHeight, innerWidth, NodeFilter, requestAnimationFrame, window */
import { buildSelectorOf } from './layout-collect.mjs'

// Runs in the page. Sets window.__auditIx: register, tabbed, prepare, centre, isFocused, snapshot,
// settle, blockClick and selectorAt. Every node under #storybook-root gets an id at register time (a WeakMap,
// no DOM mutation), so later states compare the same nodes.
export function installInteraction({ maxNodes, maxSubtree, maxTexts, maxAncestors }) {
  const root = document.querySelector('#storybook-root')
  // A page global from interactionPageSource; a module binding would not survive serialising.
  const selectorOf = window.buildSelectorOf(root)
  const LOOK = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderTopWidth',
    'boxShadow',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'transform',
    'opacity',
    'textDecorationLine',
  ]
  const RING = ['outlineStyle', 'outlineWidth', 'outlineOffset', 'outlineColor', 'boxShadow']
  const ids = new WeakMap()
  const nodes = []
  const targets = []
  const round = (v) => Math.round(v * 10) / 10
  const rectOf = (el) => {
    const r = el.getBoundingClientRect()
    return [round(r.left), round(r.top), round(r.width), round(r.height)]
  }
  const pick = (s, props) => Object.fromEntries(props.map((p) => [p, s[p]]))
  const border = (s) => ({ borderTopWidth: s.borderTopWidth, borderTopColor: s.borderTopColor })

  function register() {
    const names = {}
    for (const el of root.querySelectorAll('*')) {
      if (nodes.length >= maxNodes) break
      ids.set(el, nodes.length)
      names[nodes.length] = selectorOf(el)
      nodes.push(el)
    }
    return names
  }

  // After a Tab: the index of the newly focused target, -1 when focus left the story, -2 on a cycle.
  function tabbed() {
    const el = document.activeElement
    if (!el || el === root || !root.contains(el)) return -1
    if (targets.includes(el)) return -2
    targets.push(el)
    return targets.length - 1
  }

  // blur() and a click move the Tab starting point, so focus starts from an anchor before the
  // story: a 0x0 fixed element outside #storybook-root that Tab cannot reach.
  const anchor = document.createElement('div')
  anchor.tabIndex = -1
  anchor.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;outline:none'
  document.body.prepend(anchor)

  // Focus sits just before target i, so one Tab is a keyboard move onto it.
  function prepare(i) {
    const from = i > 0 ? targets[i - 1] : anchor
    from.focus({ preventScroll: true })
  }

  function centre(i) {
    targets[i].scrollIntoView({ block: 'center', inline: 'center' })
    const [x, y, w, h] = rectOf(targets[i])
    return { x: x + w / 2, y: y + h / 2, away: { x: innerWidth - 1, y: innerHeight - 1 } }
  }

  const isFocused = (i) => document.activeElement === targets[i]

  // The target and its nearest ancestors in the story: a wrapper may draw the state or the ring.
  function chainOf(t) {
    const chain = [t]
    for (
      let p = t.parentElement;
      p && p !== root && chain.length <= maxAncestors;
      p = p.parentElement
    )
      chain.push(p)
    return chain
  }

  function look(t) {
    const subtree = [...chainOf(t), ...[...t.querySelectorAll('*')].slice(0, maxSubtree)]
    return subtree.map((n) => {
      const s = getComputedStyle(n)
      return LOOK.map((p) => s[p]).join('|')
    })
  }

  function boxesOutside(t) {
    const boxes = {}
    for (const n of nodes) if (n.isConnected && !t.contains(n)) boxes[ids.get(n)] = rectOf(n)
    return boxes
  }

  function visibleTexts() {
    const out = new Set()
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n && out.size < maxTexts; n = walk.nextNode()) {
      const text = n.textContent.trim().replace(/\s+/g, ' ')
      const el = n.parentElement
      if (!text || !el || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue
      const visible = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      const [, , w, h] = rectOf(el)
      if (visible && w > 0 && h > 0) out.add(text.slice(0, 60))
    }
    return [...out]
  }

  const nameOf = (el) => (root.contains(el) ? selectorOf(el) : el.tagName.toLowerCase())

  // Ancestors inside the story whose overflow clips: each one's padding box.
  function clipsOf(t) {
    const clips = []
    for (let p = t.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue
      const [x, y, w, h] = rectOf(p)
      const [bt, br, bb, bl] = ['Top', 'Right', 'Bottom', 'Left'].map((e) =>
        parseFloat(s[`border${e}Width`])
      )
      clips.push({ selector: nameOf(p), rect: [x + bl, y + bt, x + w - br, y + h - bb] })
    }
    return clips
  }

  // Centre and four quarter points: null off-screen, else whether the target is topmost there.
  function topmostOf(t) {
    const [x, y, w, h] = rectOf(t)
    const points = [
      [0.5, 0.5],
      [0.25, 0.25],
      [0.75, 0.25],
      [0.25, 0.75],
      [0.75, 0.75],
    ].map(([fx, fy]) => [x + w * fx, y + h * fy])
    let coveredBy = null
    const topmost = points.map(([px, py]) => {
      if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) return null
      const hit = document.elementFromPoint(px, py)
      const mine = Boolean(hit) && (hit === t || t.contains(hit))
      if (!mine && hit && !coveredBy) coveredBy = nameOf(hit)
      return mine
    })
    return { topmost, coveredBy }
  }

  function backdropOf(t) {
    for (let p = t.parentElement; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor
      if (bg && bg !== 'transparent' && !/,\s*0\)$/.test(bg)) return bg
    }
    return null
  }

  function focusDetail(t) {
    const chain = chainOf(t).map((n) => ({
      box: rectOf(n),
      clips: clipsOf(n),
      backdrop: backdropOf(n),
    }))
    return { chain, ...topmostOf(t) }
  }

  function snapshot(i, withFocus) {
    const t = targets[i]
    const ringStyle = (n) => {
      const s = getComputedStyle(n)
      return { ...pick(s, RING), ...border(s) }
    }
    const state = {
      look: look(t),
      ring: chainOf(t).map(ringStyle),
      boxes: boxesOutside(t),
      texts: visibleTexts(),
    }
    return withFocus ? { ...state, focus: focusDetail(t) } : state
  }

  const settle = (ms) =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms))))

  // A press must not activate: one capture-phase click on window is swallowed.
  function blockClick() {
    const stop = (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    window.addEventListener('click', stop, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 500)
  }

  const selectorAt = (i) => selectorOf(targets[i])

  window.__auditIx = {
    register,
    tabbed,
    prepare,
    centre,
    isFocused,
    snapshot,
    settle,
    blockClick,
    selectorAt,
  }
}

export const interactionPageSource = `${buildSelectorOf}\n${installInteraction}`
