// The strokes of each annotation kind as pure geometry in the anchor box's own frame (0, 0 is its top-left).
// The kinds and their placement round the box follow rough-notation by Preet Shihn (MIT, see
// ../LICENSE-rough-notation); no lines are copied, and the strokes come from ../rough.
import type { PathModel } from '../paths/model'
import type { PathPoint } from '../paths/parse'
import { roughEllipse, roughLine } from '../rough'

/** The six marks: a marker sweep behind, a line under or through, a box, a ring, or a cross. */
export type AnnotationKind =
  | 'highlight'
  | 'underline'
  | 'box'
  | 'circle'
  | 'strike-through'
  | 'crossed-off'

/** The annotated area in px: a word's layout box, or a map node's box after projection. */
export interface AnnotationBox {
  /** Left edge, px. */
  x: number
  /** Top edge, px. */
  y: number
  /** Width, px. */
  w: number
  /** Height, px. */
  h: number
}

/** What shapes a mark besides its kind and box. */
export interface AnnotationGeometryOptions {
  /** Picks the wobble; equal seeds give equal strokes. */
  seed: number | string
  /** Clearance between the box and the mark, px. */
  padding: number
  /** How many times the mark is gone over. */
  iterations: number
  /** Scales every jitter; 0 draws clean lines. */
  roughness: number
  /** Pen width, px; a highlight is as thick as the padded box is tall. */
  strokeWidth: number
}

/** One stroke of a mark, in drawing order. */
export interface AnnotationStroke {
  /** The measured path, ready for `drawOn`. */
  model: PathModel
  /** Stroke width, px. */
  width: number
}

/** Per-kind defaults. rough-notation goes over every mark twice; a single line through or across reads cleaner. */
export const ANNOTATION_DEFAULTS: Record<AnnotationKind, { padding: number; iterations: number }> =
  {
    highlight: { padding: 2, iterations: 2 }, // optical: marker bleed past the glyphs
    underline: { padding: 2, iterations: 2 }, // optical: pen gap under the descenders
    box: { padding: 6, iterations: 2 }, // optical: pen clearance so wobble never touches the glyphs
    circle: { padding: 4, iterations: 2 }, // optical: pen clearance before the ring's root-2 growth
    'strike-through': { padding: 0, iterations: 1 },
    'crossed-off': { padding: 2, iterations: 1 }, // optical: the cross overruns the box corners
  }

/** A marker is drawn rougher than a pen line, as rough-notation's 3 against 1.5. */
const HIGHLIGHT_ROUGHNESS_GAIN = 2

const point = (x: number, y: number): PathPoint => ({ x, y })

/** One line per pass, each pass running back over the last. */
function passes(
  { seed, iterations, roughness }: AnnotationGeometryOptions,
  from: PathPoint,
  to: PathPoint,
  firstKey = 0
): PathModel[] {
  return Array.from({ length: iterations }, (_, i) =>
    i % 2 === 0
      ? roughLine(seed, firstKey + i, from, to, { roughness })
      : roughLine(seed, firstKey + i, to, from, { roughness })
  )
}

function boxSides(box: AnnotationBox, options: AnnotationGeometryOptions): PathModel[] {
  const { seed, iterations, padding: p, roughness } = options
  const corners = [
    point(-p, -p),
    point(box.w + p, -p),
    point(box.w + p, box.h + p),
    point(-p, box.h + p),
  ]
  return Array.from({ length: iterations }, (_, pass) =>
    corners.map((from, side) =>
      roughLine(seed, pass * 4 + side, from, corners[(side + 1) % 4] as PathPoint, { roughness })
    )
  ).flat()
}

function circleLaps(box: AnnotationBox, options: AnnotationGeometryOptions): PathModel[] {
  const { seed, iterations, padding: p, roughness } = options
  // The ellipse through the padded box's corners has radii of half-diagonal over root 2 per axis.
  const radii = [(box.w + 2 * p) / Math.SQRT2, (box.h + 2 * p) / Math.SQRT2] as const
  return Array.from({ length: iterations }, (_, lap) =>
    roughEllipse(seed, lap, point(box.w / 2, box.h / 2), radii, { roughness })
  )
}

function crossLines(box: AnnotationBox, options: AnnotationGeometryOptions): PathModel[] {
  const p = options.padding
  const diagonal = passes(options, point(-p, -p), point(box.w + p, box.h + p))
  const anti = passes(options, point(box.w + p, -p), point(-p, box.h + p), options.iterations)
  return [...diagonal, ...anti]
}

/** The strokes of `kind` round `box`, in drawing order. Equal arguments give identical path data. */
export function annotationStrokes(
  kind: AnnotationKind,
  box: AnnotationBox,
  options: AnnotationGeometryOptions
): AnnotationStroke[] {
  const { padding: p, strokeWidth } = options
  const pen = (models: PathModel[]) => models.map((model) => ({ model, width: strokeWidth }))
  switch (kind) {
    case 'highlight': {
      const marker = { ...options, roughness: options.roughness * HIGHLIGHT_ROUGHNESS_GAIN }
      const models = passes(marker, point(-p, box.h / 2), point(box.w + p, box.h / 2))
      return models.map((model) => ({ model, width: box.h + 2 * p }))
    }
    case 'underline':
      return pen(passes(options, point(0, box.h + p), point(box.w, box.h + p)))
    case 'strike-through':
      return pen(passes(options, point(-p, box.h / 2), point(box.w + p, box.h / 2)))
    case 'box':
      return pen(boxSides(box, options))
    case 'circle':
      return pen(circleLaps(box, options))
    case 'crossed-off':
      return pen(crossLines(box, options))
  }
}

/**
 * How far each stroke is drawn at `progress` of the whole mark. Strokes draw one after another at one pen
 * speed, so each takes a share of the time equal to its share of the total length.
 */
export function strokeProgress(lengths: readonly number[], progress: number): number[] {
  const clamped = Math.min(1, Math.max(0, progress))
  // A finished mark is exactly finished; summing lengths in another order would leave 1e-14 undrawn.
  if (clamped === 1) return lengths.map(() => 1)
  const drawn = clamped * lengths.reduce((sum, length) => sum + length, 0)
  let before = 0
  return lengths.map((length) => {
    const share = length > 0 ? (drawn - before) / length : drawn >= before ? 1 : 0
    before += length
    return Math.min(1, Math.max(0, share))
  })
}
