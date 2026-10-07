// DOM audit for one rendered story: page checks run in the browser, the rest is pure.
// domChecks, runAxe and tokenColours are serialised into the page, so they use browser globals.
/* global document, getComputedStyle, innerWidth, NodeFilter, window */
import { layoutCollectorSource } from './layout-collect.mjs'
import {
  ALIGNMENT_NEAR_MISS,
  EDGE_CLEARANCE,
  GAP_OUTLIER,
  INSET_ASYMMETRY,
  PROXIMITY_INVERSION,
  STACKED_INSET,
  judgeLayout,
} from './layout-probes.mjs'
import { buildScale, isOnScale } from './spacing-scale.mjs'

const MAX_FINDINGS_PER_KIND = 25

const CONTRAST = 'contrast'
const CONTRAST_TOKEN = 'contrast-token'
const OFF_SCALE_SPACING = 'off-scale-spacing'
const THEME_GEOMETRY_SHIFT = 'theme-geometry-shift'

// Kinds that fail the run. `render-error` also blocks but comes from capture.mjs, not these checks.
export const BLOCKER_KINDS = Object.freeze([
  'overflow',
  'clipped-text',
  'truncated-text',
  'text-overlap',
  'hit-target',
  CONTRAST,
])
// Reported, never failing. Token-on-token contrast pairs sit in their own `contrast_token` field.
export const WARNING_KINDS = Object.freeze([
  'story-frame-overflow',
  'small-text',
  OFF_SCALE_SPACING,
  THEME_GEOMETRY_SHIFT,
  STACKED_INSET,
  EDGE_CLEARANCE,
  INSET_ASYMMETRY,
  ALIGNMENT_NEAR_MISS,
  GAP_OUTLIER,
  PROXIMITY_INVERSION,
])
export const CONTRAST_TOKEN_KIND = CONTRAST_TOKEN

// Runs in the page. Every check is a named function so a finding can cite it.
export function domChecks({ touch, spacingVars }) {
  const root = document.querySelector('#storybook-root')
  const minTarget = touch ? 44 : 24
  const all = [...root.querySelectorAll('*')]

  const isVisible = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0)
      return false
    const r = el.getBoundingClientRect()
    return r.width > 1 && r.height > 1
  }
  const visible = all.filter(isVisible)

  const selectorOf = (el) => {
    if (el === root) return '#storybook-root'
    const parts = []
    for (let n = el; n && n !== root && parts.length < 4; n = n.parentElement) {
      const testId = n.getAttribute('data-testid')
      if (testId) {
        parts.unshift(`[data-testid="${testId}"]`)
        break
      }
      const role = n.getAttribute('role')
      const label = n.getAttribute('aria-label')
      let part = n.tagName.toLowerCase()
      if (role) part += `[role="${role}"]`
      if (label) part += `[aria-label="${label.slice(0, 30)}"]`
      const sibs = n.parentElement
        ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName)
        : []
      if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(n) + 1})`
      parts.unshift(part)
    }
    return parts.join(' > ')
  }
  const textOf = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim())
      .join(' ')
  const textEls = visible.filter((el) => ownText(el))
  const finding = (kind, el, detail) => ({ kind, selector: selectorOf(el), detail })
  const hasReportedAncestor = (el, set) => {
    for (let n = el.parentElement; n && n !== root; n = n.parentElement) if (set.has(n)) return true
    return false
  }
  const clipsX = (cs) => ['hidden', 'clip'].includes(cs.overflowX)
  const scrollsX = (cs) => ['auto', 'scroll'].includes(cs.overflowX)
  const clipsAny = (cs) => [cs.overflowX, cs.overflowY].some((v) => v !== 'visible')
  const clippingAncestor = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      if (clipsAny(getComputedStyle(n))) return n
    }
    return null
  }

  // Story harness frames: fixed inline px widths near the root (the preview decorator adds one level).
  const FRAME_MAX_DEPTH = 5
  const depthOf = (el) => {
    let d = 0
    for (let n = el; n && n !== root; n = n.parentElement) d++
    return d
  }
  const crosses = (r, bounds) => r.right > bounds.right + 1 || r.left < bounds.left - 1
  const STORY_WRAPPER_DEPTH = 2
  const candidates = visible.filter(
    (el) => /^[\d.]+px$/.test(el.style.width) && depthOf(el) <= FRAME_MAX_DEPTH
  )
  const containsCandidate = (el) => candidates.some((c) => c !== el && el.contains(c))
  // A story-level width wrapper holding real frames is not itself a frame.
  const outerFrames = candidates.filter(
    (c) => !(depthOf(c) <= STORY_WRAPPER_DEPTH && containsCandidate(c))
  )
  // A fixed-width box that leaves the frame around it is content overflow, not a frame.
  const leavesEnclosingFrame = (c) => {
    const parent = outerFrames.findLast((p) => p !== c && p.contains(c))
    return parent && crosses(c.getBoundingClientRect(), parent.getBoundingClientRect())
  }
  const frames = outerFrames.filter((c) => !leavesEnclosingFrame(c))
  const frameOf = (el) => {
    for (let n = el.parentElement; n && n !== root; n = n.parentElement)
      if (frames.includes(n)) return n
    return null
  }
  const framesRight = Math.max(0, ...frames.map((f) => f.getBoundingClientRect().right))

  function checkFrameOverflow() {
    return frames
      .filter((f) => crosses(f.getBoundingClientRect(), { left: 0, right: innerWidth }))
      .map((f) =>
        finding(
          'story-frame-overflow',
          f,
          `story frame with style width ${f.style.width} spans x ${Math.round(f.getBoundingClientRect().left)}..${Math.round(f.getBoundingClientRect().right)} in a ${innerWidth}px viewport; its content is audited against the frame`
        )
      )
  }

  // Content inside a frame is held to the frame's box; everything else to the viewport.
  function checkPageOverflow() {
    const out = []
    const reported = new Set()
    for (const el of visible) {
      if (frames.includes(el) || hasReportedAncestor(el, reported) || insideHorizontalScroller(el))
        continue
      const r = el.getBoundingClientRect()
      const frame = frameOf(el)
      const bounds = frame ? frame.getBoundingClientRect() : { left: 0, right: innerWidth }
      if (!crosses(r, bounds)) continue
      if (!frame && frames.length && r.right <= framesRight + 1 && r.left >= -1) continue
      reported.add(el)
      const where = frame
        ? `its ${frame.style.width} story frame (x ${Math.round(bounds.left)}..${Math.round(bounds.right)})`
        : `the ${innerWidth}px viewport`
      out.push(
        finding(
          'overflow',
          el,
          `box x ${Math.round(r.left)}..${Math.round(r.right)} leaves ${where}`
        )
      )
    }
    const docW = document.documentElement.scrollWidth
    const explainedByFrames = frames.length && docW <= framesRight + 1 + 32
    if (docW > innerWidth + 1 && !explainedByFrames)
      out.unshift(
        finding(
          'overflow',
          root,
          `page scrolls horizontally: ${docW}px content in ${innerWidth}px viewport`
        )
      )
    return out
  }
  function insideHorizontalScroller(el) {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      if (scrollsX(getComputedStyle(n)) && n.scrollWidth > n.clientWidth) return true
    }
    return false
  }

  function checkContainerOverflow() {
    const out = []
    for (const el of visible) {
      const cs = getComputedStyle(el)
      if (!clipsX(cs) || ownText(el) || el.scrollWidth <= el.clientWidth + 1) continue
      if (el.tagName === 'svg' || el.closest('svg')) continue
      out.push(
        finding(
          'overflow',
          el,
          `content ${el.scrollWidth}px wide is cut by a ${el.clientWidth}px overflow:hidden box`
        )
      )
    }
    return out
  }

  const isEllipsis = (cs) => cs.textOverflow === 'ellipsis'
  const isClamped = (cs) => cs.webkitLineClamp && cs.webkitLineClamp !== 'none'

  function checkTruncatedText() {
    const out = []
    for (const el of textEls) {
      const cs = getComputedStyle(el)
      const cutX = isEllipsis(cs) && el.scrollWidth > el.clientWidth + 1
      const cutY = isClamped(cs) && el.scrollHeight > el.clientHeight + 1
      if (cutX || cutY)
        out.push(
          finding(
            'truncated-text',
            el,
            `"${textOf(el)}" ${cutX ? 'ellipsised' : `clamped to ${cs.webkitLineClamp} lines`}`
          )
        )
    }
    return out
  }

  function checkClippedText() {
    const out = []
    for (const el of textEls) {
      const cs = getComputedStyle(el)
      if (isEllipsis(cs) || isClamped(cs)) continue
      const ownCut =
        clipsAny(cs) &&
        (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
      const cutBy = ownCut ? null : textCutByAncestor(el)
      if (ownCut)
        out.push(
          finding(
            'clipped-text',
            el,
            `"${textOf(el)}" needs ${el.scrollWidth}x${el.scrollHeight}, box is ${el.clientWidth}x${el.clientHeight}, overflow hidden`
          )
        )
      else if (cutBy)
        out.push(
          finding(
            'clipped-text',
            el,
            `"${textOf(el)}" extends past clipping ancestor ${selectorOf(cutBy)}`
          )
        )
    }
    return out
  }
  function textBox(el) {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getBoundingClientRect()
  }
  function textCutByAncestor(el) {
    const anc = clippingAncestor(el)
    if (!anc) return null
    const t = textBox(el)
    const a = anc.getBoundingClientRect()
    const out =
      t.left < a.left - 1 || t.right > a.right + 1 || t.top < a.top - 1 || t.bottom > a.bottom + 1
    return out ? anc : null
  }

  function checkTextOverlap() {
    const out = []
    const boxes = textEls.slice(0, 400).map((el) => ({ el, r: textBox(el) }))
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
        if (w > 2 && h > 2)
          out.push(
            finding(
              'text-overlap',
              a.el,
              `"${textOf(a.el)}" overlaps "${textOf(b.el)}" (${selectorOf(b.el)}) by ${Math.round(w)}x${Math.round(h)}px`
            )
          )
      }
    }
    return out
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
  const isInlineLink = (el) => el.tagName === 'A' && getComputedStyle(el).display === 'inline'

  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2]
  const distToRect = ([x, y], r) =>
    Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))

  // WCAG 2.5.8 spacing exception: a 24px circle on an undersized target touches no other target or circle.
  function isSpacedEnough(t, targets) {
    const c = centre(t.r)
    return targets.every(
      (o) =>
        o === t ||
        o.el.contains(t.el) ||
        t.el.contains(o.el) ||
        (o.small
          ? Math.hypot(...centre(o.r).map((v, i) => v - c[i])) >= 24
          : distToRect(c, o.r) >= 12)
    )
  }

  function checkHitTargets() {
    const targets = visible
      .filter((el) => isTarget(el) && !isInlineLink(el))
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { el, r, small: r.width < minTarget - 0.5 || r.height < minTarget - 0.5 }
      })
    return targets
      .filter((t) => t.small && (touch || !isSpacedEnough(t, targets)))
      .map((t) =>
        finding(
          'hit-target',
          t.el,
          `${Math.round(t.r.width)}x${Math.round(t.r.height)} under ${minTarget}x${minTarget}${touch ? ' (touch case)' : ', and closer than 24px to another target'}${textOf(t.el) ? ` ("${textOf(t.el)}")` : ''}`
        )
      )
  }

  const SPACING_PROPS = [
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'rowGap',
    'columnGap',
  ]

  // Raw spacing per element; Node decides what is off titan's scale.
  function collectSpacing() {
    const out = []
    for (const el of visible) {
      if (el.closest('svg')) continue
      const cs = getComputedStyle(el)
      const specified = el.computedStyleMap()
      const isAuto = (p) =>
        p.startsWith('margin') &&
        String(specified.get(p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))) === 'auto'
      const values = SPACING_PROPS.filter((p) => !isAuto(p))
        .map((p) => [p, parseFloat(cs[p])])
        .filter(([, v]) => Number.isFinite(v) && v !== 0)
      if (values.length) out.push({ selector: selectorOf(el), values })
    }
    return out
  }

  function resolveSpacingVars() {
    const rootStyle = getComputedStyle(document.documentElement)
    const remPx = parseFloat(rootStyle.fontSize)
    const toPx = (raw) => (raw.endsWith('rem') ? parseFloat(raw) * remPx : parseFloat(raw))
    return Object.fromEntries(
      spacingVars.map((name) => [name, toPx(rootStyle.getPropertyValue(name).trim())])
    )
  }

  function checkSmallText() {
    return textEls
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 11)
      .map((el) => finding('small-text', el, `"${textOf(el)}" at ${getComputedStyle(el).fontSize}`))
  }

  function collectMetrics() {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let textNodes = 0
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) textNodes++
    const fontSizes = new Set(textEls.map((el) => getComputedStyle(el).fontSize))
    const colours = new Set()
    for (const el of visible) {
      const cs = getComputedStyle(el)
      const candidates = [
        cs.backgroundColor,
        cs.borderTopColor,
        el.closest('svg') ? cs.fill : null,
        el.closest('svg') ? cs.stroke : null,
      ]
      if (ownText(el)) candidates.push(cs.color)
      if (cs.borderTopWidth === '0px') candidates.splice(1, 1)
      for (const c of candidates)
        if (c && c !== 'none' && !/rgba\(.*,\s*0\)$/.test(c) && c !== 'transparent') colours.add(c)
    }
    return {
      elementCount: all.length,
      textNodeCount: textNodes,
      maxDepth: all.reduce((m, el) => Math.max(m, depthOf(el)), 0),
      fontSizes: [...fontSizes].sort((a, b) => parseFloat(a) - parseFloat(b)),
      distinctFontSizes: fontSizes.size,
      colours: [...colours],
      distinctColours: colours.size,
    }
  }

  function geometry() {
    const pathOf = (el) => {
      const idx = []
      for (let n = el; n && n !== root; n = n.parentElement)
        idx.unshift([...n.parentElement.children].indexOf(n))
      return idx.join('.')
    }
    return visible.map((el) => {
      const r = el.getBoundingClientRect()
      return [
        pathOf(el),
        selectorOf(el),
        Math.round(r.x),
        Math.round(r.y),
        Math.round(r.width),
        Math.round(r.height),
      ]
    })
  }

  const cap = (list) => list.slice(0, 25)
  return {
    blockers: [
      ...cap(checkPageOverflow()),
      ...cap(checkContainerOverflow()),
      ...cap(checkClippedText()),
      ...cap(checkTruncatedText()),
      ...cap(checkTextOverlap()),
      ...cap(checkHitTargets()),
    ],
    warnings: [...cap(checkFrameOverflow()), ...cap(checkSmallText())],
    spacing: collectSpacing(),
    spacingVars: resolveSpacingVars(),
    metrics: collectMetrics(),
    geometry: geometry(),
  }
}

export async function runAxe(page, axeSource) {
  if (!(await page.evaluate(() => Boolean(window.axe))))
    await page.addScriptTag({ content: axeSource })
  return page.evaluate(async () => {
    const res = await window.axe.run('#storybook-root', {
      rules: { 'color-contrast': { enabled: true }, region: { enabled: false } },
      resultTypes: ['violations'],
    })
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({
        target: n.target.join(' '),
        summary: (n.failureSummary || '').split('\n').slice(1, 2).join('').trim(),
        fg: n.any?.[0]?.data?.fgColor,
        bg: n.any?.[0]?.data?.bgColor,
      })),
    }))
  })
}

// Every opaque --color-* token in the current theme, as lowercase #rrggbb mapped to token names.
export function tokenColours() {
  const names = new Set()
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = [...sheet.cssRules]
    } catch {
      continue
    }
    for (const rule of rules)
      for (const prop of rule.style ?? []) if (prop.startsWith('--color-')) names.add(prop)
  }
  const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext(
    '2d',
    { willReadFrequently: true }
  )
  const rootStyle = getComputedStyle(document.documentElement)
  const out = {}
  for (const name of names) {
    const value = rootStyle.getPropertyValue(name).trim()
    if (!value) continue
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    if (a !== 255) continue
    const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
    ;(out[hex] ??= []).push(name)
  }
  return out
}

// Splits contrast failures: pairs where both colours are titan tokens go to contrast_token.
export function splitContrast(violations, tokens) {
  const nodes = violations.find((v) => v.id === 'color-contrast')?.nodes ?? []
  const fromTokens = (n) => n.fg && n.bg && tokens[n.fg.toLowerCase()] && tokens[n.bg.toLowerCase()]
  const toFinding = (kind) => (n) => ({
    kind,
    selector: n.target,
    detail: n.summary,
    ...(kind === CONTRAST_TOKEN
      ? { tokens: [tokens[n.fg.toLowerCase()][0], tokens[n.bg.toLowerCase()][0]] }
      : {}),
  })
  return {
    blockers: nodes
      .filter((n) => !fromTokens(n))
      .map(toFinding(CONTRAST))
      .slice(0, MAX_FINDINGS_PER_KIND),
    contrastToken: nodes
      .filter(fromTokens)
      .map(toFinding(CONTRAST_TOKEN))
      .slice(0, MAX_FINDINGS_PER_KIND),
  }
}

export function offScaleWarnings(spacing, scale) {
  return spacing
    .map(({ selector, values }) => ({
      selector,
      off: values.filter(([, v]) => !isOnScale(v, scale)),
    }))
    .filter(({ off }) => off.length)
    .map(({ selector, off }) => ({
      kind: OFF_SCALE_SPACING,
      selector,
      detail: off.map(([p, v]) => `${p} ${+v.toFixed(2)}px`).join(', '),
    }))
    .slice(0, MAX_FINDINGS_PER_KIND)
}

// Installs the layout collector once per page, then judges what it measured.
async function layoutWarnings(page, spacingVars) {
  if (!(await page.evaluate(() => Boolean(window.collectLayout))))
    await page.addScriptTag({ content: layoutCollectorSource })
  const layout = await page.evaluate(
    (vars) => window.collectLayout({ spacingVars: vars }),
    spacingVars
  )
  return judgeLayout(layout, { limit: MAX_FINDINGS_PER_KIND })
}

export async function auditPage(page, { axeSource, spacingConfig, touch = false }) {
  const dom = await page.evaluate(domChecks, { touch, spacingVars: spacingConfig.vars })
  const violations = await runAxe(page, axeSource)
  const contrast = splitContrast(violations, await page.evaluate(tokenColours))
  const blockers = [...dom.blockers, ...contrast.blockers]
  const scale = buildScale(spacingConfig.px, dom.spacingVars)
  const warnings = [
    ...offScaleWarnings(dom.spacing, scale),
    ...dom.warnings,
    ...(await layoutWarnings(page, spacingConfig.vars)),
  ]
  return {
    blockers,
    contrast_token: contrast.contrastToken,
    warnings,
    metrics: dom.metrics,
    axe: { violations },
    geometry: dom.geometry,
  }
}

// Compares element boxes of the same story and width between two themes.
export function themeGeometryShift(baseGeometry, otherGeometry, baseTheme) {
  const base = new Map(
    baseGeometry.map(([path, sel, x, y, w, h]) => [path, { sel, box: [x, y, w, h] }])
  )
  const shifts = []
  for (const [path, sel, x, y, w, h] of otherGeometry) {
    const b = base.get(path)
    if (!b) continue
    const delta = [x, y, w, h].map((v, i) => Math.abs(v - b.box[i]))
    if (Math.max(...delta) > 1)
      shifts.push({
        path,
        kind: THEME_GEOMETRY_SHIFT,
        selector: sel,
        detail: `box ${b.box.join(',')} in ${baseTheme} vs ${[x, y, w, h].join(',')}`,
      })
  }
  const kept = []
  for (const s of shifts) if (!kept.some((k) => s.path.startsWith(`${k.path}.`))) kept.push(s)
  const outermost = kept.map(({ kind, selector, detail }) => ({ kind, selector, detail }))
  return outermost.slice(0, MAX_FINDINGS_PER_KIND)
}
