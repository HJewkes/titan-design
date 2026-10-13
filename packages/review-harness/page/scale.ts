import type { ScaleReference } from '@titan-design/review-schema'

/** The ladder's column inside the frame, wide enough for its largest rung's sample. */
export const LADDER_WIDTH = 360

/** Fit scales the whole frame into the card; actual shows it at 1:1 and scrolls. */
export const SCALE_VIEWS = ['fit', 'actual'] as const
export type ScaleView = (typeof SCALE_VIEWS)[number]

/** "64px · 5.9% of 1080": a size and the share of the frame's height it takes. */
export function sizeLabel(px: number, frameHeight: number): string {
  const share = ((px / frameHeight) * 100).toFixed(1)
  return `${Number(px.toFixed(1))}px · ${share}% of ${frameHeight}`
}

/** The ladder column, then one equal column per candidate, in the frame's own px. */
export function scaleColumns(scale: ScaleReference): { ladder: number; cell: number } {
  const ladder = Math.min(LADDER_WIDTH, Math.floor(scale.frame.width / 4))
  return { ladder, cell: Math.floor((scale.frame.width - ladder) / scale.candidates.length) }
}

/** The factor the frame is drawn at: 1:1, or fitted to the room the card has (never enlarged). */
export function viewScale(view: ScaleView, fitScale: number): number {
  return view === 'actual' ? 1 : Math.min(1, fitScale)
}

export interface TextRun {
  text: string
  /** The computed font-size, as CSS reports it (`"48px"`). */
  fontSize: string
}

/** The largest font size any visible run of text uses, or null when the story shows no text. */
export function largestTextPx(runs: Iterable<TextRun>): number | null {
  let largest: number | null = null
  for (const { text, fontSize } of runs) {
    const px = Number.parseFloat(fontSize)
    if (text.trim() && Number.isFinite(px) && (largest === null || px > largest)) largest = px
  }
  return largest
}

/** Every element under the story root that holds its own text, with its computed size. */
export function textRuns(doc: Document | null): TextRun[] {
  const root = doc?.getElementById('storybook-root')
  const view = doc?.defaultView
  if (!root || !view) return []
  return [...root.querySelectorAll<HTMLElement>('*')].flatMap((el) => {
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent ?? '')
      .join('')
    if (!own.trim() || el.getClientRects().length === 0) return []
    return [{ text: own, fontSize: view.getComputedStyle(el).fontSize }]
  })
}
