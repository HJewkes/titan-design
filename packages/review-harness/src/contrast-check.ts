import {
  REQUIRED_RATIO,
  contrastRatio,
  floorRatio,
  over,
  textKind,
  toHex,
  withAlpha,
  type Rgba,
} from './contrast.ts'
import type { CheckKind } from '@titan-design/review-schema'
import type { FrameSamples, RawSample, SampleRole } from './contrast-collect.ts'

/** One measured pair, in the shape contrast.json reports it. */
export interface Check {
  kind: CheckKind
  role: SampleRole
  selector: string
  testId?: string
  text?: string
  fg: string
  bg: string
  ratio: number
  required: number
  pass: boolean
  exempt?: string
}

/** A pair the DOM cannot measure (gradient plane or paint); reported, never blocking. */
export interface Indeterminate {
  role: SampleRole
  selector: string
  testId?: string
  text?: string
  reason: string
}

export interface FrameResult {
  checks: Check[]
  indeterminate: Indeterminate[]
}

interface Plane {
  color: Rgba
  /** Opacity of the subtree from <html> down to here, which fades every paint inside it. */
  opacity: number
  bgImage: boolean
}

/**
 * Each node's effective plane: its ancestors' backgrounds composited from the canvas down,
 * each faded by the opacity of its subtree. Positioned overlays that are not ancestors are
 * not seen, which is the price of a DOM measurement.
 */
export function planes(frame: FrameSamples): Plane[] {
  const out: Plane[] = []
  const planeOf = (i: number): Plane => {
    if (out[i]) return out[i]
    const node = frame.nodes[i]
    const below: Plane =
      node.parent < 0 ? { color: frame.base, opacity: 1, bgImage: false } : planeOf(node.parent)
    const opacity = below.opacity * node.opacity
    out[i] = {
      color: over(withAlpha(node.bg, opacity), below.color),
      opacity,
      bgImage: below.bgImage || node.bgImage,
    }
    return out[i]
  }
  frame.nodes.forEach((_, i) => planeOf(i))
  return out
}

function kindOf(sample: RawSample): CheckKind {
  if (sample.role !== 'text') return 'non-text'
  return textKind(sample.fontSize ?? 16, sample.fontWeight ?? 400)
}

function identity(sample: RawSample) {
  return {
    role: sample.role,
    selector: sample.selector,
    ...(sample.testId ? { testId: sample.testId } : {}),
    ...(sample.text ? { text: sample.text } : {}),
  }
}

/** The best alternative wins: a control is bounded if its border OR its fill contrasts. */
function measure(sample: RawSample, plane: Plane, paintOpacity: number): Check {
  const kind = kindOf(sample)
  const scored = sample.colors.map((c) => {
    const fg = over(withAlpha(c, paintOpacity), plane.color)
    return { fg, ratio: contrastRatio(fg, plane.color) }
  })
  const best = scored.reduce((a, b) => (b.ratio > a.ratio ? b : a))
  const required = REQUIRED_RATIO[kind]
  return {
    kind,
    ...identity(sample),
    fg: toHex(best.fg),
    bg: toHex(plane.color),
    ratio: floorRatio(best.ratio),
    required,
    pass: sample.exempt !== undefined || best.ratio >= required,
    ...(sample.exempt ? { exempt: sample.exempt } : {}),
  }
}

/** Whether a fill or border is drawn at all: one identical to its plane is not a mark. */
function isPainted(sample: RawSample, plane: Plane, paintOpacity: number): boolean {
  return sample.colors.some((c) => {
    const fg = toHex(over(withAlpha(c, paintOpacity), plane.color))
    return fg !== toHex(plane.color)
  })
}

export function evaluateFrame(frame: FrameSamples): FrameResult {
  const all = planes(frame)
  const result: FrameResult = { checks: [], indeterminate: [] }
  for (const sample of frame.samples) {
    const plane = all[sample.plane]
    const reason =
      sample.indeterminate ?? (plane.bgImage ? 'background-image on the plane' : undefined)
    if (reason) {
      result.indeterminate.push({ ...identity(sample), reason })
      continue
    }
    const paintOpacity = all[sample.node].opacity
    if (!sample.colors.some((c) => c[3] * paintOpacity > 0)) continue
    if (sample.role !== 'text' && !isPainted(sample, plane, paintOpacity)) continue
    result.checks.push(measure(sample, plane, paintOpacity))
  }
  return result
}
