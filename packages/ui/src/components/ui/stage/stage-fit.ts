import { useLayoutEffect, type RefObject } from 'react'

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

/** A laid-out box in stage coordinates. */
export interface StageContentBox {
  /** Left edge, relative to the stage. */
  x: number
  /** Top edge, relative to the stage. */
  y: number
  /** Width. */
  w: number
  /** Height. */
  h: number
}

/** How far content reaches past each side of a stage, in whole px; 0 where it fits. */
export interface StageOverflow {
  /** Px above the stage. */
  top: number
  /** Px past the right edge. */
  right: number
  /** Px below the stage. */
  bottom: number
  /** Px past the left edge. */
  left: number
}

/** A stage's own size and the boxes laid out inside it. */
export interface StageMeasure {
  /** The stage's own width. */
  width: number
  /** The stage's own height. */
  height: number
  /** Every content box, in stage coordinates. */
  boxes: readonly StageContentBox[]
}

/** Integer offsets round each edge, so up to 1 px past the stage is layout noise. */
const TOLERANCE_PX = 1

/** How far `boxes` reach past a `width` × `height` stage on each side. */
export function stageOverflow(
  width: number,
  height: number,
  boxes: readonly StageContentBox[]
): StageOverflow {
  const past = (n: number) => (n > TOLERANCE_PX ? Math.ceil(n) : 0)
  return {
    top: past(-Math.min(0, ...boxes.map((b) => b.y))),
    right: past(Math.max(width, ...boxes.map((b) => b.x + b.w)) - width),
    bottom: past(Math.max(height, ...boxes.map((b) => b.y + b.h)) - height),
    left: past(-Math.min(0, ...boxes.map((b) => b.x))),
  }
}

/** `"<label> overflows its stage box by N px (bottom N, …)"`, or undefined when nothing overflows. */
export function describeOverflow(label: string, overflow: StageOverflow): string | undefined {
  const sides = (Object.entries(overflow) as [keyof StageOverflow, number][]).filter(
    ([, px]) => px > 0
  )
  if (!sides.length) return undefined
  const worst = Math.max(...sides.map(([, px]) => px))
  const list = sides.map(([side, px]) => `${side} ${px}`).join(', ')
  return `${label} overflows its stage box by ${worst} px (${list})`
}

// The offset chain ignores transforms, so an entrance slide is not overflow.
function offsetIn(el: HTMLElement, stage: HTMLElement): { x: number; y: number } | undefined {
  let x = 0
  let y = 0
  for (let node: Element | null = el; node !== stage; node = (node as HTMLElement).offsetParent) {
    if (!(node instanceof HTMLElement)) return undefined
    x += node.offsetLeft
    y += node.offsetTop
  }
  return { x, y }
}

/** Every rendered element's layout box inside `stage`; a text leaf also counts its scroll size. */
export function contentBoxes(stage: HTMLElement): StageContentBox[] {
  const els = Array.from(stage.querySelectorAll('*')).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.offsetParent !== null
  )
  return els.flatMap((el) => {
    const at = offsetIn(el, stage)
    if (!at) return []
    const leaf = el.childElementCount === 0
    const w = leaf ? Math.max(el.offsetWidth, el.scrollWidth) : el.offsetWidth
    const h = leaf ? Math.max(el.offsetHeight, el.scrollHeight) : el.offsetHeight
    return [{ ...at, w, h }]
  })
}

/** The DOM measure: the stage's client size and its content boxes. */
export function measureStage(stage: HTMLElement): StageMeasure {
  return { width: stage.clientWidth, height: stage.clientHeight, boxes: contentBoxes(stage) }
}

/**
 * Throws in development when content inside `ref` runs past it, naming `label`. A no-op in
 * production. `measure` is the layout seam; the default reads the DOM.
 */
export function useStageFit(
  ref: RefObject<unknown>,
  label: string,
  measure: (stage: HTMLElement) => StageMeasure = measureStage
): void {
  useLayoutEffect(() => {
    if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return
    const stage = ref.current
    if (!(stage instanceof HTMLElement)) return
    const { width, height, boxes } = measure(stage)
    const message = describeOverflow(label, stageOverflow(width, height, boxes))
    if (message) throw new Error(message)
  })
}
