/** A rectangle in frame pixels. */
export interface StageRect {
  /** Left edge. */
  x: number
  /** Top edge. */
  y: number
  /** Width. */
  width: number
  /** Height. */
  height: number
}

/** The output frame in pixels, e.g. 1920 × 1080. */
export interface StageFrame {
  /** Frame width in px. */
  width: number
  /** Frame height in px; every metric scales by `height / 1080`. */
  height: number
}

/** Band metrics in design px at a 1080-high frame; every value scales by `height / 1080`. */
export interface StageMetrics {
  /** Horizontal inset of the header and chip bands. */
  edgeX: number
  /** Space above a top header, and above the stage under a bottom header. */
  topPad: number
  /** Space between a band and the stage. */
  gap: number
  /** Space between the parts of a band. */
  gapSm: number
  /** Space below the last chip row. */
  bottomPad: number
  /** Title type size. */
  title: number
  /** Body type size. */
  body: number
  /** Label type size (kicker, chips). */
  label: number
  /** Thickness of the rule under the headline. */
  rule: number
  /** Line height of a headline, as a multiple of its size. */
  headlineLeading: number
  /** Line height of a label or body line, as a multiple of its size. */
  lineLeading: number
}

/** The shipped explainer chrome on the S96 beat scale (title 96, body 48, label 40). */
export const STAGE_METRICS_S96: Readonly<StageMetrics> = Object.freeze({
  edgeX: 60,
  topPad: 26,
  gap: 27, // optical: the S96 video gap (body 48 × 4/7), measured in frame px, not UI spacing
  gapSm: 14,
  bottomPad: 20,
  title: 96,
  body: 48,
  label: 40,
  rule: 4,
  headlineLeading: 1.1,
  lineLeading: 1.3,
})

/** Which parts the header band holds, top to bottom: kicker, headline, rule, sub. */
export interface HeaderChrome {
  /** A one-line label above the headline. */
  kicker?: boolean
  /** `body` is a 1.3 × body headline (one line); `title` is title size. */
  headline: 'body' | 'title'
  /** A rule under the headline. */
  rule?: boolean
  /** A one-line body sub under the headline. */
  sub?: boolean
}

/** The chrome around the stage. Every field is optional. */
export interface StageChrome {
  /** Default `{ headline: 'body' }`. `'none'` gives the stage the top of the frame. */
  header?: HeaderChrome | 'none'
  /** Default `top`. A bottom header sits on the caption keep-out. */
  headerAt?: 'top' | 'bottom'
  /** Rows in the chip band at the foot of the frame. Default 2. */
  chipRows?: 0 | 1 | 2
  /**
   * Content stays above this fraction of the frame height, so captions never cover it. Chrome may sit
   * below it. Default 0.83; 1 turns the keep-out off.
   */
  keepOutFraction?: number
  /** Overrides on top of {@link STAGE_METRICS_S96}. */
  metrics?: Partial<StageMetrics>
}

/** Every region of the frame, in frame px. `scale` is `height / 1080`. */
export interface StageBox {
  /** `height / 1080`: frame px per design px. */
  scale: number
  /** The header band, inset by `edgeX`. Zero height when the header is `'none'`. */
  header: StageRect
  /** Where content goes. Full width; it never reaches the chip band or the keep-out. */
  stage: StageRect
  /** The chip rows at the foot of the frame, inset by `edgeX`, content bottom-aligned. */
  chipBand: StageRect
  /** The caption area at the foot of the frame. Chrome may sit in it; content may not. */
  keepOut: StageRect
}

const DESIGN_HEIGHT = 1080
const DEFAULT_KEEP_OUT = 0.83

// 96 × 1.1 is 105.60000000000001: a bare ceil would add a pixel to a band that sums to a whole number.
const ceilPx = (v: number) => Math.max(0, Math.ceil(v - 1e-6))

/** The header band's height in design px, summed top to bottom: pad, parts with gapSm between, pad. */
function headerBandHeight(h: HeaderChrome, m: StageMetrics, padAbove: number): number {
  const headline = (h.headline === 'title' ? m.title : m.body * m.lineLeading) * m.headlineLeading
  const parts = [
    h.kicker ? m.label * m.lineLeading : null,
    headline,
    h.rule ? m.rule : null,
    h.sub ? m.body * m.lineLeading : null,
  ].filter((p): p is number => p !== null)
  const inner = parts.reduce((sum, p, i) => sum + (i > 0 ? m.gapSm : 0) + p, padAbove)
  return inner + m.gap
}

function chipBandHeight(rows: number, m: StageMetrics): number {
  if (rows === 0) return 0
  return m.gap + rows * m.label * m.lineLeading + (rows - 1) * m.gapSm + m.bottomPad
}

function assertFrame({ width, height }: StageFrame, keepOutFraction: number): void {
  const positive = (n: number) => Number.isFinite(n) && n > 0
  if (!positive(width) || !positive(height)) {
    throw new RangeError(`stageBox: frame must be finite and positive, got ${width} × ${height}`)
  }
  if (!(keepOutFraction > 0 && keepOutFraction <= 1)) {
    throw new RangeError(`stageBox: keepOutFraction must be in (0, 1], got ${keepOutFraction}`)
  }
}

function placeHeader(
  inset: Pick<StageRect, 'x' | 'width'>,
  m: StageMetrics,
  s: number,
  h: HeaderChrome | 'none',
  bottom: number | null
): StageRect {
  const { x, width } = inset
  if (h === 'none') return { x, y: 0, width, height: 0 }
  if (bottom === null)
    return { x, y: 0, width, height: ceilPx(headerBandHeight(h, m, m.topPad) * s) }
  const height = ceilPx(headerBandHeight(h, m, m.gap) * s)
  return { x, y: bottom - height, width, height }
}

/**
 * Splits a frame into its header band, stage, chip band and caption keep-out. Pure. Stage content is laid
 * out inside `stage`; the stage never reaches the keep-out or the chip band.
 *
 * @example
 * const box = stageBox({ width: 1920, height: 1080 }, { chipRows: 1 })
 */
export function stageBox(frame: StageFrame, chrome: StageChrome = {}): StageBox {
  const keepOutFraction = chrome.keepOutFraction ?? DEFAULT_KEEP_OUT
  assertFrame(frame, keepOutFraction)
  const m: StageMetrics = { ...STAGE_METRICS_S96, ...chrome.metrics }
  const s = frame.height / DESIGN_HEIGHT
  const { width: W, height: H } = frame

  const bandH = ceilPx(chipBandHeight(chrome.chipRows ?? 2, m) * s)
  const edge = ceilPx(m.edgeX * s)
  const chipBand = { x: edge, y: H - bandH, width: W - 2 * edge, height: bandH }
  const keepOutY = Math.floor(keepOutFraction * H)
  const keepOut = { x: 0, y: keepOutY, width: W, height: H - keepOutY }
  const floor = Math.min(chipBand.y, keepOutY)

  const atBottom = chrome.headerAt === 'bottom'
  const header = placeHeader(
    chipBand,
    m,
    s,
    chrome.header ?? { headline: 'body' },
    atBottom ? floor : null
  )
  const top = atBottom ? ceilPx(m.topPad * s) : header.y + header.height
  const bottom = atBottom ? header.y : floor
  if (bottom - top <= 0) {
    throw new RangeError(`stageBox: the chrome leaves no stage (${top}..${bottom} px)`)
  }
  return {
    scale: s,
    header,
    stage: { x: 0, y: top, width: W, height: bottom - top },
    chipBand,
    keepOut,
  }
}
