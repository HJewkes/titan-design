/**
 * The committed and stretch rule labels as text marks in the chart's pixels.
 * `named` is the 0.21 layout ("Committed 185", "Stretch 195"). `numeric` drops the
 * words (titan-0201 round 2, human: "Lets drop the literal committed / stretch text
 * and just show the numeric labels") and, being short, moves each label to the
 * first spot clear of the readings, the tip targets and the other label.
 */
import {
  CHART_FONT,
  LABEL_ASCENT,
  LABEL_DESCENT,
  ruleLabelBaseline,
  ruleLabelLayout,
  type GeometryPoint,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'
import { roundWeight } from '../../../utils/workout-format'
import { ruleLabelX, type ReferenceLabelSide } from './GoalTrajectoryPlot'
import type { HitBox } from './goalTrajectoryTargets'

export type RuleLabelText = 'named' | 'numeric' | 'none'

export interface RuleLabelSpec {
  id: 'committed-label' | 'stretch-label' | 'merged-rule-label'
  text: string
  x: number
  y: number
  anchor: 'start' | 'end'
}

export interface RuleLabelInput {
  geometry: GoalTrajectoryGeometry
  committed: number
  stretch: number
  text: RuleLabelText
  side: ReferenceLabelSide
  /** Hit boxes a label must not sit on: the next-target tip and the info target. */
  boxes?: HitBox[]
}

// Digits are tabular in Inter; a numeric label is digits and at most one point.
const DIGIT_EM = 0.62
const POINT_EM = 0.3
const DOT_REACH = 6
const LINE_REACH = 3
const LINE_SAMPLES = 12

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

/** Estimated width of a numeric label in px. */
export function numericLabelWidth(text: string, font = CHART_FONT): number {
  let em = 0
  for (const c of text) em += c >= '0' && c <= '9' ? DIGIT_EM : POINT_EM
  return em * font
}

function named(input: RuleLabelInput): RuleLabelSpec[] {
  const { geometry: g, committed, stretch, side } = input
  const x = ruleLabelX(g.plot, side)
  const anchor = side === 'left' ? 'start' : 'end'
  const layout = ruleLabelLayout(g.committedY, g.stretchY)
  if (layout.merged) {
    const text = `Committed = Stretch ${String(roundWeight(committed))}`
    return [{ id: 'merged-rule-label', text, x, y: layout.committed.y, anchor }]
  }
  return [
    {
      id: 'committed-label',
      text: `Committed ${String(roundWeight(committed))}`,
      x,
      y: layout.committed.y,
      anchor,
    },
    {
      id: 'stretch-label',
      text: `Stretch ${String(roundWeight(stretch))}`,
      x,
      y: layout.stretch.y,
      anchor,
    },
  ]
}

function rectOf(spec: RuleLabelSpec): Rect {
  const width = numericLabelWidth(spec.text)
  const left = spec.anchor === 'start' ? spec.x : spec.x - width
  return {
    left,
    right: left + width,
    top: spec.y - CHART_FONT * LABEL_ASCENT,
    bottom: spec.y + CHART_FONT * LABEL_DESCENT,
  }
}

function near(r: Rect, p: GeometryPoint, reach: number): boolean {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right)
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
  return dx * dx + dy * dy < reach * reach
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

function readingLine(points: GeometryPoint[]): GeometryPoint[] {
  const out: GeometryPoint[] = []
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]]
    for (let s = 1; s < LINE_SAMPLES; s++) {
      const t = s / LINE_SAMPLES
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return out
}

/** True when a label box would sit on a reading, the line between them, the next target or a tip target. */
function blocked(g: GoalTrajectoryGeometry, r: Rect, boxes: HitBox[], taken: Rect[]): boolean {
  const dots = g.nextTarget ? [...g.actuals, g.nextTarget] : g.actuals
  if (dots.some((p) => near(r, p, DOT_REACH))) return true
  if (readingLine(g.actuals).some((p) => near(r, p, LINE_REACH))) return true
  const asRect = (b: HitBox): Rect => ({
    left: b.x,
    right: b.x + b.size,
    top: b.y,
    bottom: b.y + b.size,
  })
  return [...boxes.map(asRect), ...taken].some((o) => overlaps(r, o))
}

/** Every spot a numeric label may take, preferred first: the chosen side, then the other; above, then below. */
function candidates(
  g: GoalTrajectoryGeometry,
  ruleY: number,
  side: ReferenceLabelSide,
  first: 'above' | 'below'
) {
  const sides: ReferenceLabelSide[] = side === 'left' ? ['left', 'right'] : ['right', 'left']
  const heights: ('above' | 'below')[] = first === 'above' ? ['above', 'below'] : ['below', 'above']
  return sides.flatMap((s) =>
    heights.map((h) => ({
      x: ruleLabelX(g.plot, s),
      y: ruleLabelBaseline(ruleY, h),
      anchor: (s === 'left' ? 'start' : 'end') as RuleLabelSpec['anchor'],
    }))
  )
}

function numeric(input: RuleLabelInput): RuleLabelSpec[] {
  const { geometry: g, committed, stretch, side, boxes = [] } = input
  const layout = ruleLabelLayout(g.committedY, g.stretchY)
  const rules = layout.merged
    ? [
        {
          id: 'merged-rule-label' as const,
          value: committed,
          y: g.committedY,
          first: layout.committed.side,
        },
      ]
    : [
        {
          id: 'committed-label' as const,
          value: committed,
          y: g.committedY,
          first: layout.committed.side,
        },
        { id: 'stretch-label' as const, value: stretch, y: g.stretchY, first: layout.stretch.side },
      ]
  const taken: Rect[] = []
  return rules.map(({ id, value, y, first }) => {
    const text = String(roundWeight(value))
    const spots = candidates(g, y, side, first).map((spot) => ({ id, text, ...spot }))
    const spec = spots.find((c) => !blocked(g, rectOf(c), boxes, taken)) ?? spots[0]
    taken.push(rectOf(spec))
    return spec
  })
}

/** The rule labels to draw, or none. */
export function ruleLabelSpecs(input: RuleLabelInput): RuleLabelSpec[] {
  if (input.text === 'none') return []
  return input.text === 'named' ? named(input) : numeric(input)
}
