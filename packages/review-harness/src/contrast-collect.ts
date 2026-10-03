import type { Rgba } from './contrast.ts'

/** One element on the path from <html> down: what it paints behind its subtree. */
export interface RawNode {
  parent: number
  bg: Rgba
  opacity: number
  /** A background-image (gradient, url) the DOM cannot reduce to one colour. */
  bgImage: boolean
}

export type SampleRole = 'text' | 'control-boundary' | 'separator' | 'track' | 'mark' | 'svg-mark'

/** One thing to measure. `colors` are alternatives: the best of them must meet the ratio. */
export interface RawSample {
  role: SampleRole
  node: number
  /** The node whose effective background is the adjacent plane. */
  plane: number
  colors: Rgba[]
  selector: string
  testId?: string
  text?: string
  fontSize?: number
  fontWeight?: number
  /** Why WCAG exempts it (an inactive control); it is counted but never fails. */
  exempt?: string
  /** A paint the DOM cannot reduce to one colour (a gradient or pattern fill). */
  indeterminate?: string
}

export interface FrameSamples {
  /** The canvas under <html>: white, or Chromium's dark canvas for `color-scheme: dark`. */
  base: Rgba
  nodes: RawNode[]
  samples: RawSample[]
}

/**
 * Runs inside the story's page (Playwright serialises it), so it must stay self-contained:
 * no imports, no outer references. It only reads; every ratio is computed in Node.
 */
export function collectFrame(rootSelector: string): FrameSamples {
  const CONTROL =
    'button, input:not([type=hidden]), select, textarea, [role=button], [role=checkbox], ' +
    '[role=radio], [role=switch], [role=slider], [role=textbox], [role=combobox], ' +
    '[role=searchbox], [role=spinbutton]'
  const DISABLED = ':disabled, [aria-disabled="true"]'
  const SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'])
  const SIDES = ['top', 'right', 'bottom', 'left'] as const
  const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  const colorCache = new Map<string, Rgba>()

  function parse(value: string): Rgba {
    const cached = colorCache.get(value)
    if (cached) return cached
    const m = value.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/)
    const rgba: Rgba = m
      ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
      : viaCanvas(value)
    colorCache.set(value, rgba)
    return rgba
  }

  function viaCanvas(value: string): Rgba {
    canvas.clearRect(0, 0, 1, 1)
    canvas.fillStyle = value
    canvas.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }

  const index = new Map<Element, number>()
  const nodes: RawNode[] = []
  function nodeOf(el: Element): number {
    const known = index.get(el)
    if (known !== undefined) return known
    const parent = el.parentElement ? nodeOf(el.parentElement) : -1
    const style = getComputedStyle(el)
    nodes.push({
      parent,
      bg: parse(style.backgroundColor),
      opacity: Number(style.opacity),
      bgImage: style.backgroundImage !== 'none',
    })
    index.set(el, nodes.length - 1)
    return nodes.length - 1
  }

  function selectorOf(el: Element): string {
    const parts: string[] = []
    for (let e: Element | null = el; e && parts.length < 5; e = e.parentElement) {
      if (e.matches(rootSelector)) break
      const testId = e.getAttribute('data-testid')
      if (testId) {
        parts.unshift(`[data-testid="${testId}"]`)
        break
      }
      const siblings = e.parentElement ? [...e.parentElement.children] : [e]
      const same = siblings.filter((s) => s.tagName === e!.tagName)
      const nth = same.length > 1 ? `:nth-of-type(${same.indexOf(e) + 1})` : ''
      parts.unshift(`${e.tagName.toLowerCase()}${nth}`)
    }
    return parts.join(' > ')
  }

  function visible(el: Element, style: CSSStyleDeclaration): boolean {
    const box = el.getBoundingClientRect()
    if (box.width <= 1 && box.height <= 1) return false
    return style.visibility === 'visible' && Number(style.opacity) > 0
  }

  function ownText(el: Element): string {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value.trim()
    return [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function labelOf(el: Element): string | undefined {
    const text = el.getAttribute('aria-label') ?? el.textContent?.replace(/\s+/g, ' ').trim()
    return text ? text.slice(0, 60) : undefined
  }

  function base(el: Element, role: SampleRole, plane: Element, colors: Rgba[]): RawSample {
    const testId = el.closest('[data-testid]')?.getAttribute('data-testid') ?? undefined
    return {
      role,
      node: nodeOf(el),
      plane: nodeOf(plane),
      colors,
      selector: selectorOf(el),
      ...(testId ? { testId } : {}),
      ...(el.closest(DISABLED) ? { exempt: 'inactive control (WCAG 1.4.3, 1.4.11)' } : {}),
    }
  }

  function textSample(el: Element, style: CSSStyleDeclaration): RawSample | null {
    const text = ownText(el)
    if (!text) return null
    const paint = el instanceof SVGElement ? style.fill : style.color
    const sample = base(el, 'text', el, [parse(paint)])
    sample.text = text.slice(0, 60)
    sample.fontSize = parseFloat(style.fontSize)
    sample.fontWeight = Number(style.fontWeight) || 400
    return sample
  }

  function borderColors(style: CSSStyleDeclaration): { sides: string[]; colors: Rgba[] } {
    const shown = SIDES.filter(
      (side) =>
        parseFloat(style.getPropertyValue(`border-${side}-width`)) >= 1 &&
        !['none', 'hidden'].includes(style.getPropertyValue(`border-${side}-style`)) &&
        parse(style.getPropertyValue(`border-${side}-color`))[3] > 0
    )
    return {
      sides: shown,
      colors: shown.map((side) => parse(style.getPropertyValue(`border-${side}-color`))),
    }
  }

  function isSeparatorBorder(sides: string[]): boolean {
    const key = sides.join(',')
    return ['top', 'bottom', 'left', 'right', 'top,bottom', 'right,left'].includes(key)
  }

  function htmlRole(el: Element, sides: string[], hasFill: boolean): SampleRole | null {
    const box = el.getBoundingClientRect()
    const thin = Math.min(box.width, box.height)
    const long = Math.max(box.width, box.height)
    if (el.matches(CONTROL)) return 'control-boundary'
    if (el.matches('hr, [role=separator]') || isSeparatorBorder(sides)) return 'separator'
    if (hasFill && thin <= 2) return 'separator'
    if (hasFill && thin <= 8 && long >= 4 * thin) return 'track'
    if (long <= 24 && (hasFill || sides.length > 0)) return 'mark'
    return null
  }

  function boxSample(el: Element, style: CSSStyleDeclaration): RawSample | null {
    if (!el.parentElement) return null
    const { sides, colors } = borderColors(style)
    const fill = parse(style.backgroundColor)
    const hasFill = fill[3] > 0
    const role = htmlRole(el, sides, hasFill)
    if (!role || (!hasFill && sides.length === 0)) return null
    const sample = base(el, role, el.parentElement, [...colors, ...(hasFill ? [fill] : [])])
    const label = labelOf(el)
    if (label) sample.text = label
    return sample
  }

  function svgPaint(value: string, opacity: string): Rgba | 'pattern' | null {
    if (value === 'none') return null
    if (value.startsWith('url(')) return 'pattern'
    const rgba = parse(value)
    return [rgba[0], rgba[1], rgba[2], rgba[3] * Number(opacity)]
  }

  function svgSample(el: Element, style: CSSStyleDeclaration): RawSample | null {
    const stroked = parseFloat(style.strokeWidth) > 0
    const paints = [
      svgPaint(style.fill, style.fillOpacity),
      stroked ? svgPaint(style.stroke, style.strokeOpacity) : null,
    ].filter((p) => p !== null)
    if (paints.length === 0) return null
    const plane = el.closest('svg')?.parentElement ?? el.parentElement!
    const colors = paints.filter((p): p is Rgba => p !== 'pattern')
    const sample = base(el, 'svg-mark', plane, colors)
    if (colors.length === 0) sample.indeterminate = 'gradient or pattern paint'
    return sample
  }

  function samplesOf(el: Element): RawSample[] {
    const style = getComputedStyle(el)
    if (!visible(el, style)) return []
    const shape = el instanceof SVGElement && SHAPES.has(el.tagName.toLowerCase())
    const marks = shape ? svgSample(el, style) : boxSample(el, style)
    return [textSample(el, style), marks].filter((s): s is RawSample => s !== null)
  }

  const root = document.querySelector(rootSelector)
  const html = document.documentElement
  const dark = getComputedStyle(html).colorScheme.split(' ').includes('dark')
  const light = getComputedStyle(html).colorScheme.split(' ').includes('light')
  const samples = root ? [...root.querySelectorAll('*')].flatMap(samplesOf) : []
  return { base: dark && !light ? [18, 18, 18, 1] : [255, 255, 255, 1], nodes, samples }
}
