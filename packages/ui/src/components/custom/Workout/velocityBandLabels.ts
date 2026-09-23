import type { VelocityBandIndex } from './VelocityBandScale'

/** A label's box in plot px: `x` from the left edge, `y` from the baseline to the box's bottom. */
export interface BandLabelRect {
  x: number
  y: number
  width: number
  height: number
}

/** `ink` and `faint` are the surface's neutral inks; a band index draws in that band's colour. */
export type BandLabelInk = 'ink' | 'faint' | VelocityBandIndex

export interface BandLabel extends BandLabelRect {
  key: string
  text: string
  align: 'left' | 'center' | 'right'
  ink: BandLabelInk
  /** No candidate spot was free; the label sits at its first choice, clamped into the plot. */
  crowded: boolean
}

/** One label to place, with the spots it may take in order of preference. */
export interface BandLabelRequest {
  key: string
  text: string
  ink: BandLabelInk
  candidates: { x: number; y: number; align: BandLabel['align'] }[]
}

export interface BandLabelMetrics {
  /** The rendered line box; the overlay sets `lineHeight` to this so the arithmetic is true. */
  height: number
  fontSize: number
  /** Glyph advance as a fraction of the font size; deliberately generous so boxes over-cover. */
  glyphWidthRatio: number
  /** Space between a label and the mark it names. */
  inset: number
}

export const BAND_LABEL_METRICS: BandLabelMetrics = {
  height: 16,
  fontSize: 12,
  glyphWidthRatio: 0.62,
  inset: 4,
}

export function estimateLabelWidth(text: string, metrics: BandLabelMetrics): number {
  return Math.ceil(text.length * metrics.fontSize * metrics.glyphWidthRatio)
}

function rectAt(
  spot: BandLabelRequest['candidates'][number],
  width: number,
  height: number
): BandLabelRect {
  const x =
    spot.align === 'right' ? spot.x - width : spot.align === 'center' ? spot.x - width / 2 : spot.x
  return { x, y: spot.y, width, height }
}

function insidePlot(r: BandLabelRect, plotWidth: number, plotHeight: number): boolean {
  return r.x >= 0 && r.y >= 0 && r.x + r.width <= plotWidth && r.y + r.height <= plotHeight
}

function intersects(a: BandLabelRect, b: BandLabelRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

function clampIntoPlot(r: BandLabelRect, plotWidth: number, plotHeight: number): BandLabelRect {
  const x = Math.min(Math.max(0, r.x), Math.max(0, plotWidth - r.width))
  const y = Math.min(Math.max(0, r.y), Math.max(0, plotHeight - r.height))
  return { ...r, x, y }
}

function overlapArea(a: BandLabelRect, b: BandLabelRect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/** Each candidate slides sideways into the plot first: a label a hair past the edge still fits. */
function candidateRects(request: BandLabelRequest, width: number, plot: PlotBox, height: number) {
  return request.candidates.map((spot) => {
    const rect = rectAt(spot, width, height)
    const x = Math.min(Math.max(0, rect.x), Math.max(0, plot.width - width))
    return { spot, rect: { ...rect, x } }
  })
}

interface PlotBox {
  width: number
  height: number
}

type Candidate = ReturnType<typeof candidateRects>[number]

/** The free candidate, or else the one that covers the least of what is already placed. */
function chooseCandidate(options: Candidate[], placed: BandLabel[], plot: PlotBox) {
  const free = options.find(
    ({ rect }) =>
      insidePlot(rect, plot.width, plot.height) && placed.every((p) => !intersects(rect, p))
  )
  if (free) return { ...free, crowded: false }
  const cost = (c: Candidate) => {
    const rect = clampIntoPlot(c.rect, plot.width, plot.height)
    return placed.reduce((sum, p) => sum + overlapArea(rect, p), 0)
  }
  const least = options.reduce<Candidate | null>(
    (best, c) => (best == null || cost(c) < cost(best) ? c : best),
    null
  )
  return (
    least && {
      spot: least.spot,
      rect: clampIntoPlot(least.rect, plot.width, plot.height),
      crowded: true,
    }
  )
}

/**
 * Place labels in the order given, each at its first candidate that lies inside the plot and
 * clear of every label placed before it. A label with no free candidate takes the one that
 * overlaps least, clamped into the plot, and is marked `crowded` so a test can see it.
 */
export function placeBandLabels(
  requests: readonly BandLabelRequest[],
  plot: PlotBox,
  metrics: BandLabelMetrics = BAND_LABEL_METRICS
): BandLabel[] {
  const placed: BandLabel[] = []
  for (const request of requests) {
    const width = Math.min(estimateLabelWidth(request.text, metrics), plot.width)
    const chosen = chooseCandidate(
      candidateRects(request, width, plot, metrics.height),
      placed,
      plot
    )
    if (chosen == null) continue
    const { key, text, ink } = request
    placed.push({
      ...chosen.rect,
      key,
      text,
      ink,
      align: chosen.spot.align,
      crowded: chosen.crowded,
    })
  }
  return placed
}

/** True when any two placed labels overlap; the geometry's tests assert it never is. */
export function labelsOverlap(labels: readonly BandLabelRect[]): boolean {
  return labels.some((a, i) => labels.slice(i + 1).some((b) => intersects(a, b)))
}
