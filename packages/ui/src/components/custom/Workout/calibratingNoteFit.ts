/**
 * Fitting the calibrating note into the chart without a DOM: a conservative width
 * estimate for the chart's Inter text, a two-line word wrap with an ellipsis for
 * what still does not fit, and a rectangle test against the plotted marks.
 */
import type { GeometryPoint } from './GoalTrajectoryChartGeometry'

// Inter advance widths in em, rounded up so an estimate never undershoots the drawn text.
const NARROW = new Set(" il.,:;'!|")
const SEMI = new Set('fjrt()[]-/')
const WIDE = new Set('mwMW')
const EM = { narrow: 0.3, semi: 0.4, wide: 0.92, upper: 0.7, digit: 0.62, other: 0.58 }

function charEm(c: string): number {
  if (NARROW.has(c)) return EM.narrow
  if (SEMI.has(c)) return EM.semi
  if (WIDE.has(c)) return EM.wide
  if (c >= '0' && c <= '9') return EM.digit
  if (c !== c.toLowerCase()) return EM.upper
  return EM.other
}

/** Estimated drawn width of `text` in px at `fontSize`. */
export function textWidth(text: string, fontSize: number): number {
  let em = 0
  for (const c of text) em += charEm(c)
  return em * fontSize
}

const ELLIPSIS = '…'

/** `text` cut at the end, with an ellipsis, to fit `maxWidth`. */
export function ellipsize(text: string, maxWidth: number, fontSize: number): string {
  if (textWidth(text, fontSize) <= maxWidth) return text
  let cut = text
  while (cut.length > 0 && textWidth(`${cut.trimEnd()}${ELLIPSIS}`, fontSize) > maxWidth) {
    cut = cut.slice(0, -1)
  }
  return `${cut.trimEnd()}${ELLIPSIS}`
}

/** Greedy word wrap into at most `maxLines`, or null when the words need more lines or a word is wider than a line. */
export function wrapWords(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number
): string[] | null {
  const lines: string[] = []
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (textWidth(word, fontSize) > maxWidth) return null
    const last = lines[lines.length - 1]
    const joined = last == null ? word : `${last} ${word}`
    if (last != null && textWidth(joined, fontSize) <= maxWidth) lines[lines.length - 1] = joined
    else lines.push(word)
  }
  return lines.length <= maxLines ? lines : null
}

/** The note in at most two lines of `maxWidth`: wrapped when it fits, else its second line ends in an ellipsis. */
export function fitNote(text: string, maxWidth: number, fontSize: number): string[] {
  const wrapped = wrapWords(text, maxWidth, fontSize, 2)
  if (wrapped) return wrapped
  const words = text.split(/\s+/).filter(Boolean)
  let first = ''
  let used = 0
  for (const word of words) {
    const next = first ? `${first} ${word}` : word
    if (textWidth(next, fontSize) > maxWidth) break
    first = next
    used += 1
  }
  if (used === 0) return [ellipsize(text, maxWidth, fontSize)]
  return [first, ellipsize(words.slice(used).join(' '), maxWidth, fontSize)]
}

export interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

/** A mark drawn on the plot: a dot of `radius` at a point. */
export interface PlottedMark extends GeometryPoint {
  radius: number
}

const SEGMENT_SAMPLES = 12

/** The marks along a polyline: its vertices, and points between them close enough to stand for the line. */
export function marksAlong(points: GeometryPoint[], radius: number, lineRadius: number) {
  const marks: PlottedMark[] = points.map((p) => ({ ...p, radius }))
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]]
    for (let s = 1; s < SEGMENT_SAMPLES; s++) {
      const t = s / SEGMENT_SAMPLES
      marks.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, radius: lineRadius })
    }
  }
  return marks
}

/** True when any mark's circle touches `rect`. */
export function collides(rect: Rect, marks: readonly PlottedMark[]): boolean {
  return marks.some((m) => {
    const dx = Math.max(rect.left - m.x, 0, m.x - rect.right)
    const dy = Math.max(rect.top - m.y, 0, m.y - rect.bottom)
    return dx * dx + dy * dy < m.radius * m.radius
  })
}
