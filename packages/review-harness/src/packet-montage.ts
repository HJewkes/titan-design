// One review PNG per baseline in a CI packet: BEFORE | AFTER | DIFF for a change, an aligned pair when
// the size changed, and a single labelled panel for a new or removed baseline. Small specimens are
// scaled up (nearest-neighbour) and wide shots stack top to bottom, so each reads on a phone.
import type { FrameChange } from '@titan-design/review-schema'
import { GLYPH_H, drawLabel } from './packet-glyphs.ts'
import { fillRect, solidImage, writePng, type Rgba } from './packet-png.ts'

export type MontageEntry =
  | { change: Extract<FrameChange, 'changed'>; before: Rgba; after: Rgba; diff: Rgba | null }
  | { change: Extract<FrameChange, 'new'>; after: Rgba }
  | { change: Extract<FrameChange, 'removed'>; before: Rgba }

export interface Panel {
  label: string
  bar: readonly number[]
  image: Rgba
}

export interface Placement {
  panel: Panel
  x: number
  y: number
}

export const BAR_COLORS = {
  panel: [64, 64, 64, 255],
  new: [255, 0, 255, 255],
  removed: [220, 38, 38, 255],
} as const
export const CHECKER = { size: 8, light: [204, 204, 204, 255], dark: [153, 153, 153, 255] } as const
export const GUTTER = 8
const LABEL_SCALE = 2
const LABEL_PAD = 3
export const BAR_H = GLYPH_H * LABEL_SCALE + 2 * LABEL_PAD
const BACKGROUND = [24, 24, 24, 255]
const TEXT = [255, 255, 255, 255]
const TARGET_WIDTH = 1080
const MAX_ACROSS = 1600

export function montage(entry: MontageEntry): Buffer {
  const panels = panelsFor(entry)
  const scale = scaleFor(panels[0].image.width)
  const { canvas, placements } = layout(panels, scale)
  for (const placement of placements) drawPanel(canvas, placement, scale)
  return writePng(canvas)
}

/** Integer upscale toward a 1080-pixel panel, at most 4x so a specimen keeps its pixels honest. */
export function scaleFor(width: number): number {
  return Math.max(1, Math.min(4, Math.floor(TARGET_WIDTH / width)))
}

export function panelsFor(entry: MontageEntry): Panel[] {
  const panel = (label: string, image: Rgba): Panel => ({ label, bar: BAR_COLORS.panel, image })
  switch (entry.change) {
    case 'new':
      return [{ label: 'NEW', bar: BAR_COLORS.new, image: entry.after }]
    case 'removed':
      return [{ label: 'REMOVED', bar: BAR_COLORS.removed, image: entry.before }]
    case 'changed':
      if (entry.diff === null)
        return alignedPanels(entry.before, entry.after).map(([l, image]) => panel(l, image))
      return [panel('BEFORE', entry.before), panel('AFTER', entry.after), panel('DIFF', entry.diff)]
  }
}

/** Both images top-left on one common canvas, padded with the checker. */
function alignedPanels(before: Rgba, after: Rgba): [string, Rgba][] {
  const width = Math.max(before.width, after.width)
  const height = Math.max(before.height, after.height)
  return [
    ['BEFORE', padTo(before, width, height)],
    [`AFTER ${sizeLabel(before, after)}`, padTo(after, width, height)],
  ]
}

export function sizeLabel(before: Rgba, after: Rgba): string {
  const parts: string[] = []
  if (before.width !== after.width) parts.push(`${before.width}>${after.width} W`)
  if (before.height !== after.height) parts.push(`${before.height}>${after.height} H`)
  return `SIZE ${parts.join(' ')}`
}

export function checkerAt(x: number, y: number): readonly number[] {
  const square = Math.floor(x / CHECKER.size) + Math.floor(y / CHECKER.size)
  return square % 2 === 0 ? CHECKER.light : CHECKER.dark
}

function padTo(image: Rgba, width: number, height: number): Rgba {
  const canvas = solidImage(width, height, CHECKER.light)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) canvas.data.set(checkerAt(x, y), (y * width + x) * 4)
  blit(canvas, image, { x: 0, y: 0 }, 1)
  return canvas
}

/** Panels side by side when they fit 1600 pixels across, otherwise stacked top to bottom. */
export function layout(panels: Panel[], scale: number): { canvas: Rgba; placements: Placement[] } {
  const cellW = panels[0].image.width * scale
  const cellH = BAR_H + panels[0].image.height * scale
  const across = panels.length * cellW <= MAX_ACROSS
  const span = (cell: number) => panels.length * cell + (panels.length - 1) * GUTTER
  const width = across ? span(cellW) : cellW
  const height = across ? cellH : span(cellH)
  const placements = panels.map((panel, i) => ({
    panel,
    x: across ? i * (cellW + GUTTER) : 0,
    y: across ? 0 : i * (cellH + GUTTER),
  }))
  return { canvas: solidImage(width, height, BACKGROUND), placements }
}

function drawPanel(canvas: Rgba, { panel, x, y }: Placement, scale: number): void {
  const width = panel.image.width * scale
  fillRect(canvas, { x, y, w: width, h: BAR_H }, panel.bar)
  const maxX = x + width - LABEL_PAD
  drawLabel(
    canvas,
    panel.label,
    { x: x + LABEL_PAD, y: y + LABEL_PAD, scale: LABEL_SCALE, maxX },
    TEXT
  )
  blit(canvas, panel.image, { x, y: y + BAR_H }, scale)
}

/** Copies `src` into `dst` at `at`, each source pixel as a `scale`-sized square. */
export function blit(dst: Rgba, src: Rgba, at: { x: number; y: number }, scale: number): void {
  const row = Buffer.alloc(src.width * scale * 4)
  for (let sy = 0; sy < src.height; sy++) {
    for (let sx = 0; sx < src.width; sx++)
      for (let k = 0; k < scale; k++)
        src.data.copy(
          row,
          (sx * scale + k) * 4,
          (sy * src.width + sx) * 4,
          (sy * src.width + sx + 1) * 4
        )
    for (let k = 0; k < scale; k++)
      row.copy(dst.data, ((at.y + sy * scale + k) * dst.width + at.x) * 4)
  }
}
